import { type DrizzleDb } from "../index";
import * as schema from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { type EssayLike, type InsertEssayLike } from "@shared/schema";
import { IEssayLikeStore } from "./essayLike.store";

export class EssayLikeDbStore implements IEssayLikeStore {
  private db;

  constructor(db: DrizzleDb) {
    this.db = db;
  }

  async getEssayLikes(essayId: string): Promise<EssayLike[]> {
    const result = await this.db
      .select()
      .from(schema.essayLikes)
      .where(eq(schema.essayLikes.essayId, essayId));
    return result;
  }

  async createEssayLike(like: InsertEssayLike): Promise<EssayLike> {
    const result = await this.db.insert(schema.essayLikes).values(like).returning();
    return result[0];
  }

  async deleteEssayLike(essayId: string, userId: string): Promise<boolean> {
    const result = await this.db
      .delete(schema.essayLikes)
      .where(and(
        eq(schema.essayLikes.essayId, essayId),
        eq(schema.essayLikes.userId, userId)
      ))
      .returning();
    return result.length > 0;
  }

  async isEssayLiked(essayId: string, userId: string): Promise<boolean> {
    const result = await this.db
      .select()
      .from(schema.essayLikes)
      .where(and(
        eq(schema.essayLikes.essayId, essayId),
        eq(schema.essayLikes.userId, userId)
      ));
    return result.length > 0;
  }
}