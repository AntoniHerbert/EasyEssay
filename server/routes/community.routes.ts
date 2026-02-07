import { Router } from "express";
import { z } from "zod";
import { insertCommunitySchema, insertCommunityTopicSchema, insertEssaySchema } from "@shared/schema";
import { communityService } from "../services";

const router = Router();

// --- Communities ---

router.get("/communities", async (req, res) => {
  try {
    const { userId, limit, cursor, q } = req.query;

    const result = await communityService.getCommunities(
      userId as string,     
      limit as string,     
      cursor as string,     
      q as string            
    );
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch communities" });
  }
});

router.get("/communities/:id", async (req, res) => {
  try {
    const community = await communityService.getCommunity(req.params.id);
    if (!community) return res.status(404).json({ message: "Community not found" });
    res.json(community);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch community" });
  }
});

router.post("/communities", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ message: "Not authenticated" });
  try {
    const data = insertCommunitySchema
      .omit({ leaderId: true, leaderName: true, code: true })
      .extend({ isPublic: z.boolean().optional() })
      .parse(req.body);

    const community = await communityService.createCommunity(req.session.userId, data);
    res.status(201).json(community);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ errors: error.errors });
    res.status(500).json({ message: "Failed to create community" });
  }
});

router.put("/communities/:id", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ message: "Not authenticated" });
  try {
    const updates = insertCommunitySchema.partial().parse(req.body);
    const updated = await communityService.updateCommunity(req.params.id, req.session.userId, updates);
    res.json(updated);
  } catch (error: any) {
    if (error.message === "NOT_FOUND") return res.status(404).json({ message: "Community not found" });
    if (error.message === "FORBIDDEN") return res.status(403).json({ message: "Forbidden" });
    res.status(500).json({ message: "Failed to update community" });
  }
});

router.delete("/communities/:id", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ message: "Not authenticated" });
  try {
    await communityService.deleteCommunity(req.params.id, req.session.userId);
    res.status(204).send();
  } catch (error: any) {
    if (error.message === "NOT_FOUND") return res.status(404).json({ message: "Community not found" });
    if (error.message === "FORBIDDEN") return res.status(403).json({ message: "Forbidden" });
    res.status(500).json({ message: "Failed to delete community" });
  }
});

// --- Members ---

router.get("/communities/:id/members", async (req, res) => {
  try {
    const members = await communityService.getMembers(req.params.id);
    res.json(members);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch members" });
  }
});

router.post("/communities/:id/join", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ message: "Not authenticated" });
  try {
    const result = await communityService.joinCommunity(req.params.id, req.session.userId);
    res.status(201).json(result.type === 'request' 
      ? { type: 'request', request: result.result } 
      : { type: 'member', member: result.result });
  } catch (error: any) {
    if (error.message === "NOT_FOUND") return res.status(404).json({ message: "Community not found" });
    if (error.message === "ALREADY_MEMBER") return res.status(400).json({ message: "Already a member" });
    if (error.message === "REQUEST_PENDING") return res.status(400).json({ message: "Join request pending" });
    res.status(500).json({ message: "Failed to join community" });
  }
});

router.post("/communities/:id/leave", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ message: "Not authenticated" });
  try {
    await communityService.leaveCommunity(req.params.id, req.session.userId);
    res.json({ message: "Left community" });
  } catch (error: any) {
    if (error.message === "LEADER_CANNOT_LEAVE") return res.status(400).json({ message: "Leaders cannot leave. Transfer first." });
    if (error.message === "NOT_MEMBER") return res.status(400).json({ message: "Not a member" });
    res.status(500).json({ message: "Failed to leave" });
  }
});

router.post("/communities/:id/members/:userId/promote", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ message: "Not authenticated" });

  try {
    const updated = await communityService.updateMemberRole(
      req.params.id, 
      req.session.userId, 
      req.params.userId, 
      "leader"
    );
    res.json(updated);

  } catch (error: any) {
    if (error.message === "FORBIDDEN") {
      return res.status(403).json({ message: "Only leaders can promote members" });
    }
    if (error.message === "MEMBER_NOT_FOUND") {
      return res.status(404).json({ message: "Member not found" });
    }
    if (error.message === "NOT_FOUND") {
      return res.status(404).json({ message: "Community not found" });
    }
    res.status(500).json({ message: "Failed to promote member" });
  }
});

router.post("/communities/:id/members/:userId/demote", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ message: "Not authenticated" });

  try {
    const updated = await communityService.updateMemberRole(
      req.params.id, 
      req.session.userId, 
      req.params.userId, 
      "member"
    );
    res.json(updated);

  } catch (error: any) {
    if (error.message === "FORBIDDEN") {
      return res.status(403).json({ message: "Only leaders can demote members" });
    }
    if (error.message === "CANNOT_DEMOTE_OWNER") {
      return res.status(400).json({ message: "Cannot demote the community owner" });
    }
    if (error.message === "MEMBER_NOT_FOUND") {
      return res.status(404).json({ message: "Member not found" });
    }
    res.status(500).json({ message: "Failed to demote member" });
  }
});

router.post("/communities/:id/transfer-leadership", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ message: "Not authenticated" });
  try {
    const { newLeaderId } = req.body;
    const result = await communityService.transferLeadership(req.params.id, req.session.userId, newLeaderId);
    res.json(result);
  } catch (error: any) {
    if (error.message === "FORBIDDEN") return res.status(403).json({ message: "Forbidden" });
    if (error.message === "NEW_LEADER_NOT_MEMBER") return res.status(404).json({ message: "New leader must be a member" });
    res.status(500).json({ message: "Failed to transfer leadership" });
  }
});

// --- Join Requests ---

router.get("/communities/:id/join-requests", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ message: "Not authenticated" });
  try {
    const requests = await communityService.getJoinRequests(req.params.id, req.session.userId);
    res.json(requests);
  } catch (error: any) {
    if (error.message === "FORBIDDEN") return res.status(403).json({ message: "Forbidden" });
    res.status(500).json({ message: "Failed to fetch requests" });
  }
});

router.post("/communities/:id/join-requests/:requestId/:action", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ message: "Not authenticated" });
  const { action } = req.params;
  if (action !== 'approve' && action !== 'reject') return res.status(400).json({ message: "Invalid action" });

  try {
    const result = await communityService.respondJoinRequest(req.params.id, req.session.userId, req.params.requestId, action);
    res.json(result);
  } catch (error: any) {
    if (error.message === "FORBIDDEN") return res.status(403).json({ message: "Forbidden" });
    if (error.message === "REQUEST_NOT_FOUND") return res.status(404).json({ message: "Request not found" });
    res.status(500).json({ message: "Failed to respond" });
  }
});

// --- Topics & Submissions ---

router.post("/communities/:id/topics", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ message: "Not authenticated" });
try {
    const schema = insertCommunityTopicSchema
      .pick({ 
        title: true, 
        description: true,
        isActive: true
      })
      .extend({
        deadline: z.coerce.date().optional()
      });

      const data = schema.parse(req.body);

    const topic = await communityService.createTopic(req.session.userId, { 
      ...data, 
      communityId: req.params.id 
    });

    res.status(201).json(topic);

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    if (error.message === "FORBIDDEN") {
      return res.status(403).json({ message: "Only leaders can create topics" });
    }
    if (error.message === "NOT_FOUND") {
      return res.status(404).json({ message: "Community not found" });
    }
    
    console.error("Error creating topic:", error);
    res.status(500).json({ message: "Failed to create topic" });
  }
});

router.get("/communities/:id/topics", async (req, res) => {
  try {
    const topics = await communityService.getCommunityTopics(req.params.id);
    res.json(topics);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch topics" });
  }
});

router.get("/topics/:id", async (req, res) => {
  try {
    const topic = await communityService.getTopic(req.params.id);
    
    if (!topic) {
      return res.status(404).json({ message: "Topic not found" });
    }
    res.json(topic);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch topic" });
  }
});

router.patch("/topics/:id", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ message: "Not authenticated" });

  try {
    const updates = insertCommunityTopicSchema.partial().parse(req.body);

    const updated = await communityService.updateTopic(
      req.params.id, 
      req.session.userId, 
      updates
    );
    
    res.json(updated);

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    if (error.message === "FORBIDDEN") {
      return res.status(403).json({ message: "Only leaders can update topics" });
    }
    if (error.message === "NOT_FOUND") {
      return res.status(404).json({ message: "Topic not found" });
    }
    res.status(500).json({ message: "Failed to update topic" });
  }
});

router.patch("/submissions/:id/review", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    const submission = await communityService.markSubmissionReviewed(
      req.params.id, 
      req.session.userId
    );
    res.json(submission);

  } catch (error: any) {
    if (error.message === "NOT_FOUND") {
      return res.status(404).json({ message: "Submission not found" });
    }
    res.status(500).json({ message: "Failed to mark submission as reviewed" });
  }
});


router.get("/topics/:id/submissions", async (req, res) => {
  try {
    const submissions = await communityService.getTopicSubmissions(req.params.id);
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch submissions" });
  }
});

router.post("/topics/:id/submissions", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ message: "Not authenticated" });
  try {
    const essayInput = insertEssaySchema.pick({ title: true, content: true }).parse(req.body);
    const result = await communityService.createSubmission(req.session.userId, req.params.id, essayInput);
    res.status(201).json(result);
  } catch (error: any) {
    if (error.message === "TOPIC_CLOSED") return res.status(400).json({ message: "Topic closed" });
    if (error.message === "ALREADY_SUBMITTED") return res.status(400).json({ message: "Already submitted" });
    if (error.message === "FORBIDDEN") return res.status(403).json({ message: "Not a member" });
    res.status(500).json({ message: "Failed to submit" });
  }
});

// User stuff
router.get("/user/communities", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ message: "Not authenticated" });
    const result = await communityService.getUserCommunities(req.session.userId);
    res.json(result);
});

router.get("/user/pending-requests", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ message: "Not authenticated" });
    const result = await communityService.getUserPendingRequests(req.session.userId);
    res.json(result);
});

export default router;