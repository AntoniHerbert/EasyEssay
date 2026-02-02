import { type DrizzleDb } from "../index";
import * as schema from "@shared/schema";
import { eq, and, desc, lt, ne, ilike, or, exists } from "drizzle-orm"; 
import { type Essay, type InsertEssay, type RubricCategory } from "@shared/schema";
import { IEssayStore } from "./essay.store";
import { type Tx } from "../types"; 

export class EssayDbStore implements IEssayStore {
  private db;

  constructor(db: DrizzleDb) {
    this.db = db;
  }

  async getEssay(id: string): Promise<Essay | undefined> {
    const result = await this.db
      .select({
        essay: schema.essays,
        profileDisplayName: schema.userProfiles.displayName,
      })
      .from(schema.essays)
      .leftJoin(
        schema.userProfiles,
        eq(schema.essays.authorId, schema.userProfiles.userId)
      )
      .where(eq(schema.essays.id, id));

    const row = result[0];
    if (!row) return undefined;

    return {
      ...row.essay,
      authorName: row.profileDisplayName || row.essay.authorName || "Anonymous"
    };
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
    
    let query = this.db
      .select({
        essay: schema.essays,
        profileDisplayName: schema.userProfiles.displayName,
      }).from(schema.essays)
      .leftJoin(
        schema.userProfiles,
        eq(schema.essays.authorId, schema.userProfiles.userId)
      );
    
    const conditions = [];

    if (statusFilter === "drafts") {
      conditions.push(eq(schema.essays.isPublic, false));
      conditions.push(eq(schema.essays.isAnalyzed, false));
    } else if (statusFilter === "analyzed") {
      conditions.push(eq(schema.essays.isAnalyzed, true));
    } else {
      if (isPublic !== undefined) {
        conditions.push(eq(schema.essays.isPublic, isPublic));
      }
    }

    if (communityId && communityId !== "all") {
      conditions.push(
        exists(
          this.db
            .select({ id: schema.topicSubmissions.id })
            .from(schema.topicSubmissions)
            .innerJoin(
              schema.communityTopics,
              eq(schema.topicSubmissions.topicId, schema.communityTopics.id)
            )
            .where(and(
              eq(schema.topicSubmissions.essayId, schema.essays.id),
              eq(schema.communityTopics.communityId, communityId)
            ))
        )
      );
    }

    if (authorId) {
      conditions.push(eq(schema.essays.authorId, authorId));
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
    
    return rows.map(({ essay, profileDisplayName }) => ({
      ...essay,
      authorName: profileDisplayName || essay.authorName || "Anonymous"
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