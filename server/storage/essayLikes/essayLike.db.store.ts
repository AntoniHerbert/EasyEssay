import { type DrizzleDb } from "../index";
import * as schema from "@shared/schema";
import { eq, and, count } from "drizzle-orm";
import { type EssayLike, type InsertEssayLike } from "@shared/schema";
import { IEssayLikeStore } from "./essayLike.store";
import { type Tx } from "../types"; 

export class EssayLikeDbStore implements IEssayLikeStore {
  private db;

  constructor(db: DrizzleDb) {
    this.db = db;
  }

  async countEssayLikes(essayId: string): Promise<number> {
    const result = await this.db
      .select({ value: count() })
      .from(schema.essayLikes)
      .where(eq(schema.essayLikes.essayId, essayId));
      
    return result[0]?.value ?? 0;
  }

  async createEssayLike(like: InsertEssayLike, tx?: Tx): Promise<EssayLike> {
    const executor = (tx || this.db) as DrizzleDb;
    const result = await executor
      .insert(schema.essayLikes)
      .values(like)
      .returning();
    return result[0];
  }

  async deleteEssayLike(essayId: string, userId: string, tx?: Tx): Promise<boolean> {
    const executor = (tx || this.db) as DrizzleDb;
    const result = await executor
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
      ))
      .limit(1);
      
    return result.length > 0;
  }

  async deleteByEssayId(essayId: string, tx?: Tx): Promise<void> {
    const executor = (tx || this.db) as DrizzleDb;
    await executor
      .delete(schema.essayLikes)
      .where(eq(schema.essayLikes.essayId, essayId));
  }
}