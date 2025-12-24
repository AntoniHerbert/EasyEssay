import { type Tx } from "../types";
import { type ExploreItem, type InsertExploreItem, type ExploreContentType, type ExploreSave } from "@shared/schema";

export interface IExploreStore {
  getItems(type?: ExploreContentType, authorId?: string): Promise<ExploreItem[]>;
  getItemsByIds(ids: string[]): Promise<ExploreItem[]>;
  getItem(id: string): Promise<ExploreItem | undefined>;
  createItem(item: InsertExploreItem): Promise<ExploreItem>;
  deleteItem(id: string): Promise<void>;
  
  updateCounts(itemId: string, likesDelta: number, savesDelta: number, tx?: Tx): Promise<void>;

  hasLiked(itemId: string, userId: string): Promise<boolean>;
  getUserLikesForItems(userId: string, itemIds: string[]): Promise<Set<string>>; 
  addLike(itemId: string, userId: string, tx?: Tx): Promise<void>;
  removeLike(itemId: string, userId: string, tx?: Tx): Promise<void>;

  getUserSaves(userId: string): Promise<ExploreSave[]>;
  hasSaved(itemId: string, userId: string): Promise<boolean>;
  addSave(itemId: string, userId: string, tx?: Tx): Promise<void>;
  removeSave(itemId: string, userId: string, tx?: Tx): Promise<void>;
}