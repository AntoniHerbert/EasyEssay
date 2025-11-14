import { type PeerReview, type InsertPeerReview, type CorrectionObject } from "@shared/schema";

export interface IPeerReviewStore {
  getPeerReviews(essayId: string): Promise<PeerReview[]>;
  getPeerReview(essayId: string, reviewerId: string): Promise<PeerReview | undefined>;
  getPeerReviewById(id: string): Promise<PeerReview | undefined>;
  createPeerReview(review: InsertPeerReview): Promise<PeerReview>;
  updatePeerReview(id: string, updates: Partial<InsertPeerReview>): Promise<PeerReview | undefined>;
  addCorrectionToReview(reviewId: string, correction: CorrectionObject): Promise<PeerReview | undefined>;
}