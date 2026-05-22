import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, MicOff, Phone, PhoneOff, Settings, Languages, 
  Volume2, Info, AlertCircle, ChevronDown, Sparkles,
  Command, Wifi, Globe, Clock, X
} from 'lucide-react';
import { useGeminiLive } from './useGeminiLive';
import { VoiceOrb } from './components/VoiceOrb';
import { detectTerminationIntent } from './lib/intent';
import { playEndedSound } from './lib/soundEffects';

const VOICES = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];
const LANGUAGES = [
  { code: 'auto', name: 'Auto-detect' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ha', name: 'Hausa' },
  { code: 'yo', name: 'Yoruba' },
  { code: 'ig', name: 'Igbo' },
  { code: 'ar', name: 'Arabic' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
];

export default function App() {
  const { 
    status, transcripts, isMuted, toggleMute, error, connect, disconnect,
    userVolume, modelVolume
  } = useGeminiLive();
  
  const [activeStatus, setActiveStatus] = useState<'idle' | 'connecting' | 'connected' | 'exiting' | 'error'>('idle');
  const [targetLang, setTargetLang] = useState('auto');
  const [selectedVoice, setSelectedVoice] = useState('Puck');
  const [showSettings, setShowSettings] = useState(false);
  
  const getDetectedLanguageName = () => {
    const browserLang = typeof navigator !== 'undefined' && navigator.language ? navigator.language.split('-')[0] : 'en';
    const isSupported = LANGUAGES.some(l => l.code === browserLang && l.code !== 'auto');
    const detectedCode = isSupported ? browserLang : 'en';
    return LANGUAGES.find(l => l.code === detectedCode)?.name || 'English';
  };
  
  useEffect(() => {
    if (status === 'connecting') {
      setActiveStatus('connecting');
    } else if (status === 'connected') {
      setActiveStatus('connected');
    } else if (status === 'error') {
      setActiveStatus('error');
    } else if (status === 'idle') {
      setActiveStatus(prev => prev === 'exiting' ? 'exiting' : 'idle');
    }
  }, [status]);

  const [hue, setHue] = useState(240);
  useEffect(() => {
    const interval = setInterval(() => {
        setHue(prev => (prev + 0.5) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const handleEndCall = () => {
    setActiveStatus('exiting');
    playEndedSound();
    setTimeout(() => {
      disconnect();
      setActiveStatus('idle');
    }, 2200);
  };

  const handleStartCall = () => {
    let resolvedLangCode = targetLang;
    if (targetLang === 'auto') {
      const browserLang = typeof navigator !== 'undefined' && navigator.language ? navigator.language.split('-')[0] : 'en';
      const isSupported = LANGUAGES.some(l => l.code === browserLang && l.code !== 'auto');
      resolvedLangCode = isSupported ? browserLang : 'en';
    }
    const langName = LANGUAGES.find(l => l.code === resolvedLangCode)?.name || 'English';
    const systemInstruction = `
      You are Astraz, a sophisticated AI voice persona.
      Aesthetics: Modern, professional, concise.
      Role: Real-time translator and assistant.
      User's preferred output language: ${langName}.
      Instructions: Use advanced punctuation. Adjust your tone to be helpful and articulate.
      
      CRITICAL: If the user requests to end the call, hang up, stop, exit, or close the session (using terms like "end call", "hang up", "terminate", "kashe kiran", "gama kiran", "oda bo", "mechie oku" in any language), always respond instantly and only with a brief final word (such as "Goodbye!" or "Terminating session") and then stay silent, allowing the client application to shut down the communication line. Under no circumstances should you state that you are incapable of hanging up or ending the call.
    `;
    connect({ 
      systemInstruction, 
      voiceName: selectedVoice,
      onTerminationTriggered: handleEndCall
    });
  };

  // Speech-based intent termination monitor across all languages
  useEffect(() => {
    if (activeStatus !== 'connected') return;

    // Check user transcripts
    const userTranscripts = transcripts.filter(t => t.role === 'user');
    if (userTranscripts.length > 0) {
      const latest = userTranscripts[userTranscripts.length - 1];
      if (latest && latest.text) {
        if (detectTerminationIntent(latest.text)) {
          console.log("Interactive voice termination triggered for user phrase:", latest.text);
          handleEndCall();
          return;
        }
      }
    }

    // Check model transcripts for final goodbye sequence
    const modelTranscripts = transcripts.filter(t => t.role === 'model');
    if (modelTranscripts.length > 0) {
      const latest = modelTranscripts[modelTranscripts.length - 1];
      if (latest && latest.text) {
        const lowerText = latest.text.toLowerCase().trim();
        if (
          lowerText.includes("goodbye") || 
          lowerText.includes("terminating session") || 
          lowerText.includes("terminating") ||
          lowerText.includes("session ended") ||
          lowerText.includes("oda bo") ||
          lowerText.includes("odabo") ||
          lowerText.includes("mechie oku") ||
          lowerText.includes("adios") ||
          lowerText.includes("au revoir")
        ) {
          console.log("Interactive voice termination triggered for model response:", latest.text);
          handleEndCall();
        }
      }
    }
  }, [transcripts, activeStatus]);

  return (
    <div className={`h-screen transition-colors duration-1000 font-sans selection:bg-indigo-500/30 overflow-hidden flex flex-col ${activeStatus !== 'idle' ? 'bg-[#050508] text-white' : 'bg-white text-slate-900'}`}>
      {/* Dynamic Header */}
      <AnimatePresence>
        {activeStatus === 'idle' && (
          <motion.header 
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            className="px-8 py-5 flex items-center justify-between border-b border-slate-100 bg-white/80 backdrop-blur-xl z-30 sticky top-0"
          >
            <div className="flex items-center gap-3">
              <Command className="w-6 h-6 text-slate-900" />
              <div>
                <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase">Astraz</h1>
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${activeStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    System Ready
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowSettings(true)}
                className="p-2.5 hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-200 text-slate-600"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col md:flex-row relative z-10 overflow-hidden h-full">
        {/* Main Interface Area */}
        <div className={`flex-1 flex flex-col relative transition-colors duration-1000 ${activeStatus !== 'idle' ? 'bg-[#050508]' : 'bg-white'}`}>
          <div className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden">
             
             {/* Background Atmosphere for active call */}
             <AnimatePresence>
                {activeStatus !== 'idle' && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.15 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.3),transparent_70%)]"
                        />
                        <motion.div 
                            className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.2 }}
                            exit={{ opacity: 0 }}
                        >
                            <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-500 rounded-full blur-[120px]" />
                            <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-500 rounded-full blur-[120px]" />
                        </motion.div>
                    </>
                )}
             </AnimatePresence>

             <AnimatePresence mode="wait">
               {activeStatus === 'idle' ? (
                 <motion.div 
                   key="idle-view"
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 1.05 }}
                   className="flex flex-col items-center gap-8 text-center relative z-10 max-w-sm px-6"
                 >
                   <div className="space-y-4">
                     <h2 className="text-4xl font-black tracking-tight text-slate-900 leading-[0.9]">Transformative Voice.</h2>
                     <p className="text-slate-500 text-sm font-medium">Connect with Astraz in real-time. Native understanding across multiple languages with zero latency.</p>
                   </div>
                   <button 
                     onClick={handleStartCall}
                     className="bg-slate-900 hover:bg-slate-800 transform transition-all active:scale-95 text-white px-12 py-5 rounded-full font-black text-xs tracking-[0.2em] uppercase shadow-2xl shadow-indigo-200 mt-4 flex items-center gap-3"
                   >
                     <Phone className="w-4 h-4 fill-current mr-2" />
                     Initiate Session
                   </button>
                 </motion.div>
               ) : (
                 <motion.div 
                    key="active-view"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 1.5 } }}
                    className="w-full h-full flex flex-col items-center justify-center relative z-10"
                 >
                    {activeStatus === 'connecting' && (
                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none">
                            <div className="relative w-24 h-24 mb-6">
                                <div className="absolute inset-0 border-4 border-white/10 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
                            </div>
                            <p className="text-white font-black text-xs tracking-[0.3em] uppercase animate-pulse">Establishing Neural Link</p>
                        </div>
                    )}
                    <div className="w-full h-full max-w-5xl max-h-[85vh] relative flex items-center justify-center">
                        <VoiceOrb 
                            userVolume={userVolume}
                            modelVolume={modelVolume}
                            isMuted={isMuted} 
                            status={activeStatus}
                         />
                    </div>
                 </motion.div>
               )}
             </AnimatePresence>
          </div>



          {/* Redesigned Floating Controls - High Glassmorphism */}
          {activeStatus !== 'idle' && activeStatus !== 'exiting' && (
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-50">
               <motion.div 
                 initial={{ y: 100, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 className="bg-white/10 backdrop-blur-3xl border border-white/20 p-4 rounded-full shadow-[0_30px_100px_rgba(0,0,0,0.4)] flex items-center gap-4"
               >
                 <button 
                   onClick={toggleMute}
                   className={`w-16 h-16 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                    isMuted ? 'bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.4)]' : 'bg-white/10 text-white hover:bg-white/20'
                   }`}
                 >
                   {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                 </button>

                 <button 
                   onClick={handleEndCall}
                   className="w-24 h-16 bg-rose-600 hover:bg-rose-500 text-white rounded-full flex items-center justify-center transition-all shadow-xl active:scale-95 hover:shadow-[0_0_30px_rgba(225,29,72,0.4)]"
                   title="End Session"
                 >
                   <PhoneOff className="w-7 h-7 fill-current" />
                 </button>
               </motion.div>
            </div>
          )}
        </div>

      </main>

      {/* Settings Modal Redesign */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#050508]/80 backdrop-blur-2xl overflow-y-auto flex flex-col items-center justify-start sm:justify-center p-4 sm:p-6"
            onClick={() => setShowSettings(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0f0f14] border border-white/10 w-full max-w-3xl rounded-[2rem] sm:rounded-[3rem] p-5 sm:p-10 shadow-3xl relative my-auto max-h-[90vh] md:max-h-[85vh] flex flex-col overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="relative z-10 flex flex-col h-full overflow-y-auto pr-1">
                <div className="flex items-center justify-between mb-6 sm:mb-10">
                   <div>
                     <h3 className="text-2xl sm:text-4xl font-black tracking-tighter text-white">Advanced Control</h3>
                     <p className="text-white/40 text-[11px] sm:text-xs font-medium mt-1">Fine-tune the neural bridge parameters.</p>
                   </div>
                   <button 
                     onClick={() => setShowSettings(false)} 
                     className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center hover:bg-white/10 rounded-full border border-white/10 text-white/50 active:scale-90 transition-all"
                     aria-label="Close Settings"
                   >
                     <X className="w-5 h-5 sm:w-6 sm:h-6" />
                   </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 flex items-center gap-3">
                       <Globe className="w-4 h-4" /> Linguistic Target
                    </label>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3 max-h-[160px] md:max-h-[300px] overflow-y-auto pr-2">
                      {LANGUAGES.map(lang => (
                        <button
                          key={lang.code}
                          onClick={() => setTargetLang(lang.code)}
                          className={`px-3.5 py-3 sm:px-5 sm:py-4 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-black border transition-all text-left flex flex-col gap-1 ${
                            targetLang === lang.code 
                              ? 'bg-indigo-600 border-indigo-500 text-white shadow-2xl shadow-indigo-500/20' 
                              : 'bg-white/5 border-white/5 text-white/60 hover:border-white/20'
                          }`}
                        >
                          <span className="opacity-40 text-[8px] uppercase tracking-widest leading-none">Active</span>
                          {lang.code === 'auto' ? `Auto (${getDetectedLanguageName()})` : lang.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 flex items-center gap-3">
                       <Volume2 className="w-4 h-4" /> Neural Persona
                    </label>
                    <div className="space-y-2 max-h-[160px] md:max-h-[300px] overflow-y-auto pr-1">
                      {VOICES.map(voice => (
                        <button
                          key={voice}
                          onClick={() => setSelectedVoice(voice)}
                          className={`w-full px-4 py-3 sm:px-5 sm:py-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black border transition-all flex items-center justify-between ${
                            selectedVoice === voice 
                              ? 'bg-emerald-600 border-emerald-500 text-white' 
                              : 'bg-white/5 border-white/5 text-white/60 hover:border-white/20'
                          }`}
                        >
                          {voice}
                          {selectedVoice === voice && <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setShowSettings(false)}
                  className="w-full mt-6 sm:mt-10 bg-white text-black font-black py-4 sm:py-5 rounded-xl sm:rounded-full text-[10px] sm:text-xs tracking-[0.3em] uppercase hover:bg-neutral-100 active:scale-95 shadow-2xl transition-all"
                >
                  Apply Configuration
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className={`px-8 py-4 border-t transition-colors duration-1000 flex items-center justify-between text-[9px] font-black uppercase tracking-widest overflow-hidden ${activeStatus !== 'idle' ? 'bg-[#050508] border-white/5 text-white/30' : 'bg-white border-slate-100 text-slate-400'}`}>
        <div className="flex items-center gap-8">
           <div className="flex items-center gap-3">
              <Clock className="w-3 h-3" />
              <span>UPTIME: 04:12m</span>
           </div>
           <div className="hidden sm:flex items-center gap-3 border-l border-white/10 pl-8">
              <span className={`w-1.5 h-1.5 rounded-full ${activeStatus === 'connected' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              <span>Neural Bridge: Active</span>
           </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline">Signal Integrity: 99.8%</span>
          <div className="flex gap-1 ml-2">
            {[1,1,1,1,0].map((v, i) => <div key={i} className={`w-1.5 h-4 rounded-full ${v ? (activeStatus !== 'idle' ? 'bg-indigo-400' : 'bg-indigo-500') : 'bg-white/10'}`} />)}
          </div>
        </div>
      </footer>
      {/* Error Overlay */}
      <AnimatePresence>
        {error && (
          <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0 }}
             className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-white border border-rose-100 p-4 rounded-2xl flex items-center gap-4 shadow-2xl max-w-sm w-full mx-4"
          >
            <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center shrink-0">
               <AlertCircle className="w-5 h-5 text-rose-500" />
            </div>
            <div className="flex-1 overflow-hidden">
               <p className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-0.5">Stream Error</p>
               <p className="text-xs font-semibold text-slate-700 truncate">{error}</p>
            </div>
            <button onClick={() => window.location.reload()} className="bg-slate-900 text-white p-2 rounded-lg transition-colors hover:bg-slate-800">
               <Phone className="w-3 h-3 rotate-135" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
