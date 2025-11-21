import { IEssayStore } from "../storage/essays/essay.store";
import { IPeerReviewStore } from "../storage/peerReviews/peerReview.store";
import { 
  insertPeerReviewSchema , 
  correctionSchema
} from "@shared/schema";

export class PeerReviewService {

  constructor(
    private essayStore: IEssayStore,
    private peerReviewStore: IPeerReviewStore
  ) {}

  /**
   * Busca todas as revisões de uma redação.
   */
  async getReviewsByEssayId(essayId: string) {
    return await this.peerReviewStore.getPeerReviews(essayId);
  }

  /**
   * Tenta criar uma revisão.
   * Retorna um objeto indicando o resultado e se foi criada agora ou já existia.
   * Lança erros para casos de negócio inválidos (404 ou 403).
   */
  async createReview(essayId: string, reviewerId: string, rawBody: unknown) {
    // 1. Valida se a redação existe
    const essay = await this.essayStore.getEssay(essayId);
    if (!essay) {
      throw new Error("ESSAY_NOT_FOUND");
    }

    // 2. Valida regra de negócio: Autor não revisa própria obra
    if (essay.authorId === reviewerId) {
      throw new Error("CANNOT_REVIEW_OWN_ESSAY");
    }

    // 3. Verifica se já existe uma revisão deste usuário (Idempotência)
    const existingReview = await this.peerReviewStore.getPeerReview(essayId, reviewerId);
    if (existingReview) {
      return { review: existingReview, isNew: false };
    }

    // 4. Valida dados de entrada e Cria
    const reviewData = insertPeerReviewSchema.parse({
      ...(rawBody as object),
      reviewerId,
      essayId
    });
    
    const newReview = await this.peerReviewStore.createPeerReview(reviewData);
    return { review: newReview, isNew: true };
  }

  /**
   * Atualiza uma revisão.
   */
  async updateReview(reviewId: string, userId: string, rawBody: unknown) {
    const existingReview = await this.peerReviewStore.getPeerReviewById(reviewId);
    
    if (!existingReview) {
      throw new Error("REVIEW_NOT_FOUND");
    }

    if (existingReview.reviewerId !== userId) {
      throw new Error("FORBIDDEN_ACCESS");
    }

    const updates = insertPeerReviewSchema.partial().parse(rawBody);

    return await this.peerReviewStore.updatePeerReview(reviewId, updates);
  }

  /**
   * Adiciona uma correção a uma revisão.
   */
  async addCorrection(reviewId: string, userId: string, rawBody: unknown) {
    const existingReview = await this.peerReviewStore.getPeerReviewById(reviewId);

    if (!existingReview) {
      throw new Error("REVIEW_NOT_FOUND");
    }

    if (existingReview.reviewerId !== userId) {
      throw new Error("FORBIDDEN_ACCESS");
    }

    if (existingReview.isSubmitted) {
      throw new Error("REVIEW_ALREADY_SUBMITTED");
    }

    const correctionData = correctionSchema.parse(rawBody);
    
    return await this.peerReviewStore.addCorrectionToReview(reviewId, correctionData);
  }
}