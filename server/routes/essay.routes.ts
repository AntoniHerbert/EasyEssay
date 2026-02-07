import { Router } from "express";
import { essayService, essayLikeService, peerReviewService, aiService } from "../services"; 
import { validateBody } from "./middlewares/validation"; 
import { createEssayDTO, updateEssayDTO } from "@shared/schema"; 
import { catchAsync } from "./middlewares/errorHandler";
import { isAuthenticated } from "./middlewares/isAuthenticated";

const router = Router();

// =================================================================
// 🔒 Protected Routes
// =================================================================

router.use(isAuthenticated);

router.get("/", catchAsync(async (req, res) => {
  const { 
    isPublic, 
    authorId, 
    cursor, 
    excludeAuthorId, 
    q,
    status,       
    communityId,
    topicId
  } = req.query;

  const essays = await essayService.getEssays(
    req.session.userId, 
    isPublic as string, 
    authorId as string,
    cursor as string,
    excludeAuthorId as string,
    q as string,
    status as "drafts" | "analyzed" | "all" | "submitted", 
    communityId as string,
    topicId as string
  );
  res.json(essays);
}));

router.get("/:id", catchAsync(async (req, res) => {
  try {
    const essay = await essayService.getEssayById(
      req.params.id, 
      req.session.userId! 
    );
    
    if (!essay) {
      return res.status(404).json({ message: "Essay not found" });
    }
    res.json(essay);

  } catch (error: any) {
    if (error.message === "FORBIDDEN_ACCESS") {
      return res.status(403).json({ message: "You do not have permission to view this private essay" });
    }
    throw error;
  }
}));

router.get("/:id/likes", catchAsync(async (req, res) => {
  const result = await essayLikeService.getLikesData(
    req.params.id, 
    req.session.userId 
  );
  res.json(result);
}));

router.get("/:essayId/peer-reviews", catchAsync(async (req, res) => {
  const { cursor } = req.query;

  const result = await peerReviewService.getReviewsByEssayId(
    req.params.essayId,
    cursor as string
  );
  
  res.json(result);
}));

router.post("/", 
  validateBody(createEssayDTO), 
  catchAsync(async (req, res) => {
    const essay = await essayService.createEssay(req.session.userId!, req.body);
    res.status(201).json(essay);
}));

router.put("/:id",
  validateBody(updateEssayDTO),
  catchAsync(async (req, res) => {
    try {
        const updatedEssay = await essayService.updateEssay(
          req.params.id, 
          req.session.userId!, 
          req.body
        );
        
        if (!updatedEssay) return res.status(404).json({ message: "Essay not found" });
        res.json(updatedEssay);

      } catch (error: any) {
        if (error.message === "FORBIDDEN_ACCESS") {
          return res.status(403).json({ message: "You are not allowed to edit this essay" });
        }
        throw error;
      }
}));

router.delete("/:id", catchAsync(async (req, res) => {
  try {
      const deleted = await essayService.deleteEssay(
        req.params.id, 
        req.session.userId!
      );

      if (!deleted) return res.status(404).json({ message: "Essay not found" });
      res.status(204).send();

    } catch (error: any) {
      if (error.message === "FORBIDDEN_ACCESS") {
        return res.status(403).json({ message: "You are not allowed to delete this essay" });
      }
      throw error;
    }
}));

/**
 * (Admin) Batch Analysis
 */
router.post("/batch-analyze", catchAsync(async (req, res) => {
  const result = await aiService.batchAnalyzeEssays();
  res.json({ message: "Batch analysis complete", ...result });
}));

/**
 * Single Essay Analysis
 */
router.post("/:id/analyze", catchAsync(async (req, res) => {
  const result = await aiService.analyzeEssay(req.params.id);
  if (!result) {
    return res.status(404).json({ message: "Essay not found" });
  }
  res.json(result);
}));

router.post("/:id/like", catchAsync(async (req, res) => {
  try {
      const userId = req.session.userId!;
      const essayId = req.params.id;
      const result = await essayLikeService.toggleLike(essayId, userId); 
      res.json(result);
    } catch (error: any) {
      if (error.message === "ESSAY_NOT_FOUND") {
        return res.status(404).json({ message: "Essay not found" });
      }
      if (error.message === "FORBIDDEN_ACCESS") {
        return res.status(403).json({ message: "You cannot like a private essay" });
      }
      if (error.message === "CANNOT_LIKE_OWN_ESSAY") {
        return res.status(400).json({ message: "You cannot like your own essay" });
      }
      throw error;
    }
}));

router.post("/:essayId/peer-reviews", catchAsync(async (req, res) => {
  try {
      const { review, isNew } = await peerReviewService.createReview(
        req.params.essayId, 
        req.session.userId!, 
        req.body
      );

      if (!isNew) {
        return res.json(review); 
      }
      res.status(201).json(review); 

    } catch (error: any) {
      if (error.message === "ESSAY_NOT_FOUND") {
        return res.status(404).json({ message: "Essay not found" });
      }
      if (error.message === "CANNOT_REVIEW_OWN_ESSAY") {
        return res.status(403).json({ message: "You cannot review your own essay" });
      }
      throw error;
    }
}));

export default router;