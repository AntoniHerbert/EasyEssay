import { Router } from "express";
import { peerReviewStore } from "../storage/"; 
import { insertPeerReviewSchema, correctionSchema } from "@shared/schema"; 
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
  const reviewId = req.params.id;
  
  // TODO: VERIFICAÇÃO DE SEGURANÇA CRÍTICA!
  // Apenas o usuário que criou a revisão (reviewerId) deve poder atualizá-la.
  // const reviewToUpdate = await storage.getPeerReviewById(reviewId);
  // if (!reviewToUpdate) {
  //   return res.status(404).json({ message: "Review not found" });
  // }
  // if (reviewToUpdate.reviewerId !== req.session.userId) {
  //   return res.status(403).json({ message: "Forbidden: You cannot edit this review" });
  // }
  
  const updates = insertPeerReviewSchema.partial().parse(req.body);
  const review = await peerReviewStore.updatePeerReview(req.params.id, updates);  
  if (!review) {
    return res.status(404).json({ message: "Review not found" });
  }
  res.json(review);
}));

/**
 * Adiciona uma correção inline específica a uma revisão (peer review)
 * que ainda não foi submetida.
 */
router.post("/:id/corrections", catchAsync(async (req, res) => {
  const reviewId = req.params.id;

  const existingReview = await peerReviewStore.getPeerReviewById(reviewId); 
  if (!existingReview) {
    return res.status(404).json({ message: "Review not found" });
  }

  // TODO: VERIFICAÇÃO DE SEGURANÇA CRÍTICA!
  // Apenas o 'reviewerId' pode adicionar correções à sua própria revisão.
  // if (existingReview.reviewerId !== req.session.userId) {
  //   return res.status(403).json({ message: "Forbidden: You cannot add corrections to this review" });
  // }

  if (existingReview.isSubmitted) {
    return res.status(400).json({ message: "Cannot add corrections to a submitted review" });
  }

  const correctionData = correctionSchema.parse(req.body);
  const review = await peerReviewStore.addCorrectionToReview(reviewId, correctionData);   
  if (!review) {
    return res.status(404).json({ message: "Review not found after attempting to add correction" });
  }
  res.json(review);
}));

export default router;