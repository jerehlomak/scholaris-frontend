import { GoogleGenAI } from '@google/genai';

export interface CurriculumConfig {
    classLevel: string;
    subject: string;
    academicTerm: string;
    weeks: number;
    focusAreas: string[];
}

export interface WeeklyPlan {
    weekNumber: number;
    topic: string;
    objectives: string[];
    activities: string;
}

export interface GeneratedCurriculum {
    metadata: CurriculumConfig;
    weeks: WeeklyPlan[];
}

/**
 * Mocks an AI generating a structured curriculum timeline based on inputs.
 */
export async function generateCurriculum(config: CurriculumConfig): Promise<GeneratedCurriculum> {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey || apiKey === "your_api_key_here") {
        throw new Error("Missing Gemini API Key. Please add VITE_GEMINI_API_KEY to your .env file.");
    }

    const ai = new GoogleGenAI({ apiKey: apiKey });

    const prompt = `
You are an expert educational curriculum designer.
Generate a ${config.weeks}-week scheme of work for the following criteria:
- Section: ${config.classLevel}
- Subject: ${config.subject}
- Academic Term: ${config.academicTerm}
- Special Focus Areas (if any): ${config.focusAreas.join(", ")}

Constraints:
Ensure the content is highly relevant, progressive, and realistically achievable within a standard school term. 
The curriculum must have exactly ${config.weeks} weeks.

Output Format Requirement:
You MUST return ONLY valid JSON that precisely matches the following TypeScript structure. Do NOT wrap the JSON in markdown blocks like \`\`\`json. Just return the raw JSON object.

{
  "weeks": [
    {
      "weekNumber": 1, // Number from 1 to ${config.weeks}
      "topic": "String topic name",
      "objectives": ["String objective 1", "String objective 2"], // 2-3 short bullet points
      "activities": "String concise description of core class activity"
    }
  ]
}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.7,
                responseMimeType: 'application/json'
            }
        });

        const textResponse = response.text || "{}";
        const generatedData = JSON.parse(textResponse);

        if (!generatedData.weeks || !Array.isArray(generatedData.weeks)) {
            throw new Error("Invalid format returned from AI.");
        }

        return {
            metadata: config,
            weeks: generatedData.weeks as WeeklyPlan[]
        };

    } catch (error: any) {
        console.error("Gemini Curriculum Generation Failed:", error);
        throw new Error(error.message || "Failed to generate curriculum from AI.");
    }
}
