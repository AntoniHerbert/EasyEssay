import { type PeerReview, type InsertPeerReview, type CorrectionObject } from "@shared/schema";
import { type Tx } from "../types"; 

export interface IPeerReviewStore {
  getPeerReviews(essayId: string, limit?: number, cursor?: Date): Promise<PeerReview[]>;
  getPeerReview(essayId: string, reviewerId: string): Promise<PeerReview | undefined>;
  getPeerReviewById(id: string): Promise<PeerReview | undefined>;
  createPeerReview(review: InsertPeerReview, tx?: Tx): Promise<PeerReview>;
  updatePeerReview(id: string, updates: Partial<InsertPeerReview>, tx?: Tx): Promise<PeerReview | undefined>;
  addCorrectionToReview(reviewId: string, correction: CorrectionObject, tx?: Tx): Promise<PeerReview | undefined>;
  deleteByEssayId(essayId: string, tx?: Tx): Promise<void>;
  getEssayStats(essayId: string, tx?: Tx): Promise<{ count: number; average: number }>;
  getLikeCount(reviewId: string): Promise<number>;
  hasUserLiked(reviewId: string, userId: string): Promise<boolean>;
  addLike(reviewId: string, userId: string, tx?: Tx): Promise<void>;
  removeLike(reviewId: string, userId: string, tx?: Tx): Promise<void>;
}