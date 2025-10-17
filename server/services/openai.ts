import OpenAI from "openai";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export interface AnalysisResult {
  corrections: Array<{
    type: "grammar" | "style" | "clarity" | "structure";
    severity: "error" | "warning" | "suggestion";
    originalText: string;
    suggestedText?: string;
    explanation: string;
    startIndex: number;
    endIndex: number;
  }>;
  overallScore: number;
  summary: string;
}

export async function analyzeEssay(title: string, content: string): Promise<AnalysisResult> {
  try {
    const prompt = `Please analyze the following essay for grammar, style, clarity, and structure issues. 

Title: ${title}

Content: ${content}

Provide detailed corrections with the following JSON format:
{
  "corrections": [
    {
      "type": "grammar|style|clarity|structure",
      "severity": "error|warning|suggestion", 
      "originalText": "exact text that needs correction",
      "suggestedText": "proposed replacement text",
      "explanation": "clear explanation of the issue and why the suggestion improves it",
      "startIndex": number (character position where issue starts),
      "endIndex": number (character position where issue ends)
    }
  ],
  "overallScore": number (1-100, writing quality score),
  "summary": "Brief summary of the essay's strengths and areas for improvement"
}

Focus on:
- Grammar errors (subject-verb disagreement, tense inconsistency, etc.)
- Style improvements (word choice, sentence variety, flow)
- Clarity issues (vague language, unclear references, ambiguous phrasing)
- Structure problems (paragraph organization, transitions, logical flow)

Be specific with character indices so corrections can be highlighted accurately.`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are an expert writing assistant that provides detailed, constructive feedback on essays. Always respond with valid JSON that matches the specified format exactly."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    if (!result.corrections || !Array.isArray(result.corrections)) {
      throw new Error("Invalid response format from OpenAI");
    }

    return {
      corrections: result.corrections,
      overallScore: Math.max(1, Math.min(100, result.overallScore || 75)),
      summary: result.summary || "Analysis completed successfully.",
    };

  } catch (error) {
    console.error("OpenAI analysis error:", error);
    throw new Error("Failed to analyze essay: " + (error as Error).message);
  }
}
