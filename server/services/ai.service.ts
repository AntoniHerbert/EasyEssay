import type { IEssayStore } from "../storage/essays/essay.store";
import type { IPeerReviewStore } from "../storage/peerReviews/peerReview.store";
import type { ITransactionManager } from "../storage/transaction";
import { getMockAIReview } from "./mock-analysis";
import { analyzeEssayWithOpenAI, type AIReviewResult } from "./openai";
import { type RubricCategory } from "@shared/schema";

export class AiService {

  constructor(
    private essayStore: IEssayStore,
    private peerReviewStore: IPeerReviewStore,
    private txManager: ITransactionManager,
  ) {}

  /**
   * Analisa uma única redação.
   */
  async analyzeEssay(essayId: string, language: string = "pt-BR") {
    const essay = await this.essayStore.getEssay(essayId);
    if (!essay) return null;

    await this.runAiAnalysis(
        essay.id, 
        essay.title, 
        essay.content, 
        essay.rubric || undefined,
        essay.rubricName || "argumentative",
        language 
    );
    
    return await this.peerReviewStore.getPeerReview(essay.id, "AI");
  }

  /**
   * Analisa todas as redações públicas pendentes.
   */
  async batchAnalyzeEssays() {
    const allEssays = await this.essayStore.getEssays(true);
    const stats = { success: 0, failed: 0, skipped: 0 };

    for (const essay of allEssays) {
      const existingAIReview = await this.peerReviewStore.getPeerReview(essay.id, "AI");
      if (existingAIReview) {
        stats.skipped++;
        continue;
      }

      try {
        await this.runAiAnalysis(
            essay.id, 
            essay.title, 
            essay.content,
            essay.rubric || undefined,
            essay.rubricName || "argumentative",
            "pt-BR" 
        );
        stats.success++;
      } catch (error) {
        console.error(`[AiService] Failed batch analysis for ${essay.id}:`, error);
        stats.failed++;
      }
    }

    return { total: allEssays.length, ...stats };
  }

  /**
   * Lógica central privada de interação com a IA e persistência.
   */
  private async runAiAnalysis(
      essayId: string, 
      title: string, 
      content: string, 
      rubric: RubricCategory[] | undefined,
      essayType: string | undefined,
      language: string 
  ) {
    const aiReview = await this.fetchReviewData(title, content, rubric, essayType, language);
    
    console.log(`[AiService] Analysis result for ${essayId}: Offensive=${aiReview.isOffensive}`);

    await this.txManager.transaction(async (tx) => {
        
        if (aiReview.isOffensive) {
            console.warn(`[AiService] 🚩 FLAGGED OFFENSIVE CONTENT: Essay ${essayId}`);
            
            await this.essayStore.updateEssay(essayId, { 
                isPublic: false, 
                isAnalyzed: true 
            }, tx);

            const warningComment = `⚠️ CONTEÚDO SINALIZADO: Esta redação foi identificada como ofensiva ou imprópria.\n\nMotivo: ${aiReview.offenseReason || "Violação de diretrizes."}`;

            await this.saveReviewInDatabase(essayId, aiReview, warningComment, tx);
            await this.updateEssayStats(essayId, tx);
            return;
        }

        await this.saveReviewInDatabase(essayId, aiReview, null, tx);

        const stats = await this.peerReviewStore.getEssayStats(essayId, tx);

        await this.essayStore.updateEssay(essayId, { 
            isAnalyzed: true,
            isPublic: true,
            reviewCount: stats.count,      
            averageScore: stats.average  
        }, tx);
    });
  }

  private async updateEssayStats(essayId: string, tx: any) {
    const stats = await this.peerReviewStore.getEssayStats(essayId, tx);
    await this.essayStore.updateEssay(essayId, {
      reviewCount: stats.count,
      averageScore: stats.average
    }, tx);
  }

  /**
   * Auxiliar: Decide se usa IA Real ou Mock.
   */
  private async fetchReviewData(
    title: string, 
    content: string, 
    rubric: RubricCategory[] | undefined, 
    essayType: string | undefined,
    language: string
  ): Promise<AIReviewResult> {
    const useRealAi = process.env.NODE_ENV === 'production' || process.env.USE_REAL_AI === 'true';

    if (useRealAi) {
      try {
        console.log(`[AiService] Calling OpenAI (${essayType}) Language: ${language}...`);
        return await analyzeEssayWithOpenAI(title, content, rubric, essayType, language); 
      } catch (error) {
        console.error("[AiService] AI API failed, falling back to mock:", error);
        return this.getMockData(title, content, rubric);
      }
    }

    console.log(`[AiService] Using Mock AI...`);
    return this.getMockData(title, content, rubric);
  }

  private getMockData(title: string, content: string, rubric?: RubricCategory[]): AIReviewResult {
    const mock = getMockAIReview(title, content, rubric);
    return {
      ...mock,
      isOffensive: false,
      offenseReason: undefined
    };
  }

  /**
   * Auxiliar: Lógica de UPSERT (Criar ou Atualizar)
   */
  private async saveReviewInDatabase(
      essayId: string, 
      aiReview: AIReviewResult, 
      overrideComment: string | null,
      tx: any
  ) {
    const reviewData = {
      essayId: essayId,
      reviewerId: "AI",
      
      grammarScore: aiReview.grammarScore,
      styleScore: aiReview.styleScore,
      clarityScore: aiReview.clarityScore,
      structureScore: aiReview.structureScore,
      contentScore: aiReview.contentScore,
      researchScore: aiReview.researchScore,
      overallScore: aiReview.overallScore,
      
      rubricScores: aiReview.rubricScores || null, 
      
      corrections: aiReview.corrections,
      reviewComment: overrideComment || "Análise automática da IA.", 
      isSubmitted: true
    };

    const existingReview = await this.peerReviewStore.getPeerReview(essayId, "AI");

    if (existingReview) {
      await this.peerReviewStore.updatePeerReview(existingReview.id, reviewData, tx);
    } else {
      await this.peerReviewStore.createPeerReview(reviewData, tx);
    }
  }
}