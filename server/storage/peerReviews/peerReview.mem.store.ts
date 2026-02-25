import { 
  type PeerReview, 
  type InsertPeerReview, 
  type CorrectionObject, 
  type RubricScore,
  type PeerReviewWithProfile 
} from "@shared/schema";
import { IPeerReviewStore } from "./peerReview.store";
import { randomUUID } from "crypto";
import { type Tx } from "../types";

export class PeerReviewMemStore implements IPeerReviewStore {
  private peerReviews: Map<string, PeerReview>;

  constructor() {
    this.peerReviews = new Map();
  }

  async getEssayStats(essayId: string): Promise<{ count: number; average: number }> {
    let count = 0;
    let sum = 0;

    this.peerReviews.forEach((r) => {
      if (r.essayId === essayId && r.isSubmitted === true) {
        count++;
        sum += r.overallScore;
      }
    });

    if (count === 0) return { count: 0, average: 0 };

    return {
      count,
      average: Math.round(sum / count),
    };
  }

  async getPeerReviews(essayId: string, limit = 10, cursor?: Date): Promise<PeerReviewWithProfile[]> {
    const reviews: PeerReview[] = [];
    
    this.peerReviews.forEach((r) => {
      if (r.essayId === essayId) {
        if (!cursor || r.createdAt < cursor) {
          reviews.push(r);
        }
      }
    });

    return reviews
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit)
      .map((r) => ({
        ...r,
        reviewerName: r.reviewerId === 'AI' ? 'AI Assistant' : 'Anonymous',
      }));
  }

  async getPeerReview(essayId: string, reviewerId: string): Promise<PeerReview | undefined> {
    let found: PeerReview | undefined;
    this.peerReviews.forEach((r) => {
      if (r.essayId === essayId && r.reviewerId === reviewerId) {
        found = r;
      }
    });
    return found;
  }

  async getPeerReviewById(id: string): Promise<PeerReview | undefined> {
    return this.peerReviews.get(id);
  }

  async createPeerReview(review: InsertPeerReview, _tx?: Tx): Promise<PeerReview> {
    const id = randomUUID();
    const newReview: PeerReview = {
      ...review,
      id,
      isSubmitted: review.isSubmitted ?? false,
      corrections: review.corrections || [],
      rubricScores: (review.rubricScores as RubricScore[]) || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as PeerReview;

    this.peerReviews.set(id, newReview);
    return newReview;
  }

  async updatePeerReview(id: string, updates: Partial<InsertPeerReview>, _tx?: Tx): Promise<PeerReview | undefined> {
    const review = this.peerReviews.get(id);
    if (!review) return undefined;

    const updated: PeerReview = {
      ...review,
      ...updates,
      updatedAt: new Date(),
    } as PeerReview;

    this.peerReviews.set(id, updated);
    return updated;
  }

  async addCorrectionToReview(
    reviewId: string, 
    correction: CorrectionObject, 
    updates?: Partial<InsertPeerReview>, 
    _tx?: Tx
  ): Promise<PeerReview | undefined> {
    const review = this.peerReviews.get(reviewId);
    if (!review) return undefined;

    const updatedCorrections = [...(review.corrections as CorrectionObject[] || []), correction];
    
    const updated: PeerReview = {
      ...review,
      ...updates,
      corrections: updatedCorrections,
      updatedAt: new Date(),
    } as PeerReview;

    this.peerReviews.set(reviewId, updated);
    return updated;
  }

  async deleteByEssayId(essayId: string, _tx?: Tx): Promise<void> {
    this.peerReviews.forEach((review, key) => {
      if (review.essayId === essayId) {
        this.peerReviews.delete(key);
      }
    });
  }

  async getLikeCount(_reviewId: string): Promise<number> { return 0; }
  async hasUserLiked(_reviewId: string, _userId: string): Promise<boolean> { return false; }
  async addLike(_reviewId: string, _userId: string): Promise<void> {}
  async removeLike(_reviewId: string, _userId: string): Promise<void> {}
}