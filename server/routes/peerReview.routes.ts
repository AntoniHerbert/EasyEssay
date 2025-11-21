import { Router } from "express";
import { peerReviewStore } from "../storage/"; 
import { insertPeerReviewSchema, correctionSchema } from "@shared/schema"; 
import { peerReviewService } from "server/services/peerReview.service";
import { catchAsync } from "./middlewares/errorHandler"; 
import { isAuthenticated } from "./middlewares/isAuthenticated"; 

const router = Router();

// =================================================================
// 🔒 Rotas Protegidas (Exigem login)
// =================================================================

router.use(isAuthenticated);

/**
 * Atualiza uma revisão (peer review) existente.
 * (ex: adicionar notas, submeter a revisão).
 */
router.patch("/:id", catchAsync(async (req, res) => {
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

export default router;