import { type Essay, type InsertEssay, type RubricCategory } from "@shared/schema";
import { IEssayStore } from "./essay.store";
import { randomUUID } from "crypto";
import { type Tx } from "../types";

export class EssayMemStore implements IEssayStore {
  private essays: Map<string, Essay>;

  constructor() {
    this.essays = new Map();
  }

  async getEssay(id: string): Promise<Essay | undefined> {
    return this.essays.get(id);
  }

  async getEssays(
    isPublic?: boolean, 
    authorId?: string, 
    limit = 20, 
    cursor?: Date, 
    excludeAuthorId?: string,
    searchQuery?: string,
    statusFilter?: "drafts" | "analyzed" | "all",
    communityId?: string
  ): Promise<Essay[]> {
    let allEssays = Array.from(this.essays.values());

    allEssays = allEssays.filter(essay => {
      if (statusFilter === "drafts") {
        if (essay.isPublic || essay.isAnalyzed) return false;
      } else if (statusFilter === "analyzed") {
        if (!essay.isAnalyzed) return false;
      } else {
        if (isPublic !== undefined && essay.isPublic !== isPublic) return false;
      }

      if (authorId && essay.authorId !== authorId) return false;
      if (excludeAuthorId && essay.authorId === excludeAuthorId) return false;
      
      if (cursor && essay.createdAt >= cursor) return false;

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = essay.title.toLowerCase().includes(query);
        const matchesContent = essay.content.toLowerCase().includes(query);
        if (!matchesTitle && !matchesContent) return false;
      }
      
      return true;
    });

    return allEssays
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  async createEssay(insertEssay: InsertEssay, _tx?: Tx): Promise<Essay> {
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
      rubric: insertEssay.rubric ? (insertEssay.rubric as RubricCategory[]) : null,
      rubricName: insertEssay.rubricName ?? null,
    };
    this.essays.set(id, essay);
    return essay;
  }

  async updateEssay(id: string, updates: Partial<InsertEssay>, _tx?: Tx): Promise<Essay | undefined> {
    const essay = this.essays.get(id);
    if (!essay) return undefined;

    const updatedEssay: Essay = {
      ...essay,
      ...updates,
      updatedAt: new Date(),
      rubric: updates.rubric !== undefined 
        ? (updates.rubric ? (updates.rubric as RubricCategory[]) : null)
        : essay.rubric,
    };
    this.essays.set(id, updatedEssay);
    return updatedEssay;
  }

  async deleteEssay(id: string, _tx?: Tx): Promise<boolean> {
    return this.essays.delete(id);
  }
}