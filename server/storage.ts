import { type Essay, type InsertEssay, type UserCorrection, type InsertUserCorrection, type EssayLike, type InsertEssayLike, type Inspiration, type InsertInspiration, type UserProfile, type InsertUserProfile, type Friendship, type InsertFriendship, type UserMessage, type InsertUserMessage, type PeerReview, type InsertPeerReview, type CorrectionObject, type User, type InsertUser } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {

  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getEssay(id: string): Promise<Essay | undefined>;
  getEssays(isPublic?: boolean, authorId?: string): Promise<Essay[]>;
  createEssay(essay: InsertEssay): Promise<Essay>;
  updateEssay(id: string, updates: Partial<InsertEssay>): Promise<Essay | undefined>;
  deleteEssay(id: string): Promise<boolean>;

  getUserCorrections(essayId: string): Promise<UserCorrection[]>;
  createUserCorrection(correction: InsertUserCorrection): Promise<UserCorrection>;
  updateUserCorrection(id: string, updates: Partial<InsertUserCorrection>): Promise<UserCorrection | undefined>;

  getEssayLikes(essayId: string): Promise<EssayLike[]>;
  createEssayLike(like: InsertEssayLike): Promise<EssayLike>;
  deleteEssayLike(essayId: string, userId: string): Promise<boolean>;
  isEssayLiked(essayId: string, userId: string): Promise<boolean>;

  getInspirations(category?: string, type?: string): Promise<Inspiration[]>;
  getInspiration(id: string): Promise<Inspiration | undefined>;
  createInspiration(inspiration: InsertInspiration): Promise<Inspiration>;
  updateInspiration(id: string, updates: Partial<InsertInspiration>): Promise<Inspiration | undefined>;


  getAllUsers(): Promise<UserProfile[]>;
  getUserProfile(userId: string): Promise<UserProfile | undefined>;
  createUserProfile(profile: InsertUserProfile): Promise<UserProfile>;
  updateUserProfile(userId: string, updates: Partial<InsertUserProfile>): Promise<UserProfile | undefined>;

  getFriendships(userId: string, status?: string): Promise<Friendship[]>;
  createFriendship(friendship: InsertFriendship): Promise<Friendship>;
  updateFriendship(id: string, updates: Partial<InsertFriendship>): Promise<Friendship | undefined>;

  getUserMessages(userId: string, unreadOnly?: boolean): Promise<UserMessage[]>;
  createUserMessage(message: InsertUserMessage): Promise<UserMessage>;
  markMessageAsRead(id: string): Promise<UserMessage | undefined>;

  getPeerReviews(essayId: string): Promise<PeerReview[]>;
  getPeerReview(essayId: string, reviewerId: string): Promise<PeerReview | undefined>;
  getPeerReviewById(id: string): Promise<PeerReview | undefined>;
  createPeerReview(review: InsertPeerReview): Promise<PeerReview>;
  updatePeerReview(id: string, updates: Partial<InsertPeerReview>): Promise<PeerReview | undefined>;
  addCorrectionToReview(reviewId: string, correction: CorrectionObject): Promise<PeerReview | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private essays: Map<string, Essay>;
  private userCorrections: Map<string, UserCorrection>;
  private essayLikes: Map<string, EssayLike>;
  private inspirations: Map<string, Inspiration>;
  private userProfiles: Map<string, UserProfile>;
  private friendships: Map<string, Friendship>;
  private userMessages: Map<string, UserMessage>;
  private peerReviews: Map<string, PeerReview>;

  constructor() {
    this.users = new Map();
    this.essays = new Map();
    this.userCorrections = new Map();
    this.essayLikes = new Map();
    this.inspirations = new Map();
    this.userProfiles = new Map();
    this.friendships = new Map();
    this.userMessages = new Map();
    this.peerReviews = new Map();
    this.seedInspirations();
    this.seedMockData();
  }


  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }


  async getEssay(id: string): Promise<Essay | undefined> {
    return this.essays.get(id);
  }

  async getEssays(isPublic?: boolean, authorId?: string): Promise<Essay[]> {
    const allEssays = Array.from(this.essays.values());
    return allEssays.filter(essay => {
      if (isPublic !== undefined && essay.isPublic !== isPublic) return false;
      if (authorId && essay.authorId !== authorId) return false;
      return true;
    }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async createEssay(insertEssay: InsertEssay): Promise<Essay> {
    const id = randomUUID();
    const now = new Date();
    const essay: Essay = {
      ...insertEssay,
      id,
      createdAt: now,
      updatedAt: now,
      isPublic: insertEssay.isPublic ?? false,
      wordCount: insertEssay.wordCount ?? 0,
      isAnalyzed: insertEssay.isAnalyzed ?? false,
    };
    this.essays.set(id, essay);
    return essay;
  }

  async updateEssay(id: string, updates: Partial<InsertEssay>): Promise<Essay | undefined> {
    const essay = this.essays.get(id);
    if (!essay) return undefined;

    const updatedEssay: Essay = {
      ...essay,
      ...updates,
      updatedAt: new Date(),
    };
    this.essays.set(id, updatedEssay);
    return updatedEssay;
  }

  async deleteEssay(id: string): Promise<boolean> {
    return this.essays.delete(id);
  }


  async getUserCorrections(essayId: string): Promise<UserCorrection[]> {
    return Array.from(this.userCorrections.values())
      .filter(correction => correction.essayId === essayId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createUserCorrection(insertUserCorrection: InsertUserCorrection): Promise<UserCorrection> {
    const id = randomUUID();
    const userCorrection: UserCorrection = {
      ...insertUserCorrection,
      id,
      likes: 0,
      createdAt: new Date(),
    };
    this.userCorrections.set(id, userCorrection);
    return userCorrection;
  }

  async updateUserCorrection(id: string, updates: Partial<InsertUserCorrection>): Promise<UserCorrection | undefined> {
    const userCorrection = this.userCorrections.get(id);
    if (!userCorrection) return undefined;

    const updatedUserCorrection: UserCorrection = {
      ...userCorrection,
      ...updates,
    };
    this.userCorrections.set(id, updatedUserCorrection);
    return updatedUserCorrection;
  }


  async getEssayLikes(essayId: string): Promise<EssayLike[]> {
    return Array.from(this.essayLikes.values())
      .filter(like => like.essayId === essayId);
  }

  async createEssayLike(insertEssayLike: InsertEssayLike): Promise<EssayLike> {
    const id = randomUUID();
    const like: EssayLike = {
      ...insertEssayLike,
      id,
      createdAt: new Date(),
    };
    this.essayLikes.set(id, like);
    return like;
  }

  async deleteEssayLike(essayId: string, userId: string): Promise<boolean> {
    const likeEntry = Array.from(this.essayLikes.entries())
      .find(([_, like]) => like.essayId === essayId && like.userId === userId);
    
    if (likeEntry) {
      this.essayLikes.delete(likeEntry[0]);
      return true;
    }
    return false;
  }

  async isEssayLiked(essayId: string, userId: string): Promise<boolean> {
    return Array.from(this.essayLikes.values())
      .some(like => like.essayId === essayId && like.userId === userId);
  }


  async getInspirations(category?: string, type?: string): Promise<Inspiration[]> {
    const allInspirations = Array.from(this.inspirations.values());
    return allInspirations.filter(inspiration => {
      if (category && inspiration.category !== category) return false;
      if (type && inspiration.type !== type) return false;
      return inspiration.isPublic;
    }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async getInspiration(id: string): Promise<Inspiration | undefined> {
    return this.inspirations.get(id);
  }

  async createInspiration(insertInspiration: InsertInspiration): Promise<Inspiration> {
    const id = randomUUID();
    const now = new Date();
    const inspiration: Inspiration = {
      ...insertInspiration,
      id,
      createdAt: now,
      updatedAt: now,
      isPublic: insertInspiration.isPublic ?? true,
      wordCount: insertInspiration.wordCount ?? 0,
      readTime: insertInspiration.readTime ?? 5,
      tags: insertInspiration.tags ?? [],
      source: insertInspiration.source ?? null,
      difficulty: insertInspiration.difficulty ?? "intermediate",
    };
    this.inspirations.set(id, inspiration);
    return inspiration;
  }

  async updateInspiration(id: string, updates: Partial<InsertInspiration>): Promise<Inspiration | undefined> {
    const inspiration = this.inspirations.get(id);
    if (!inspiration) return undefined;

    const updatedInspiration: Inspiration = {
      ...inspiration,
      ...updates,
      updatedAt: new Date(),
    };
    this.inspirations.set(id, updatedInspiration);
    return updatedInspiration;
  }

  
  async getAllUsers(): Promise<UserProfile[]> {
    return Array.from(this.userProfiles.values())
      .sort((a, b) => b.totalEssays - a.totalEssays); 
  }

  async getUserProfile(userId: string): Promise<UserProfile | undefined> {
    return Array.from(this.userProfiles.values())
      .find(profile => profile.userId === userId);
  }

  async createUserProfile(insertUserProfile: InsertUserProfile): Promise<UserProfile> {
    const id = randomUUID();
    const now = new Date();
    const profile: UserProfile = {
      ...insertUserProfile,
      id,
      joinedAt: now,
      lastActiveAt: now,
      totalEssays: insertUserProfile.totalEssays ?? 0,
      totalWords: insertUserProfile.totalWords ?? 0,
      averageScore: insertUserProfile.averageScore ?? 0,
      streak: insertUserProfile.streak ?? 0,
      level: insertUserProfile.level ?? 1,
      experience: insertUserProfile.experience ?? 0,
      bio: insertUserProfile.bio ?? null,
      avatar: insertUserProfile.avatar ?? null,
    };
    this.userProfiles.set(id, profile);
    return profile;
  }

  async updateUserProfile(userId: string, updates: Partial<InsertUserProfile>): Promise<UserProfile | undefined> {
    const profile = Array.from(this.userProfiles.values())
      .find(p => p.userId === userId);
    if (!profile) return undefined;

    const updatedProfile: UserProfile = {
      ...profile,
      ...updates,
      lastActiveAt: new Date(),
    };
    this.userProfiles.set(profile.id, updatedProfile);
    return updatedProfile;
  }

  async getFriendships(userId: string, status?: string): Promise<Friendship[]> {
    return Array.from(this.friendships.values())
      .filter(friendship => {
        const isUserInvolved = friendship.requesterId === userId || friendship.addresseeId === userId;
        if (!isUserInvolved) return false;
        if (status && friendship.status !== status) return false;
        return true;
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async createFriendship(insertFriendship: InsertFriendship): Promise<Friendship> {
    const id = randomUUID();
    const now = new Date();
    const friendship: Friendship = {
      ...insertFriendship,
      id,
      createdAt: now,
      updatedAt: now,
      status: insertFriendship.status ?? "pending",
    };
    this.friendships.set(id, friendship);
    return friendship;
  }

  async updateFriendship(id: string, updates: Partial<InsertFriendship>): Promise<Friendship | undefined> {
    const friendship = this.friendships.get(id);
    if (!friendship) return undefined;

    const updatedFriendship: Friendship = {
      ...friendship,
      ...updates,
      updatedAt: new Date(),
    };
    this.friendships.set(id, updatedFriendship);
    return updatedFriendship;
  }

  
  async getUserMessages(userId: string, unreadOnly?: boolean): Promise<UserMessage[]> {
    return Array.from(this.userMessages.values())
      .filter(message => {
    
        const isInvolved = message.toUserId === userId || message.fromUserId === userId;
        if (!isInvolved) return false;

        if (unreadOnly && (message.toUserId !== userId || message.isRead)) return false;
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createUserMessage(insertUserMessage: InsertUserMessage): Promise<UserMessage> {
    const id = randomUUID();
    const message: UserMessage = {
      ...insertUserMessage,
      id,
      createdAt: new Date(),
      isRead: insertUserMessage.isRead ?? false,
      type: insertUserMessage.type ?? "text",
      relatedEssayId: insertUserMessage.relatedEssayId ?? null,
    };
    this.userMessages.set(id, message);
    return message;
  }

  async markMessageAsRead(id: string): Promise<UserMessage | undefined> {
    const message = this.userMessages.get(id);
    if (!message) return undefined;

    const updatedMessage: UserMessage = {
      ...message,
      isRead: true,
    };
    this.userMessages.set(id, updatedMessage);
    return updatedMessage;
  }


  async getPeerReviews(essayId: string): Promise<PeerReview[]> {
    return Array.from(this.peerReviews.values()).filter(r => r.essayId === essayId);
  }

  async getPeerReview(essayId: string, reviewerId: string): Promise<PeerReview | undefined> {
    return Array.from(this.peerReviews.values()).find(
      r => r.essayId === essayId && r.reviewerId === reviewerId
    );
  }

  async getPeerReviewById(id: string): Promise<PeerReview | undefined> {
    return this.peerReviews.get(id);
  }

  async createPeerReview(review: InsertPeerReview): Promise<PeerReview> {
    const newReview: PeerReview = {
      id: randomUUID(),
      ...review,
      grammarScore: review.grammarScore ?? 100,
      styleScore: review.styleScore ?? 100,
      clarityScore: review.clarityScore ?? 100,
      structureScore: review.structureScore ?? 100,
      contentScore: review.contentScore ?? 100,
      researchScore: review.researchScore ?? 100,
      overallScore: review.overallScore ?? 600,
      corrections: (review.corrections ?? []) as CorrectionObject[],
      reviewComment: review.reviewComment ?? null,
      isSubmitted: review.isSubmitted ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.peerReviews.set(newReview.id, newReview);
    return newReview;
  }

  async updatePeerReview(id: string, updates: Partial<InsertPeerReview>): Promise<PeerReview | undefined> {
    const review = this.peerReviews.get(id);
    if (review) {
      const updatedReview: PeerReview = { 
        ...review, 
        ...updates,
        corrections: (updates.corrections ?? review.corrections) as CorrectionObject[],
        updatedAt: new Date() 
      };
      this.peerReviews.set(id, updatedReview);
      return updatedReview;
    }
    return undefined;
  }

  async addCorrectionToReview(reviewId: string, correction: CorrectionObject): Promise<PeerReview | undefined> {
    const review = this.peerReviews.get(reviewId);
    if (review) {
      const updatedReview: PeerReview = {
        ...review,
        corrections: [...review.corrections, correction] as CorrectionObject[],
        updatedAt: new Date()
      };
      this.peerReviews.set(reviewId, updatedReview);
      return updatedReview;
    }
    return undefined;
  }

  private seedInspirations() {
    const inspirationsData = [
      {
        title: "On the Art of Writing",
        author: "Arthur Quiller-Couch",
        content: `The best writing is not about the writer—it is about the reader. When you sit down to write, your goal is not to show how clever you are, but to help your reader understand something important. Clear prose is the result of clear thinking, and clear thinking comes from understanding your subject deeply and caring about your reader genuinely. 

Every word must earn its place. Every sentence must advance your argument or deepen your reader's understanding. Precision in language reflects precision in thought, and precision in thought leads to powerful communication.

Remember that writing is thinking made visible. When you struggle to write clearly, you are really struggling to think clearly. The difficulty is not in your pen—it is in your mind. Wrestle with your ideas until they submit to clarity, and then your words will flow with purpose and power.`,
        category: "literature",
        type: "excerpt",
        source: "On the Art of Writing (1916)",
        tags: ["writing craft", "clarity", "communication"],
        difficulty: "intermediate",
        wordCount: 150,
        readTime: 2,
        isPublic: true,
      },
      {
        title: "The Power of Scientific Thinking",
        author: "Carl Sagan",
        content: `Science is not only compatible with spirituality; it is a profound source of spirituality. When we recognize our place in an immensity of light-years and in the passage of ages, when we grasp the intricacy, beauty, and subtlety of life, then that soaring feeling, that sense of elation and humility combined, is surely spiritual.

The notion that science and spirituality are somehow mutually exclusive does a disservice to both. Science is not only about cold, hard facts—it's about wonder, about awe, about the incredible interconnectedness of all things. The more we learn about the universe, the more we realize how much we don't know, and that realization should fill us with humility and curiosity, not fear.`,
        category: "science",
        type: "excerpt",
        source: "The Demon-Haunted World",
        tags: ["science", "spirituality", "wonder", "universe"],
        difficulty: "intermediate",
        wordCount: 130,
        readTime: 2,
        isPublic: true,
      },
      {
        title: "The Examined Life",
        author: "Socrates",
        content: `The unexamined life is not worth living. This famous declaration from my defense in Athens speaks to the core of human existence. We must constantly question our beliefs, our actions, and our assumptions. Only through rigorous self-examination can we hope to live a life of meaning and virtue.

Wisdom begins with knowing that we know nothing. The moment we think we have all the answers is the moment we stop growing, stop learning, stop becoming better human beings. True knowledge is understanding the limits of our knowledge.

I have spent my life as a gadfly, stinging the lazy horse of Athens into action, forcing people to think about their lives and their choices. This is not comfortable work, neither for me nor for those I question. But comfort is not the goal—truth is the goal, and truth requires courage.`,
        category: "philosophy",
        type: "excerpt",
        source: "Plato's Apology",
        tags: ["wisdom", "self-knowledge", "virtue", "truth"],
        difficulty: "advanced",
        wordCount: 160,
        readTime: 2,
        isPublic: true,
      },
      {
        title: "The Digital Revolution",
        author: "Tim Berners-Lee",
        content: `The original idea of the web was that it should be a collaborative space where you could communicate through sharing information. The dream behind the Web is of a common information space in which we communicate by sharing information.

What we have today is not quite that vision. We have created a world wide web, but in many ways it has become a world wide surveillance system. The power of the web lies not in its technology, but in its ability to connect human beings and allow them to work together in ways that were never before possible.

We must reclaim the web as a force for good, as a tool for human empowerment rather than human exploitation. This requires not just technological solutions, but social and political ones as well. The future of the web is the future of democracy itself.`,
        category: "technology",
        type: "excerpt",
        source: "Weaving the Web",
        tags: ["internet", "technology", "democracy", "collaboration"],
        difficulty: "intermediate",
        wordCount: 140,
        readTime: 2,
        isPublic: true,
      },
      {
        title: "Climate Change and Human Responsibility",
        author: "Elizabeth Kolbert",
        content: `We are living through the sixth mass extinction, and this time, we are the asteroid. The rate of species loss today is estimated to be between 1,000 and 10,000 times higher than the natural background rate. Unlike the five previous mass extinctions, this one is entirely of our own making.

Climate change is not just about polar bears or melting ice caps—it's about the fundamental systems that make life on Earth possible. When we alter the chemistry of the atmosphere and the oceans, we are conducting a vast experiment with the only planet we have.

The challenge is not just technological or economic—it's moral. We have a responsibility to future generations to leave them a world that is at least as rich and vibrant as the one we inherited. This requires unprecedented cooperation and sacrifice, but the alternative is unthinkable.`,
        category: "environment",
        type: "excerpt",
        source: "The Sixth Extinction",
        tags: ["climate change", "extinction", "environment", "responsibility"],
        difficulty: "intermediate",
        wordCount: 150,
        readTime: 2,
        isPublic: true,
      },
    ];

    inspirationsData.forEach(async (data) => {
      await this.createInspiration(data);
    });
  }

  private async seedMockData() {

  }
}

import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import { eq, and, or, desc } from "drizzle-orm";
import * as schema from "@shared/schema";


export class DbStorage implements IStorage {
  private db;

  constructor() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    this.db = drizzle(pool, { schema });
    this.seedInspirations();
  }

  private async seedInspirations() {
    const existing = await this.db.select().from(schema.inspirations).limit(1);
    if (existing.length > 0) return;

    const inspirationsData: InsertInspiration[] = [
      {
        title: "On the Art of Writing",
        author: "Stephen King",
        content: `The scariest moment is always just before you start. After that, things can only get better. Writing is magic, as much the water of life as any other creative art. The water is free. So drink. Drink and be filled up.

When you write a story, you're telling yourself the story. When you rewrite, your main job is taking out all the things that are not the story. Your stuff starts out being just for you, but then it goes out. Once you know what the story is and get it right — as right as you can, anyway — it belongs to anyone who wants to read it. Or criticize it.

The real importance of reading is that it creates an ease and intimacy with the process of writing; one comes to the country of the writer with one's papers and identification pretty much in order. The only way to do it is to do it, and the only way to get better at it is to do it more.`,
        category: "literature",
        type: "excerpt",
        source: "On Writing: A Memoir of the Craft",
        tags: ["writing", "creativity", "craft", "inspiration"],
        difficulty: "intermediate",
        wordCount: 180,
        readTime: 2,
        isPublic: true,
      },
      {
        title: "The Power of Observation",
        author: "Maya Angelou",
        content: `There is no greater agony than bearing an untold story inside you. I've learned that people will forget what you said, people will forget what you did, but people will never forget how you made them feel.

To be able to write, one must be a reader. And when you read, you should be observing the world through a different lens. Every person you meet, every place you visit, every moment you experience—these are the raw materials of your writing. The writer who observes the world with honesty and compassion will always have something valuable to say.

Writing is an act of courage. It requires vulnerability, a willingness to expose oneself to judgment and criticism. But it is also an act of generosity—you are sharing a piece of yourself with the world.`,
        category: "literature",
        type: "excerpt",
        source: "The Heart of a Woman",
        tags: ["observation", "empathy", "courage", "storytelling"],
        difficulty: "intermediate",
        wordCount: 150,
        readTime: 2,
        isPublic: true,
      },
      {
        title: "The Scientific Method",
        author: "Carl Sagan",
        content: `Science is not only compatible with spirituality; it is a profound source of spirituality. When we recognize our place in an immensity of light-years and in the passage of ages, when we grasp the intricacy, beauty, and subtlety of life, then that soaring feeling, that sense of elation and humility combined, is surely spiritual.

The notion that science and spirituality are somehow mutually exclusive does a disservice to both. Science is not only about cold, hard facts—it's about wonder, about awe, about the incredible interconnectedness of all things. The more we learn about the universe, the more we realize how much we don't know, and that realization should fill us with humility and curiosity, not fear.`,
        category: "science",
        type: "excerpt",
        source: "The Demon-Haunted World",
        tags: ["science", "spirituality", "wonder", "universe"],
        difficulty: "intermediate",
        wordCount: 130,
        readTime: 2,
        isPublic: true,
      },
      {
        title: "The Examined Life",
        author: "Socrates",
        content: `The unexamined life is not worth living. This famous declaration from my defense in Athens speaks to the core of human existence. We must constantly question our beliefs, our actions, and our assumptions. Only through rigorous self-examination can we hope to live a life of meaning and virtue.

Wisdom begins with knowing that we know nothing. The moment we think we have all the answers is the moment we stop growing, stop learning, stop becoming better human beings. True knowledge is understanding the limits of our knowledge.

I have spent my life as a gadfly, stinging the lazy horse of Athens into action, forcing people to think about their lives and their choices. This is not comfortable work, neither for me nor for those I question. But comfort is not the goal—truth is the goal, and truth requires courage.`,
        category: "philosophy",
        type: "excerpt",
        source: "Plato's Apology",
        tags: ["wisdom", "self-knowledge", "virtue", "truth"],
        difficulty: "advanced",
        wordCount: 160,
        readTime: 2,
        isPublic: true,
      },
      {
        title: "The Digital Revolution",
        author: "Tim Berners-Lee",
        content: `The original idea of the web was that it should be a collaborative space where you could communicate through sharing information. The dream behind the Web is of a common information space in which we communicate by sharing information.

What we have today is not quite that vision. We have created a world wide web, but in many ways it has become a world wide surveillance system. The power of the web lies not in its technology, but in its ability to connect human beings and allow them to work together in ways that were never before possible.

We must reclaim the web as a force for good, as a tool for human empowerment rather than human exploitation. This requires not just technological solutions, but social and political ones as well. The future of the web is the future of democracy itself.`,
        category: "technology",
        type: "excerpt",
        source: "Weaving the Web",
        tags: ["internet", "technology", "democracy", "collaboration"],
        difficulty: "intermediate",
        wordCount: 140,
        readTime: 2,
        isPublic: true,
      },
      {
        title: "Climate Change and Human Responsibility",
        author: "Elizabeth Kolbert",
        content: `We are living through the sixth mass extinction, and this time, we are the asteroid. The rate of species loss today is estimated to be between 1,000 and 10,000 times higher than the natural background rate. Unlike the five previous mass extinctions, this one is entirely of our own making.

Climate change is not just about polar bears or melting ice caps—it's about the fundamental systems that make life on Earth possible. When we alter the chemistry of the atmosphere and the oceans, we are conducting a vast experiment with the only planet we have.

The challenge is not just technological or economic—it's moral. We have a responsibility to future generations to leave them a world that is at least as rich and vibrant as the one we inherited. This requires unprecedented cooperation and sacrifice, but the alternative is unthinkable.`,
        category: "environment",
        type: "excerpt",
        source: "The Sixth Extinction",
        tags: ["climate change", "extinction", "environment", "responsibility"],
        difficulty: "intermediate",
        wordCount: 150,
        readTime: 2,
        isPublic: true,
      },
    ];

    for (const data of inspirationsData) {
      await this.createInspiration(data);
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    const result = await this.db.select().from(schema.users).where(eq(schema.users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(schema.users).where(eq(schema.users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await this.db.insert(schema.users).values(insertUser).returning();
    return result[0];
  }

  async getEssay(id: string): Promise<Essay | undefined> {
    const result = await this.db.select().from(schema.essays).where(eq(schema.essays.id, id));
    return result[0];
  }

  async getEssays(isPublic?: boolean, authorId?: string): Promise<Essay[]> {
    let query = this.db.select().from(schema.essays);
    
    const conditions = [];
    if (isPublic !== undefined) {
      conditions.push(eq(schema.essays.isPublic, isPublic));
    }
    if (authorId) {
      conditions.push(eq(schema.essays.authorId, authorId));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    const result = await query.orderBy(desc(schema.essays.updatedAt));
    return result;
  }

  async createEssay(insertEssay: InsertEssay): Promise<Essay> {
    const result = await this.db.insert(schema.essays).values(insertEssay).returning();
    return result[0];
  }

  async updateEssay(id: string, updates: Partial<InsertEssay>): Promise<Essay | undefined> {
    const result = await this.db
      .update(schema.essays)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schema.essays.id, id))
      .returning();
    return result[0];
  }

  async deleteEssay(id: string): Promise<boolean> {
    const result = await this.db.delete(schema.essays).where(eq(schema.essays.id, id)).returning();
    return result.length > 0;
  }

  async getUserCorrections(essayId: string): Promise<UserCorrection[]> {
    const result = await this.db
      .select()
      .from(schema.userCorrections)
      .where(eq(schema.userCorrections.essayId, essayId));
    return result;
  }

  async createUserCorrection(correction: InsertUserCorrection): Promise<UserCorrection> {
    const result = await this.db.insert(schema.userCorrections).values(correction).returning();
    return result[0];
  }

  async updateUserCorrection(id: string, updates: Partial<InsertUserCorrection>): Promise<UserCorrection | undefined> {
    const result = await this.db
      .update(schema.userCorrections)
      .set(updates)
      .where(eq(schema.userCorrections.id, id))
      .returning();
    return result[0];
  }

  async getEssayLikes(essayId: string): Promise<EssayLike[]> {
    const result = await this.db
      .select()
      .from(schema.essayLikes)
      .where(eq(schema.essayLikes.essayId, essayId));
    return result;
  }

  async createEssayLike(like: InsertEssayLike): Promise<EssayLike> {
    const result = await this.db.insert(schema.essayLikes).values(like).returning();
    return result[0];
  }

  async deleteEssayLike(essayId: string, userId: string): Promise<boolean> {
    const result = await this.db
      .delete(schema.essayLikes)
      .where(and(
        eq(schema.essayLikes.essayId, essayId),
        eq(schema.essayLikes.userId, userId)
      ))
      .returning();
    return result.length > 0;
  }

  async isEssayLiked(essayId: string, userId: string): Promise<boolean> {
    const result = await this.db
      .select()
      .from(schema.essayLikes)
      .where(and(
        eq(schema.essayLikes.essayId, essayId),
        eq(schema.essayLikes.userId, userId)
      ));
    return result.length > 0;
  }

  async getInspirations(category?: string, type?: string): Promise<Inspiration[]> {
    let query = this.db.select().from(schema.inspirations);
    
    const conditions = [];
    if (category) {
      conditions.push(eq(schema.inspirations.category, category));
    }
    if (type) {
      conditions.push(eq(schema.inspirations.type, type));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    const result = await query;
    return result;
  }

  async getInspiration(id: string): Promise<Inspiration | undefined> {
    const result = await this.db.select().from(schema.inspirations).where(eq(schema.inspirations.id, id));
    return result[0];
  }

  async createInspiration(inspiration: InsertInspiration): Promise<Inspiration> {
    const result = await this.db.insert(schema.inspirations).values(inspiration).returning();
    return result[0];
  }

  async updateInspiration(id: string, updates: Partial<InsertInspiration>): Promise<Inspiration | undefined> {
    const result = await this.db
      .update(schema.inspirations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schema.inspirations.id, id))
      .returning();
    return result[0];
  }

  async getAllUsers(): Promise<UserProfile[]> {
    const result = await this.db.select().from(schema.userProfiles);
    return result;
  }

  async getUserProfile(userId: string): Promise<UserProfile | undefined> {
    const result = await this.db
      .select()
      .from(schema.userProfiles)
      .where(eq(schema.userProfiles.userId, userId));
    return result[0];
  }

  async createUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
    const result = await this.db.insert(schema.userProfiles).values(profile).returning();
    return result[0];
  }

  async updateUserProfile(userId: string, updates: Partial<InsertUserProfile>): Promise<UserProfile | undefined> {
    const result = await this.db
      .update(schema.userProfiles)
      .set({ ...updates, lastActiveAt: new Date() })
      .where(eq(schema.userProfiles.userId, userId))
      .returning();
    return result[0];
  }

  async getFriendships(userId: string, status?: string): Promise<Friendship[]> {
    const conditions = [
      or(
        eq(schema.friendships.requesterId, userId),
        eq(schema.friendships.addresseeId, userId)
      )
    ];
    
    if (status) {
      conditions.push(eq(schema.friendships.status, status));
    }
    
    const result = await this.db
      .select()
      .from(schema.friendships)
      .where(and(...conditions));
    return result;
  }

  async createFriendship(friendship: InsertFriendship): Promise<Friendship> {
    const result = await this.db.insert(schema.friendships).values(friendship).returning();
    return result[0];
  }

  async updateFriendship(id: string, updates: Partial<InsertFriendship>): Promise<Friendship | undefined> {
    const result = await this.db
      .update(schema.friendships)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schema.friendships.id, id))
      .returning();
    return result[0];
  }

  async getUserMessages(userId: string, unreadOnly?: boolean): Promise<UserMessage[]> {
    const conditions = [
      or(
        eq(schema.userMessages.fromUserId, userId),
        eq(schema.userMessages.toUserId, userId)
      )
    ];
    
    if (unreadOnly) {
      conditions.push(eq(schema.userMessages.toUserId, userId));
      conditions.push(eq(schema.userMessages.isRead, false));
    }
    
    const result = await this.db
      .select()
      .from(schema.userMessages)
      .where(and(...conditions))
      .orderBy(desc(schema.userMessages.createdAt));
    return result;
  }

  async createUserMessage(message: InsertUserMessage): Promise<UserMessage> {
    const result = await this.db.insert(schema.userMessages).values(message).returning();
    return result[0];
  }

  async markMessageAsRead(id: string): Promise<UserMessage | undefined> {
    const result = await this.db
      .update(schema.userMessages)
      .set({ isRead: true })
      .where(eq(schema.userMessages.id, id))
      .returning();
    return result[0];
  }


  async getPeerReviews(essayId: string): Promise<PeerReview[]> {
    const result = await this.db
      .select()
      .from(schema.peerReviews)
      .where(eq(schema.peerReviews.essayId, essayId))
      .orderBy(desc(schema.peerReviews.createdAt));
    return result;
  }

  async getPeerReview(essayId: string, reviewerId: string): Promise<PeerReview | undefined> {
    const result = await this.db
      .select()
      .from(schema.peerReviews)
      .where(and(
        eq(schema.peerReviews.essayId, essayId),
        eq(schema.peerReviews.reviewerId, reviewerId)
      ));
    return result[0];
  }

  async getPeerReviewById(id: string): Promise<PeerReview | undefined> {
    const result = await this.db
      .select()
      .from(schema.peerReviews)
      .where(eq(schema.peerReviews.id, id));
    return result[0];
  }

  async createPeerReview(review: InsertPeerReview): Promise<PeerReview> {
    const result = await this.db.insert(schema.peerReviews).values(review as any).returning();
    return result[0];
  }

  async updatePeerReview(id: string, updates: Partial<InsertPeerReview>): Promise<PeerReview | undefined> {
    const result = await this.db
      .update(schema.peerReviews)
      .set({ ...updates, updatedAt: new Date() } as any)
      .where(eq(schema.peerReviews.id, id))
      .returning();
    return result[0];
  }

  async addCorrectionToReview(reviewId: string, correction: CorrectionObject): Promise<PeerReview | undefined> {
    const review = await this.getPeerReviewById(reviewId);
    if (!review) return undefined;
    
    const corrections = [...(review.corrections as CorrectionObject[] || []), correction];
    const result = await this.db
      .update(schema.peerReviews)
      .set({ corrections: corrections as any, updatedAt: new Date() })
      .where(eq(schema.peerReviews.id, reviewId))
      .returning();
    return result[0];
  }
}

export const storage = new DbStorage();
