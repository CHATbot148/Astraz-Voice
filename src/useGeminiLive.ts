import { useState, useEffect, useRef, useCallback } from 'react';
import { pcmToBase64, base64ToFloat32 } from './lib/audio-utils';
import { playInitiatedSound, playMutedSound } from './lib/soundEffects';
import { detectTerminationIntent } from './lib/intent';

export interface Transcript {
  id: string;
  text: string;
  role: 'user' | 'model';
  timestamp: number;
  final?: boolean;
}

export function useGeminiLive() {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const isMutedRef = useRef(false);
  
  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
        const newState = !prev;
        isMutedRef.current = newState;
        if (streamRef.current) {
            streamRef.current.getAudioTracks().forEach(track => {
                track.enabled = !newState;
            });
        }
        playMutedSound(newState);
        return newState;
    });
  }, []);
  const [error, setError] = useState<string | null>(null);

  // Real-time volumes for visualization
  const [userVolume, setUserVolume] = useState(0);
  const [modelVolume, setModelVolume] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);

  const modelAnalyserRef = useRef<AnalyserNode | null>(null);
  const userAnalyserRef = useRef<AnalyserNode | null>(null);

  const clearState = useCallback(() => {
    setTranscripts([]);
    setError(null);
    setUserVolume(0);
    setModelVolume(0);
  }, []);

  const connect = useCallback(async (config: { systemInstruction: string; voiceName: string; onTerminationTriggered?: () => void }) => {
    let retryCount = 0;
    const maxRetries = 3;

    const establishConnection = () => {
        try {
          setStatus('connecting');
          setError(null);

          const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
          const ws = new WebSocket(`${protocol}//${window.location.host}/api/live`);
          wsRef.current = ws;

          ws.onopen = () => {
            ws.send(JSON.stringify({ 
              type: 'setup', 
              systemInstruction: config.systemInstruction,
              voiceName: config.voiceName 
            }));
            retryCount = 0; // Reset retries on success
          };

          ws.onmessage = async (event) => {
            const msg = JSON.parse(event.data);

            // Handle connection success
            if (msg.type === 'connected') {
              setStatus('connected');
              startAudioCapture();
              playInitiatedSound();
              return;
            }

            // Handle error
            if (msg.type === 'error') {
              console.error("Gemini Live Error:", msg.message);
              setError(msg.message);
              // Handle specific "stream error" or quota issues
              if (msg.message.toLowerCase().includes('quota') || msg.message.toLowerCase().includes('limit')) {
                  setStatus('error');
              } else {
                  // For transient errors, we might stay connected or try to reconnect
                  // If it's a critical stream error, we might need to reset
                  if (msg.message === 'stream error') {
                     console.warn("Transient stream error detected.");
                  }
              }
              return;
            }

            // Handle Audio
            if (msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data) {
              playAudioChunk(msg.serverContent.modelTurn.parts[0].inlineData.data);
            }

            // Handle Interruption (Server-side VAD)
            if (msg.serverContent?.interrupted) {
              stopAllPlayback();
            }

            // Handle Transcription
            if (msg.serverContent?.modelTurn?.parts?.[0]?.text) {
               const text = msg.serverContent.modelTurn.parts[0].text;
               updateTranscript('model', text, false);

               const lowerText = text.toLowerCase().trim();
               if (config.onTerminationTriggered && (
                 lowerText.includes("goodbye") || 
                 lowerText.includes("terminating session") || 
                 lowerText.includes("terminating") ||
                 lowerText.includes("session ended") ||
                 lowerText.includes("oda bo") ||
                 lowerText.includes("odabo") ||
                 lowerText.includes("mechie oku") ||
                 lowerText.includes("adios") ||
                 lowerText.includes("au revoir")
               )) {
                   console.log("WebSocket model-level termination triggered:", text);
                   config.onTerminationTriggered();
               }
            }

            if (msg.serverContent?.modelTurn?.audioTranscription?.text) {
               const text = msg.serverContent.modelTurn.audioTranscription.text;
               updateTranscript('model', text, true);

               const lowerText = text.toLowerCase().trim();
               if (config.onTerminationTriggered && (
                 lowerText.includes("goodbye") || 
                 lowerText.includes("terminating session") || 
                 lowerText.includes("terminating") ||
                 lowerText.includes("session ended") ||
                 lowerText.includes("oda bo") ||
                 lowerText.includes("odabo") ||
                 lowerText.includes("mechie oku") ||
                 lowerText.includes("adios") ||
                 lowerText.includes("au revoir")
               )) {
                   console.log("WebSocket model-level audio transcription termination triggered:", text);
                   config.onTerminationTriggered();
               }
            }

            if (msg.serverContent?.userTurn?.audioTranscription?.text) {
               const text = msg.serverContent.userTurn.audioTranscription.text;
               updateTranscript('user', text, true);

               if (config.onTerminationTriggered && detectTerminationIntent(text)) {
                   console.log("WebSocket user-level audio transcription termination triggered:", text);
                   config.onTerminationTriggered();
               }
            }
          };

          ws.onclose = (event) => {
            console.log("WebSocket closed:", event.code, event.reason);
            if (status !== 'idle' && retryCount < maxRetries) {
                retryCount++;
                console.log(`Reconnecting... attempt ${retryCount}`);
                setTimeout(establishConnection, 1000 * retryCount);
            } else {
                setStatus('idle');
                cleanup();
            }
          };

          ws.onerror = (err) => {
            console.error("WebSocket error:", err);
            setError('Neural link interrupted. Attempting to restore...');
            // onclose will handle retry
          };

        } catch (err: any) {
          setError(err.message);
          setStatus('error');
        }
    };

    establishConnection();
  }, [clearState, status]);

  const disconnect = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
    }
    cleanup();
    setStatus('idle');
  }, []);

  const cleanup = () => {
    if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
            wsRef.current.close();
        }
        wsRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
       try { audioCtxRef.current.close(); } catch(e) {}
    }
    audioCtxRef.current = null;
    streamRef.current = null;
    processorRef.current = null;
    nextStartTimeRef.current = 0;
  };

  const startAudioCapture = async () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioCtxRef.current = audioCtx;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }});
      streamRef.current = stream;

      const source = audioCtx.createMediaStreamSource(stream);
      
      const userAnalyser = audioCtx.createAnalyser();
      userAnalyser.fftSize = 256;
      userAnalyserRef.current = userAnalyser;
      source.connect(userAnalyser);

      const processor = audioCtx.createScriptProcessor(2048, 1, 1);
      processorRef.current = processor;

      source.connect(processor);
      processor.connect(audioCtx.destination);

      const dataArray = new Uint8Array(userAnalyser.frequencyBinCount);

      processor.onaudioprocess = (e) => {
        // Track input volume
        userAnalyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((p, c) => p + c, 0) / dataArray.length;
        const vol = avg / 160;
        setUserVolume(vol);

        // Local Interruption: If user starts speaking while model is speaking, stop playback
        if (vol > 0.12 && modelVolume > 0.03) {
            stopAllPlayback();
            // We also notify the server if possible, but sending audio is usually enough to trigger server VAD
        }

        if (isMutedRef.current) {
          // console.debug("Audio capture skipped (muted)");
          return;
        }
        
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        
        const inputData = e.inputBuffer.getChannelData(0);
        const base64 = pcmToBase64(inputData);
        wsRef.current.send(JSON.stringify({ audio: base64 }));
      };

      // Model Side Analyser
      const modelAnalyser = audioCtx.createAnalyser();
      modelAnalyser.fftSize = 256;
      modelAnalyserRef.current = modelAnalyser;
      modelAnalyser.connect(audioCtx.destination);
    } catch (err: any) {
      setError(`Microphone access error: ${err.message}`);
      setStatus('error');
    }
  };

  const audioSourcesRef = useRef<AudioBufferSourceNode[]>([]);

  const playAudioChunk = (base64: string) => {
    if (!audioCtxRef.current || !modelAnalyserRef.current) return;
    const audioCtx = audioCtxRef.current;
    
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const data = base64ToFloat32(base64);
    // Gemini 2.0/3.1 sends 24kHz audio
    const buffer = audioCtx.createBuffer(1, data.length, 24000);
    buffer.getChannelData(0).set(data);

    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(modelAnalyserRef.current);

    const now = audioCtx.currentTime;
    // Buffer management to ensure clear, non-jittery audio
    const safetyBuffer = 0.05; // 50ms safety buffer
    if (nextStartTimeRef.current < now + safetyBuffer) {
      nextStartTimeRef.current = now + safetyBuffer;
    }

    source.start(nextStartTimeRef.current);
    nextStartTimeRef.current += buffer.duration;

    // Track active sources for interruption
    audioSourcesRef.current.push(source);
    source.onended = () => {
      audioSourcesRef.current = audioSourcesRef.current.filter(s => s !== source);
    };

    // Track model volume (improved tracking)
    const modelData = new Uint8Array(modelAnalyserRef.current.frequencyBinCount);
    const updateModelVolume = () => {
      if (modelAnalyserRef.current) {
        modelAnalyserRef.current.getByteFrequencyData(modelData);
        const avg = modelData.reduce((p, c) => p + c, 0) / modelData.length;
        setModelVolume(avg / 140);
        if (avg > 0) requestAnimationFrame(updateModelVolume);
        else setModelVolume(0);
      }
    };
    updateModelVolume();
  };

  const stopAllPlayback = () => {
    audioSourcesRef.current.forEach(source => {
      try { source.stop(); } catch(e) {}
    });
    audioSourcesRef.current = [];
    if (audioCtxRef.current) {
      nextStartTimeRef.current = audioCtxRef.current.currentTime;
    }
  };

  const updateTranscript = (role: 'user' | 'model', text: string, final: boolean) => {
    setTranscripts(prev => {
      const last = prev[prev.length - 1];
      // Logic: if last message is same role and NOT final, we append/overwrite
      if (last && last.role === role && !last.final) {
        const updated = [...prev];
        updated[updated.length - 1] = { 
          ...last, 
          text: final ? text : (last.text + text), // Simplified for tokens
          timestamp: Date.now(),
          final 
        };
        return updated;
      }
      return [...prev, { id: Math.random().toString(36), role, text, timestamp: Date.now(), final }];
    });
  };

  useEffect(() => {
    return () => cleanup();
  }, []);

  return {
    status,
    transcripts,
    isMuted,
    toggleMute,
    userVolume,
    modelVolume,
    error,
    connect,
    disconnect
  };
}
