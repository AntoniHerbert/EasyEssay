import type { IEssayStore } from "../storage/essays/essay.store";
import type { IPeerReviewStore } from "../storage/peerReviews/peerReview.store";
import { getMockAIReview } from "./mock-analysis";

export class AiService {

    constructor(
    private essayStore: IEssayStore,
    private peerReviewStore: IPeerReviewStore
  ) {}

  /**
   * Analisa uma única redação.
   * Pode ser chamado manualmente (pela rota /analyze) ou automaticamente (ao criar essay).
   */
  async analyzeEssay(essayId: string) {
    // 1. Busca a redação
    const essay = await this.essayStore.getEssay(essayId);
    if (!essay) return null;

    // 2. Executa a lógica de IA
    await this.runAiAnalysis(essay.id, essay.title, essay.content);
    
    // 3. Retorna a review atualizada ou criada
    return await this.peerReviewStore.getPeerReview(essay.id, "AI");
  }

  /**
   * Analisa todas as redações públicas pendentes.
   */
  async batchAnalyzeEssays() {
    const allEssays = await this.essayStore.getEssays(true); // Apenas públicas
    const stats = { success: 0, failed: 0, skipped: 0 };

    for (const essay of allEssays) {
      const existingAIReview = await this.peerReviewStore.getPeerReview(essay.id, "AI");
      if (existingAIReview) {
        stats.skipped++;
        continue;
      }

      try {
        await this.runAiAnalysis(essay.id, essay.title, essay.content);
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
  private async runAiAnalysis(essayId: string, title: string, content: string) {
    // AQUI é onde você trocaria 'getMockAIReview' por uma chamada real à OpenAI/LangChain
    const aiReview = getMockAIReview(title, content);
    
    console.log(`[AiService] Analyzing essay ${essayId}...`);

    // Verifica se já existe para atualizar ou criar (Upsert logic)
    const existingReview = await this.peerReviewStore.getPeerReview(essayId, "AI");
    
    if (existingReview) {
      await this.peerReviewStore.updatePeerReview(existingReview.id, {
        grammarScore: aiReview.grammarScore,
        styleScore: aiReview.styleScore,
        clarityScore: aiReview.clarityScore,
        structureScore: aiReview.structureScore,
        contentScore: aiReview.contentScore,
        researchScore: aiReview.researchScore,
        overallScore: aiReview.overallScore,
        corrections: aiReview.corrections,
      });
    } else {
      await this.peerReviewStore.createPeerReview({
        essayId: essayId,
        reviewerId: "AI",
        grammarScore: aiReview.grammarScore,
        styleScore: aiReview.styleScore,
        clarityScore: aiReview.clarityScore,
        structureScore: aiReview.structureScore,
        contentScore: aiReview.contentScore,
        researchScore: aiReview.researchScore,
        overallScore: aiReview.overallScore,
        corrections: aiReview.corrections,
        isSubmitted: true,
      });
    }

    await this.essayStore.updateEssay(essayId, { isAnalyzed: true });
  }
}