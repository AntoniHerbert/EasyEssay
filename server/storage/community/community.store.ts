import { type Community, type InsertCommunity, type CommunityMember, type InsertCommunityMember, type CommunityTopic, type InsertCommunityTopic, type TopicSubmission, type InsertTopicSubmission, type JoinRequest, type InsertJoinRequest } from "@shared/schema";
import { type Tx } from "../types";

export interface ICommunityStore {
  getCommunities(
    limit?: number,
    cursor?: Date,
    userId?: string, 
    searchQuery?: string
  ): Promise<Community[]>;

  getCommunity(id: string): Promise<Community | undefined>;
  createCommunity(community: InsertCommunity, tx?: Tx): Promise<Community>;
  updateCommunity(id: string, updates: Partial<InsertCommunity>, tx?: Tx): Promise<Community | undefined>;
  deleteCommunity(id: string, tx?: Tx): Promise<boolean>;
  updateMemberCount(communityId: string, delta: number, tx?: Tx): Promise<void>;

  getCommunityMembers(communityId: string): Promise<CommunityMember[]>;
  getCommunityMember(communityId: string, userId: string): Promise<CommunityMember | undefined>;
  getUserCommunities(userId: string): Promise<CommunityMember[]>;
  addMember(member: InsertCommunityMember, tx?: Tx): Promise<CommunityMember>;
  removeMember(communityId: string, userId: string, tx?: Tx): Promise<boolean>;
  updateMemberRole(communityId: string, userId: string, role: string, tx?: Tx): Promise<CommunityMember | undefined>;

  getCommunityTopics(communityId: string): Promise<CommunityTopic[]>;
  getCommunityTopic(id: string): Promise<CommunityTopic | undefined>;
  createCommunityTopic(topic: InsertCommunityTopic, tx?: Tx): Promise<CommunityTopic>;
  updateCommunityTopic(id: string, updates: Partial<InsertCommunityTopic>, tx?: Tx): Promise<CommunityTopic | undefined>;

  getTopicSubmissions(contextId: string, source?: 'community' | 'explore'): Promise<TopicSubmission[]>;
  getTopicSubmission(contextId: string, userId: string, source?: 'community' | 'explore'): Promise<TopicSubmission | undefined>;
  
  getUserSubmissions(userId: string): Promise<TopicSubmission[]>;
  createTopicSubmission(submission: InsertTopicSubmission, tx?: Tx): Promise<TopicSubmission>;
  markSubmissionReviewed(id: string, reviewerId: string, tx?: Tx): Promise<TopicSubmission | undefined>;

  getJoinRequests(communityId: string): Promise<JoinRequest[]>;
  getJoinRequest(communityId: string, userId: string): Promise<JoinRequest | undefined>;
  getUserPendingJoinRequests(userId: string): Promise<JoinRequest[]>;
  createJoinRequest(request: InsertJoinRequest, tx?: Tx): Promise<JoinRequest>;
  updateJoinRequest(id: string, updates: { status: string; respondedAt: Date; respondedById: string }, tx?: Tx): Promise<JoinRequest | undefined>;
}