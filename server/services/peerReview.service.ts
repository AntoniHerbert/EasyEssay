import { IEssayStore } from "../storage/essays/essay.store";
import { IPeerReviewStore } from "../storage/peerReviews/peerReview.store";
import type { ITransactionManager } from "../storage/transaction";
import { 
  insertPeerReviewSchema , 
  correctionSchema,
  UpdatePeerReviewInput,
  AddCorrectionInput,
  CreatePeerReviewInput
} from "@shared/schema";

export class PeerReviewService {

  constructor(
    private peerReviewStore: IPeerReviewStore,
    private essayStore: IEssayStore,
    private txManager: ITransactionManager
  ) {}

  private async updateEssayStats(essayId: string, tx: Tx) {
    const stats = await this.peerReviewStore.getEssayStats(essayId, tx);
    
    await this.essayStore.updateEssay(essayId, {
      reviewCount: stats.count,
      averageScore: stats.average
    }, tx);
  }

  /**
   * Busca todas as revisões de uma redação.
   */
  async getReviewsByEssayId(essayId: string, cursorStr?: string) {
    const limit = 10;

    let cursorDate: Date | undefined;
    if (cursorStr) {
      const parsed = new Date(cursorStr);
      if (!isNaN(parsed.getTime())) cursorDate = parsed;
    }

    const reviews = await this.peerReviewStore.getPeerReviews(essayId, limit, cursorDate);

    let nextCursor: string | null = null;
    if (reviews.length === limit) {
      nextCursor = reviews[reviews.length - 1].createdAt.toISOString();
    }

    return { data: reviews, nextCursor };
  }

  /**
   * Tenta criar uma revisão.
   * Retorna um objeto indicando o resultado e se foi criada agora ou já existia.
   * Lança erros para casos de negócio inválidos (404 ou 403).
   */
  async createReview(essayId: string, reviewerId: string, data: CreatePeerReviewInput) {
    const essay = await this.essayStore.getEssay(essayId);
    if (!essay) {
      throw new Error("ESSAY_NOT_FOUND");
    }

    if (essay.authorId === reviewerId) {
      throw new Error("CANNOT_REVIEW_OWN_ESSAY");
    }

    const existingReview = await this.peerReviewStore.getPeerReview(essayId, reviewerId);
    if (existingReview) {
      return { review: existingReview, isNew: false };
    }

    const newReview = await this.txManager.transaction(async (tx) => {
      
      const review = await this.peerReviewStore.createPeerReview({
        ...data,
        reviewerId,
        essayId
      }, tx); 

      await this.updateEssayStats(essayId, tx); 

      return review;
    });
    
    return { review: newReview, isNew: true };
  }

  /**
   * Atualiza uma revisão.
   */
  async updateReview(reviewId: string, userId: string, data: UpdatePeerReviewInput) {
    const existingReview = await this.peerReviewStore.getPeerReviewById(reviewId);
    
    if (!existingReview) {
      throw new Error("REVIEW_NOT_FOUND");
    }

    if (existingReview.reviewerId !== userId) {
      throw new Error("FORBIDDEN_ACCESS");
    }

    return await this.txManager.transaction(async (tx) => {

    const updated = await this.peerReviewStore.updatePeerReview(reviewId, data, tx);

        const review = await this.peerReviewStore.getPeerReviewById(reviewId); // Leitura rápida
        if (review) {
            await this.updateEssayStats(review.essayId, tx);
        }
        
        return updated;
    });
  
  }

  /**
   * Adiciona uma correção a uma revisão.
   */
  async addCorrection(reviewId: string, userId: string, data: AddCorrectionInput) {
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
    
    return await this.peerReviewStore.addCorrectionToReview(reviewId, data);
  }

  /**
   * Obtém contagem de likes e se o usuário atual deu like.
   */
  async getLikeStatus(reviewId: string, currentUserId?: string) {
    const [likeCount, isLiked] = await Promise.all([
      this.peerReviewStore.getLikeCount(reviewId),
      currentUserId 
        ? this.peerReviewStore.hasUserLiked(reviewId, currentUserId) 
        : Promise.resolve(false)
    ]);

    return { count: likeCount, isLiked };
  }

  /**
   * Alterna o like (Se tem, tira. Se não tem, põe).
   * Retorna o novo estado completo.
   */
  async toggleLike(reviewId: string, userId: string) {
    const isLiked = await this.peerReviewStore.hasUserLiked(reviewId, userId);

    if (isLiked) {
      await this.peerReviewStore.removeLike(reviewId, userId);
    } else {
      await this.peerReviewStore.addLike(reviewId, userId);
    }

    const newCount = await this.peerReviewStore.getLikeCount(reviewId);

    return {
      isLiked: !isLiked,
      count: newCount
    };
  }
}