import { Router } from "express";
import { essayService } from "../services/essay.service"; 
import { userCorrectionService } from "../services/userCorrection.service";
import { essayLikeService } from "../services/essayLike.service"; 
import { peerReviewService } from "../services/peerReview.service";
import { aiService } from "../services/ai.service";

import { 
  insertPeerReviewSchema 
} from "@shared/schema"; 
import { catchAsync } from "./middlewares/errorHandler";
import { isAuthenticated } from "./middlewares/isAuthenticated";

const router = Router();

// =================================================================
// 🚀 Rotas Públicas
// =================================================================

router.get("/", catchAsync(async (req, res) => {
  const { isPublic, authorId } = req.query;
  const essays = await essayService.getEssays(isPublic as string, authorId as string);
  res.json(essays);
}));

router.get("/:id", catchAsync(async (req, res) => {
  const essay = await essayService.getEssayById(req.params.id);
  if (!essay) {
    return res.status(404).json({ message: "Essay not found" });
  }
  res.json(essay);
}));

router.get("/:id/user-corrections", catchAsync(async (req, res) => {
const userCorrections = await userCorrectionService.getCorrectionsByEssayId(req.params.id);
res.json(userCorrections);
}));

router.get("/:id/likes", catchAsync(async (req, res) => {
const likes = await essayLikeService.getLikes(req.params.id);
  res.json({ count: likes.length });
}));

router.get("/:essayId/peer-reviews", catchAsync(async (req, res) => {
const reviews = await peerReviewService.getReviewsByEssayId(req.params.essayId);
res.json(reviews);
}));


// =================================================================
// 🔒 Rotas Protegidas
// =================================================================

router.use(isAuthenticated);

router.post("/", catchAsync(async (req, res) => {

  const essay = await essayService.createEssay(req.session.userId!, req.body);
  res.status(201).json(essay);
}));

router.put("/:id", catchAsync(async (req, res) => {

  const updatedEssay = await essayService.updateEssay(req.params.id, req.body);
  if (!updatedEssay) {
    return res.status(404).json({ message: "Essay not found" });
  }
  res.json(updatedEssay);
}));

router.delete("/:id", catchAsync(async (req, res) => {

  const deleted = await essayService.deleteEssay(req.params.id);
  if (!deleted) {
    return res.status(404).json({ message: "Essay not found" });
  }
  res.status(204).send();
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

router.post("/:id/user-corrections", catchAsync(async (req, res) => {

  const userCorrection = await userCorrectionService.createCorrection(req.params.id, req.body);
  res.status(201).json(userCorrection);
}));

router.post("/:id/like", catchAsync(async (req, res) => {
  const userId = req.session.userId!;
  const essayId = req.params.id;
  const result = await essayLikeService.toggleLike(essayId, userId); 
  
  res.json(result);
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