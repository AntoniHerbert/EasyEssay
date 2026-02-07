import { IEssayStore } from "server/storage/essays/essay.store";
import { IEssayLikeStore } from "../storage/essayLikes/essayLike.store";
import type { ITransactionManager } from "../storage/transaction";

export class EssayLikeService {

  constructor(
    private essayLikeStore: IEssayLikeStore,
    private essayStore: IEssayStore,
    private txManager: ITransactionManager
  ) {}

  /**
   * Retorna os dados completos: Quantidade total e se o usuário atual curtiu.
   * Essencial para pintar o coração de vermelho no frontend.
   */
  async getLikesData(essayId: string, userId?: string) {
    const count = await this.essayLikeStore.countEssayLikes(essayId);
    
    let isLiked = false;
    if (userId) {
      isLiked = await this.essayLikeStore.isEssayLiked(essayId, userId);
    }

    return { count, isLiked };
  }

  /**
   * Mantido para retrocompatibilidade (caso alguma parte antiga use apenas o número)
   */
  async getLikesCount(essayId: string) {
    return await this.essayLikeStore.countEssayLikes(essayId);
  }

  /**
   * Lógica de "Toggle":
   */
  async toggleLike(essayId: string, userId: string) {
    const essay = await this.essayStore.getEssay(essayId);
    
    if (!essay) {
      throw new Error("ESSAY_NOT_FOUND");
    }

    if (essay.authorId === userId) {
      throw new Error("CANNOT_LIKE_OWN_ESSAY");
    }

    if (!essay.isPublic && essay.authorId !== userId) {
      if (!essay.communityId) {
        throw new Error("FORBIDDEN_ACCESS");
      }
    }

    const isLiked = await this.essayLikeStore.isEssayLiked(essayId, userId);

    if (isLiked) {
      await this.essayLikeStore.deleteEssayLike(essayId, userId);
    } else {
      await this.essayLikeStore.createEssayLike({ essayId, userId });
    }

    return this.getLikesData(essayId, userId);
  }
}