import { eq, and, desc, sql, lt, ilike, or, exists } from "drizzle-orm"; 
import { type Tx } from "../types";
import { type ICommunityStore } from "./community.store";
import { 
  communities, communityMembers, communityTopics, 
  topicSubmissions, joinRequests,
  type Community, type InsertCommunity,
  type CommunityMember, type InsertCommunityMember,
  type CommunityTopic, type InsertCommunityTopic,
  type TopicSubmission, type InsertTopicSubmission,
  type JoinRequest, type InsertJoinRequest
} from "@shared/schema";

export class CommunityDbStore implements ICommunityStore {
  constructor(private db: any) {}

  // --- Communities ---

  async getCommunities(
    limit = 20,
    cursor?: Date,
    userId?: string,
    searchQuery?: string
  ): Promise<Community[]> {
    let query = this.db
      .select()
      .from(communities);

    const conditions = [];

    if (userId) {
      conditions.push(
        exists(
          this.db
            .select({ id: communityMembers.id })
            .from(communityMembers)
            .where(and(
              eq(communityMembers.communityId, communities.id),
              eq(communityMembers.userId, userId)
            ))
        )
      );
    }

    if (searchQuery) {
      const pattern = `%${searchQuery}%`;
      conditions.push(
        or(
          ilike(communities.name, pattern),
          ilike(communities.description, pattern)
        )
      );
    }

    if (cursor) {
      conditions.push(lt(communities.createdAt, cursor));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return await query
      .limit(limit)
      .orderBy(desc(communities.createdAt));
  }

  async getCommunity(id: string): Promise<Community | undefined> {
    const [result] = await this.db
      .select()
      .from(communities)
      .where(eq(communities.id, id));
    return result;
  }

  async createCommunity(community: InsertCommunity, tx?: Tx): Promise<Community> {
    const db = (tx || this.db) as any;
    const [result] = await db.insert(communities).values(community).returning();
    return result;
  }

  async updateCommunity(id: string, updates: Partial<InsertCommunity>, tx?: Tx): Promise<Community | undefined> {
    const db = (tx || this.db) as any;
    const [result] = await db
      .update(communities)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(communities.id, id))
      .returning();
    return result;
  }

  async deleteCommunity(id: string, tx?: Tx): Promise<boolean> {
    const db = (tx || this.db) as any;
    const result = await db
      .delete(communities)
      .where(eq(communities.id, id))
      .returning();
    return result.length > 0;
  }

  async updateMemberCount(communityId: string, delta: number, tx?: Tx): Promise<void> {
    const db = (tx || this.db) as any;
    await db
      .update(communities)
      .set({ memberCount: sql`${communities.memberCount} + ${delta}` })
      .where(eq(communities.id, communityId));
  }

  // --- Members ---

  async getCommunityMembers(communityId: string): Promise<CommunityMember[]> {
    return await this.db
      .select()
      .from(communityMembers)
      .where(eq(communityMembers.communityId, communityId))
      .orderBy(desc(communityMembers.joinedAt));
  }

  async getCommunityMember(communityId: string, userId: string): Promise<CommunityMember | undefined> {
    const [result] = await this.db
      .select()
      .from(communityMembers)
      .where(and(
        eq(communityMembers.communityId, communityId),
        eq(communityMembers.userId, userId)
      ));
    return result;
  }

  async getUserCommunities(userId: string): Promise<any[]> {
    const results = await this.db
      .select()
      .from(communityMembers)
      .innerJoin(communities, eq(communityMembers.communityId, communities.id))
      .where(eq(communityMembers.userId, userId))
      .orderBy(desc(communityMembers.joinedAt));

    return results.map((row: any) => ({
      ...row.community_members,
      community: row.communities
    }));
  }

  async addMember(member: InsertCommunityMember, tx?: Tx): Promise<CommunityMember> {
    const db = (tx || this.db) as any;
    const [result] = await db.insert(communityMembers).values(member).returning();
    return result;
  }

  async removeMember(communityId: string, userId: string, tx?: Tx): Promise<boolean> {
    const db = (tx || this.db) as any;
    const result = await db
      .delete(communityMembers)
      .where(and(
        eq(communityMembers.communityId, communityId),
        eq(communityMembers.userId, userId)
      ))
      .returning();
    return result.length > 0;
  }

  async updateMemberRole(communityId: string, userId: string, role: string, tx?: Tx): Promise<CommunityMember | undefined> {
    const db = (tx || this.db) as any;
    const [result] = await db
      .update(communityMembers)
      .set({ role })
      .where(and(
        eq(communityMembers.communityId, communityId),
        eq(communityMembers.userId, userId)
      ))
      .returning();
    return result;
  }

  // --- Topics ---

  async getCommunityTopics(communityId: string): Promise<CommunityTopic[]> {
    return await this.db
      .select()
      .from(communityTopics)
      .where(eq(communityTopics.communityId, communityId))
      .orderBy(desc(communityTopics.createdAt));
  }

  async getCommunityTopic(id: string): Promise<CommunityTopic | undefined> {
    const [result] = await this.db
      .select()
      .from(communityTopics)
      .where(eq(communityTopics.id, id));
    return result;
  }

  async createCommunityTopic(topic: InsertCommunityTopic, tx?: Tx): Promise<CommunityTopic> {
    const db = (tx || this.db) as any;
    const [result] = await db.insert(communityTopics).values(topic).returning();
    return result;
  }

  async updateCommunityTopic(id: string, updates: Partial<InsertCommunityTopic>, tx?: Tx): Promise<CommunityTopic | undefined> {
    const db = (tx || this.db) as any;
    const [result] = await db
      .update(communityTopics)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(communityTopics.id, id))
      .returning();
    return result;
  }

  // --- Submissions ---

  async getTopicSubmissions(topicId: string): Promise<TopicSubmission[]> {
    return await this.db
      .select()
      .from(topicSubmissions)
      .where(eq(topicSubmissions.topicId, topicId))
      .orderBy(desc(topicSubmissions.createdAt));
  }

  async getTopicSubmission(topicId: string, userId: string): Promise<TopicSubmission | undefined> {
    const [result] = await this.db
      .select()
      .from(topicSubmissions)
      .where(and(
        eq(topicSubmissions.topicId, topicId),
        eq(topicSubmissions.userId, userId)
      ));
    return result;
  }

  async getUserSubmissions(userId: string): Promise<TopicSubmission[]> {
    return await this.db
      .select()
      .from(topicSubmissions)
      .where(eq(topicSubmissions.userId, userId))
      .orderBy(desc(topicSubmissions.createdAt));
  }

  async createTopicSubmission(submission: InsertTopicSubmission, tx?: Tx): Promise<TopicSubmission> {
    const db = (tx || this.db) as any;
    const [result] = await db.insert(topicSubmissions).values(submission).returning();
    return result;
  }

  async markSubmissionReviewed(id: string, reviewerId: string, tx?: Tx): Promise<TopicSubmission | undefined> {
    const db = (tx || this.db) as any;
    const [result] = await db
      .update(topicSubmissions)
      .set({ isReviewed: true, reviewedById: reviewerId, reviewedAt: new Date() })
      .where(eq(topicSubmissions.id, id))
      .returning();
    return result;
  }

  // --- Join Requests ---

  async getJoinRequests(communityId: string): Promise<JoinRequest[]> {
    return await this.db
      .select()
      .from(joinRequests)
      .where(and(
        eq(joinRequests.communityId, communityId),
        eq(joinRequests.status, 'pending')
      ))
      .orderBy(desc(joinRequests.createdAt));
  }

  async getJoinRequest(communityId: string, userId: string): Promise<JoinRequest | undefined> {
    const [result] = await this.db
      .select()
      .from(joinRequests)
      .where(and(
        eq(joinRequests.communityId, communityId),
        eq(joinRequests.userId, userId)
      ));
    return result;
  }

  async getUserPendingJoinRequests(userId: string): Promise<JoinRequest[]> {
    return await this.db
      .select()
      .from(joinRequests)
      .where(and(
        eq(joinRequests.userId, userId),
        eq(joinRequests.status, 'pending')
      ))
      .orderBy(desc(joinRequests.createdAt));
  }

  async createJoinRequest(request: InsertJoinRequest, tx?: Tx): Promise<JoinRequest> {
    const db = (tx || this.db) as any;
    const [result] = await db.insert(joinRequests).values(request).returning();
    return result;
  }

  async updateJoinRequest(id: string, updates: { status: string; respondedAt: Date; respondedById: string }, tx?: Tx): Promise<JoinRequest | undefined> {
    const db = (tx || this.db) as any;
    const [result] = await db
      .update(joinRequests)
      .set(updates)
      .where(eq(joinRequests.id, id))
      .returning();
    return result;
  }
}