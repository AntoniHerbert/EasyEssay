import { type DrizzleDb } from "../index";
import * as schema from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { type PeerReview, type InsertPeerReview, type CorrectionObject } from "@shared/schema";
import { IPeerReviewStore } from "./peerReview.store";

export class PeerReviewDbStore implements IPeerReviewStore {
  private db;

  constructor(db: DrizzleDb) {
    this.db = db;
  }

  async getPeerReviews(essayId: string): Promise<PeerReview[]> {
    const result = await this.db
      .select()
      .from(schema.peerReviews)
      .where(eq(schema.peerReviews.essayId, essayId))
      .orderBy(desc(schema.peerReviews.createdAt));
    return result;
  }

  async getPeerReview(essayId: string, reviewerId: string): Promise<PeerReview | undefined> {
    const result = await this.db
      .select()
      .from(schema.peerReviews)
      .where(and(
        eq(schema.peerReviews.essayId, essayId),
        eq(schema.peerReviews.reviewerId, reviewerId)
      ));
    return result[0];
  }

  async getPeerReviewById(id: string): Promise<PeerReview | undefined> {
    const result = await this.db
      .select()
      .from(schema.peerReviews)
      .where(eq(schema.peerReviews.id, id));
    return result[0];
  }

  async createPeerReview(review: InsertPeerReview): Promise<PeerReview> {
    const result = await this.db.insert(schema.peerReviews).values(review as any).returning();
    return result[0];
  }

  async updatePeerReview(id: string, updates: Partial<InsertPeerReview>): Promise<PeerReview | undefined> {
    const result = await this.db
      .update(schema.peerReviews)
      .set({ ...updates, updatedAt: new Date() } as any)
      .where(eq(schema.peerReviews.id, id))
      .returning();
    return result[0];
  }

  async addCorrectionToReview(reviewId: string, correction: CorrectionObject): Promise<PeerReview | undefined> {
    const review = await this.getPeerReviewById(reviewId); 
    if (!review) return undefined;
    
    const corrections = [...(review.corrections as CorrectionObject[] || []), correction];
    const result = await this.db
      .update(schema.peerReviews)
      .set({ corrections: corrections as any, updatedAt: new Date() })
      .where(eq(schema.peerReviews.id, reviewId))
      .returning();
    return result[0];
  }
}