import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, timestamp, jsonb, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";


export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username", { length: 50 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const essays = pgTable("essays", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  authorId: varchar("author_id").notNull(),
  authorName: text("author_name").notNull(),
  wordCount: integer("word_count").notNull().default(0),
  isPublic: boolean("is_public").notNull().default(false),
  isAnalyzed: boolean("is_analyzed").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userCorrections = pgTable("user_corrections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  essayId: varchar("essay_id").notNull(),
  userId: varchar("user_id").notNull(),
  userName: text("user_name").notNull(),
  originalText: text("original_text").notNull(),
  suggestedText: text("suggested_text").notNull(),
  explanation: text("explanation").notNull(),
  startIndex: integer("start_index").notNull(),
  endIndex: integer("end_index").notNull(),
  likes: integer("likes").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const essayLikes = pgTable("essay_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  essayId: varchar("essay_id").notNull(),
  userId: varchar("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

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
  username: text("username").notNull().unique(),
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

export const insertUserCorrectionSchema = createInsertSchema(userCorrections).omit({
  id: true,
  createdAt: true,
  likes: true,
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
export type UserCorrection = typeof userCorrections.$inferSelect;
export type InsertUserCorrection = z.infer<typeof insertUserCorrectionSchema>;
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
  corrections: jsonb('corrections').$type<CorrectionObject[]>().notNull().default([]),
  reviewComment: text('review_comment'),
  isSubmitted: boolean('is_submitted').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const insertPeerReviewSchema = createInsertSchema(peerReviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type PeerReview = typeof peerReviews.$inferSelect;
export type InsertPeerReview = z.infer<typeof insertPeerReviewSchema>;

export type ReviewCategory = 'grammar' | 'style' | 'clarity' | 'structure' | 'content' | 'research';
