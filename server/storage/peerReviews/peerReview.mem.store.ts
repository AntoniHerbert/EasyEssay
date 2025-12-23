import { type PeerReview, type InsertPeerReview, type CorrectionObject } from "@shared/schema";
import { IPeerReviewStore } from "./peerReview.store";
import { randomUUID } from "crypto";
import { type Tx } from "../types"; 

export class PeerReviewMemStore implements IPeerReviewStore {
  private peerReviews: Map<string, PeerReview>;
  private reviewLikes: Map<string, Set<string>> = new Map();

  constructor() {
    this.peerReviews = new Map();
  }

  async getEssayStats(essayId: string, _tx?: Tx): Promise<{ count: number; average: number }> {
    const reviews = Array.from(this.peerReviews.values())
      .filter(r => r.essayId === essayId);

    const count = reviews.length;

    if (count === 0) {
      return { count: 0, average: 0 };
    }

    const totalScore = reviews.reduce((sum, review) => sum + review.overallScore, 0);

    const average = Math.round(totalScore / count);

    return { count, average };
  }

  async getPeerReviews(essayId: string): Promise<PeerReview[]> {
    return Array.from(this.peerReviews.values()).filter(r => r.essayId === essayId);
  }

  async getPeerReview(essayId: string, reviewerId: string): Promise<PeerReview | undefined> {
    return Array.from(this.peerReviews.values()).find(
      r => r.essayId === essayId && r.reviewerId === reviewerId
    );
  }

  async getPeerReviewById(id: string): Promise<PeerReview | undefined> {
    return this.peerReviews.get(id);
  }

  async createPeerReview(review: InsertPeerReview, _tx?: Tx): Promise<PeerReview> {
    const newReview: PeerReview = {
      id: randomUUID(),
      ...review,
      grammarScore: review.grammarScore ?? 100,
      styleScore: review.styleScore ?? 100,
      clarityScore: review.clarityScore ?? 100,
      structureScore: review.structureScore ?? 100,
      contentScore: review.contentScore ?? 100,
      researchScore: review.researchScore ?? 100,
      overallScore: review.overallScore ?? 600,
      corrections: (review.corrections ?? []) as CorrectionObject[],
      reviewComment: review.reviewComment ?? null,
      isSubmitted: review.isSubmitted ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.peerReviews.set(newReview.id, newReview);
    return newReview;
  }

  async updatePeerReview(id: string, updates: Partial<InsertPeerReview>, _tx?: Tx): Promise<PeerReview | undefined> {
    const review = this.peerReviews.get(id);
    if (review) {
      const updatedReview: PeerReview = { 
        ...review, 
        ...updates,
        corrections: (updates.corrections ?? review.corrections) as CorrectionObject[],
        updatedAt: new Date() 
      };
      this.peerReviews.set(id, updatedReview);
      return updatedReview;
    }
    return undefined;
  }

  async addCorrectionToReview(reviewId: string, correction: CorrectionObject, _tx?: Tx): Promise<PeerReview | undefined> {
    const review = this.peerReviews.get(reviewId);
    if (review) {
      const updatedReview: PeerReview = {
        ...review,
        corrections: [...review.corrections, correction] as CorrectionObject[],
        updatedAt: new Date()
      };
      this.peerReviews.set(reviewId, updatedReview);
      return updatedReview;
    }
    return undefined;
  }

  async deleteByEssayId(essayId: string, _tx?: Tx): Promise<void> {
  for (const [id, review] of Array.from(this.peerReviews.entries())) {
    if (review.essayId === essayId) {
      this.peerReviews.delete(id);
    }
  }
  }

  async getLikeCount(reviewId: string): Promise<number> {
    const likes = this.reviewLikes.get(reviewId);
    return likes ? likes.size : 0;
  }

  async hasUserLiked(reviewId: string, userId: string): Promise<boolean> {
    const likes = this.reviewLikes.get(reviewId);
    return likes ? likes.has(userId) : false;
  }

  async addLike(reviewId: string, userId: string, _tx?: Tx): Promise<void> {
    if (!this.reviewLikes.has(reviewId)) {
      this.reviewLikes.set(reviewId, new Set());
    }
    
    this.reviewLikes.get(reviewId)!.add(userId);
  }

  async removeLike(reviewId: string, userId: string, _tx?: Tx): Promise<void> {
    const likes = this.reviewLikes.get(reviewId);
    if (likes) {
      likes.delete(userId);
    }
  }
}