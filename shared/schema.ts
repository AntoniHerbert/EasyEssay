import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, timestamp, jsonb, integer, pgEnum, index, uniqueIndex, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Essay Types
export const ESSAY_TYPES = [
  'argumentative',
  'narrative',
  'descriptive',
  'expository',
  'persuasive',
  'compare_contrast',
  'analytical',
  'reflective',
] as const;

export type EssayType = typeof ESSAY_TYPES[number];

export const essayTypeLabels: Record<EssayType, string> = {
  argumentative: 'Argumentative',
  narrative: 'Narrative',
  descriptive: 'Descriptive',
  expository: 'Expository',
  persuasive: 'Persuasive',
  compare_contrast: 'Compare & Contrast',
  analytical: 'Analytical',
  reflective: 'Reflective',
};

// Users table for authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username", { length: 50 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const rubricCategorySchema = z.object({
  name: z.string(),
  maxScore: z.number(),
  description: z.string().optional(),
});

export type RubricCategory = z.infer<typeof rubricCategorySchema>;

export const essays = pgTable("essays", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  authorId: varchar("author_id").notNull(),
  authorName: text("author_name").notNull(),
  wordCount: integer("word_count").notNull().default(0),
  isPublic: boolean("is_public").notNull().default(false),
  isAnalyzed: boolean("is_analyzed").notNull().default(false),
  rubric: jsonb("rubric").$type<RubricCategory[]>(),
  rubricName: text("rubric_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  reviewCount: integer("review_count").notNull().default(0),
  averageScore: integer("average_score").notNull().default(0),
}, (table) => {
  return {
    byAuthorPagination: index("essay_author_date_idx").on(table.authorId, table.createdAt),

    byPublicPagination: index("essay_public_date_idx").on(table.isPublic, table.createdAt),
    
  };
});

export const essayLikes = pgTable("essay_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  essayId: varchar("essay_id").notNull(),
  userId: varchar("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueLike: unique("unique_user_essay_like").on(table.userId, table.essayId),
}));

export const inspirations = pgTable("inspirations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  author: text("author").notNull(),
  content: text("content").notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(),
  source: text("source"), 
  tags: text("tags").array().default([]),
  difficulty: varchar("difficulty", { length: 20 }).notNull().default("intermediate"),
  wordCount: integer("word_count").notNull().default(0),
  readTime: integer("read_time").notNull().default(5),
  isPublic: boolean("is_public").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userProfiles = pgTable("user_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  displayName: text("display_name").notNull(),
  bio: text("bio"),
  avatar: text("avatar"), 
  totalEssays: integer("total_essays").notNull().default(0),
  totalWords: integer("total_words").notNull().default(0),
  averageScore: integer("average_score").notNull().default(0),
  streak: integer("streak").notNull().default(0), 
  level: integer("level").notNull().default(1),
  experience: integer("experience").notNull().default(0),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  lastActiveAt: timestamp("last_active_at").defaultNow().notNull(),
}, (table) => {
  return {
    displayNameIdx: index("profile_display_name_idx").on(table.displayName),
    
    rankingIdx: index("profile_ranking_idx").on(table.totalEssays, table.id),  };
});

export const friendships = pgTable("friendships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requesterId: varchar("requester_id").notNull(),
  addresseeId: varchar("addressee_id").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"), 
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userMessages = pgTable("user_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromUserId: varchar("from_user_id").notNull(),
  toUserId: varchar("to_user_id").notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 20 }).notNull().default("text"), 
  relatedEssayId: varchar("related_essay_id"), 
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertEssaySchema = createInsertSchema(essays).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEssayLikeSchema = createInsertSchema(essayLikes).omit({
  id: true,
  createdAt: true,
});

export const insertInspirationSchema = createInsertSchema(inspirations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({
  id: true,
  joinedAt: true,
  lastActiveAt: true,
});

export const insertFriendshipSchema = createInsertSchema(friendships).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserMessageSchema = createInsertSchema(userMessages).omit({
  id: true,
  createdAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Essay = typeof essays.$inferSelect;
export type InsertEssay = z.infer<typeof insertEssaySchema>;
export type EssayLike = typeof essayLikes.$inferSelect;
export type InsertEssayLike = z.infer<typeof insertEssayLikeSchema>;
export type Inspiration = typeof inspirations.$inferSelect;
export type InsertInspiration = z.infer<typeof insertInspirationSchema>;
export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type Friendship = typeof friendships.$inferSelect;
export type InsertFriendship = z.infer<typeof insertFriendshipSchema>;
export type UserMessage = typeof userMessages.$inferSelect;
export type InsertUserMessage = z.infer<typeof insertUserMessageSchema>;


export const reviewCategoriesEnum = pgEnum('review_category', [
  'grammar',
  'style', 
  'clarity',
  'structure',
  'content',
  'research'
]);


export const correctionSchema = z.object({
  category: z.enum(['grammar', 'style', 'clarity', 'structure', 'content', 'research']),
  selectedText: z.string(),
  textStartIndex: z.number(),
  textEndIndex: z.number(),
  comment: z.string(),
});

export type CorrectionObject = z.infer<typeof correctionSchema>;

export const rubricScoreSchema = z.object({
  categoryName: z.string(),
  score: z.number(),
  maxScore: z.number(),
  feedback: z.string().optional(),
});

export type RubricScore = z.infer<typeof rubricScoreSchema>;

export const peerReviews = pgTable('peer_reviews', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  essayId: varchar('essay_id').notNull(),
  reviewerId: varchar('reviewer_id').notNull(),
  grammarScore: integer('grammar_score').notNull().default(100), 
  styleScore: integer('style_score').notNull().default(100), 
  clarityScore: integer('clarity_score').notNull().default(100), 
  structureScore: integer('structure_score').notNull().default(100), 
  contentScore: integer('content_score').notNull().default(100), 
  researchScore: integer('research_score').notNull().default(100), 
  overallScore: integer('overall_score').notNull().default(600), 
  rubricScores: jsonb('rubric_scores').$type<RubricScore[]>(),
  corrections: jsonb('corrections').$type<CorrectionObject[]>().notNull().default([]),
  reviewComment: text('review_comment'),
  isSubmitted: boolean('is_submitted').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    essayPagingIdx: index("review_essay_paging_idx").on(table.essayId, table.createdAt),
    
    uniqueReviewer: uniqueIndex("unique_essay_reviewer").on(table.essayId, table.reviewerId),
  };
});

export const insertPeerReviewSchema = createInsertSchema(peerReviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type PeerReview = typeof peerReviews.$inferSelect;

export type PeerReviewWithProfile = PeerReview & {
  reviewerName: string | null;
};

export type InsertPeerReview = z.infer<typeof insertPeerReviewSchema>;

export type ReviewCategory = 'grammar' | 'style' | 'clarity' | 'structure' | 'content' | 'research';


export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = insertUserSchema.omit({ id: true, createdAt: true, passwordHash: true }).extend({
  password: z.string(),
  username: z.string(),
  displayName: z.string().min(1, "Display name is required"),
  bio: z.string().optional(),
});

export const createFriendshipSchema = insertFriendshipSchema.omit({ 
  id: true, requesterId: true, status: true, createdAt: true, updatedAt: true 
});

export const updateFriendshipSchema = z.object({
  status: z.enum(["accepted", "rejected"]), 
});

export const createMessageSchema = insertUserMessageSchema.omit({ 
  id: true, fromUserId: true, isRead: true, createdAt: true 
});

export const createEssayDTO = insertEssaySchema.omit({ authorId: true, authorName: true });
export const updateEssayDTO = createEssayDTO.partial();

export const createEssayPayload = insertEssaySchema.omit({
    authorId: true,
    authorName: true
})

export const createProfileSchema = insertUserProfileSchema.omit({ userId: true, id: true, joinedAt: true, lastActiveAt: true });
export const updateProfileSchema = insertUserProfileSchema.partial();

export const updatePeerReviewSchema = insertPeerReviewSchema.partial();

export const addCorrectionSchema = correctionSchema; 

export type CreateProfileInput = z.infer<typeof createProfileSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdatePeerReviewInput = z.infer<typeof updatePeerReviewSchema>;
export type AddCorrectionInput = z.infer<typeof addCorrectionSchema>;

export type CreateEssayInput = z.infer<typeof createEssayPayload>;
export type UpdateEssayInput = Partial<CreateEssayInput>;

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateFriendshipInput = z.infer<typeof createFriendshipSchema>;
export type UpdateFriendshipInput = z.infer<typeof updateFriendshipSchema>;
export type CreateMessageInput = z.infer<typeof createMessageSchema>;

export type CreatePeerReviewInput = Omit<InsertPeerReview, 'id' | 'createdAt' | 'updatedAt' | 'essayId' | 'reviewerId'>;

export type UserProfileWithAuth = typeof userProfiles.$inferSelect & { username: string };

export const peerReviewLikes = pgTable('peer_review_likes', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  reviewId: varchar('review_id').notNull(),
  userId: varchar('user_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const insertPeerReviewLikeSchema = createInsertSchema(peerReviewLikes).omit({
  id: true,
  createdAt: true,
});

export type PeerReviewLike = typeof peerReviewLikes.$inferSelect;
export type InsertPeerReviewLike = z.infer<typeof insertPeerReviewLikeSchema>;

export const communities = pgTable('communities', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  code: varchar('code', { length: 8 }).notNull().unique(), 
  name: text('name').notNull(),
  description: text('description'),
  leaderId: varchar('leader_id').notNull(),
  leaderName: text('leader_name').notNull(),
  memberCount: integer('member_count').notNull().default(1),
  isPublic: boolean('is_public').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const communityMembers = pgTable('community_members', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  communityId: varchar('community_id').notNull(),
  userId: varchar('user_id').notNull(),
  username: text('username').notNull(),
  role: varchar('role', { length: 20 }).notNull().default('member'), 
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
});

export const communityTopics = pgTable('community_topics', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  communityId: varchar('community_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  createdById: varchar('created_by_id').notNull(),
  createdByName: text('created_by_name').notNull(),
  deadline: timestamp('deadline'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const topicSubmissions = pgTable('topic_submissions', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  topicId: varchar('topic_id').notNull(),
  essayId: varchar('essay_id').notNull(),
  userId: varchar('user_id').notNull(),
  username: text('username').notNull(),
  isReviewed: boolean('is_reviewed').notNull().default(false),
  reviewedById: varchar('reviewed_by_id'),
  reviewedAt: timestamp('reviewed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const joinRequests = pgTable('join_requests', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  communityId: varchar('community_id').notNull(),
  userId: varchar('user_id').notNull(),
  username: text('username').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'), 
  createdAt: timestamp('created_at').defaultNow().notNull(),
  respondedAt: timestamp('responded_at'),
  respondedById: varchar('responded_by_id'),
});

export const insertCommunitySchema = createInsertSchema(communities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  memberCount: true,
});

export const insertCommunityMemberSchema = createInsertSchema(communityMembers).omit({
  id: true,
  joinedAt: true,
});

export const insertCommunityTopicSchema = createInsertSchema(communityTopics).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTopicSubmissionSchema = createInsertSchema(topicSubmissions).omit({
  id: true,
  createdAt: true,
  isReviewed: true,
  reviewedById: true,
  reviewedAt: true,
});

export const insertJoinRequestSchema = createInsertSchema(joinRequests).omit({
  id: true,
  createdAt: true,
  status: true,
  respondedAt: true,
  respondedById: true,
});

export type Community = typeof communities.$inferSelect;
export type InsertCommunity = z.infer<typeof insertCommunitySchema>;
export type CommunityMember = typeof communityMembers.$inferSelect;
export type InsertCommunityMember = z.infer<typeof insertCommunityMemberSchema>;
export type CommunityTopic = typeof communityTopics.$inferSelect;
export type InsertCommunityTopic = z.infer<typeof insertCommunityTopicSchema>;
export type TopicSubmission = typeof topicSubmissions.$inferSelect;
export type InsertTopicSubmission = z.infer<typeof insertTopicSubmissionSchema>;
export type JoinRequest = typeof joinRequests.$inferSelect;
export type InsertJoinRequest = z.infer<typeof insertJoinRequestSchema>;

export const exploreContentTypeEnum = pgEnum('explore_content_type', [
  'category_list',
  'essay_topic',
  'quote',
  'template'
]);

export const categoryItemSchema = z.object({
  name: z.string(),
  maxScore: z.number().min(1).max(200),
});

export const categoryListPayloadSchema = z.object({
  categories: z.array(categoryItemSchema).min(1),
});

export const essayTopicPayloadSchema = z.object({
  description: z.string().optional(),
});

export const quotePayloadSchema = z.object({
  author: z.string(),
  source: z.string().optional(),
});

export const templatePayloadSchema = z.object({
  templateContent: z.string(),
  gapMarkers: z.array(z.object({
    placeholder: z.string(),
    hint: z.string().optional(),
  })),
});

export const explorePayloadSchema = z.union([
  categoryListPayloadSchema,
  essayTopicPayloadSchema,
  quotePayloadSchema,
  templatePayloadSchema,
]);

export type CategoryItem = z.infer<typeof categoryItemSchema>;
export type CategoryListPayload = z.infer<typeof categoryListPayloadSchema>;
export type EssayTopicPayload = z.infer<typeof essayTopicPayloadSchema>;
export type QuotePayload = z.infer<typeof quotePayloadSchema>;
export type TemplatePayload = z.infer<typeof templatePayloadSchema>;
export type ExplorePayload = z.infer<typeof explorePayloadSchema>;

export const exploreItems = pgTable('explore_items', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  type: exploreContentTypeEnum('type').notNull(),
  title: text('title').notNull(),
  subtitle: text('subtitle'),
  authorId: varchar('author_id').notNull(),
  authorName: text('author_name').notNull(),
  payload: jsonb('payload').$type<ExplorePayload>().notNull(),
  likesCount: integer('likes_count').notNull().default(0),
  savesCount: integer('saves_count').notNull().default(0),
  isFeatured: boolean('is_featured').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const exploreLikes = pgTable('explore_likes', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  exploreItemId: varchar('explore_item_id').notNull(),
  userId: varchar('user_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const exploreSaves = pgTable('explore_saves', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  exploreItemId: varchar('explore_item_id').notNull(),
  userId: varchar('user_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const insertExploreItemSchema = createInsertSchema(exploreItems).omit({
  id: true,
  createdAt: true,
  likesCount: true,
  savesCount: true,
});

export const insertExploreLikeSchema = createInsertSchema(exploreLikes).omit({
  id: true,
  createdAt: true,
});

export const insertExploreSaveSchema = createInsertSchema(exploreSaves).omit({
  id: true,
  createdAt: true,
});

export interface EnrichedEssay extends Essay {
  communityId: string | null;
  communityName: string | null;
  topicTitle: string | null;
}

export type ExploreItem = typeof exploreItems.$inferSelect;
export type InsertExploreItem = z.infer<typeof insertExploreItemSchema>;
export type ExploreLike = typeof exploreLikes.$inferSelect;
export type InsertExploreLike = z.infer<typeof insertExploreLikeSchema>;
export type ExploreSave = typeof exploreSaves.$inferSelect;
export type InsertExploreSave = z.infer<typeof insertExploreSaveSchema>;

export type ExploreContentType = 'category_list' | 'essay_topic' | 'quote' | 'template';