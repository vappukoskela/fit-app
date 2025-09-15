import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const models = ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-1.5-pro", "gemini-1.5-flash"];

async function callGeminiModel(prompt: string, modelName: string): Promise<string> {
  console.log(`Calling Gemini with model: ${modelName}`);
  const model = genAI.getGenerativeModel({ model: modelName });
  const result = await model.generateContent(prompt);
  const response = await result.response;

  if (response.candidates && response.candidates.length > 0 && response.candidates[0].content.parts) {
    return response.candidates[0].content.parts.map(part => part.text).join('');
  }
  throw new Error(`No text response generated from Gemini model: ${modelName}`);
}

export async function generateText(prompt: string): Promise<string> {
  if (!prompt) {
    throw new Error("Prompt is required");
  }

  models.forEach(async model => {
    try {
      return await callGeminiModel(prompt, model);
    } catch (error) {
      console.warn(model + " failed", error);
    }
  });
  throw new Error("Failed to generate text from any available Gemini model.");
}