import OpenAI from "openai";
import { z } from "zod";
import { type CorrectionObject, type RubricCategory } from "@shared/schema";

const openai = new OpenAI();

const CategoryScoreSchema = z.object({
  categoryName: z.string(),
  score: z.number(),
});

const AiResponseSchema = z.object({
  scores: z.array(CategoryScoreSchema),
  
  isOffensive: z.boolean().describe("True if the essay contains hate speech, explicit violence, sexual content, or severe harassment."),
  offenseReason: z.string().nullable().optional().describe("If offensive, a brief explanation in Portuguese."),
  
  corrections: z.array(z.object({
    category: z.string(), 
    exactQuote: z.string(),
    comment: z.string(),
  })),
});

export interface AIReviewResult {
  grammarScore: number;
  styleScore: number;
  clarityScore: number;
  structureScore: number;
  contentScore: number;
  researchScore: number;
  overallScore: number;

  rubricScores: { categoryName: string; score: number; maxScore: number }[] | null;

  isOffensive: boolean;
  offenseReason?: string;
  corrections: CorrectionObject[];
}

/**
 * Analisa uma redação usando GPT-4o com Contexto de Gênero e Rúbrica Dinâmica.
 */
export async function analyzeEssayWithOpenAI(
  title: string, 
  content: string, 
  rubric?: RubricCategory[],
  essayType?: string
): Promise<AIReviewResult> {

  const model = process.env.AI_MODEL || "gpt-4o";
  const hasCustomRubric = rubric && rubric.length > 0;
  const currentGenre = essayType || "argumentative";

  let rubricInstructions = "";
  let categoriesList: string[] = [];

  if (hasCustomRubric) {
    rubricInstructions = "Evaluate based strictly on these CUSTOM categories:\n";
    rubric!.forEach(cat => {
      rubricInstructions += `- "${cat.name}" (Max ${cat.maxScore} pts): ${cat.description}\n`;
      categoriesList.push(cat.name);
    });
  } else {
    rubricInstructions = `Evaluate based on these STANDARD categories (Max 200 pts each):
    - grammar (Grammar & Mechanics)
    - style (Style & Voice)
    - clarity (Clarity & Flow)
    - structure (Structure & Organization)
    - content (Content & Ideas)
    - research (Research & Evidence)`;
    categoriesList = ['grammar', 'style', 'clarity', 'structure', 'content', 'research'];
  }

  try {
    const completion = await openai.chat.completions.create({
      model: model,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an expert writing tutor analyzing a(n) "${currentGenre}" essay.

          ADAPT YOUR FEEDBACK TO THE GENRE:
          - If "narrative" or "descriptive": Focus on imagery, storytelling, character development, and emotional impact.
          - If "argumentative" or "persuasive": Focus on thesis statement, logic, evidence, and rhetoric.
          - If "analytical" or "expository": Focus on clarity, objectivity, and depth of analysis.
          - If "reflective": Focus on personal insight and connection.

          LANGUAGE INSTRUCTIONS:
          - **All comments and feedback text MUST be in Portuguese (Português do Brasil).**
          - **JSON Keys and Category Names MUST remain in English (matching the rubric provided).**

          MODERATION GUIDE:
          - Check for hate speech, explicit violence, etc. Set "isOffensive" to true if found.

          SCORING GUIDE:
          ${rubricInstructions}

          CORRECTIONS GUIDE:
          - Identify specific issues relevant to the "${currentGenre}" genre.
          - "category" field in corrections must match one of: ${categoriesList.join(', ')}.
          - For 'exactQuote', copy the text exactly from the user input.

          OUTPUT JSON FORMAT:
          {
            "scores": [
              { "categoryName": "string (must match rubric)", "score": number }
            ],
            "isOffensive": boolean,
            "offenseReason": string | null,
            "corrections": [
              { "category": "string", "exactQuote": "string", "comment": "string" }
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
    if (!responseContent) throw new Error("IA retornou resposta vazia");

    const rawJson = JSON.parse(responseContent);
    const aiResponse = AiResponseSchema.parse(rawJson);

    let result: AIReviewResult = {
      grammarScore: 0, styleScore: 0, clarityScore: 0, 
      structureScore: 0, contentScore: 0, researchScore: 0,
      overallScore: 0,
      rubricScores: null,
      isOffensive: aiResponse.isOffensive,
      offenseReason: aiResponse.offenseReason || undefined,
      corrections: []
    };

    let totalScore = 0;

    if (hasCustomRubric) {
      result.rubricScores = aiResponse.scores.map(s => {
        const def = rubric!.find(r => r.name.toLowerCase() === s.categoryName.toLowerCase());
        const maxScore = def ? def.maxScore : 200;
        
        const safeScore = Math.min(Math.max(0, s.score), maxScore);

        return {
          categoryName: s.categoryName, 
          score: safeScore,
          maxScore: maxScore
        };
      });
      totalScore = result.rubricScores.reduce((acc, curr) => acc + curr.score, 0);
    } else {
      const scoreMap: Record<string, number> = {};
      const STANDARD_MAX = 200;

      aiResponse.scores.forEach(s => {
        const key = s.categoryName.toLowerCase().split(' ')[0]; 
        const safeScore = Math.min(Math.max(0, s.score), STANDARD_MAX);
        
        scoreMap[key] = safeScore;
        totalScore += safeScore;
      });

      result.grammarScore = scoreMap['grammar'] || 0;
      result.styleScore = scoreMap['style'] || 0;
      result.clarityScore = scoreMap['clarity'] || 0;
      result.structureScore = scoreMap['structure'] || 0;
      result.contentScore = scoreMap['content'] || 0;
      result.researchScore = scoreMap['research'] || 0;
    }

    result.overallScore = aiResponse.isOffensive ? 0 : totalScore;

    result.corrections = aiResponse.corrections.map(c => {
        const startIndex = content.indexOf(c.exactQuote);
        
        if (startIndex === -1) {
          console.warn(`[OpenAI] Could not find exact quote: "${c.exactQuote}"`);
          return null;
        }

        return {
            category: c.category as any,
            selectedText: c.exactQuote,
            textStartIndex: startIndex,
            textEndIndex: startIndex + c.exactQuote.length,
            comment: c.comment
        };
    }).filter((c): c is CorrectionObject => c !== null);

    return result;

  } catch (error) {
    console.error("Erro na chamada da IA:", error);
    throw new Error("Falha ao analisar redação com IA");
  }
}