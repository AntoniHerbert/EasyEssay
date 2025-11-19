import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { hashPassword, verifyPassword } from "./auth";
import { analyzeEssay } from "./services/openai";
import { getMockAIReview } from "./services/mock-analysis";
import { insertEssaySchema, insertUserCorrectionSchema, insertEssayLikeSchema, insertInspirationSchema, insertUserProfileSchema, insertFriendshipSchema, insertUserMessageSchema, insertPeerReviewSchema, correctionSchema } from "@shared/schema";
import { z } from "zod";
import "./types"; 

export async function registerRoutes(app: Express): Promise<Server> {
  

  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { username, password, displayName, bio } = req.body;
      
      if (!username || !password || !displayName) {
        return res.status(400).json({ message: "Username, password, and display name are required" });
      }

    
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" });
      }

    
      const passwordHash = await hashPassword(password);
      const user = await storage.createUser({ username, passwordHash });

  
      await storage.createUserProfile({
        userId: user.id,
        username,
        displayName,
        bio: bio || "",
      });

    
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


  app.post("/api/essays", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

  
      const userProfile = await storage.getUserProfile(req.session.userId);
      
      const essayData = insertEssaySchema.omit({ authorId: true, authorName: true }).parse(req.body);
      
    
      const wordCount = essayData.content.trim().split(/\s+/).filter(word => word.length > 0).length;
      
      const essay = await storage.createEssay({
        ...essayData,
        authorId: req.session.userId,
        authorName: userProfile?.displayName || "Anonymous",
        wordCount,
      });
      
    
      if (essay.isPublic) {
        console.log(`[Auto-Analysis] Starting auto-analysis for public essay: ${essay.id}`);
        try {
          const aiReview = getMockAIReview(essay.title, essay.content);
          console.log(`[Auto-Analysis] Generated mock AI review with ${aiReview.corrections.length} corrections`);
          
      
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
        } catch (aiError) {
          console.error("Failed to auto-analyze essay:", aiError);
        
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


  app.put("/api/essays/:id", async (req, res) => {
    try {
      const updates = insertEssaySchema.partial().parse(req.body);
      
    
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

  
  app.post("/api/essays/:id/analyze", async (req, res) => {
    try {
      const essay = await storage.getEssay(req.params.id);
      if (!essay) {
        return res.status(404).json({ message: "Essay not found" });
      }

    
      const aiReview = getMockAIReview(essay.title, essay.content);

      
      const existingAIReview = await storage.getPeerReview(essay.id, "AI");
      if (existingAIReview) {
        
        const updatedReview = await storage.updatePeerReview(existingAIReview.id, {
          grammarScore: aiReview.grammarScore,
          styleScore: aiReview.styleScore,
          clarityScore: aiReview.clarityScore,
          structureScore: aiReview.structureScore,
          contentScore: aiReview.contentScore,
          researchScore: aiReview.researchScore,
          overallScore: aiReview.overallScore,
          corrections: aiReview.corrections,
        });
        
      
        await storage.updateEssay(essay.id, { isAnalyzed: true, isPublic: true } );
        
        return res.json(updatedReview);
      }

      
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
        corrections: aiReview.corrections,
        isSubmitted: true, 
      });

    
      await storage.updateEssay(essay.id, { isAnalyzed: true });

      res.json(aiPeerReview);
    } catch (error) {
      console.error("Analysis error:", error);
      res.status(500).json({ message: "Failed to analyze essay: " + (error as Error).message });
    }
  });


  app.post("/api/essays/batch-analyze", async (req, res) => {
    try {
      const allEssays = await storage.getEssays(true); 
      const analyzedCount = { success: 0, failed: 0, skipped: 0 };
      
      for (const essay of allEssays) {
        
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


  app.get("/api/essays/:id/user-corrections", async (req, res) => {
    try {
      const userCorrections = await storage.getUserCorrections(req.params.id);
      res.json(userCorrections);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user corrections" });
    }
  });


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

  app.get("/api/essays/:id/likes", async (req, res) => {
    try {
      const likes = await storage.getEssayLikes(req.params.id);
      res.json({ count: likes.length });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch likes" });
    }
  });

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

  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

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

  app.get("/api/essays/:essayId/peer-reviews", async (req, res) => {
    try {
      const reviews = await storage.getPeerReviews(req.params.essayId);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch peer reviews" });
    }
  });

  app.post("/api/essays/:essayId/peer-reviews", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const reviewerId = req.session.userId;
      
      const essay = await storage.getEssay(req.params.essayId);
      if (!essay) {
        return res.status(404).json({ message: "Essay not found" });
      }
      
      if (essay.authorId === reviewerId) {
        return res.status(403).json({ message: "You cannot review your own essay" });
      }
      
      const existingReview = await storage.getPeerReview(req.params.essayId, reviewerId);
      if (existingReview) {
        return res.json(existingReview);
      }

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


  app.post("/api/peer-reviews/:id/corrections", async (req, res) => {
    try {
    
      const existingReview = await storage.getPeerReviewById(req.params.id);
      if (!existingReview) {
        return res.status(404).json({ message: "Review not found" });
      }
      if (existingReview.isSubmitted) {
        return res.status(400).json({ message: "Cannot add corrections to a submitted review" });
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

  return app;
}
