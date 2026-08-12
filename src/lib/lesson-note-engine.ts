import { GoogleGenAI } from '@google/genai';

export interface LessonNoteConfig {
    topic: string;
    duration: string;
    objectives: string;
}

export interface GeneratedLessonNote {
    metadata: LessonNoteConfig;
    content: {
        introduction: string;
        coreConcepts: string[];
        presentationSteps: string[];
        formativeAssessment: string;
        conclusion: string;
        assignment: string;
    };
}

/**
 * Mocks an AI generating a structured lesson plan document based on inputs.
 */
export async function generateLessonNote(config: LessonNoteConfig): Promise<GeneratedLessonNote> {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey || apiKey === "your_api_key_here") {
        throw new Error("Missing Gemini API Key. Please add VITE_GEMINI_API_KEY to your .env file.");
    }

    const ai = new GoogleGenAI({ apiKey: apiKey });

    const prompt = `
You are a master teacher and lesson plan architect.
Write a comprehensive, professional Lesson Note based directly on these parameters:
- Topic: ${config.topic}
- Duration: ${config.duration}
- Key Objectives: ${config.objectives}

Requirements:
- Ensure the tone is instructional, professional, and actionable for a teacher in a real classroom.
- Create deep, robust content for each section, not just single sentences.
- The 'coreConcepts' and 'presentationSteps' arrays must have at least 3-4 detailed items each.

Output Format Requirement:
You MUST return ONLY valid JSON that precisely matches the following TypeScript structure. Do NOT wrap the JSON in markdown blocks like \`\`\`json. Just return the raw JSON object.

{
  "content": {
    "introduction": "A strong hook and connection to prior knowledge...",
    "coreConcepts": ["Detailed concept explanation 1", "Detailed concept explanation 2"],
    "presentationSteps": ["Step 1: ...", "Step 2: ...", "Step 3: ..."],
    "formativeAssessment": "Methods to check for understanding mid-lesson...",
    "conclusion": "Summary of learning and closing remarks...",
    "assignment": "Homework or independent practice instructions..."
  }
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

        if (!generatedData.content || !generatedData.content.introduction) {
            throw new Error("Invalid format returned from AI.");
        }

        return {
            metadata: config,
            content: generatedData.content
        };

    } catch (error: any) {
        console.error("Gemini Lesson Note Generation Failed:", error);
        throw new Error(error.message || "Failed to generate lesson note from AI.");
    }
}
