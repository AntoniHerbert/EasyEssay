import { IEssayLikeStore } from "../storage/essayLikes/essayLike.store";

export class EssayLikeService {

    constructor(
    private essayLikeStore: IEssayLikeStore
  ) {}

  /**
   * Retorna a lista de likes de uma redação.
   */
  async getLikes(essayId: string) {
    return await this.essayLikeStore.getEssayLikes(essayId);
  }

  /**
   * Lógica de "Toggle":
   * - Se o usuário já curtiu, remove o like.
   * - Se não curtiu, adiciona o like.
   * Retorna o novo estado ({ liked: true/false }).
   */
  async toggleLike(essayId: string, userId: string) {
    const isLiked = await this.essayLikeStore.isEssayLiked(essayId, userId);

    if (isLiked) {
      await this.essayLikeStore.deleteEssayLike(essayId, userId);
      return { liked: false };
    } else {
      await this.essayLikeStore.createEssayLike({ essayId, userId });
      return { liked: true };
    }
  }
}