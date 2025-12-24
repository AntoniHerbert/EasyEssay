import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { type Tx } from "../types";
import { type IExploreStore } from "./explore.store";
import { 
  exploreItems, 
  exploreLikes, 
  exploreSaves, 
  type ExploreItem, 
  type InsertExploreItem, 
  type ExploreContentType,
  type ExploreSave 
} from "@shared/schema";

export class ExploreDbStore implements IExploreStore {
  constructor(private db: any) {}

  async getItems(type?: ExploreContentType, authorId?: string): Promise<ExploreItem[]> {
    const conditions = [];
    if (type) conditions.push(eq(exploreItems.type, type));
    if (authorId) conditions.push(eq(exploreItems.authorId, authorId));
    
    return await this.db
      .select()
      .from(exploreItems)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(exploreItems.createdAt));
  }

  async getItemsByIds(ids: string[]): Promise<ExploreItem[]> {
    if (ids.length === 0) return [];
    return await this.db
      .select()
      .from(exploreItems)
      .where(inArray(exploreItems.id, ids))
      .orderBy(desc(exploreItems.createdAt));
  }

  async getItem(id: string): Promise<ExploreItem | undefined> {
    const [item] = await this.db
      .select()
      .from(exploreItems)
      .where(eq(exploreItems.id, id));
    return item;
  }

  async createItem(item: InsertExploreItem): Promise<ExploreItem> {
    const [newItem] = await this.db.insert(exploreItems).values(item).returning();
    return newItem;
  }

  async deleteItem(id: string): Promise<void> {
    await this.db.delete(exploreItems).where(eq(exploreItems.id, id));
  }

  async updateCounts(itemId: string, likesDelta: number, savesDelta: number, tx?: Tx): Promise<void> {
    const db = (tx || this.db) as any;
    // Uso de sql`` garante atomicidade no banco de dados
    await db.update(exploreItems)
      .set({ 
        likesCount: sql`${exploreItems.likesCount} + ${likesDelta}`,
        savesCount: sql`${exploreItems.savesCount} + ${savesDelta}`
      })
      .where(eq(exploreItems.id, itemId));
  }

  // --- Likes ---
  async hasLiked(itemId: string, userId: string): Promise<boolean> {
    const [result] = await this.db
      .select()
      .from(exploreLikes)
      .where(and(eq(exploreLikes.exploreItemId, itemId), eq(exploreLikes.userId, userId)))
      .limit(1);
    return !!result;
  }

  async getUserLikesForItems(userId: string, itemIds: string[]): Promise<Set<string>> {
    if (itemIds.length === 0) return new Set();
    const likes = await this.db
      .select({ itemId: exploreLikes.exploreItemId })
      .from(exploreLikes)
      .where(and(
        eq(exploreLikes.userId, userId),
        inArray(exploreLikes.exploreItemId, itemIds)
      ));
    return new Set(likes.map((l: any) => l.itemId));
  }

  async addLike(itemId: string, userId: string, tx?: Tx): Promise<void> {
    const db = (tx || this.db) as any;
    await db.insert(exploreLikes)
      .values({ exploreItemId: itemId, userId })
      .onConflictDoNothing();
  }

  async removeLike(itemId: string, userId: string, tx?: Tx): Promise<void> {
    const db = (tx || this.db) as any;
    await db.delete(exploreLikes)
      .where(and(eq(exploreLikes.exploreItemId, itemId), eq(exploreLikes.userId, userId)));
  }

  // --- Saves ---
  async getUserSaves(userId: string): Promise<ExploreSave[]> {
    return await this.db
      .select()
      .from(exploreSaves)
      .where(eq(exploreSaves.userId, userId));
  }

  async hasSaved(itemId: string, userId: string): Promise<boolean> {
    const [result] = await this.db
      .select()
      .from(exploreSaves)
      .where(and(eq(exploreSaves.exploreItemId, itemId), eq(exploreSaves.userId, userId)))
      .limit(1);
    return !!result;
  }

  async addSave(itemId: string, userId: string, tx?: Tx): Promise<void> {
    const db = (tx || this.db) as any;
    await db.insert(exploreSaves)
      .values({ exploreItemId: itemId, userId })
      .onConflictDoNothing();
  }

  async removeSave(itemId: string, userId: string, tx?: Tx): Promise<void> {
    const db = (tx || this.db) as any;
    await db.delete(exploreSaves)
      .where(and(eq(exploreSaves.exploreItemId, itemId), eq(exploreSaves.userId, userId)));
  }
}