import { type DrizzleDb } from "../index";
import * as schema from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { type Inspiration, type InsertInspiration } from "@shared/schema";
import { IInspirationStore } from "./inspiration.store";
import { inspirationsData } from "../seedData"; 

export class InspirationDbStore implements IInspirationStore {
  private db;

  constructor(db: DrizzleDb) {
    this.db = db;
    this.seedInspirations();
  }

  private async seedInspirations() {
    const existing = await this.db.select().from(schema.inspirations).limit(1);
    if (existing.length > 0) return;

    console.log("🌱 [Storage/DB] Seeding inspirations...");
    for (const data of inspirationsData) {
      await this.createInspiration(data);
    }
  }

  async getInspirations(category?: string, type?: string): Promise<Inspiration[]> {
    let query = this.db.select().from(schema.inspirations);
    
    const conditions = [eq(schema.inspirations.isPublic, true)];
    
    if (category) {
      conditions.push(eq(schema.inspirations.category, category));
    }
    if (type) {
      conditions.push(eq(schema.inspirations.type, type));
    }
    
    query = query.where(and(...conditions)) as any;
    
    const result = await query;
    return result;
  }

  async getInspiration(id: string): Promise<Inspiration | undefined> {
    const result = await this.db.select().from(schema.inspirations).where(eq(schema.inspirations.id, id));
    return result[0];
  }

  async createInspiration(inspiration: InsertInspiration): Promise<Inspiration> {
    const result = await this.db.insert(schema.inspirations).values(inspiration).returning();
    return result[0];
  }

  async updateInspiration(id: string, updates: Partial<InsertInspiration>): Promise<Inspiration | undefined> {
    const result = await this.db
      .update(schema.inspirations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schema.inspirations.id, id))
      .returning();
    return result[0];
  }
}