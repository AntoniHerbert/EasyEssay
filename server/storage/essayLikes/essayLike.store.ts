import { type EssayLike, type InsertEssayLike } from "@shared/schema";

export interface IEssayLikeStore {
  getEssayLikes(essayId: string): Promise<EssayLike[]>;
  createEssayLike(like: InsertEssayLike): Promise<EssayLike>;
  deleteEssayLike(essayId: string, userId: string): Promise<boolean>;
  isEssayLiked(essayId: string, userId: string): Promise<boolean>;
}