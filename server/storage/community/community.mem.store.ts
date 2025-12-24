import { type Tx } from "../types";
import { type ICommunityStore } from "./community.store";
import { 
  type Community, type InsertCommunity,
  type CommunityMember, type InsertCommunityMember,
  type CommunityTopic, type InsertCommunityTopic,
  type TopicSubmission, type InsertTopicSubmission,
  type JoinRequest, type InsertJoinRequest
} from "@shared/schema";

export class CommunityMemStore implements ICommunityStore {
  private communities: Map<string, Community> = new Map();
  private members: Map<string, CommunityMember> = new Map();
  private topics: Map<string, CommunityTopic> = new Map();
  private submissions: Map<string, TopicSubmission> = new Map();
  private requests: Map<string, JoinRequest> = new Map();

  private currentIds = { comm: 1, topic: 1, sub: 1, req: 1 };

  // --- Communities ---

  async getCommunities(): Promise<Community[]> {
    return Array.from(this.communities.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getCommunity(id: string): Promise<Community | undefined> {
    return this.communities.get(id);
  }

  async createCommunity(data: InsertCommunity, _tx?: Tx): Promise<Community> {
    const id = (this.currentIds.comm++).toString();
    const newItem: Community = {
      ...data,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      memberCount: 0,
      imageUrl: data.imageUrl || null
    };
    this.communities.set(id, newItem);
    return newItem;
  }

  async updateCommunity(id: string, updates: Partial<InsertCommunity>, _tx?: Tx): Promise<Community | undefined> {
    const comm = this.communities.get(id);
    if (!comm) return undefined;
    
    const updated = { ...comm, ...updates, updatedAt: new Date() };
    this.communities.set(id, updated);
    return updated;
  }

  async deleteCommunity(id: string): Promise<boolean> {
    return this.communities.delete(id);
  }

  async updateMemberCount(communityId: string, delta: number, _tx?: Tx): Promise<void> {
    const comm = this.communities.get(communityId);
    if (comm) {
      comm.memberCount = (comm.memberCount || 0) + delta;
      if (comm.memberCount < 0) comm.memberCount = 0;
    }
  }

  // --- Members ---

  private getMemberKey(cId: string, uId: string) { return `${cId}:${uId}`; }

  async getCommunityMembers(communityId: string): Promise<CommunityMember[]> {
    return Array.from(this.members.values())
      .filter(m => m.communityId === communityId)
      .sort((a, b) => b.joinedAt.getTime() - a.joinedAt.getTime());
  }

  async getCommunityMember(communityId: string, userId: string): Promise<CommunityMember | undefined> {
    return this.members.get(this.getMemberKey(communityId, userId));
  }

  async getUserCommunities(userId: string): Promise<CommunityMember[]> {
    return Array.from(this.members.values())
      .filter(m => m.userId === userId)
      .sort((a, b) => b.joinedAt.getTime() - a.joinedAt.getTime());
  }

  async addMember(data: InsertCommunityMember, _tx?: Tx): Promise<CommunityMember> {
    const member: CommunityMember = {
      ...data,
      id: Math.random().toString(), 
      joinedAt: new Date()
    };
    this.members.set(this.getMemberKey(data.communityId, data.userId), member);
    return member;
  }

  async removeMember(communityId: string, userId: string, _tx?: Tx): Promise<boolean> {
    return this.members.delete(this.getMemberKey(communityId, userId));
  }

  async updateMemberRole(communityId: string, userId: string, role: string, _tx?: Tx): Promise<CommunityMember | undefined> {
    const key = this.getMemberKey(communityId, userId);
    const member = this.members.get(key);
    if (!member) return undefined;
    
    member.role = role;
    return member;
  }

  // --- Topics ---

  async getCommunityTopics(communityId: string): Promise<CommunityTopic[]> {
    return Array.from(this.topics.values())
      .filter(t => t.communityId === communityId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getCommunityTopic(id: string): Promise<CommunityTopic | undefined> {
    return this.topics.get(id);
  }

  async createCommunityTopic(data: InsertCommunityTopic): Promise<CommunityTopic> {
    const id = (this.currentIds.topic++).toString();
    const topic: CommunityTopic = {
      ...data, id, createdAt: new Date(), updatedAt: new Date()
    };
    this.topics.set(id, topic);
    return topic;
  }

  async updateCommunityTopic(id: string, updates: Partial<InsertCommunityTopic>): Promise<CommunityTopic | undefined> {
    const topic = this.topics.get(id);
    if (!topic) return undefined;
    
    const updated = { ...topic, ...updates, updatedAt: new Date() };
    this.topics.set(id, updated);
    return updated;
  }

  // --- Submissions ---

  async getTopicSubmissions(topicId: string): Promise<TopicSubmission[]> {
    return Array.from(this.submissions.values())
      .filter(s => s.topicId === topicId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getTopicSubmission(topicId: string, userId: string): Promise<TopicSubmission | undefined> {
    return Array.from(this.submissions.values())
      .find(s => s.topicId === topicId && s.userId === userId);
  }

  async getUserSubmissions(userId: string): Promise<TopicSubmission[]> {
    return Array.from(this.submissions.values())
      .filter(s => s.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createTopicSubmission(data: InsertTopicSubmission, _tx?: Tx): Promise<TopicSubmission> {
    const id = (this.currentIds.sub++).toString();
    const sub: TopicSubmission = {
      ...data, id, createdAt: new Date(), isReviewed: false, reviewedAt: null, reviewedById: null
    };
    this.submissions.set(id, sub);
    return sub;
  }

  async markSubmissionReviewed(id: string, reviewerId: string, _tx?: Tx): Promise<TopicSubmission | undefined> {
    const sub = this.submissions.get(id);
    if (!sub) return undefined;
    sub.isReviewed = true;
    sub.reviewedById = reviewerId;
    sub.reviewedAt = new Date();
    return sub;
  }

  // --- Join Requests ---

  async getJoinRequests(communityId: string): Promise<JoinRequest[]> {
    return Array.from(this.requests.values())
      .filter(r => r.communityId === communityId && r.status === 'pending')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getJoinRequest(communityId: string, userId: string): Promise<JoinRequest | undefined> {
    return Array.from(this.requests.values())
      .find(r => r.communityId === communityId && r.userId === userId);
  }

  async getUserPendingJoinRequests(userId: string): Promise<JoinRequest[]> {
    return Array.from(this.requests.values())
      .filter(r => r.userId === userId && r.status === 'pending')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createJoinRequest(data: InsertJoinRequest): Promise<JoinRequest> {
    const id = (this.currentIds.req++).toString();
    const req: JoinRequest = {
      ...data, id, createdAt: new Date(), status: 'pending', respondedAt: null, respondedById: null
    };
    this.requests.set(id, req);
    return req;
  }

  async updateJoinRequest(id: string, updates: { status: string; respondedAt: Date; respondedById: string }, _tx?: Tx): Promise<JoinRequest | undefined> {
    const req = this.requests.get(id);
    if (!req) return undefined;
    
    Object.assign(req, updates);
    return req;
  }
}