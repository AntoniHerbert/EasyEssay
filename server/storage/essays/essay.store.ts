import { type Essay, type InsertEssay } from "@shared/schema";
import { type Tx } from "../types";

export interface IEssayStore {
  getEssay(id: string): Promise<Essay | undefined>;
  
  getEssays(
    isPublic?: boolean, 
    authorId?: string,
    limit?: number,
    cursor?: Date,
    excludeAuthorId?: string,
    searchQuery?: string,
    statusFilter?: "drafts" | "analyzed" | "all", 
    communityId?: string
  ): Promise<Essay[]>;

  createEssay(essay: InsertEssay, tx?: Tx): Promise<Essay>;
  updateEssay(id: string, updates: Partial<InsertEssay>, tx?: Tx): Promise<Essay | undefined>;
  deleteEssay(id: string, tx?: Tx): Promise<boolean>;
}