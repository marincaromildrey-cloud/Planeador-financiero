import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import * as dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with custom user-agent
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("WARNING: GEMINI_API_KEY is not defined in the environment.");
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
};

// API endpoint for AI financial recommendations
app.post("/api/chat", async (req, res) => {
  try {
    const { message, activeState } = req.body;
    if (!message) {
      return res.status(400).json({ error: "El mensaje es requerido." });
    }

    const ai = getGeminiClient();
    if (!ai) {
      // Return a simulated high-quality response if Gemini is not configured, while warning of the lack of API key.
      return res.json({
        text: `Hola, soy tu asistente financiero. (Nota: GEMINI_API_KEY no está configurada, respuesta local simulada):\n\nActualmente, de acuerdo con tu información:\n- **Patrimonio**: $${activeState.netWorth.toLocaleString()}\n- **Ahorros**: $${activeState.savingsTotal.toLocaleString()}\n- **Ingresos Mensuales**: $${activeState.income.toLocaleString()}\n- **Gastos Mensuales**: $${activeState.expenses.toLocaleString()}\n\n¿Deseas que simulemos un plan detallado para tu meta actual **${activeState.featuredGoal || "Ahorros"}**?`
      });
    }

    // Embed current user financial context to make Gemini incredibly smart and personal!
    const context = `
Eres un asistente e instructor financiero personal altamente calificado en la aplicación 'Ordena Tus Finanzas' (o StewardWealth). El usuario se llama Carlos Aranda.
A continuación se detallan sus datos financieros actuales reales que debes utilizar para contestar con precisión (sin inventar):
- Patrimonio Neto Total: $${activeState.netWorth}
- Ingresos Mensuales: $${activeState.income}
- Gastos Mensuales: $${activeState.expenses}
- Saldo en Cuenta de Ahorros: $${activeState.savingsTotal}
- Metas de ahorro destacadas:
  * ${activeState.featuredGoal} (Ahorrado: $${activeState.featuredGoalSaved} / Objetivo: $${activeState.featuredGoalTarget})
- Mensaje del usuario: "${message}"

Responde en español de manera profesional, clara, cercana, motivadora y estructurada con viñetas. Da consejos prácticos basados en la relación de ingresos y gastos del usuario, o explica cómo va con su meta de ahorro. No menciones detalles técnicos de bases de datos. Mantén un tono de coach financiero de confianza.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: context,
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Error in Gemini API:", error);
    res.status(500).json({ error: "Error al procesar la recomendación con IA. Inténtalo de nuevo." });
  }
});

// Serve health status
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date() });
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
