import { ITransactionManager } from "../storage/transaction";
import { IExploreStore } from "../storage/explore/explore.store";
import { InsertExploreItem, ExploreContentType } from "@shared/schema";

export class ExploreService {
  constructor(
    private store: IExploreStore,
    private txManager: ITransactionManager
  ) {}

  // --- Helper Privado Otimizado ---
  private async enrichItems(items: any[], userId?: string) {
    if (!userId || items.length === 0) {
      return items.map(item => ({ ...item, isLiked: false, isSaved: false }));
    }

    const itemIds = items.map(i => i.id);

    const [likedSet, savedSet] = await Promise.all([
      this.store.getUserLikesForItems(userId, itemIds),
      this.store.getUserSavesForItems 
        ? this.store.getUserSavesForItems(userId, itemIds) 
        : this.store.getUserSaves(userId).then(saves => new Set(saves.map(s => s.exploreItemId))) 
    ]);

    return items.map(item => ({
      ...item,
      isLiked: likedSet.has(item.id),
      isSaved: savedSet.has(item.id)
    }));
  }

  // --- Core Methods ---

  async getFeed(
    userId?: string, 
    type?: ExploreContentType, 
    authorId?: string,
    limit: number = 20,
    cursor?: string,
    searchQuery?: string
  ) {
    const { items, nextCursor } = await this.store.getItems(type, authorId, limit, cursor, searchQuery);
    
    const enrichedItems = await this.enrichItems(items, userId);

    return { items: enrichedItems, nextCursor };
  }

  async getSavedItems(userId: string) {
    const saves = await this.store.getUserSaves(userId);
    
    if (saves.length === 0) {
      return [];
    }

    const ids = saves.map(s => s.exploreItemId);
    
    const items = await this.store.getItemsByIds(ids);
    
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


  async toggleLike(itemId: string, userId: string): Promise<boolean> {
    return this.txManager.transaction(async (tx) => {
      const isLiked = await this.store.hasLiked(itemId, userId);

      if (isLiked) {
        await this.store.removeLike(itemId, userId, tx);
        await this.store.updateCounts(itemId, -1, 0, tx);
        return false;
      } else {
        await this.store.addLike(itemId, userId, tx);
        await this.store.updateCounts(itemId, 1, 0, tx);
        return true;
      }
    });
  }

  async toggleSave(itemId: string, userId: string): Promise<boolean> {
    const isSaved = await this.store.hasSaved(itemId, userId);
    
    return this.txManager.transaction(async (tx) => {
      if (isSaved) {
        await this.store.removeSave(itemId, userId, tx);
        await this.store.updateCounts(itemId, 0, -1, tx);
        return false;
      } else {
        await this.store.addSave(itemId, userId, tx);
        await this.store.updateCounts(itemId, 0, 1, tx);
        return true;
      }
    });
  }
}