import { 
  insertEssaySchema, 
  type InsertEssay 
} from "@shared/schema";
import type { IEssayStore } from "../storage/essays/essay.store";
import type { IProfileStore } from "../storage/profiles/profile.store";
import type { AiService } from "./ai.service";

export class EssayService {

    constructor(
    private essayStore: IEssayStore,
    private profileStore: IProfileStore,
    private aiService: AiService
  ) {}


  async getEssays(isPublicString?: string, authorId?: string) {
    const isPublic = isPublicString === "true" ? true : isPublicString === "false" ? false : undefined;
    return await this.essayStore.getEssays(isPublic, authorId);
  }

  async getEssayById(id: string) {
    return await this.essayStore.getEssay(id);
  }

  async createEssay(userId: string, rawBody: unknown) {
    const userProfile = await this.profileStore.getUserProfile(userId);
    const essayData = insertEssaySchema.omit({ authorId: true, authorName: true }).parse(rawBody);
    const wordCount = essayData.content.trim().split(/\s+/).filter(word => word.length > 0).length;
    
    const essay = await this.essayStore.createEssay({
      ...essayData,
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

  async updateEssay(id: string, rawBody: unknown) {
    const updates = insertEssaySchema.partial().parse(rawBody);
    if (updates.content) {
      updates.wordCount = updates.content.trim().split(/\s+/).filter(word => word.length > 0).length;
    }
    return await this.essayStore.updateEssay(id, updates);
  }

  async deleteEssay(id: string) {
    return await this.essayStore.deleteEssay(id);
  }

}