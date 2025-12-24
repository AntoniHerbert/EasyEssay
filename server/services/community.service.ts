import { ICommunityStore } from "../storage/community/community.store";
import { IProfileStore } from "../storage/profiles/profile.store";
import { IUserStore } from "../storage/users/user.store";
import { IEssayStore } from "../storage/essays/essay.store";
import { IPeerReviewStore } from "../storage/peerReviews/peerReview.store"; 
import { ITransactionManager } from "../storage/transaction";
import { 
  InsertCommunity, InsertCommunityTopic, InsertTopicSubmission, 
  InsertCommunityMember 
} from "@shared/schema";

export class CommunityService {
  constructor(
    private store: ICommunityStore,
    private profileStore: IProfileStore,
    private userStore: IUserStore,
    private essayStore: IEssayStore,
    private peerReviewStore: IPeerReviewStore,
    private txManager: ITransactionManager
  ) {}

  private async getUserIdentity(userId: string) {
    const [user, profile] = await Promise.all([
      this.userStore.getUser(userId),
      this.profileStore.getUserProfile(userId)
    ]);

    return {
      username: user?.username || "unknown",
      displayName: profile?.displayName || "Unknown"
    };
  }

  // --- Communities ---

  async getCommunities() {
    return this.store.getCommunities();
  }

  async getCommunity(id: string) {
    return this.store.getCommunity(id);
  }

  async createCommunity(userId: string, data: Omit<InsertCommunity, "leaderId" | "leaderName" | "code"> & { isPublic?: boolean }) {
    const { username, displayName } = await this.getUserIdentity(userId);

    const generateCode = () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    };

    return this.txManager.transaction(async (tx) => {
      const community = await this.store.createCommunity({
        ...data,
        leaderId: userId,
        leaderName: displayName,
        code: generateCode(),
        isPublic: data.isPublic ?? true,
      }, tx);
      
      await this.store.addMember({
        communityId: community.id,
        userId,
        username,
        role: "leader"
      }, tx);

      await this.store.updateMemberCount(community.id, 1, tx);

      return community;
    });
  }

  async updateCommunity(communityId: string, userId: string, updates: Partial<InsertCommunity>) {
    const community = await this.store.getCommunity(communityId);
    if (!community) throw new Error("NOT_FOUND");
    if (community.leaderId !== userId) throw new Error("FORBIDDEN");

    return this.store.updateCommunity(communityId, updates);
  }

  async deleteCommunity(communityId: string, userId: string) {
    const community = await this.store.getCommunity(communityId);
    if (!community) throw new Error("NOT_FOUND");
    if (community.leaderId !== userId) throw new Error("FORBIDDEN");

    return this.store.deleteCommunity(communityId);
  }

  // --- Members & Joining ---

  async getMembers(communityId: string) {
    return this.store.getCommunityMembers(communityId);
  }

  async getUserCommunities(userId: string) {
    return this.store.getUserCommunities(userId);
  }

  async joinCommunity(communityId: string, userId: string) {
    const community = await this.store.getCommunity(communityId);
    if (!community) throw new Error("NOT_FOUND");

    const existingMember = await this.store.getCommunityMember(communityId, userId);
    if (existingMember) throw new Error("ALREADY_MEMBER");

    const { username } = await this.getUserIdentity(userId);

    if (!community.isPublic) {
      const existingRequest = await this.store.getJoinRequest(communityId, userId);
      if (existingRequest && existingRequest.status === 'pending') {
        throw new Error("REQUEST_PENDING");
      }

      const request = await this.store.createJoinRequest({
        communityId,
        userId,
        username
      });
      return { type: 'request', result: request };
    }

    return this.txManager.transaction(async (tx) => {
      const member = await this.store.addMember({
        communityId,
        userId,
        username,
        role: "member"
      }, tx);
      
      await this.store.updateMemberCount(communityId, 1, tx);
      
      return { type: 'member', result: member };
    });
  }

  async leaveCommunity(communityId: string, userId: string) {
    const community = await this.store.getCommunity(communityId);
    if (!community) throw new Error("NOT_FOUND");
    if (community.leaderId === userId) throw new Error("LEADER_CANNOT_LEAVE");

    return this.txManager.transaction(async (tx) => {
      const removed = await this.store.removeMember(communityId, userId, tx);
      if (!removed) throw new Error("NOT_MEMBER");
      
      await this.store.updateMemberCount(communityId, -1, tx);
    });
  }

  async transferLeadership(communityId: string, currentLeaderId: string, newLeaderId: string) {
    const community = await this.store.getCommunity(communityId);
    if (!community) throw new Error("NOT_FOUND");
    if (community.leaderId !== currentLeaderId) throw new Error("FORBIDDEN");

    const newLeaderMember = await this.store.getCommunityMember(communityId, newLeaderId);
    if (!newLeaderMember) throw new Error("NEW_LEADER_NOT_MEMBER");

    const newLeaderProfile = await this.profileStore.getUserProfile(newLeaderId);

    return this.txManager.transaction(async (tx) => {
      await this.store.updateMemberRole(communityId, newLeaderId, 'leader', tx);
      await this.store.updateMemberRole(communityId, currentLeaderId, 'member', tx);
      return this.store.updateCommunity(communityId, {
        leaderId: newLeaderId,
        leaderName: newLeaderProfile?.displayName || "Unknown"
      }, tx);
    });
  }

  async updateMemberRole(communityId: string, requesterId: string, targetUserId: string, newRole: string) {
    const requester = await this.store.getCommunityMember(communityId, requesterId);
    if (!requester || requester.role !== 'leader') throw new Error("FORBIDDEN");
    
    const community = await this.store.getCommunity(communityId);
    if (community?.leaderId === targetUserId && newRole !== 'leader') {
       throw new Error("CANNOT_DEMOTE_OWNER");
    }

    const updated = await this.store.updateMemberRole(communityId, targetUserId, newRole);
    if (!updated) throw new Error("MEMBER_NOT_FOUND");
    return updated;
  }

  // --- Join Requests ---

  async getJoinRequests(communityId: string, userId: string) {
    const community = await this.store.getCommunity(communityId);
    if (!community) throw new Error("NOT_FOUND");
    if (community.leaderId !== userId) throw new Error("FORBIDDEN");

    return this.store.getJoinRequests(communityId);
  }

  async getUserPendingRequests(userId: string) {
    return this.store.getUserPendingJoinRequests(userId);
  }

  async respondJoinRequest(communityId: string, leaderId: string, requestId: string, action: 'approve' | 'reject') {
    const community = await this.store.getCommunity(communityId);
    if (!community) throw new Error("NOT_FOUND");
    if (community.leaderId !== leaderId) throw new Error("FORBIDDEN");

    if (action === 'reject') {
      const updated = await this.store.updateJoinRequest(requestId, {
        status: 'rejected',
        respondedAt: new Date(),
        respondedById: leaderId
      });
      if (!updated) throw new Error("REQUEST_NOT_FOUND");
      return updated;
    }

    return this.txManager.transaction(async (tx) => {
      const request = await this.store.updateJoinRequest(requestId, {
        status: 'approved',
        respondedAt: new Date(),
        respondedById: leaderId
      }, tx);
      
      if (!request) throw new Error("REQUEST_NOT_FOUND");

      const existing = await this.store.getCommunityMember(communityId, request.userId);
      if (existing) return { request, member: existing };

      const member = await this.store.addMember({
        communityId,
        userId: request.userId,
        username: request.username,
        role: "member"
      }, tx);

      await this.store.updateMemberCount(communityId, 1, tx);

      return { request, member };
    });
  }

  // --- Topics & Submissions ---

  async createTopic(userId: string, data: InsertCommunityTopic) {
    const member = await this.store.getCommunityMember(data.communityId, userId);
    if (!member || member.role !== 'leader') throw new Error("FORBIDDEN");

    const profile = await this.profileStore.getUserProfile(userId);
    
    return this.store.createCommunityTopic({
      ...data,
      createdById: userId,
      createdByName: profile?.displayName || "Unknown"
    });
  }

  async updateTopic(topicId: string, userId: string, updates: Partial<InsertCommunityTopic>) {
    const topic = await this.store.getCommunityTopic(topicId);
    if (!topic) throw new Error("NOT_FOUND");

    const member = await this.store.getCommunityMember(topic.communityId, userId);
    if (!member || member.role !== 'leader') throw new Error("FORBIDDEN");

    return this.store.updateCommunityTopic(topicId, updates);
  }

  async getTopicSubmissions(topicId: string) {
    const submissions = await this.store.getTopicSubmissions(topicId);
    const topic = await this.store.getCommunityTopic(topicId);
    
    let leaderId: string | null = null;
    if (topic) {
        const community = await this.store.getCommunity(topic.communityId);
        leaderId = community?.leaderId || null;
    }

    return Promise.all(submissions.map(async (sub) => {
        const essay = await this.essayStore.getEssay(sub.essayId);
        let isReviewed = false;
        
        if (leaderId) {
            const review = await this.peerReviewStore.getPeerReview(sub.essayId, leaderId);
            isReviewed = !!(review && review.isSubmitted);
        }

        return {
            ...sub,
            essay: essay ? { id: essay.id, wordCount: essay.wordCount, title: essay.title } : null,
            isReviewed: isReviewed || sub.isReviewed
        };
    }));
  }

  async createSubmission(userId: string, topicId: string, essayData: { title: string, content: string }) {
    const topic = await this.store.getCommunityTopic(topicId);
    if (!topic) throw new Error("NOT_FOUND");
    if (!topic.isActive) throw new Error("TOPIC_CLOSED");

    const member = await this.store.getCommunityMember(topic.communityId, userId);
    if (!member) throw new Error("FORBIDDEN");

    const existing = await this.store.getTopicSubmission(topicId, userId);
    if (existing) throw new Error("ALREADY_SUBMITTED");

    const { username, displayName } = await this.getUserIdentity(userId);
    const wordCount = essayData.content.trim().split(/\s+/).filter(w => w.length > 0).length;

    return this.txManager.transaction(async (tx) => {
        const essay = await this.essayStore.createEssay({
            title: essayData.title,
            content: essayData.content,
            authorId: userId,
            authorName: displayName || "Anonymous",
            wordCount,
            isPublic: false
        }, tx);

        const submission = await this.store.createTopicSubmission({
            essayId: essay.id,
            topicId,
            userId,
            username: username || "unknown"
        }, tx);

        return { ...submission, essay };
    });
  }
}