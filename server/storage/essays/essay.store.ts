import { type Essay, type InsertEssay } from "@shared/schema";
import { type Tx } from "../types";

// Definimos o tipo enriquecido aqui na interface
export interface EnrichedEssay extends Essay {
  communityId: string | null;
  communityName: string | null;
  topicTitle: string | null;
}

export interface IEssayStore {
  getEssay(id: string): Promise<EnrichedEssay | undefined>;
  
  getEssays(
    isPublic?: boolean, 
    authorId?: string,
    limit?: number,
    cursor?: Date,
    excludeAuthorId?: string,
    searchQuery?: string,
    statusFilter?: "drafts" | "analyzed" | "all" | "submitted", 
    communityId?: string,
    topicId?: string
  ): Promise<EnrichedEssay[]>;

  createEssay(essay: InsertEssay, tx?: Tx): Promise<Essay>;
  updateEssay(id: string, updates: Partial<InsertEssay>, tx?: Tx): Promise<Essay | undefined>;
  deleteEssay(id: string, tx?: Tx): Promise<boolean>;
}