import { ITransactionManager, type DrizzleDb } from "../index";
import * as schema from "@shared/schema";
import { eq, and, desc, count, avg, lt, getTableColumns } from "drizzle-orm"; 
import { type PeerReview, type InsertPeerReview, type CorrectionObject, type RubricScore } from "@shared/schema";
import { IPeerReviewStore } from "./peerReview.store";
import { type Tx } from "../types"; 

export class PeerReviewDbStore implements IPeerReviewStore {
  private db;

  constructor(db: DrizzleDb) {
    this.db = db;
  }

  async getEssayStats(essayId: string): Promise<{ count: number; average: number }> {
    const result = await this.db
      .select({
        count: count(),
        average: avg(schema.peerReviews.overallScore)
      })
      .from(schema.peerReviews)
      .where(eq(schema.peerReviews.essayId, essayId));

    const stats = result[0];
    
    return {
      count: stats.count,
      average: stats.average ? Math.round(Number(stats.average)) : 0
    };
  }

  async getPeerReviews(
    essayId: string, 
    limit = 10, 
    cursor?: Date
  ): Promise<schema.PeerReviewWithProfile[]> {
    let query = this.db
      .select({
        ...getTableColumns(schema.peerReviews), 
        profileDisplayName: schema.userProfiles.displayName,
      })
      .from(schema.peerReviews)
      .leftJoin(
        schema.userProfiles,
        eq(schema.peerReviews.reviewerId, schema.userProfiles.userId)
      );

      const conditions = [eq(schema.peerReviews.essayId, essayId)];

    if (cursor) {
      conditions.push(lt(schema.peerReviews.createdAt, cursor));
    }

    const rows = await query
      .where(and(...conditions))
      .limit(limit)
      .orderBy(desc(schema.peerReviews.createdAt));

    return rows.map((row) => {
      const { profileDisplayName, ...reviewData } = row;
      let reviewerName = profileDisplayName;

      if (!reviewerName) {
        if (reviewData.reviewerId === 'AI') {
          reviewerName = 'AI Assistant';
        } else {
          reviewerName = 'Anonymous';
        }
      }

      return {
        ...reviewData,
        reviewerName,
      };
    });
  }

  async getPeerReview(essayId: string, reviewerId: string): Promise<schema.PeerReviewWithProfile | undefined> {
    const result = await this.db
      .select({
        ...schema.peerReviews,
        reviewerName: schema.userProfiles.displayName,
      })
      .from(schema.peerReviews)
      .leftJoin(schema.userProfiles, eq(schema.peerReviews.reviewerId, schema.userProfiles.userId))
      .where(and(
        eq(schema.peerReviews.essayId, essayId),
        eq(schema.peerReviews.reviewerId, reviewerId)
      ));
    return result[0];
  }

  async getPeerReviewById(id: string): Promise<schema.PeerReviewWithProfile | undefined> {
    const result = await this.db
      .select({
        ...schema.peerReviews,
        reviewerName: schema.userProfiles.displayName,
      })
      .from(schema.peerReviews)
      .leftJoin(schema.userProfiles, eq(schema.peerReviews.reviewerId, schema.userProfiles.userId))
      .where(eq(schema.peerReviews.id, id));
    return result[0];
  }

  async createPeerReview(review: InsertPeerReview, tx?: Tx): Promise<PeerReview> {
    const executor = (tx || this.db) as DrizzleDb;

    const values = {
        ...review,
        rubricScores: review.rubricScores ? (review.rubricScores as RubricScore[]) : null,
    };

    const result = await executor.insert(schema.peerReviews).values(values as any).returning();
    return result[0];
  }

  async updatePeerReview(id: string, updates: Partial<InsertPeerReview>, tx?: Tx): Promise<PeerReview | undefined> {
    const executor = (tx || this.db) as DrizzleDb;
 
    const setValues = {
        ...updates,
        updatedAt: new Date(),
        rubricScores: updates.rubricScores !== undefined 
          ? (updates.rubricScores as RubricScore[] | undefined) ?? null 
          : undefined,
    };

    if (setValues.rubricScores === undefined) {
        delete (setValues as any).rubricScores;
    }

    const result = await executor
      .update(schema.peerReviews)
      .set(setValues as any)
      .where(eq(schema.peerReviews.id, id))
      .returning();
    return result[0];
  }

  async addCorrectionToReview(reviewId: string, correction: CorrectionObject, tx?: Tx): Promise<PeerReview | undefined> {
    const executor = (tx || this.db) as DrizzleDb;

    const review = await this.getPeerReviewById(reviewId); 
    if (!review) return undefined;
    
    const corrections = [...(review.corrections as CorrectionObject[] || []), correction];
    const result = await executor
      .update(schema.peerReviews)
      .set({ corrections: corrections as any, updatedAt: new Date() })
      .where(eq(schema.peerReviews.id, reviewId))
      .returning();
    return result[0];
  }

  async deleteByEssayId(essayId: string, tx?: Tx): Promise<void> {
    const executor = (tx || this.db) as DrizzleDb;
    await executor
      .delete(schema.peerReviews)
      .where(eq(schema.peerReviews.essayId, essayId));
  }

  async getLikeCount(reviewId: string): Promise<number> {
    const [result] = await this.db
      .select({ value: count() })
      .from(schema.peerReviewLikes)
      .where(eq(schema.peerReviewLikes.reviewId, reviewId));
    
    return result?.value || 0;
  }

  async hasUserLiked(reviewId: string, userId: string): Promise<boolean> {
    const [result] = await this.db
      .select()
      .from(schema.peerReviewLikes)
      .where(and(
        eq(schema.peerReviewLikes.reviewId, reviewId),
        eq(schema.peerReviewLikes.userId, userId)
      ))
      .limit(1);

    return !!result;
  }

  async addLike(reviewId: string, userId: string, tx?: ITransactionManager): Promise<void> {
    const db = tx || this.db as any;
    await db.insert(schema.peerReviewLikes)
      .values({ reviewId, userId })
      .onConflictDoNothing(); 
  }

  async removeLike(reviewId: string, userId: string, tx?: ITransactionManager): Promise<void> {
    const db = tx || this.db as any;
    await db.delete(schema.peerReviewLikes)
      .where(and(
        eq(schema.peerReviewLikes.reviewId, reviewId),
        eq(schema.peerReviewLikes.userId, userId)
      ));
  }
}