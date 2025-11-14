import { type PeerReview, type InsertPeerReview, type CorrectionObject } from "@shared/schema";
import { IPeerReviewStore } from "./peerReview.store";
import { randomUUID } from "crypto";

export class PeerReviewMemStore implements IPeerReviewStore {
  private peerReviews: Map<string, PeerReview>;

  constructor() {
    this.peerReviews = new Map();
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

  async createPeerReview(review: InsertPeerReview): Promise<PeerReview> {
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

  async updatePeerReview(id: string, updates: Partial<InsertPeerReview>): Promise<PeerReview | undefined> {
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

  async addCorrectionToReview(reviewId: string, correction: CorrectionObject): Promise<PeerReview | undefined> {
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
}