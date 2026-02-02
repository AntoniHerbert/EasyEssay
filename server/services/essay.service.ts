import { 
  CreateEssayInput,
  insertEssaySchema, 
  UpdateEssayInput, 
  type InsertEssay 
} from "@shared/schema";
import type { IEssayStore } from "../storage/essays/essay.store";
import type { IProfileStore } from "../storage/profiles/profile.store";
import type { ITransactionManager } from "../storage/transaction";
import type { IPeerReviewStore } from "../storage/peerReviews/peerReview.store";
import type { IEssayLikeStore } from "../storage/essayLikes/essayLike.store"; 
import type { AiService } from "./ai.service";
import { z } from "zod";

export class EssayService {

  constructor(
    private essayStore: IEssayStore,
    private profileStore: IProfileStore,
    private aiService: AiService,
    private peerReviewStore: IPeerReviewStore,
    private essayLikeStore: IEssayLikeStore,
    private txManager: ITransactionManager 
  ) {}

  async getEssays(
    requestingUserId: string | undefined,
    isPublicString?: string, 
    authorIdFilter?: string,
    cursorStr?: string,
    excludeAuthorId?: string,
    searchQuery?: string,
    statusFilter?: "drafts" | "analyzed" | "all",
    communityId?: string
  ) {
    let isPublic = isPublicString === "true" ? true : isPublicString === "false" ? false : undefined;
    
    const isViewingOwnProfile = authorIdFilter && authorIdFilter === requestingUserId;
    
    if (!isViewingOwnProfile) {
      isPublic = true;
    }

    let cursorDate: Date | undefined;
    if (cursorStr) {
      const parsed = new Date(cursorStr);
      if (!isNaN(parsed.getTime())) cursorDate = parsed;
    }

    const limit = 10;
    const safeSearch = searchQuery?.slice(0, 100);

    const essays = await this.essayStore.getEssays(
      isPublic, 
      authorIdFilter, 
      limit, 
      cursorDate, 
      excludeAuthorId, 
      safeSearch,
      statusFilter,
      communityId 
    );

    let nextCursor: string | null = null;
    
    if (essays.length === limit) {
      nextCursor = essays[essays.length - 1].createdAt.toISOString();
    }

    return {
      data: essays,
      nextCursor
    };
  }

  async getEssayById(essayId: string, requestingUserId: string) {
    const essay = await this.essayStore.getEssay(essayId);
    
    if (!essay) {
      return null; 
    }

    if (!essay.isPublic && essay.authorId !== requestingUserId) {
      throw new Error("FORBIDDEN_ACCESS");
    }

    return essay;
  }

  async createEssay(userId: string, data: CreateEssayInput) {
    const userProfile = await this.profileStore.getUserProfile(userId);
    const wordCount = data.content.trim().split(/\s+/).filter(word => word.length > 0).length;
    
    const essay = await this.essayStore.createEssay({
      ...data,
      authorId: userId,
      authorName: userProfile?.displayName || "Anonymous",
      wordCount,
    });

    if (essay.isPublic) {
      console.log(`[EssayService] Triggering auto-analysis for essay: ${essay.id}`);
      this.aiService.analyzeEssay(essay.id).catch(err => {
        console.error(`[EssayService] Background analysis failed for ${essay.id}:`, err);
      });
    }
    
    return essay;
  }

  async updateEssay(essayId: string, requestingUserId: string, data: UpdateEssayInput) {
    const essay = await this.essayStore.getEssay(essayId);
    
    if (!essay) return null;

    if (essay.authorId !== requestingUserId) {
      throw new Error("FORBIDDEN_ACCESS");
    }
  
    if (data.content) {
      data.wordCount = data.content.trim().split(/\s+/).filter(word => word.length > 0).length;
    }
    
    return await this.essayStore.updateEssay(essayId, data);
  }

  async deleteEssay(essayId: string, requestingUserId: string) {
    const essay = await this.essayStore.getEssay(essayId);
    if (!essay) return false;

    if (essay.authorId !== requestingUserId) {
      throw new Error("FORBIDDEN_ACCESS");
    }

    await this.txManager.transaction(async (tx) => {
      await Promise.all([
        this.peerReviewStore.deleteByEssayId(essayId, tx),
        this.essayLikeStore.deleteByEssayId(essayId, tx),
      ]);

      await this.essayStore.deleteEssay(essayId, tx);
    });

    return true;
  }
}