import { type DrizzleDb } from "../index";
import * as schema from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { type Essay, type InsertEssay } from "@shared/schema";
import { IEssayStore } from "./essay.store";

export class EssayDbStore implements IEssayStore {
  private db;

  constructor(db: DrizzleDb) {
    this.db = db;
  }

  async getEssay(id: string): Promise<Essay | undefined> {
    const result = await this.db.select().from(schema.essays).where(eq(schema.essays.id, id));
    return result[0];
  }

  async getEssays(isPublic?: boolean, authorId?: string): Promise<Essay[]> {
    let query = this.db.select().from(schema.essays);
    
    const conditions = [];
    if (isPublic !== undefined) {
      conditions.push(eq(schema.essays.isPublic, isPublic));
    }
    if (authorId) {
      conditions.push(eq(schema.essays.authorId, authorId));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    const result = await query.orderBy(desc(schema.essays.updatedAt));
    return result;
  }

  async createEssay(insertEssay: InsertEssay): Promise<Essay> {
    const result = await this.db.insert(schema.essays).values(insertEssay).returning();
    return result[0];
  }

  async updateEssay(id: string, updates: Partial<InsertEssay>): Promise<Essay | undefined> {
    const result = await this.db
      .update(schema.essays)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schema.essays.id, id))
      .returning();
    return result[0];
  }

  async deleteEssay(id: string): Promise<boolean> {
    const result = await this.db.delete(schema.essays).where(eq(schema.essays.id, id)).returning();
    return result.length > 0;
  }
}