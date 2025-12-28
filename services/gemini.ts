
import { GoogleGenAI, Type } from "@google/genai";

// Always obtain API key directly from process.env.API_KEY as per guidelines
export const breakdownTaskAI = async (title: string, description: string): Promise<string[]> => {
  // Create a new GoogleGenAI instance right before making an API call
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `En tant qu'assistant expert pour les personnes avec TDAH, décompose la tâche suivante en 4 à 6 étapes extrêmement simples, concrètes et gratifiantes.
  Tâche: ${title}
  Description: ${description}
  Réponds uniquement sous forme d'un tableau JSON de chaînes de caractères.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    // Extract text output using the .text property
    const text = response.text;
    if (!text) {
      throw new Error("No text content in response");
    }
    const steps = JSON.parse(text);
    return steps;
  } catch (error) {
    console.error("Gemini breakdown error:", error);
    return ["Commencer par la première petite étape", "Respirer un bon coup", "Faire 5 minutes d'action", "Célébrer la fin"];
  }
};

export const parseVoiceCommand = async (transcript: string): Promise<{ title: string; priority: string } | null> => {
  // Create a new GoogleGenAI instance right before making an API call
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Analyse cette transcription vocale pour créer une tâche: "${transcript}". 
  Identifie le titre de la tâche et suggère une priorité (URGENT, HAUTE, MOYENNE, BASSE). 
  Si aucune tâche n'est détectée, retourne null.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            priority: { type: Type.STRING, enum: ["URGENT", "HAUTE", "MOYENNE", "BASSE"] }
          },
          required: ["title", "priority"]
        }
      }
    });

    // Extract text output using the .text property
    const text = response.text;
    if (!text) {
      return null;
    }
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini voice parsing error:", error);
    return null;
  }
};
