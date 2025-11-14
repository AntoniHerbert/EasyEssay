import { type EssayLike, type InsertEssayLike } from "@shared/schema";
import { IEssayLikeStore } from "./essayLike.store";
import { randomUUID } from "crypto";

export class EssayLikeMemStore implements IEssayLikeStore {
  private essayLikes: Map<string, EssayLike>;

  constructor() {
    this.essayLikes = new Map();
  }

  async getEssayLikes(essayId: string): Promise<EssayLike[]> {
    return Array.from(this.essayLikes.values())
      .filter(like => like.essayId === essayId);
  }

  async createEssayLike(insertEssayLike: InsertEssayLike): Promise<EssayLike> {
    const id = randomUUID();
    const like: EssayLike = {
      ...insertEssayLike,
      id,
      createdAt: new Date(),
    };
    this.essayLikes.set(id, like);
    return like;
  }

  async deleteEssayLike(essayId: string, userId: string): Promise<boolean> {
    const likeEntry = Array.from(this.essayLikes.entries())
      .find(([_, like]) => like.essayId === essayId && like.userId === userId);
    
    if (likeEntry) {
      this.essayLikes.delete(likeEntry[0]);
      return true;
    }
    return false;
  }

  async isEssayLiked(essayId: string, userId: string): Promise<boolean> {
    return Array.from(this.essayLikes.values())
      .some(like => like.essayId === essayId && like.userId === userId);
  }
}