import { Router } from "express";
import { peerReviewStore } from "../storage/"; 
import { insertPeerReviewSchema, correctionSchema, updatePeerReviewSchema, addCorrectionSchema } from "@shared/schema"; 
import { peerReviewService } from "server/services";
import { catchAsync } from "./middlewares/errorHandler"; 
import { isAuthenticated } from "./middlewares/isAuthenticated"; 
import { validateBody } from "./middlewares/validation";

const router = Router();

// =================================================================
// 🔒 Rotas Protegidas (Exigem login)
// =================================================================

router.use(isAuthenticated);

/**
 * Atualiza uma revisão (peer review) existente.
 * (ex: adicionar notas, submeter a revisão).
 */
router.patch("/:id", validateBody(updatePeerReviewSchema), catchAsync(async (req, res) => {
  try {
      const review = await peerReviewService.updateReview(
        req.params.id,
        req.session.userId!,
        req.body
      );
      res.json(review);
    } catch (error: any) {
      if (error.message === "REVIEW_NOT_FOUND") {
        return res.status(404).json({ message: "Review not found" });
      }
      if (error.message === "FORBIDDEN_ACCESS") {
        return res.status(403).json({ message: "Forbidden: You cannot edit this review" });
      }
      throw error;
    }
}));

/**
 * Adiciona uma correção inline específica a uma revisão (peer review)
 * que ainda não foi submetida.
 */
router.post("/:id/corrections", catchAsync(async (req, res) => {
  try {
      const review = await peerReviewService.addCorrection(
        req.params.id,
        req.session.userId!,
        req.body
      );
      res.json(review);
    } catch (error: any) {
      if (error.message === "REVIEW_NOT_FOUND") {
        return res.status(404).json({ message: "Review not found" });
      }
      if (error.message === "FORBIDDEN_ACCESS") {
        return res.status(403).json({ message: "Forbidden: You cannot add corrections to this review" });
      }
      if (error.message === "REVIEW_ALREADY_SUBMITTED") {
        return res.status(400).json({ message: "Cannot add corrections to a submitted review" });
      }
      throw error;
    }
}));

router.get("/:id/likes", async (req, res) => {
  try {
    const result = await peerReviewService.getLikeStatus(
      req.params.id, 
      req.session.userId
    );
    res.json(result);
  } catch (error) {
    console.error("[PeerReviewLikes] Get Error:", error);
    res.status(500).json({ message: "Failed to fetch like stats" });
  }
});

router.post("/:id/likes", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const result = await peerReviewService.toggleLike(
      req.params.id,
      req.session.userId
    );
    
    res.json(result);
  } catch (error) {
    console.error("[PeerReviewLikes] Toggle Error:", error);
    res.status(500).json({ message: "Failed to toggle like" });
  }
});

export default router;