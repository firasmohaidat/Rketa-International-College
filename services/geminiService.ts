import { GoogleGenAI, Type } from "@google/genai";
import { AIGradingResult } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const gradingSchema = {
  type: Type.OBJECT,
  properties: {
    score: {
      type: Type.NUMBER,
      description: "The score given to the student's answer based on accuracy compared to the model answer.",
    },
    feedback: {
      type: Type.STRING,
      description: "Constructive feedback explaining why this score was given in Arabic.",
    },
  },
  required: ["score", "feedback"],
};

export const gradeEssayAnswer = async (
  questionText: string,
  modelAnswer: string,
  studentAnswer: string,
  maxPoints: number
): Promise<AIGradingResult> => {
  try {
    const prompt = `
      You are an expert teacher assistant. 
      Task: Grade the following student answer for an exam question based on the provided model answer.
      
      Question: "${questionText}"
      Max Points: ${maxPoints}
      Model Answer: "${modelAnswer}"
      Student Answer: "${studentAnswer}"
      
      Instructions:
      1. Evaluate the student answer accuracy against the model answer.
      2. Assign a score between 0 and ${maxPoints}.
      3. Provide brief, constructive feedback in Arabic.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: gradingSchema,
        temperature: 0.3,
      },
    });

    const resultText = response.text;
    if (!resultText) throw new Error("Empty response from AI");

    const parsedResult = JSON.parse(resultText) as AIGradingResult;
    return parsedResult;

  } catch (error) {
    console.error("AI Grading Error:", error);
    return {
      score: 0,
      feedback: "حدث خطأ أثناء التصحيح الآلي. يرجى المراجعة يدوياً."
    };
  }
};