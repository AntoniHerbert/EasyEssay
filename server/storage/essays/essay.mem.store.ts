import { type Essay, type InsertEssay } from "@shared/schema";
import { IEssayStore } from "./essay.store";
import { randomUUID } from "crypto";

export class EssayMemStore implements IEssayStore {
  private essays: Map<string, Essay>;

  constructor() {
    this.essays = new Map();
  }

  async getEssay(id: string): Promise<Essay | undefined> {
    return this.essays.get(id);
  }

  async getEssays(isPublic?: boolean, authorId?: string): Promise<Essay[]> {
    const allEssays = Array.from(this.essays.values());
    return allEssays.filter(essay => {
      if (isPublic !== undefined && essay.isPublic !== isPublic) return false;
      if (authorId && essay.authorId !== authorId) return false;
      return true;
    }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async createEssay(insertEssay: InsertEssay): Promise<Essay> {
    const id = randomUUID();
    const now = new Date();
    const essay: Essay = {
      ...insertEssay,
      id,
      createdAt: now,
      updatedAt: now,
      isPublic: insertEssay.isPublic ?? false,
      wordCount: insertEssay.wordCount ?? 0,
      isAnalyzed: insertEssay.isAnalyzed ?? false,
    };
    this.essays.set(id, essay);
    return essay;
  }

  async updateEssay(id: string, updates: Partial<InsertEssay>): Promise<Essay | undefined> {
    const essay = this.essays.get(id);
    if (!essay) return undefined;

    const updatedEssay: Essay = {
      ...essay,
      ...updates,
      updatedAt: new Date(),
    };
    this.essays.set(id, updatedEssay);
    return updatedEssay;
  }

  async deleteEssay(id: string): Promise<boolean> {
    return this.essays.delete(id);
  }
}