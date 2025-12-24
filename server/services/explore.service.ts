import { ITransactionManager } from "server/storage/transaction";
import { IExploreStore } from "../storage/explore/explore.store";
import { InsertExploreItem, ExploreContentType } from "@shared/schema";

export class ExploreService {
  constructor(
    private store: IExploreStore,
    private txManager: ITransactionManager
) {}

  // Helper privado para preencher isLiked/isSaved em massa
  private async enrichItems(items: any[], userId?: string) {
    if (!userId || items.length === 0) {
      return items.map(item => ({ ...item, isLiked: false, isSaved: false }));
    }

    const itemIds = items.map(i => i.id);

    // Executa queries em paralelo
    const [likedSet, userSaves] = await Promise.all([
      this.store.getUserLikesForItems(userId, itemIds),
      this.store.getUserSaves(userId)
    ]);

    const savedSet = new Set(userSaves.map(s => s.exploreItemId));

    return items.map(item => ({
      ...item,
      isLiked: likedSet.has(item.id),
      isSaved: savedSet.has(item.id)
    }));
  }

  async getFeed(userId?: string, type?: ExploreContentType, authorId?: string) {
    const items = await this.store.getItems(type, authorId);
    return this.enrichItems(items, userId);
  }

  async getSavedItems(userId: string) {
    const saves = await this.store.getUserSaves(userId);
    const ids = saves.map(s => s.exploreItemId);
    
    // Busca apenas os itens salvos
    const items = await this.store.getItemsByIds(ids);
    
    // Enriquece (principalmente para saber se também deu like)
    return this.enrichItems(items, userId);
  }

  async getItem(id: string, userId?: string) {
    const item = await this.store.getItem(id);
    if (!item) return null;

    if (!userId) return { ...item, isLiked: false, isSaved: false };

    const [isLiked, isSaved] = await Promise.all([
      this.store.hasLiked(id, userId),
      this.store.hasSaved(id, userId)
    ]);

    return { ...item, isLiked, isSaved };
  }

  async createItem(data: InsertExploreItem) {
    return this.store.createItem(data);
  }

  async deleteItem(id: string, userId: string) {
    const item = await this.store.getItem(id);
    if (!item) throw new Error("Item not found");
    if (item.authorId !== userId) throw new Error("Unauthorized");

    await this.store.deleteItem(id);
  }

  // Retorna boolean: true se deu like, false se removeu
  async toggleLike(itemId: string, userId: string): Promise<boolean> {
    return this.txManager.transaction(async (tx) => {
    const isLiked = await this.store.hasLiked(itemId, userId);

        if (isLiked) {
        await this.store.removeLike(itemId, userId);
        await this.store.updateCounts(itemId, -1, 0);
        return false;
        } else {
        await this.store.addLike(itemId, userId);
        await this.store.updateCounts(itemId, 1, 0);
        return true;
        }
    });
  }

  // Retorna boolean: true se salvou, false se removeu
  async toggleSave(itemId: string, userId: string): Promise<boolean> {
    const isSaved = await this.store.hasSaved(itemId, userId);
    return this.txManager.transaction(async (tx) => {
        if (isSaved) {
        await this.store.removeSave(itemId, userId);
        await this.store.updateCounts(itemId, 0, -1);
        return false;
        } else {
        await this.store.addSave(itemId, userId);
        await this.store.updateCounts(itemId, 0, 1);
        return true;
        }
    });
  }
}