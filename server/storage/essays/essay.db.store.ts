import { type DrizzleDb } from "../index";
import * as schema from "@shared/schema";
import { eq, and, desc, lt, ne, ilike, or, isNotNull, isNull } from "drizzle-orm"; 
import { type Essay, type InsertEssay, type RubricCategory } from "@shared/schema";
import { IEssayStore } from "./essay.store";
import { type Tx } from "../types"; 

export interface EnrichedEssay extends Essay {
  communityId: string | null;
  communityName: string | null;
  topicTitle: string | null;
}

export class EssayDbStore implements IEssayStore {
  private db;

  constructor(db: DrizzleDb) {
    this.db = db;
  }

  async getEssay(id: string): Promise<EnrichedEssay | undefined> {
    const result = await this.db
      .select({
        essay: schema.essays,
        profileDisplayName: schema.userProfiles.displayName,
        communityId: schema.communities.id,
        communityName: schema.communities.name,
        topicTitle: schema.communityTopics.title
      })
      .from(schema.essays)
      .leftJoin(schema.userProfiles, eq(schema.essays.authorId, schema.userProfiles.userId))
      .leftJoin(schema.topicSubmissions, eq(schema.essays.id, schema.topicSubmissions.essayId))
      .leftJoin(schema.communityTopics, eq(schema.topicSubmissions.topicId, schema.communityTopics.id))
      .leftJoin(schema.communities, eq(schema.communityTopics.communityId, schema.communities.id))
      .where(eq(schema.essays.id, id));

    const row = result[0];
    if (!row) return undefined;

    return {
      ...row.essay,
      authorName: row.profileDisplayName || row.essay.authorName || "Anonymous",
      communityId: row.communityId,
      communityName: row.communityName,
      topicTitle: row.topicTitle
    };
  }

  async getEssays(
    isPublic?: boolean, 
    authorId?: string,
    limit = 20,
    cursor?: Date,
    excludeAuthorId?: string,
    searchQuery?: string,
    statusFilter?: "drafts" | "analyzed" | "all" | "submitted",
    communityId?: string,
    topicId?: string
  ): Promise<EnrichedEssay[]> {
    
    let query = this.db
      .select({
        essay: schema.essays,
        profileDisplayName: schema.userProfiles.displayName,
        communityId: schema.communities.id,
        communityName: schema.communities.name,
        topicTitle: schema.communityTopics.title
      })
      .from(schema.essays)
      .leftJoin(schema.userProfiles, eq(schema.essays.authorId, schema.userProfiles.userId))
      .leftJoin(schema.topicSubmissions, eq(schema.essays.id, schema.topicSubmissions.essayId))
      .leftJoin(schema.communityTopics, eq(schema.topicSubmissions.topicId, schema.communityTopics.id))
      .leftJoin(schema.communities, eq(schema.communityTopics.communityId, schema.communities.id));
    
    const conditions = [];

    // --- Lógica de Filtros ---

    if (topicId) {
      conditions.push(eq(schema.topicSubmissions.topicId, topicId));
    }

    if (communityId) {
      if (communityId === "all") {
        conditions.push(isNotNull(schema.communities.id));
      } else {
        conditions.push(eq(schema.communities.id, communityId));
      }
    }

    if (authorId) {
      conditions.push(eq(schema.essays.authorId, authorId));
      
    } 
    else if (isPublic !== undefined) {
      conditions.push(eq(schema.essays.isPublic, isPublic));
    }

    if (statusFilter === "drafts") {
      conditions.push(eq(schema.essays.isPublic, false));
      conditions.push(eq(schema.essays.isAnalyzed, false));
      conditions.push(isNull(schema.communities.id));
    } else if (statusFilter === "analyzed") {
      conditions.push(eq(schema.essays.isAnalyzed, true));
    } else if (statusFilter === "submitted") {
      conditions.push(isNotNull(schema.topicSubmissions.id));
    }

    if (cursor) {
      conditions.push(lt(schema.essays.createdAt, cursor));
    }
    if (excludeAuthorId) {
      conditions.push(ne(schema.essays.authorId, excludeAuthorId));
    }

    if (searchQuery) {
      const searchPattern = `%${searchQuery}%`; 
      conditions.push(
        or(
          ilike(schema.essays.title, searchPattern),
          ilike(schema.essays.content, searchPattern)
        )
      );
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const rows = await query
      .limit(limit)
      .orderBy(desc(schema.essays.createdAt));
    
    return rows.map((row) => ({
      ...row.essay,
      authorName: row.profileDisplayName || row.essay.authorName || "Anonymous",
      communityId: row.communityId,
      communityName: row.communityName,
      topicTitle: row.topicTitle
    }));
  }

  async createEssay(insertEssay: InsertEssay, tx?: Tx): Promise<Essay> {
    const executor = (tx || this.db) as DrizzleDb;

    const values = {
      ...insertEssay,
      rubric: insertEssay.rubric ? (insertEssay.rubric as RubricCategory[]) : null,
    };

    const result = await executor.insert(schema.essays).values(values).returning();
    return result[0];
  }

  async updateEssay(id: string, updates: Partial<InsertEssay>, tx?: Tx): Promise<Essay | undefined> {
    const executor = (tx || this.db) as DrizzleDb;

    const setValues = {
      ...updates,
      updatedAt: new Date(),
      rubric: updates.rubric !== undefined 
        ? (updates.rubric ? (updates.rubric as RubricCategory[]) : null) 
        : undefined,
    };

    if (setValues.rubric === undefined) {
      delete (setValues as any).rubric;
    }

    const result = await executor
      .update(schema.essays)
      .set(setValues)
      .where(eq(schema.essays.id, id))
      .returning();
    return result[0];
  }

  async deleteEssay(id: string, tx?: Tx): Promise<boolean> {
    const executor = (tx || this.db) as DrizzleDb;
    const result = await executor.delete(schema.essays).where(eq(schema.essays.id, id)).returning();
    return result.length > 0;
  }
}