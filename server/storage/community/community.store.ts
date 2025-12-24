import { type Tx } from "../types";
import { 
  type Community, type InsertCommunity,
  type CommunityMember, type InsertCommunityMember,
  type CommunityTopic, type InsertCommunityTopic,
  type TopicSubmission, type InsertTopicSubmission,
  type JoinRequest, type InsertJoinRequest
} from "@shared/schema";

export interface ICommunityStore {
  // --- Communities ---
  getCommunities(): Promise<Community[]>;
  getCommunity(id: string): Promise<Community | undefined>;
  createCommunity(community: InsertCommunity, tx?: Tx): Promise<Community>;
  updateCommunity(id: string, updates: Partial<InsertCommunity>, tx?: Tx): Promise<Community | undefined>;
  deleteCommunity(id: string): Promise<boolean>;
  
  // Atualização de Contador de Membros (Atômico)
  updateMemberCount(communityId: string, delta: number, tx?: Tx): Promise<void>;

  // --- Members ---
  getCommunityMembers(communityId: string): Promise<CommunityMember[]>;
  getCommunityMember(communityId: string, userId: string): Promise<CommunityMember | undefined>;
  getUserCommunities(userId: string): Promise<CommunityMember[]>;
  // Agora apenas insere (a lógica de verificar existência e incrementar vai para o Service)
  addMember(member: InsertCommunityMember, tx?: Tx): Promise<CommunityMember>;
  removeMember(communityId: string, userId: string, tx?: Tx): Promise<boolean>;
  updateMemberRole(communityId: string, userId: string, role: string, tx?: Tx): Promise<CommunityMember | undefined>;

  // --- Topics ---
  getCommunityTopics(communityId: string): Promise<CommunityTopic[]>;
  getCommunityTopic(id: string): Promise<CommunityTopic | undefined>;
  createCommunityTopic(topic: InsertCommunityTopic): Promise<CommunityTopic>;
  updateCommunityTopic(id: string, updates: Partial<InsertCommunityTopic>): Promise<CommunityTopic | undefined>;

  // --- Submissions ---
  getTopicSubmissions(topicId: string): Promise<TopicSubmission[]>;
  getTopicSubmission(topicId: string, userId: string): Promise<TopicSubmission | undefined>;
  getUserSubmissions(userId: string): Promise<TopicSubmission[]>;
  createTopicSubmission(submission: InsertTopicSubmission, tx?: Tx): Promise<TopicSubmission>;
  markSubmissionReviewed(id: string, reviewerId: string, tx?: Tx): Promise<TopicSubmission | undefined>;

  // --- Join Requests ---
  getJoinRequests(communityId: string): Promise<JoinRequest[]>;
  getJoinRequest(communityId: string, userId: string): Promise<JoinRequest | undefined>;
  getUserPendingJoinRequests(userId: string): Promise<JoinRequest[]>;
  createJoinRequest(request: InsertJoinRequest): Promise<JoinRequest>;
  updateJoinRequest(id: string, updates: { status: string; respondedAt: Date; respondedById: string }, tx?: Tx): Promise<JoinRequest | undefined>;
}