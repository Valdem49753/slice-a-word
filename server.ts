import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, Schema } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.post("/api/parse-words", async (req, res) => {
    try {
      const { text, nativeLang, targetLang } = req.body;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Parse the following text into a list of vocabulary words. The languages are ${nativeLang} and ${targetLang}. Extract the word in the native language and its translation in the target language. Ignore any extra text. Return a JSON array of objects with keys 'native' and 'target'.\n\nText:\n${text}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            description: "List of vocabulary words",
            items: {
              type: Type.OBJECT,
              properties: {
                native: {
                  type: Type.STRING,
                  description: `The word in ${nativeLang}`,
                },
                target: {
                  type: Type.STRING,
                  description: `The translation in ${targetLang}`,
                },
              },
              required: ["native", "target"],
            },
          },
        }
      });

      const json = JSON.parse(response.text || "[]");
      res.json(json);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to parse text" });
    }
  });

  app.post("/api/generate-distractors", async (req, res) => {
    try {
      const { targetWord, nativeWord, nativeLang, targetLang, difficulty, otherWords } = req.body;
      
      let prompt = "";
      if (difficulty === "hard") {
        prompt = `Generate 3 similar but incorrect translations in ${targetLang} for the ${nativeLang} word "${nativeWord}" (correct translation is "${targetWord}"). The distractors should be plausible translations, perhaps related words or similar sounding words, to challenge an advanced learner. Return a JSON array of 3 strings.`;
      } else {
        prompt = `Generate 3 random words in ${targetLang} that are completely unrelated to "${targetWord}". Return a JSON array of 3 strings.`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING,
            },
          },
        }
      });

      const json = JSON.parse(response.text || "[]");
      res.json(json);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to generate distractors" });
    }
  });

  // ---------------------------------------------------------------------
  // Качественная озвучка через Gemini TTS.
  // Модель возвращает сырой PCM (16-bit mono, обычно 24 кГц) в base64 —
  // оборачиваем в WAV и отдаём с долгим кэшированием.
  // Если имя модели устарело — актуальное см. на ai.google.dev (TTS models).
  // ---------------------------------------------------------------------
  const TTS_MODEL = "gemini-2.5-flash-preview-tts";
  // Другие голоса: Puck, Zephyr, Charon, Leda, Aoede, Fenrir, Orus...
  const TTS_VOICE = process.env.TTS_VOICE || "Kore";
  const ttsCache = new Map<string, Buffer>(); // экономим квоту на повторах

  function pcmToWav(pcm: Buffer, sampleRate: number): Buffer {
    const header = Buffer.alloc(44);
    header.write("RIFF", 0);
    header.writeUInt32LE(36 + pcm.length, 4);
    header.write("WAVE", 8);
    header.write("fmt ", 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20); // PCM
    header.writeUInt16LE(1, 22); // mono
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(sampleRate * 2, 28); // byteRate
    header.writeUInt16LE(2, 32); // blockAlign
    header.writeUInt16LE(16, 34); // bits per sample
    header.write("data", 36);
    header.writeUInt32LE(pcm.length, 40);
    return Buffer.concat([header, pcm]);
  }

  app.get("/api/tts", async (req, res) => {
    try {
      const text = String(req.query.text || "").slice(0, 300).trim();
      const lang = String(req.query.lang || "").trim();
      if (!text) {
        res.status(400).json({ error: "text required" });
        return;
      }

      const key = `${lang}|${text}`;
      let wav = ttsCache.get(key);

      if (!wav) {
        // Язык модель определяет из текста автоматически; короткая
        // инструкция помогает на односложных словах ("sopa" es vs pt).
        // Если модель вдруг зачитывает саму инструкцию — просто уберите
        // префикс и оставьте `contents: text`.
        const contents = lang ? `Say in ${lang}: ${text}` : text;
        const response = await ai.models.generateContent({
          model: TTS_MODEL,
          contents,
          config: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: TTS_VOICE } },
            },
          },
        });

        const part: any = response.candidates?.[0]?.content?.parts?.[0];
        const inline = part?.inlineData;
        if (!inline?.data) throw new Error("no audio in Gemini response");

        const pcm = Buffer.from(inline.data, "base64");
        const rate = Number((String(inline.mimeType || "").match(/rate=(\d+)/) || [])[1] || 24000);
        wav = pcmToWav(pcm, rate);

        if (ttsCache.size > 500) ttsCache.clear();
        ttsCache.set(key, wav);
      }

      res.setHeader("Content-Type", "audio/wav");
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      res.send(wav);
    } catch (error) {
      console.error("TTS error:", error);
      res.status(502).json({ error: "TTS failed" });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
