import { 
  CreateEssayInput,
  UpdateEssayInput, 
} from "@shared/schema";
import type { IEssayStore } from "../storage/essays/essay.store";
import type { IProfileStore } from "../storage/profiles/profile.store";
import type { ITransactionManager } from "../storage/transaction";
import type { IPeerReviewStore } from "../storage/peerReviews/peerReview.store";
import type { IEssayLikeStore } from "../storage/essayLikes/essayLike.store"; 
import type { ICommunityStore } from "../storage/community/community.store";
import type { AiService } from "./ai.service";

export class EssayService {

  constructor(
    private essayStore: IEssayStore,
    private profileStore: IProfileStore,
    private aiService: AiService,
    private peerReviewStore: IPeerReviewStore,
    private essayLikeStore: IEssayLikeStore,
    private communityStore: ICommunityStore,
    private txManager: ITransactionManager 
  ) {}

  async analyzeEssay(essayId: string, language: string = "pt-BR") {
    const essay = await this.essayStore.getEssay(essayId);
    
    if (!essay) throw new Error("ESSAY_NOT_FOUND");
    if (!essay.title || !essay.content) throw new Error("CONTENT_REQUIRED");

    return this.aiService.analyzeEssay(essayId, language);
  }


  async getEssays(
    requestingUserId: string | undefined,
    isPublicString?: string, 
    authorIdFilter?: string,
    cursorStr?: string,
    excludeAuthorId?: string,
    searchQuery?: string,
    statusFilter?: "drafts" | "analyzed" | "all" | "submitted",
    communityId?: string,
    topicId?: string 
  ) {

    let isPublic: boolean | undefined = true;
    
    if (isPublicString === "false") isPublic = false;
    if (isPublicString === "true") isPublic = true;
    
    const isViewingOwnProfile = authorIdFilter && authorIdFilter === requestingUserId;
    
    if (isViewingOwnProfile) {
      isPublic = undefined;
    }

    if (requestingUserId && (topicId || (communityId && communityId !== "all"))) {
      let hasAccess = false;

      if (topicId) {
        const topic = await this.communityStore.getCommunityTopic(topicId);
        if (topic) {
          const membership = await this.communityStore.getCommunityMember(topic.communityId, requestingUserId);
          if (membership) hasAccess = true;
        }
      } else if (communityId) {
        const membership = await this.communityStore.getCommunityMember(communityId, requestingUserId);
        if (membership) hasAccess = true;
      }

      if (hasAccess) {
        isPublic = undefined;
      }
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
      communityId,
      topicId
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

    const isAuthor = essay.authorId === requestingUserId;
    const isPublic = essay.isPublic;

    if (!isPublic && !isAuthor) {
      let hasCommunityAccess = false;

      if (essay.communityId) {
        const membership = await this.communityStore.getCommunityMember(essay.communityId, requestingUserId);
        if (membership) {
          hasCommunityAccess = true;
        }
      }

      if (!hasCommunityAccess) {
        throw new Error("FORBIDDEN_ACCESS");
      }
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