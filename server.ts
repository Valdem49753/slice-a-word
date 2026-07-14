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
