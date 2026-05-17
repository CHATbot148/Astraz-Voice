import express from "express";
import path from "path";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const wss = new WebSocketServer({ noServer: true });

const PORT = 3000;

// Gemini initialization
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// WebSocket handling
httpServer.on("upgrade", (request, socket, head) => {
  const pathname = new URL(request.url || "", `http://${request.headers.host}`).pathname;

  if (pathname === "/api/live") {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  } else {
    socket.destroy();
  }
});

wss.on("connection", async (clientWs: WebSocket) => {
  console.log("Client connected to Live API proxy");

  let session: any = null;

  clientWs.on("message", async (data) => {
    try {
      const msg = JSON.parse(data.toString());

      if (msg.type === "setup") {
        const { systemInstruction, voiceName } = msg;

        try {
          console.log("Connecting to Gemini Live with voice:", voiceName);
          session = await ai.live.connect({
            model: "models/gemini-3.1-flash-live-preview",
            callbacks: {
              onmessage: (message: LiveServerMessage) => {
                clientWs.send(JSON.stringify(message));
              },
              onclose: () => {
                console.log("Gemini session closed");
                if (clientWs.readyState === WebSocket.OPEN) {
                  clientWs.send(JSON.stringify({ type: "error", message: "Gemini connection closed" }));
                  clientWs.close();
                }
              },
              onerror: (err: any) => {
                const errMsg = err?.message || "Unknown Gemini session error";
                console.error("Gemini session error:", errMsg);
                if (clientWs.readyState === WebSocket.OPEN) {
                  clientWs.send(JSON.stringify({ type: "error", message: errMsg }));
                }
              }
            },
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName || "Puck" } },
              },
              systemInstruction: systemInstruction || "You are a helpful assistant.",
              inputAudioTranscription: {},
              outputAudioTranscription: {},
            },
          });
          console.log("Gemini session handshaked");
          clientWs.send(JSON.stringify({ type: "connected" }));
        } catch (err: any) {
          const errMsg = err?.message || "Connection failed";
          console.error("Gemini connection error:", errMsg);
          clientWs.send(JSON.stringify({ type: "error", message: "Failed to connect to Gemini: " + errMsg }));
          clientWs.close();
        }
        return;
      }

      if (session && msg.audio) {
        // Debug log to confirm audio flow
        if (msg.debug) { console.log("Mute status check on client failed if this logs?"); }
        
        session.sendRealtimeInput({
          audio: {
            mimeType: "audio/pcm;rate=24000",
            data: msg.audio
          }
        });
      }

    } catch (err) {
      console.error("Error processing client message:", err);
    }
  });

  clientWs.on("close", () => {
    console.log("Client disconnected");
    if (session) {
      // session.close() is not available in all SDK versions but usually handled by GC or explicit close
      try { session.close(); } catch(e) {}
    }
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
