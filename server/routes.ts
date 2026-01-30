import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { hashPassword, verifyPassword } from "./auth";
import { analyzeEssay } from "./services/openai";
import { getMockAIReview } from "./services/mock-analysis";
import { insertEssaySchema, insertUserCorrectionSchema, insertEssayLikeSchema, insertInspirationSchema, insertUserProfileSchema, insertFriendshipSchema, insertUserMessageSchema, insertPeerReviewSchema, correctionSchema, insertCommunitySchema, insertCommunityMemberSchema, insertCommunityTopicSchema, insertTopicSubmissionSchema, insertExploreItemSchema, type ExploreContentType } from "@shared/schema";
import { z } from "zod";
import "./types"; // Load session type definitions

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Authentication Routes
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { username, password, displayName, bio } = req.body;
      
      if (!username || !password || !displayName) {
        return res.status(400).json({ message: "Username, password, and display name are required" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" });
      }

      // Hash password and create user
      const passwordHash = await hashPassword(password);
      const user = await storage.createUser({ username, passwordHash });

      // Create user profile
      await storage.createUserProfile({
        userId: user.id,
        username,
        displayName,
        bio: bio || "",
      });

      // Set session
      req.session.userId = user.id;
      
      res.status(201).json({ id: user.id, username: user.username });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      const isValid = await verifyPassword(user.passwordHash, password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      req.session.userId = user.id;
      res.json({ id: user.id, username: user.username });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Failed to log in" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to log out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ id: user.id, username: user.username });
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Get all essays (public or by author)
  app.get("/api/essays", async (req, res) => {
    try {
      const { isPublic, authorId } = req.query;
      const essays = await storage.getEssays(
        isPublic === "true" ? true : isPublic === "false" ? false : undefined,
        authorId as string
      );
      res.json(essays);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch essays" });
    }
  });

  // Get specific essay
  app.get("/api/essays/:id", async (req, res) => {
    try {
      const essay = await storage.getEssay(req.params.id);
      if (!essay) {
        return res.status(404).json({ message: "Essay not found" });
      }
      res.json(essay);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch essay" });
    }
  });

  // Get user's topic submissions with topic/community info
  app.get("/api/user/submissions", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const submissions = await storage.getUserSubmissions(req.session.userId);
      
      // Enrich submissions with topic and community info
      const enrichedSubmissions = await Promise.all(
        submissions.map(async (sub) => {
          const topic = await storage.getCommunityTopic(sub.topicId);
          let community = null;
          if (topic) {
            community = await storage.getCommunity(topic.communityId);
          }
          return {
            ...sub,
            topicTitle: topic?.title || "Unknown Topic",
            communityId: topic?.communityId || null,
            communityName: community?.name || "Unknown Community",
          };
        })
      );
      
      res.json(enrichedSubmissions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch submissions" });
    }
  });

  // Create new essay
  app.post("/api/essays", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // Get user profile for author name
      const userProfile = await storage.getUserProfile(req.session.userId);
      
      const essayData = insertEssaySchema.omit({ authorId: true, authorName: true }).parse(req.body);
      
      // Calculate word count
      const wordCount = essayData.content.trim().split(/\s+/).filter(word => word.length > 0).length;
      
      const essay = await storage.createEssay({
        ...essayData,
        authorId: req.session.userId,
        authorName: userProfile?.displayName || "Anonymous",
        wordCount,
      });
      
      // Auto-analyze public essays with mock AI review
      if (essay.isPublic) {
        console.log(`[Auto-Analysis] Starting auto-analysis for public essay: ${essay.id}`);
        try {
          // Pass rubric if the essay has one for custom scoring
          const aiReview = getMockAIReview(essay.title, essay.content, essay.rubric || undefined);
          console.log(`[Auto-Analysis] Generated mock AI review with ${aiReview.corrections.length} corrections`);
          
          // Create AI peer review with rubricScores if available
          await storage.createPeerReview({
            essayId: essay.id,
            reviewerId: "AI",
            grammarScore: aiReview.grammarScore,
            styleScore: aiReview.styleScore,
            clarityScore: aiReview.clarityScore,
            structureScore: aiReview.structureScore,
            contentScore: aiReview.contentScore,
            researchScore: aiReview.researchScore,
            overallScore: aiReview.overallScore,
            rubricScores: aiReview.rubricScores || null,
            corrections: aiReview.corrections,
            isSubmitted: true,
          });
          
          // Mark essay as analyzed
          await storage.updateEssay(essay.id, { isAnalyzed: true });
        } catch (aiError) {
          console.error("Failed to auto-analyze essay:", aiError);
          // Continue even if AI analysis fails - don't block essay creation
        }
      }
      
      res.status(201).json(essay);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid essay data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create essay" });
    }
  });

  // Update essay
  app.put("/api/essays/:id", async (req, res) => {
    try {
      const updates = insertEssaySchema.partial().parse(req.body);
      
      // Recalculate word count if content changed
      if (updates.content) {
        updates.wordCount = updates.content.trim().split(/\s+/).filter(word => word.length > 0).length;
      }
      
      const essay = await storage.updateEssay(req.params.id, updates);
      if (!essay) {
        return res.status(404).json({ message: "Essay not found" });
      }
      res.json(essay);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid essay data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update essay" });
    }
  });

  // Delete essay
  app.delete("/api/essays/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteEssay(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Essay not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete essay" });
    }
  });

  // Analyze essay with AI
  app.post("/api/essays/:id/analyze", async (req, res) => {
    try {
      const essay = await storage.getEssay(req.params.id);
      if (!essay) {
        return res.status(404).json({ message: "Essay not found" });
      }

      // Get AI analysis (using mock analysis to avoid API costs)
      // Pass rubric if the essay has one for custom scoring
      const aiReview = getMockAIReview(essay.title, essay.content, essay.rubric || undefined);

      // Delete existing AI review if any
      const existingAIReview = await storage.getPeerReview(essay.id, "AI");
      if (existingAIReview) {
        // Update existing AI review
        const updatedReview = await storage.updatePeerReview(existingAIReview.id, {
          grammarScore: aiReview.grammarScore,
          styleScore: aiReview.styleScore,
          clarityScore: aiReview.clarityScore,
          structureScore: aiReview.structureScore,
          contentScore: aiReview.contentScore,
          researchScore: aiReview.researchScore,
          overallScore: aiReview.overallScore,
          rubricScores: aiReview.rubricScores || null,
          corrections: aiReview.corrections,
        });
        
        // Mark essay as analyzed
        await storage.updateEssay(essay.id, { isAnalyzed: true });
        
        return res.json(updatedReview);
      }

      // Create new AI peer review
      const aiPeerReview = await storage.createPeerReview({
        essayId: essay.id,
        reviewerId: "AI",
        grammarScore: aiReview.grammarScore,
        styleScore: aiReview.styleScore,
        clarityScore: aiReview.clarityScore,
        structureScore: aiReview.structureScore,
        contentScore: aiReview.contentScore,
        researchScore: aiReview.researchScore,
        overallScore: aiReview.overallScore,
        rubricScores: aiReview.rubricScores || null,
        corrections: aiReview.corrections,
        isSubmitted: true, // AI reviews are automatically submitted
      });

      // Mark essay as analyzed
      await storage.updateEssay(essay.id, { isAnalyzed: true });

      res.json(aiPeerReview);
    } catch (error) {
      console.error("Analysis error:", error);
      res.status(500).json({ message: "Failed to analyze essay: " + (error as Error).message });
    }
  });

  // Batch analyze all public essays without AI reviews
  app.post("/api/essays/batch-analyze", async (req, res) => {
    try {
      const allEssays = await storage.getEssays(true); // Get all public essays
      const analyzedCount = { success: 0, failed: 0, skipped: 0 };
      
      for (const essay of allEssays) {
        // Check if essay already has an AI review
        const existingAIReview = await storage.getPeerReview(essay.id, "AI");
        if (existingAIReview) {
          analyzedCount.skipped++;
          continue;
        }
        
        try {
          const aiReview = getMockAIReview(essay.title, essay.content);
          
          await storage.createPeerReview({
            essayId: essay.id,
            reviewerId: "AI",
            grammarScore: aiReview.grammarScore,
            styleScore: aiReview.styleScore,
            clarityScore: aiReview.clarityScore,
            structureScore: aiReview.structureScore,
            contentScore: aiReview.contentScore,
            researchScore: aiReview.researchScore,
            overallScore: aiReview.overallScore,
            corrections: aiReview.corrections,
            isSubmitted: true,
          });
          
          await storage.updateEssay(essay.id, { isAnalyzed: true });
          analyzedCount.success++;
        } catch (error) {
          console.error(`Failed to analyze essay ${essay.id}:`, error);
          analyzedCount.failed++;
        }
      }
      
      res.json({
        message: "Batch analysis complete",
        total: allEssays.length,
        ...analyzedCount
      });
    } catch (error) {
      console.error("Batch analysis error:", error);
      res.status(500).json({ message: "Failed to batch analyze essays" });
    }
  });

  // Get user corrections for essay
  app.get("/api/essays/:id/user-corrections", async (req, res) => {
    try {
      const userCorrections = await storage.getUserCorrections(req.params.id);
      res.json(userCorrections);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user corrections" });
    }
  });

  // Create user correction
  app.post("/api/essays/:id/user-corrections", async (req, res) => {
    try {
      const correctionData = insertUserCorrectionSchema.parse({
        ...req.body,
        essayId: req.params.id,
      });
      
      const userCorrection = await storage.createUserCorrection(correctionData);
      res.status(201).json(userCorrection);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid correction data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user correction" });
    }
  });

  // Like/unlike essay
  app.post("/api/essays/:id/like", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const userId = req.session.userId;
      const isLiked = await storage.isEssayLiked(req.params.id, userId);
      
      if (isLiked) {
        await storage.deleteEssayLike(req.params.id, userId);
        res.json({ liked: false });
      } else {
        await storage.createEssayLike({
          essayId: req.params.id,
          userId,
        });
        res.json({ liked: true });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to toggle like" });
    }
  });

  // Get essay likes count
  app.get("/api/essays/:id/likes", async (req, res) => {
    try {
      const likes = await storage.getEssayLikes(req.params.id);
      res.json({ count: likes.length });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch likes" });
    }
  });

  // Inspirations routes
  app.get("/api/inspirations", async (req, res) => {
    try {
      const { category, type } = req.query;
      const inspirations = await storage.getInspirations(
        category as string,
        type as string
      );
      res.json(inspirations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch inspirations" });
    }
  });

  app.get("/api/inspirations/:id", async (req, res) => {
    try {
      const inspiration = await storage.getInspiration(req.params.id);
      if (!inspiration) {
        return res.status(404).json({ message: "Inspiration not found" });
      }
      res.json(inspiration);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch inspiration" });
    }
  });

  // Get all users for discovery
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // User profile routes
  app.get("/api/profile/:userId", async (req, res) => {
    try {
      const profile = await storage.getUserProfile(req.params.userId);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      res.json(profile);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.post("/api/profile", async (req, res) => {
    try {
      const profileData = insertUserProfileSchema.parse(req.body);
      const profile = await storage.createUserProfile(profileData);
      res.status(201).json(profile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid profile data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create profile" });
    }
  });

  app.put("/api/profile/:userId", async (req, res) => {
    try {
      const updates = insertUserProfileSchema.partial().parse(req.body);
      const profile = await storage.updateUserProfile(req.params.userId, updates);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      res.json(profile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid profile data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Friendships routes
  app.get("/api/friendships/:userId", async (req, res) => {
    try {
      const { status } = req.query;
      const friendships = await storage.getFriendships(req.params.userId, status as string);
      res.json(friendships);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch friendships" });
    }
  });

  app.post("/api/friendships", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const friendshipData = insertFriendshipSchema.omit({ requesterId: true }).parse(req.body);
      const friendship = await storage.createFriendship({
        ...friendshipData,
        requesterId: req.session.userId,
      });
      res.status(201).json(friendship);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid friendship data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create friendship" });
    }
  });

  app.put("/api/friendships/:id", async (req, res) => {
    try {
      const updates = insertFriendshipSchema.partial().parse(req.body);
      const friendship = await storage.updateFriendship(req.params.id, updates);
      if (!friendship) {
        return res.status(404).json({ message: "Friendship not found" });
      }
      res.json(friendship);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid friendship data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update friendship" });
    }
  });

  // Messages routes
  app.get("/api/messages/:userId", async (req, res) => {
    try {
      const { unreadOnly } = req.query;
      const messages = await storage.getUserMessages(
        req.params.userId,
        unreadOnly === "true"
      );
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/messages", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const messageData = insertUserMessageSchema.omit({ fromUserId: true }).parse(req.body);
      const message = await storage.createUserMessage({
        ...messageData,
        fromUserId: req.session.userId,
      });
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid message data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  app.patch("/api/messages/:id/read", async (req, res) => {
    try {
      const message = await storage.markMessageAsRead(req.params.id);
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }
      res.json(message);
    } catch (error) {
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });

  // Peer Review System Routes
  // Get peer reviews for an essay (which contain corrections)
  app.get("/api/essays/:essayId/peer-reviews", async (req, res) => {
    try {
      const reviews = await storage.getPeerReviews(req.params.essayId);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch peer reviews" });
    }
  });

  // Get or create a peer review for current user
  app.post("/api/essays/:essayId/peer-reviews", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const reviewerId = req.session.userId;
      
      // Get the essay to check ownership and rubric
      const essay = await storage.getEssay(req.params.essayId);
      if (!essay) {
        return res.status(404).json({ message: "Essay not found" });
      }
      
      // Prevent users from reviewing their own essays
      if (essay.authorId === reviewerId) {
        return res.status(403).json({ message: "You cannot review your own essay" });
      }
      
      // Check if review already exists for this user
      const existingReview = await storage.getPeerReview(req.params.essayId, reviewerId);
      if (existingReview) {
        return res.json(existingReview);
      }

      // Validate rubricScores if essay has a rubric
      const hasRubric = essay.rubric && essay.rubric.length > 0;
      if (hasRubric && req.body.rubricScores) {
        const rubricNames = new Set(essay.rubric!.map(r => r.name));
        for (const score of req.body.rubricScores) {
          if (!rubricNames.has(score.categoryName)) {
            return res.status(400).json({ 
              message: `Invalid rubric category: "${score.categoryName}". Must match essay rubric.` 
            });
          }
        }
      }

      // Create new review
      const reviewData = insertPeerReviewSchema.parse({
        ...req.body,
        reviewerId,
        essayId: req.params.essayId
      });
      const review = await storage.createPeerReview(reviewData);
      res.status(201).json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid review data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create peer review" });
    }
  });

  // Update a peer review (scores, comment)
  app.patch("/api/peer-reviews/:id", async (req, res) => {
    try {
      const updates = insertPeerReviewSchema.partial().parse(req.body);
      const review = await storage.updatePeerReview(req.params.id, updates);
      if (!review) {
        return res.status(404).json({ message: "Review not found" });
      }
      res.json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid review data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update peer review" });
    }
  });

  // Add a correction (comment) to a review
  app.post("/api/peer-reviews/:id/corrections", async (req, res) => {
    try {
      // Get existing review to check if it's submitted
      const existingReview = await storage.getPeerReviewById(req.params.id);
      if (!existingReview) {
        return res.status(404).json({ message: "Review not found" });
      }
      if (existingReview.isSubmitted) {
        return res.status(400).json({ message: "Cannot add corrections to a submitted review" });
      }

      // Get essay to validate category against rubric
      const essay = await storage.getEssay(existingReview.essayId);
      if (essay?.rubric && essay.rubric.length > 0) {
        const rubricNames = new Set(essay.rubric.map(r => r.name));
        if (!rubricNames.has(req.body.category)) {
          return res.status(400).json({ 
            message: `Invalid category: "${req.body.category}". Must match essay rubric.` 
          });
        }
      }

      const correctionData = correctionSchema.parse(req.body);
      const review = await storage.addCorrectionToReview(req.params.id, correctionData);
      if (!review) {
        return res.status(404).json({ message: "Review not found" });
      }
      res.json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid correction data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add correction" });
    }
  });

  // Peer Review Likes
  app.get("/api/peer-reviews/:id/likes", async (req, res) => {
    try {
      const likeCount = await storage.getPeerReviewLikeCount(req.params.id);
      let isLiked = false;
      if (req.session.userId) {
        isLiked = await storage.isPeerReviewLiked(req.params.id, req.session.userId);
      }
      res.json({ count: likeCount, isLiked });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch like count" });
    }
  });

  app.post("/api/peer-reviews/:id/likes", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const isNowLiked = await storage.togglePeerReviewLike(req.params.id, req.session.userId);
      const likeCount = await storage.getPeerReviewLikeCount(req.params.id);
      res.json({ isLiked: isNowLiked, count: likeCount });
    } catch (error) {
      res.status(500).json({ message: "Failed to toggle like" });
    }
  });

  // Communities Routes
  app.get("/api/communities", async (req, res) => {
    try {
      const communities = await storage.getCommunities();
      res.json(communities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch communities" });
    }
  });

  app.get("/api/communities/:id", async (req, res) => {
    try {
      const community = await storage.getCommunity(req.params.id);
      if (!community) {
        return res.status(404).json({ message: "Community not found" });
      }
      res.json(community);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch community" });
    }
  });

  app.post("/api/communities", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const userProfile = await storage.getUserProfile(req.session.userId);
      const communityData = insertCommunitySchema
        .omit({ leaderId: true, leaderName: true, code: true })
        .extend({ isPublic: z.boolean().optional().default(true) })
        .parse(req.body);
      
      // Generate a unique 6-character code
      const generateCode = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      };
      
      const community = await storage.createCommunity({
        ...communityData,
        code: generateCode(),
        leaderId: req.session.userId,
        leaderName: userProfile?.displayName || "Unknown",
      });

      // Add creator as leader member
      await storage.addCommunityMember({
        communityId: community.id,
        userId: req.session.userId,
        username: userProfile?.username || "unknown",
        role: "leader",
      });

      res.status(201).json(community);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid community data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create community" });
    }
  });

  app.put("/api/communities/:id", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const community = await storage.getCommunity(req.params.id);
      if (!community) {
        return res.status(404).json({ message: "Community not found" });
      }

      if (community.leaderId !== req.session.userId) {
        return res.status(403).json({ message: "Only the leader can update this community" });
      }

      const updates = insertCommunitySchema.partial().parse(req.body);
      const updated = await storage.updateCommunity(req.params.id, updates);
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid community data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update community" });
    }
  });

  app.delete("/api/communities/:id", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const community = await storage.getCommunity(req.params.id);
      if (!community) {
        return res.status(404).json({ message: "Community not found" });
      }

      if (community.leaderId !== req.session.userId) {
        return res.status(403).json({ message: "Only the leader can delete this community" });
      }

      await storage.deleteCommunity(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete community" });
    }
  });

  // Community Members Routes
  app.get("/api/communities/:id/members", async (req, res) => {
    try {
      const members = await storage.getCommunityMembers(req.params.id);
      res.json(members);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch members" });
    }
  });

  app.post("/api/communities/:id/join", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const community = await storage.getCommunity(req.params.id);
      if (!community) {
        return res.status(404).json({ message: "Community not found" });
      }

      const existingMember = await storage.getCommunityMember(req.params.id, req.session.userId);
      if (existingMember) {
        return res.status(400).json({ message: "Already a member of this community" });
      }

      const userProfile = await storage.getUserProfile(req.session.userId);
      
      // For private communities, create a join request instead of directly adding
      if (!community.isPublic) {
        // Check for existing pending request
        const existingRequest = await storage.getJoinRequest(req.params.id, req.session.userId);
        if (existingRequest && existingRequest.status === 'pending') {
          return res.status(400).json({ message: "Join request already pending" });
        }
        
        const joinRequest = await storage.createJoinRequest({
          communityId: req.params.id,
          userId: req.session.userId,
          username: userProfile?.username || "unknown",
        });
        
        return res.status(201).json({ type: 'request', request: joinRequest });
      }
      
      // For public communities, add directly
      const member = await storage.addCommunityMember({
        communityId: req.params.id,
        userId: req.session.userId,
        username: userProfile?.username || "unknown",
        role: "member",
      });

      res.status(201).json({ type: 'member', member });
    } catch (error) {
      console.error("Join community error:", error);
      res.status(500).json({ message: "Failed to join community" });
    }
  });
  
  // Get pending join requests for a community (leaders only)
  app.get("/api/communities/:id/join-requests", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const community = await storage.getCommunity(req.params.id);
      if (!community) {
        return res.status(404).json({ message: "Community not found" });
      }

      if (community.leaderId !== req.session.userId) {
        return res.status(403).json({ message: "Only the leader can view join requests" });
      }

      const requests = await storage.getJoinRequests(req.params.id);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch join requests" });
    }
  });
  
  // Approve a join request
  app.post("/api/communities/:id/join-requests/:requestId/approve", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const community = await storage.getCommunity(req.params.id);
      if (!community) {
        return res.status(404).json({ message: "Community not found" });
      }

      if (community.leaderId !== req.session.userId) {
        return res.status(403).json({ message: "Only the leader can approve requests" });
      }

      // Get the request first to check its current status
      const joinRequests = await storage.getJoinRequests(req.params.id);
      const requestToApprove = joinRequests.find(r => r.id === req.params.requestId);
      
      if (!requestToApprove) {
        return res.status(404).json({ message: "Request not found or already processed" });
      }
      
      // Check if user is already a member (prevent duplicate additions)
      const existingMember = await storage.getCommunityMember(req.params.id, requestToApprove.userId);
      if (existingMember) {
        // Just update the request status and return existing member
        await storage.updateJoinRequest(req.params.requestId, {
          status: 'approved',
          respondedAt: new Date(),
          respondedById: req.session.userId,
        });
        return res.json({ request: requestToApprove, member: existingMember, alreadyMember: true });
      }
      
      // Update the request status
      const updatedRequest = await storage.updateJoinRequest(req.params.requestId, {
        status: 'approved',
        respondedAt: new Date(),
        respondedById: req.session.userId,
      });

      if (!updatedRequest) {
        return res.status(404).json({ message: "Request not found" });
      }

      // Add the user as a member
      const member = await storage.addCommunityMember({
        communityId: req.params.id,
        userId: updatedRequest.userId,
        username: updatedRequest.username,
        role: "member",
      });

      res.json({ request: updatedRequest, member });
    } catch (error) {
      console.error("Approve request error:", error);
      res.status(500).json({ message: "Failed to approve request" });
    }
  });
  
  // Reject a join request
  app.post("/api/communities/:id/join-requests/:requestId/reject", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const community = await storage.getCommunity(req.params.id);
      if (!community) {
        return res.status(404).json({ message: "Community not found" });
      }

      if (community.leaderId !== req.session.userId) {
        return res.status(403).json({ message: "Only the leader can reject requests" });
      }

      const updatedRequest = await storage.updateJoinRequest(req.params.requestId, {
        status: 'rejected',
        respondedAt: new Date(),
        respondedById: req.session.userId,
      });

      if (!updatedRequest) {
        return res.status(404).json({ message: "Request not found" });
      }

      res.json(updatedRequest);
    } catch (error) {
      res.status(500).json({ message: "Failed to reject request" });
    }
  });

  app.post("/api/communities/:id/leave", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const community = await storage.getCommunity(req.params.id);
      if (!community) {
        return res.status(404).json({ message: "Community not found" });
      }

      if (community.leaderId === req.session.userId) {
        return res.status(400).json({ message: "Leaders cannot leave their community. Transfer leadership or delete the community." });
      }

      const removed = await storage.removeCommunityMember(req.params.id, req.session.userId);
      if (!removed) {
        return res.status(400).json({ message: "Not a member of this community" });
      }

      res.json({ message: "Left community successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to leave community" });
    }
  });

  // Promote member to leader
  app.post("/api/communities/:id/members/:userId/promote", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const community = await storage.getCommunity(req.params.id);
      if (!community) {
        return res.status(404).json({ message: "Community not found" });
      }

      // Check if requester is a leader
      const requesterMembership = await storage.getCommunityMember(req.params.id, req.session.userId);
      if (!requesterMembership || requesterMembership.role !== 'leader') {
        return res.status(403).json({ message: "Only leaders can promote members" });
      }

      // Check if target is a member
      const targetMembership = await storage.getCommunityMember(req.params.id, req.params.userId);
      if (!targetMembership) {
        return res.status(404).json({ message: "Member not found" });
      }

      if (targetMembership.role === 'leader') {
        return res.status(400).json({ message: "Member is already a leader" });
      }

      const updated = await storage.updateCommunityMemberRole(req.params.id, req.params.userId, 'leader');
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to promote member" });
    }
  });

  // Demote leader to member (only primary leader can demote)
  app.post("/api/communities/:id/members/:userId/demote", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const community = await storage.getCommunity(req.params.id);
      if (!community) {
        return res.status(404).json({ message: "Community not found" });
      }

      // Only the primary leader can demote other leaders
      if (community.leaderId !== req.session.userId) {
        return res.status(403).json({ message: "Only the primary leader can demote leaders" });
      }

      // Can't demote yourself as primary leader
      if (req.params.userId === req.session.userId) {
        return res.status(400).json({ message: "Cannot demote yourself. Transfer leadership first." });
      }

      const targetMembership = await storage.getCommunityMember(req.params.id, req.params.userId);
      if (!targetMembership) {
        return res.status(404).json({ message: "Member not found" });
      }

      if (targetMembership.role !== 'leader') {
        return res.status(400).json({ message: "Member is not a leader" });
      }

      const updated = await storage.updateCommunityMemberRole(req.params.id, req.params.userId, 'member');
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to demote leader" });
    }
  });

  // Transfer primary leadership to another member
  app.post("/api/communities/:id/transfer-leadership", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { newLeaderId } = req.body;
      if (!newLeaderId) {
        return res.status(400).json({ message: "New leader ID is required" });
      }

      const community = await storage.getCommunity(req.params.id);
      if (!community) {
        return res.status(404).json({ message: "Community not found" });
      }

      // Only the primary leader can transfer leadership
      if (community.leaderId !== req.session.userId) {
        return res.status(403).json({ message: "Only the primary leader can transfer leadership" });
      }

      // Check if new leader is a member
      const newLeaderMembership = await storage.getCommunityMember(req.params.id, newLeaderId);
      if (!newLeaderMembership) {
        return res.status(404).json({ message: "New leader is not a member of this community" });
      }

      // Get new leader's profile for the name
      const newLeaderProfile = await storage.getUserProfile(newLeaderId);

      // Ensure new leader has leader role
      await storage.updateCommunityMemberRole(req.params.id, newLeaderId, 'leader');

      // Demote old primary leader to regular member
      await storage.updateCommunityMemberRole(req.params.id, req.session.userId, 'member');

      // Update community with new primary leader
      const updatedCommunity = await storage.updateCommunity(req.params.id, {
        leaderId: newLeaderId,
        leaderName: newLeaderProfile?.displayName || "Unknown",
      });

      res.json(updatedCommunity);
    } catch (error) {
      res.status(500).json({ message: "Failed to transfer leadership" });
    }
  });

  app.get("/api/user/communities", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const memberships = await storage.getUserCommunities(req.session.userId);
      res.json(memberships);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user communities" });
    }
  });

  app.get("/api/user/pending-requests", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const pendingRequests = await storage.getUserPendingJoinRequests(req.session.userId);
      res.json(pendingRequests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending requests" });
    }
  });

  // Community Topics Routes
  app.get("/api/communities/:id/topics", async (req, res) => {
    try {
      const topics = await storage.getCommunityTopics(req.params.id);
      res.json(topics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch topics" });
    }
  });

  app.post("/api/communities/:id/topics", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const community = await storage.getCommunity(req.params.id);
      if (!community) {
        return res.status(404).json({ message: "Community not found" });
      }

      const member = await storage.getCommunityMember(req.params.id, req.session.userId);
      if (!member || member.role !== "leader") {
        return res.status(403).json({ message: "Only leaders can create topics" });
      }

      const userProfile = await storage.getUserProfile(req.session.userId);
      const { title, description, deadline } = req.body;
      
      const topic = await storage.createCommunityTopic({
        title,
        description: description || null,
        deadline: deadline ? new Date(deadline) : null,
        isActive: true,
        communityId: req.params.id,
        createdById: req.session.userId,
        createdByName: userProfile?.displayName || "Unknown",
      });

      res.status(201).json(topic);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid topic data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create topic" });
    }
  });

  app.get("/api/topics/:id", async (req, res) => {
    try {
      const topic = await storage.getCommunityTopic(req.params.id);
      if (!topic) {
        return res.status(404).json({ message: "Topic not found" });
      }
      res.json(topic);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch topic" });
    }
  });

  app.patch("/api/topics/:id", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const topic = await storage.getCommunityTopic(req.params.id);
      if (!topic) {
        return res.status(404).json({ message: "Topic not found" });
      }

      const member = await storage.getCommunityMember(topic.communityId, req.session.userId);
      if (!member || member.role !== "leader") {
        return res.status(403).json({ message: "Only leaders can update topics" });
      }

      const updates = insertCommunityTopicSchema.partial().parse(req.body);
      const updated = await storage.updateCommunityTopic(req.params.id, updates);
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid topic data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update topic" });
    }
  });

  // Topic Submissions Routes
  app.get("/api/topics/:id/submissions", async (req, res) => {
    try {
      const submissions = await storage.getTopicSubmissions(req.params.id);
      
      // Get the topic to find the community and leader
      const topic = await storage.getCommunityTopic(req.params.id);
      let leaderId: string | null = null;
      
      if (topic) {
        const members = await storage.getCommunityMembers(topic.communityId);
        const leader = members.find(m => m.role === 'leader');
        leaderId = leader?.userId || null;
      }
      
      // Enrich submissions with essay data and leader review status
      const enrichedSubmissions = await Promise.all(
        submissions.map(async (submission) => {
          // Get essay for word count
          const essay = await storage.getEssay(submission.essayId);
          
          // Check if leader has submitted a peer review for this essay
          let leaderReviewed = false;
          if (leaderId) {
            const peerReview = await storage.getPeerReview(submission.essayId, leaderId);
            leaderReviewed = !!(peerReview && peerReview.isSubmitted);
          }
          
          return {
            ...submission,
            essay: essay ? { id: essay.id, wordCount: essay.wordCount, title: essay.title } : null,
            isReviewed: leaderReviewed, // Override with actual review status
          };
        })
      );
      
      res.json(enrichedSubmissions);
    } catch (error) {
      console.error("Failed to fetch submissions:", error);
      res.status(500).json({ message: "Failed to fetch submissions" });
    }
  });

  app.post("/api/topics/:id/submissions", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const topic = await storage.getCommunityTopic(req.params.id);
      if (!topic) {
        return res.status(404).json({ message: "Topic not found" });
      }

      if (!topic.isActive) {
        return res.status(400).json({ message: "This topic is no longer accepting submissions" });
      }

      const member = await storage.getCommunityMember(topic.communityId, req.session.userId);
      if (!member) {
        return res.status(403).json({ message: "You must be a member of this community to submit" });
      }

      const existingSubmission = await storage.getTopicSubmission(req.params.id, req.session.userId);
      if (existingSubmission) {
        return res.status(400).json({ message: "You have already submitted to this topic" });
      }

      const userProfile = await storage.getUserProfile(req.session.userId);
      
      // Validate essay data using schema
      const essayInputSchema = insertEssaySchema.pick({ title: true, content: true });
      const essayInput = essayInputSchema.parse(req.body);
      
      // Calculate word count
      const wordCount = essayInput.content.trim().split(/\s+/).filter((word: string) => word.length > 0).length;
      
      // Create the essay first with validated data
      const essay = await storage.createEssay({
        title: essayInput.title,
        content: essayInput.content,
        authorId: req.session.userId,
        authorName: userProfile?.displayName || "Anonymous",
        wordCount,
        isPublic: false, // Topic submissions are private by default
      });
      
      // Create the submission with validated data
      const submissionInput = insertTopicSubmissionSchema.parse({
        essayId: essay.id,
        topicId: req.params.id,
        userId: req.session.userId,
        username: userProfile?.username || "unknown",
      });
      
      const submission = await storage.createTopicSubmission(submissionInput);

      res.status(201).json({ ...submission, essay });
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Topic submission validation error:", error.errors);
        return res.status(400).json({ message: "Invalid submission data", errors: error.errors });
      }
      console.error("Topic submission error:", error);
      res.status(500).json({ message: "Failed to create submission" });
    }
  });

  app.patch("/api/submissions/:id/review", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const submission = await storage.markSubmissionReviewed(req.params.id, req.session.userId);
      if (!submission) {
        return res.status(404).json({ message: "Submission not found" });
      }

      res.json(submission);
    } catch (error) {
      res.status(500).json({ message: "Failed to mark submission as reviewed" });
    }
  });

  // ===== Explore Items Routes =====
  
  // Get all explore items with optional filters
  app.get("/api/explore", async (req, res) => {
    try {
      const { type, authorId } = req.query;
      const items = await storage.getExploreItems(
        type as ExploreContentType | undefined,
        authorId as string | undefined
      );
      
      // If user is authenticated, include their like/save status
      if (req.session.userId) {
        const userSaves = await storage.getExploreSaves(req.session.userId);
        const savedIds = new Set(userSaves.map(s => s.exploreItemId));
        
        const itemsWithStatus = await Promise.all(items.map(async (item) => ({
          ...item,
          isLiked: await storage.isExploreLiked(item.id, req.session.userId!),
          isSaved: savedIds.has(item.id),
        })));
        
        return res.json(itemsWithStatus);
      }
      
      res.json(items);
    } catch (error) {
      console.error("Explore items error:", error);
      res.status(500).json({ message: "Failed to fetch explore items" });
    }
  });

  // Get user's saved explore items
  app.get("/api/explore/saved", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const saves = await storage.getExploreSaves(req.session.userId);
      const savedIds = saves.map(s => s.exploreItemId);
      
      // Get the actual items
      const allItems = await storage.getExploreItems();
      const savedItems = allItems.filter(item => savedIds.includes(item.id));
      
      const itemsWithStatus = await Promise.all(savedItems.map(async (item) => ({
        ...item,
        isLiked: await storage.isExploreLiked(item.id, req.session.userId!),
        isSaved: true,
      })));

      res.json(itemsWithStatus);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch saved items" });
    }
  });

  // Get single explore item
  app.get("/api/explore/:id", async (req, res) => {
    try {
      const item = await storage.getExploreItem(req.params.id);
      if (!item) {
        return res.status(404).json({ message: "Explore item not found" });
      }
      
      if (req.session.userId) {
        const isLiked = await storage.isExploreLiked(item.id, req.session.userId);
        const isSaved = await storage.isExploreSaved(item.id, req.session.userId);
        return res.json({ ...item, isLiked, isSaved });
      }
      
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch explore item" });
    }
  });

  // Create explore item
  app.post("/api/explore", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const userProfile = await storage.getUserProfile(req.session.userId);
      
      const itemData = insertExploreItemSchema.parse({
        ...req.body,
        authorId: req.session.userId,
        authorName: userProfile?.displayName || "Anonymous",
      });

      const item = await storage.createExploreItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Create explore item error:", error);
      res.status(500).json({ message: "Failed to create explore item" });
    }
  });

  // Delete explore item
  app.delete("/api/explore/:id", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const item = await storage.getExploreItem(req.params.id);
      if (!item) {
        return res.status(404).json({ message: "Explore item not found" });
      }
      
      if (item.authorId !== req.session.userId) {
        return res.status(403).json({ message: "Not authorized to delete this item" });
      }

      await storage.deleteExploreItem(req.params.id);
      res.json({ message: "Item deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete explore item" });
    }
  });

  // Toggle like on explore item
  app.post("/api/explore/:id/like", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const item = await storage.getExploreItem(req.params.id);
      if (!item) {
        return res.status(404).json({ message: "Explore item not found" });
      }

      const isLiked = await storage.toggleExploreLike(req.params.id, req.session.userId);
      res.json({ isLiked });
    } catch (error) {
      res.status(500).json({ message: "Failed to toggle like" });
    }
  });

  // Toggle save on explore item
  app.post("/api/explore/:id/save", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const item = await storage.getExploreItem(req.params.id);
      if (!item) {
        return res.status(404).json({ message: "Explore item not found" });
      }

      const isSaved = await storage.toggleExploreSave(req.params.id, req.session.userId);
      res.json({ isSaved });
    } catch (error) {
      res.status(500).json({ message: "Failed to toggle save" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
