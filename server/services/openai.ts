import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import { type CorrectionObject } from "@shared/schema";

const openai = new OpenAI();

const AiCorrectionSchema = z.object({
  category: z.enum(['grammar', 'style', 'clarity', 'structure', 'content', 'research']),
  exactQuote: z.string(),
  comment: z.string(),
});

const AiResponseSchema = z.object({
  grammarScore: z.number(),
  styleScore: z.number(),
  clarityScore: z.number(),
  structureScore: z.number(),
  contentScore: z.number(),
  researchScore: z.number(),
  isOffensive: z.boolean().describe("True if the essay contains hate speech, explicit violence, sexual content, or severe harassment."),
  offenseReason: z.string().nullable().optional().describe("If offensive, a brief explanation in Portuguese."),
  corrections: z.array(AiCorrectionSchema),
});

export interface AIReviewResult {
  grammarScore: number;
  styleScore: number;
  clarityScore: number;
  structureScore: number;
  contentScore: number;
  researchScore: number;
  overallScore: number;

  isOffensive: boolean;
  offenseReason?: string;

  corrections: CorrectionObject[];
  rubricScores?: any;
}

/**
 * Analisa uma redação usando GPT-4o com Saídas Estruturadas.
 */
export async function analyzeEssayWithOpenAI(title: string, content: string, rubric?: any): Promise<AIReviewResult> {

  const model = process.env.AI_MODEL || "llama-3.3-70b-versatile";

  try{
  
    const completion = await openai.chat.completions.create({

      
      model: model,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an expert academic writing tutor. Analyze the essay and provide structured feedback in JSON format.

          LANGUAGE INSTRUCTIONS:
          - **All comments and feedback text MUST be in Portuguese (Português do Brasil).**
          - **JSON Keys and Category values (e.g., 'grammar', 'style') MUST remain in English.**
  
          MODERATION GUIDE (CRITICAL):
          - Check for: Hate speech, racism, severe profanity, explicit sexual content, promotion of self-harm or violence.
          - If found, set "isOffensive" to true and provide "offenseReason".
          - If the text is just poorly written or controversial but academic, it is NOT offensive.

          Scoring Guide:
          - Evaluate 6 categories: grammar, style, clarity, structure, content, research.
          - **Assign a score from 0 to 200 for EACH category.**
          - Be rigorous but fair.
          
          Corrections Guide:
          - Identify specific issues in the text.
          - **Focus on the most impactful errors (Quality over Quantity).**
          - **Do not list every single typo if there are many; group them or highlight the major ones.**
          - **Aim for 3 to 10 high-quality corrections.** (This is a guideline, not a strict rule)
          - For 'exactQuote', perform a copy-paste of the text segment you are referring to. It must match the user text exactly.

          Output JSON Schema:
          {
            "grammarScore": number,
            "styleScore": number,
            "clarityScore": number,
            "structureScore": number,
            "contentScore": number,
            "researchScore": number,
            "isOffensive": boolean,
            "offenseReason": string | null,
            "overallScore": number,
            "corrections": [
              { "category": "grammar"|"style"|"clarity"|"structure"|"content"|"research", "exactQuote": "string", "comment": "string (IN PORTUGUESE)" }
            ]
          }`
        },
        {
          role: "user",
          content: `Title: ${title}\n\nEssay Content:\n${content}`
        }
      ],
      temperature: 0.2,
    });

  const responseContent = completion.choices[0].message.content;

  if (!responseContent) {
    throw new Error("IA retornou resposta vazia");
  }

  const rawJson = JSON.parse(responseContent);

  const aiResponse = AiResponseSchema.parse(rawJson);

  const calculatedOverallScore = 
      aiResponse.grammarScore + 
      aiResponse.styleScore + 
      aiResponse.clarityScore + 
      aiResponse.structureScore + 
      aiResponse.contentScore + 
      aiResponse.researchScore;

    const finalCorrections: CorrectionObject[] = aiResponse.corrections.map(c => {
    const startIndex = content.indexOf(c.exactQuote);
    
    if (startIndex === -1) {
      console.warn(`[Grog] Could not find quote: "${c.exactQuote}"`);
      return null;
    }

    return {
      category: c.category,
      selectedText: c.exactQuote,
      textStartIndex: startIndex,
      textEndIndex: startIndex + c.exactQuote.length,
      comment: c.comment,
    };
  }).filter((c): c is CorrectionObject => c !== null);

  return {
    ...aiResponse,
    overallScore: aiResponse.isOffensive ? 0 : calculatedOverallScore,
    corrections: finalCorrections,
    offenseReason: aiResponse.offenseReason
  };
} catch (error) {
    console.error("Erro na chamada da Groq:", error);
    throw new Error("Falha ao analisar redação com IA");
  }
}