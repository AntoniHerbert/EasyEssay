import { type EssayLike, type InsertEssayLike } from "@shared/schema";
import { IEssayLikeStore } from "./essayLike.store";
import { randomUUID } from "crypto";
import { type Tx } from "../types";

export class EssayLikeMemStore implements IEssayLikeStore {
  private essayLikes: Map<string, EssayLike>;

  constructor() {
    this.essayLikes = new Map();
  }

  async countEssayLikes(essayId: string): Promise<number> {
    let count = 0;
    for (const like of this.essayLikes.values()) {
      if (like.essayId === essayId) count++;
    }
    return count;
  }

  async createEssayLike(insertEssayLike: InsertEssayLike, _tx?: Tx): Promise<EssayLike> {
    const id = randomUUID();
    const like: EssayLike = {
      essayId: insertEssayLike.essayId,
      userId: insertEssayLike.userId,
      id,
      createdAt: new Date(),
    };
    this.essayLikes.set(id, like);
    return like;
  }

  async deleteEssayLike(essayId: string, userId: string, _tx?: Tx): Promise<boolean> {
    const entries = Array.from(this.essayLikes.entries());
    
    for (const [key, like] of entries) {
      if (like.essayId === essayId && like.userId === userId) {
        this.essayLikes.delete(key);
        return true;
      }
    }
    return false;
  }

  async isEssayLiked(essayId: string, userId: string): Promise<boolean> {
    for (const like of this.essayLikes.values()) {
      if (like.essayId === essayId && like.userId === userId) {
        return true;
      }
    }
    return false;
  }

  async deleteByEssayId(essayId: string, _tx?: Tx): Promise<void> {
    const entries = Array.from(this.essayLikes.entries());
    
    for (const [key, like] of entries) {
      if (like.essayId === essayId) {
        this.essayLikes.delete(key);
      }
    }
  }
}