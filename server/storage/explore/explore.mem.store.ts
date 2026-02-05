import { type Tx } from "../types";
import { type IExploreStore } from "./explore.store";
import { 
  type ExploreItem, 
  type InsertExploreItem, 
  type ExploreContentType,
  type ExploreSave 
} from "@shared/schema";

export class ExploreMemStore implements IExploreStore {
  private items: Map<string, ExploreItem> = new Map();
  private likes: Map<string, Set<string>> = new Map(); 
  private saves: Map<string, Set<string>> = new Map();

  private currentId = 1;

  constructor() {}

  // --- Itens ---

  async getItems(
    type?: ExploreContentType, 
    authorId?: string,
    limit: number = 20,
    cursor?: string,
    searchQuery?: string
  ): Promise<{ items: ExploreItem[]; nextCursor: string | null }> {
    let allItems = Array.from(this.items.values());

    if (type) {
      allItems = allItems.filter(item => item.type === type);
    }

    if (authorId) {
      allItems = allItems.filter(item => item.authorId === authorId);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      allItems = allItems.filter(item => 
        item.title.toLowerCase().includes(q) || 
        (item.subtitle && item.subtitle.toLowerCase().includes(q))
      );
    }

    allItems.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    if (cursor) {
      const cursorDate = new Date(cursor).getTime();
      if (!isNaN(cursorDate)) {
        allItems = allItems.filter(item => new Date(item.createdAt).getTime() < cursorDate);
      }
    }

    const hasMore = allItems.length > limit;
    const paginatedItems = allItems.slice(0, limit);
    
    const nextCursor = hasMore && paginatedItems.length > 0
      ? paginatedItems[paginatedItems.length - 1].createdAt.toISOString()
      : null;

    return { items: paginatedItems, nextCursor };
  }

  async getItemsByIds(ids: string[]): Promise<ExploreItem[]> {
    const results: ExploreItem[] = [];
    for (const id of ids) {
      const item = this.items.get(id);
      if (item) results.push(item);
    }
    return results.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  }

  async getItem(id: string): Promise<ExploreItem | undefined> {
    return this.items.get(id);
  }

  async createItem(insertItem: InsertExploreItem): Promise<ExploreItem> {
    const id = (this.currentId++).toString();
    
    const newItem: ExploreItem = {
      ...insertItem,
      id,
      createdAt: new Date(),
      likesCount: 0,
      savesCount: 0,
      subtitle: insertItem.subtitle || null,
      essayType: insertItem.essayType || null,
      isFeatured: false,
    };

    this.items.set(id, newItem);
    return newItem;
  }

  async deleteItem(id: string): Promise<void> {
    this.items.delete(id);
    this.likes.delete(id);
    this.saves.delete(id);
  }

  // --- Contadores ---

  async updateCounts(itemId: string, likesDelta: number, savesDelta: number, _tx?: Tx): Promise<void> {
    const item = this.items.get(itemId);
    if (item) {
      item.likesCount = (item.likesCount || 0) + likesDelta;
      item.savesCount = (item.savesCount || 0) + savesDelta;
      
      if (item.likesCount < 0) item.likesCount = 0;
      if (item.savesCount < 0) item.savesCount = 0;
    }
  }

  // --- Likes ---

  async hasLiked(itemId: string, userId: string): Promise<boolean> {
    const itemLikes = this.likes.get(itemId);
    return itemLikes ? itemLikes.has(userId) : false;
  }

  async getUserLikesForItems(userId: string, itemIds: string[]): Promise<Set<string>> {
    const result = new Set<string>();
    for (const itemId of itemIds) {
      const itemLikes = this.likes.get(itemId);
      if (itemLikes && itemLikes.has(userId)) {
        result.add(itemId);
      }
    }
    return result;
  }

  async addLike(itemId: string, userId: string, _tx?: Tx): Promise<void> {
    if (!this.likes.has(itemId)) {
      this.likes.set(itemId, new Set());
    }
    this.likes.get(itemId)!.add(userId);
  }

  async removeLike(itemId: string, userId: string, _tx?: Tx): Promise<void> {
    const itemLikes = this.likes.get(itemId);
    if (itemLikes) {
      itemLikes.delete(userId);
    }
  }

  // --- Saves ---

  async getUserSaves(userId: string): Promise<ExploreSave[]> {
    const results: ExploreSave[] = [];
    
    for (const [itemId, userSet] of this.saves.entries()) {
      if (userSet.has(userId)) {
        results.push({
          id: `${itemId}-${userId}`, 
          userId,
          exploreItemId: itemId,
          createdAt: new Date()
        });
      }
    }
    return results;
  }

  async hasSaved(itemId: string, userId: string): Promise<boolean> {
    const itemSaves = this.saves.get(itemId);
    return itemSaves ? itemSaves.has(userId) : false;
  }

  async addSave(itemId: string, userId: string, _tx?: Tx): Promise<void> {
    if (!this.saves.has(itemId)) {
      this.saves.set(itemId, new Set());
    }
    this.saves.get(itemId)!.add(userId);
  }

  async removeSave(itemId: string, userId: string, _tx?: Tx): Promise<void> {
    const itemSaves = this.saves.get(itemId);
    if (itemSaves) {
      itemSaves.delete(userId);
    }
  }

  async getUserSavesForItems(userId: string, itemIds: string[]): Promise<Set<string>> {
    const result = new Set<string>();
    for (const itemId of itemIds) {
      const itemSaves = this.saves.get(itemId);
      if (itemSaves && itemSaves.has(userId)) {
        result.add(itemId);
      }
    }
    return result;
  }
}