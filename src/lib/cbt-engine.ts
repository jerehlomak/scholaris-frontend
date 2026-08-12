import { GoogleGenAI } from '@google/genai';

export interface QuestionConfig {
    subject: string;
    topic: string;
    count: number;
    difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface GeneratedQuestion {
    questionText: string;
    type: 'MULTIPLE_CHOICE';
    options: string[];
    correctAnswer: string;
    marks: number;
}

/**
 * Generates structured exam questions using Gemini AI.
 */
export async function generateCBTQuestions(config: QuestionConfig): Promise<GeneratedQuestion[]> {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey || apiKey === "your_api_key_here") {
        throw new Error("Missing Gemini API Key. Please add VITE_GEMINI_API_KEY to your .env file.");
    }

    const ai = new GoogleGenAI({ apiKey: apiKey });

    const prompt = `
You are an expert academic examiner.
Generate ${config.count} ${config.difficulty} difficulty-level multiple choice questions for the following:
- Subject: ${config.subject}
- Topic: ${config.topic}

Constraints:
1. Each question MUST have exactly 4 options.
2. Only one option can be correct.
3. The "correctAnswer" field must be the exact string of the correct option.
4. "marks" should be 1 for Easy, 2 for Medium, and 3 for Hard.
5. All questions must be of type "MULTIPLE_CHOICE".

Output Format Requirement:
You MUST return ONLY valid JSON that matches the following structure. Do NOT wrap the JSON in markdown blocks.

{
  "questions": [
    {
      "questionText": "What is...?",
      "type": "MULTIPLE_CHOICE",
      "options": ["Opt 1", "Opt 2", "Opt 3", "Opt 4"],
      "correctAnswer": "Opt 2",
      "marks": 1
    }
  ]
}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash', // Following existing pattern but using a widely available model
            contents: prompt,
            config: {
                temperature: 0.7,
                responseMimeType: 'application/json'
            }
        });

        const textResponse = response.text || '{"questions": []}';
        const generatedData = JSON.parse(textResponse);

        if (!generatedData.questions || !Array.isArray(generatedData.questions)) {
            throw new Error("Invalid format returned from AI.");
        }

        return generatedData.questions.map((q: any) => ({
            ...q,
            type: 'MULTIPLE_CHOICE'
        })) as GeneratedQuestion[];

    } catch (error: any) {
        console.error("Gemini CBT Generation Failed:", error);
        throw new Error(error.message || "Failed to generate questions from AI.");
    }
}
