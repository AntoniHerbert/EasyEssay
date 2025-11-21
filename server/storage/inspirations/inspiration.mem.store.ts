import { type Inspiration, type InsertInspiration } from "@shared/schema";
import { IInspirationStore } from "./inspiration.store";
import { randomUUID } from "crypto";
import { inspirationsData } from "../seedData";

export class InspirationMemStore implements IInspirationStore {
  private inspirations: Map<string, Inspiration>;

  constructor() {
    this.inspirations = new Map();
    this.seedInspirations();
  }

  private async seedInspirations() {
    console.log("🌱 [Storage/Mem] Seeding inspirations...");
    for (const data of inspirationsData) {
      await this.createInspiration(data);
    }
  }

  async getInspirations(category?: string, type?: string): Promise<Inspiration[]> {
    const allInspirations = Array.from(this.inspirations.values());
    return allInspirations.filter(inspiration => {
      if (category && inspiration.category !== category) return false;
      if (type && inspiration.type !== type) return false;
      return inspiration.isPublic;
    }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async getInspiration(id: string): Promise<Inspiration | undefined> {
    return this.inspirations.get(id);
  }

  async createInspiration(insertInspiration: InsertInspiration): Promise<Inspiration> {
    const id = randomUUID();
    const now = new Date();
    const inspiration: Inspiration = {
      ...insertInspiration,
      id,
      createdAt: now,
      updatedAt: now,
      isPublic: insertInspiration.isPublic ?? true,
      wordCount: insertInspiration.wordCount ?? 0,
      readTime: insertInspiration.readTime ?? 5,
      tags: insertInspiration.tags ?? [],
      source: insertInspiration.source ?? null,
      difficulty: insertInspiration.difficulty ?? "intermediate",
    };
    this.inspirations.set(id, inspiration);
    return inspiration;
  }

  async updateInspiration(id: string, updates: Partial<InsertInspiration>): Promise<Inspiration | undefined> {
    const inspiration = this.inspirations.get(id);
    if (!inspiration) return undefined;

    const updatedInspiration: Inspiration = {
      ...inspiration,
      ...updates,
      updatedAt: new Date(),
    };
    this.inspirations.set(id, updatedInspiration);
    return updatedInspiration;
  }
}