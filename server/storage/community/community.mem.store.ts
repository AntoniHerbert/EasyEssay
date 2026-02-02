import { 
  type Community, type InsertCommunity,
  type CommunityMember, type InsertCommunityMember,
  type CommunityTopic, type InsertCommunityTopic,
  type TopicSubmission, type InsertTopicSubmission,
  type JoinRequest, type InsertJoinRequest 
} from "@shared/schema";
import { ICommunityStore } from "./community.store";
import { randomUUID } from "crypto";
import { type Tx } from "../types";

export class CommunityMemStore implements ICommunityStore {
  private communities: Map<string, Community>;
  private members: Map<string, CommunityMember>;
  private topics: Map<string, CommunityTopic>;
  private submissions: Map<string, TopicSubmission>;
  private joinRequests: Map<string, JoinRequest>;

  constructor() {
    this.communities = new Map();
    this.members = new Map();
    this.topics = new Map();
    this.submissions = new Map();
    this.joinRequests = new Map();
  }

  // --- Communities ---

  async getCommunities(
    limit = 20, 
    cursor?: Date, 
    userId?: string, 
    searchQuery?: string
  ): Promise<Community[]> {
    let results = Array.from(this.communities.values());

    if (userId) {
      const userCommunityIds = new Set(
        Array.from(this.members.values())
          .filter(m => m.userId === userId)
          .map(m => m.communityId)
      );
      results = results.filter(c => userCommunityIds.has(c.id));
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      results = results.filter(c => 
        c.name.toLowerCase().includes(q) || 
        (c.description && c.description.toLowerCase().includes(q))
      );
    }

    if (cursor) {
      results = results.filter(c => c.createdAt < cursor);
    }

    return results
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async getCommunity(id: string): Promise<Community | undefined> {
    return this.communities.get(id);
  }

  async createCommunity(data: InsertCommunity, _tx?: Tx): Promise<Community> {
    const id = randomUUID();
    const now = new Date();
    const community: Community = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
      memberCount: 0,
      description: data.description || null,
      isPublic: data.isPublic ?? true,
    };
    this.communities.set(id, community);
    return community;
  }

  async updateCommunity(id: string, updates: Partial<InsertCommunity>, _tx?: Tx): Promise<Community | undefined> {
    const community = this.communities.get(id);
    if (!community) return undefined;

    const updatedCommunity = {
      ...community,
      ...updates,
      updatedAt: new Date()
    };
    this.communities.set(id, updatedCommunity);
    return updatedCommunity;
  }

  async deleteCommunity(id: string, _tx?: Tx): Promise<boolean> {
    return this.communities.delete(id);
  }

  async updateMemberCount(communityId: string, delta: number, _tx?: Tx): Promise<void> {
    const community = this.communities.get(communityId);
    if (community) {
      community.memberCount += delta;
      this.communities.set(communityId, community);
    }
  }

  // --- Members ---

  async getCommunityMembers(communityId: string): Promise<CommunityMember[]> {
    return Array.from(this.members.values())
      .filter(m => m.communityId === communityId)
      .sort((a, b) => b.joinedAt.getTime() - a.joinedAt.getTime());
  }

  async getCommunityMember(communityId: string, userId: string): Promise<CommunityMember | undefined> {
    return Array.from(this.members.values())
      .find(m => m.communityId === communityId && m.userId === userId);
  }

  async getUserCommunities(userId: string): Promise<CommunityMember[]> {
    return Array.from(this.members.values())
      .filter(m => m.userId === userId)
      .sort((a, b) => b.joinedAt.getTime() - a.joinedAt.getTime());
  }

  async addMember(data: InsertCommunityMember, _tx?: Tx): Promise<CommunityMember> {
    const id = randomUUID();
    const member: CommunityMember = {
      ...data,
      id,
      joinedAt: new Date(),
      role: data.role || "member"
    };
    this.members.set(id, member);
    return member;
  }

  async removeMember(communityId: string, userId: string, _tx?: Tx): Promise<boolean> {
    const member = Array.from(this.members.values())
      .find(m => m.communityId === communityId && m.userId === userId);
    
    if (member) {
      return this.members.delete(member.id);
    }
    return false;
  }

  async updateMemberRole(communityId: string, userId: string, role: string, _tx?: Tx): Promise<CommunityMember | undefined> {
    const member = Array.from(this.members.values())
      .find(m => m.communityId === communityId && m.userId === userId);
    
    if (member) {
      const updated = { ...member, role };
      this.members.set(member.id, updated);
      return updated;
    }
    return undefined;
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

  async createCommunityTopic(data: InsertCommunityTopic, _tx?: Tx): Promise<CommunityTopic> {
    const id = randomUUID();
    const now = new Date();
    const topic: CommunityTopic = {
      ...data,
      id,
      description: data.description || null,
      deadline: data.deadline || null,
      createdAt: now,
      updatedAt: now,
      isActive: true
    };
    this.topics.set(id, topic);
    return topic;
  }

  async updateCommunityTopic(id: string, updates: Partial<InsertCommunityTopic>, _tx?: Tx): Promise<CommunityTopic | undefined> {
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
    const id = randomUUID();
    const now = new Date();
    const submission: TopicSubmission = {
      ...data,
      id,
      createdAt: now,
      isReviewed: false,
      reviewedById: null,
      reviewedAt: null
    };
    this.submissions.set(id, submission);
    return submission;
  }

  async markSubmissionReviewed(id: string, reviewerId: string, _tx?: Tx): Promise<TopicSubmission | undefined> {
    const sub = this.submissions.get(id);
    if (!sub) return undefined;

    const updated = { 
      ...sub, 
      isReviewed: true, 
      reviewedById: reviewerId, 
      reviewedAt: new Date() 
    };
    this.submissions.set(id, updated);
    return updated;
  }

  // --- Join Requests ---

  async getJoinRequests(communityId: string): Promise<JoinRequest[]> {
    return Array.from(this.joinRequests.values())
      .filter(r => r.communityId === communityId && r.status === 'pending')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getJoinRequest(communityId: string, userId: string): Promise<JoinRequest | undefined> {
    return Array.from(this.joinRequests.values())
      .find(r => r.communityId === communityId && r.userId === userId);
  }

  async getUserPendingJoinRequests(userId: string): Promise<JoinRequest[]> {
    return Array.from(this.joinRequests.values())
      .filter(r => r.userId === userId && r.status === 'pending')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createJoinRequest(data: InsertJoinRequest, _tx?: Tx): Promise<JoinRequest> {
    const id = randomUUID();
    const request: JoinRequest = {
      ...data,
      id,
      status: 'pending',
      createdAt: new Date(),
      respondedAt: null,
      respondedById: null
    };
    this.joinRequests.set(id, request);
    return request;
  }

  async updateJoinRequest(id: string, updates: { status: string; respondedAt: Date; respondedById: string }, _tx?: Tx): Promise<JoinRequest | undefined> {
    const request = this.joinRequests.get(id);
    if (!request) return undefined;

    const updated = { ...request, ...updates };
    this.joinRequests.set(id, updated);
    return updated;
  }
}