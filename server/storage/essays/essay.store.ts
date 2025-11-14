import { type Essay, type InsertEssay } from "@shared/schema";

export interface IEssayStore {
  getEssay(id: string): Promise<Essay | undefined>;
  getEssays(isPublic?: boolean, authorId?: string): Promise<Essay[]>;
  createEssay(essay: InsertEssay): Promise<Essay>;
  updateEssay(id: string, updates: Partial<InsertEssay>): Promise<Essay | undefined>;
  deleteEssay(id: string): Promise<boolean>;
}