import { Router } from "express";
import { storage } from "../storage"; 
import { getMockAIReview } from "../services/mock-analysis"; 
import { 
  insertEssaySchema, 
  insertUserCorrectionSchema, 
  insertPeerReviewSchema 
} from "@shared/schema"; 
import { catchAsync } from "./middlewares/errorHandler";
import { isAuthenticated } from "./middlewares/isAuthenticated";

const router = Router();

// =================================================================
// 🚀 Rotas Públicas (Não exigem login)
// =================================================================

/**
 * Busca uma lista de redações com base em filtros.
 * @query isPublic {boolean} Filtra por redações públicas/privadas.
 * @query authorId {string} Filtra por ID do autor.
 */
router.get("/", catchAsync(async (req, res) => {
  const { isPublic, authorId } = req.query;
  const essays = await storage.getEssays(
    isPublic === "true" ? true : isPublic === "false" ? false : undefined,
    authorId as string
  );
  res.json(essays);
}));

/**
 * Busca uma redação específica pelo ID.
 */
router.get("/:id", catchAsync(async (req, res) => {
  const essay = await storage.getEssay(req.params.id);
  if (!essay) {
    return res.status(404).json({ message: "Essay not found" });
  }
  res.json(essay);
}));

/**
 * Busca as correções manuais de uma redação.
 */
router.get("/:id/user-corrections", catchAsync(async (req, res) => {
  const userCorrections = await storage.getUserCorrections(req.params.id);
  res.json(userCorrections);
}));

/**
 * Busca a contagem de "likes" de uma redação.
 */
router.get("/:id/likes", catchAsync(async (req, res) => {
  const likes = await storage.getEssayLikes(req.params.id);
  res.json({ count: likes.length });
}));

/**
 * Busca todas as revisões (peer reviews) de uma redação.
 */
router.get("/:essayId/peer-reviews", catchAsync(async (req, res) => {
  const reviews = await storage.getPeerReviews(req.params.essayId);
  res.json(reviews);
}));


// =================================================================
// 🔒 Rotas Protegidas (Exigem login)
// =================================================================

// O middleware 'isAuthenticated' será aplicado a todas as rotas abaixo
router.use(isAuthenticated);

/**
 * Cria uma nova redação.
 */
router.post("/", catchAsync(async (req, res) => {
  const userProfile = await storage.getUserProfile(req.session.userId!);
  
  const essayData = insertEssaySchema.omit({ authorId: true, authorName: true }).parse(req.body);
  
  const wordCount = essayData.content.trim().split(/\s+/).filter(word => word.length > 0).length;
  
  const essay = await storage.createEssay({
    ...essayData,
    authorId: req.session.userId!,
    authorName: userProfile?.displayName || "Anonymous",
    wordCount,
  });
  
  // Lógica de auto-análise assíncrona para redações públicas
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
      console.error(`Failed to auto-analyze essay ${essay.id}:`, aiError);
      // Não falha a requisição principal, apenas registra o erro
    }
  }
  
  res.status(201).json(essay);
}));

/**
 * Atualiza uma redação existente.
 */
router.put("/:id", catchAsync(async (req, res) => {
  // TODO: Adicionar verificação de propriedade (o usuário logado é o dono da redação?)
  // const essay = await storage.getEssay(req.params.id);
  // if (essay?.authorId !== req.session.userId) {
  //   return res.status(403).json({ message: "Forbidden" });
  // }

  const updates = insertEssaySchema.partial().parse(req.body);
  
  if (updates.content) {
    updates.wordCount = updates.content.trim().split(/\s+/).filter(word => word.length > 0).length;
  }
  
  const updatedEssay = await storage.updateEssay(req.params.id, updates);
  if (!updatedEssay) {
    return res.status(404).json({ message: "Essay not found" });
  }
  res.json(updatedEssay);
}));

/**
 * Exclui uma redação.
 */
router.delete("/:id", catchAsync(async (req, res) => {
  // TODO: Adicionar verificação de propriedade
  const deleted = await storage.deleteEssay(req.params.id);
  if (!deleted) {
    return res.status(404).json({ message: "Essay not found" });
  }
  res.status(204).send();
}));

/**
 * (Admin) Executa a análise de IA em todas as redações públicas que ainda não foram analisadas.
 */
router.post("/batch-analyze", catchAsync(async (req, res) => {
  // TODO: Esta rota deveria ser protegida por um middleware 'isAdmin'
  const allEssays = await storage.getEssays(true); // Apenas públicas
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
}));

/**
 * (Re)Inicia a análise de IA para uma redação específica.
 */
router.post("/:id/analyze", catchAsync(async (req, res) => {
  const essay = await storage.getEssay(req.params.id);
  if (!essay) {
    return res.status(404).json({ message: "Essay not found" });
  }
  
  // TODO: Adicionar verificação de propriedade ou permissão de admin

  const aiReview = getMockAIReview(essay.title, essay.content);

  const existingAIReview = await storage.getPeerReview(essay.id, "AI");
  if (existingAIReview) {
    // Se já existe, atualiza
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
    
    await storage.updateEssay(essay.id, { isAnalyzed: true });
    return res.json(updatedReview);
  }

  // Se não existe, cria
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
}));

/**
 * Adiciona uma correção manual (feita por usuário) a uma redação.
 */
router.post("/:id/user-corrections", catchAsync(async (req, res) => {
  const correctionData = insertUserCorrectionSchema.parse({
    ...req.body,
    essayId: req.params.id,
    // Note: Seu schema ou método de storage pode precisar do userId
    // userId: req.session.userId! 
  });
  
  const userCorrection = await storage.createUserCorrection(correctionData);
  res.status(201).json(userCorrection);
}));

/**
 * Adiciona ou remove um "like" de uma redação.
 */
router.post("/:id/like", catchAsync(async (req, res) => {
  const userId = req.session.userId!;
  const essayId = req.params.id;

  const isLiked = await storage.isEssayLiked(essayId, userId);
  
  if (isLiked) {
    await storage.deleteEssayLike(essayId, userId);
    res.json({ liked: false });
  } else {
    await storage.createEssayLike({
      essayId: essayId,
      userId,
    });
    res.json({ liked: true });
  }
}));

/**
 * Cria uma nova revisão (peer review) para uma redação.
 */
router.post("/:essayId/peer-reviews", catchAsync(async (req, res) => {
  const reviewerId = req.session.userId!;
  const { essayId } = req.params;
  
  const essay = await storage.getEssay(essayId);
  if (!essay) {
    return res.status(404).json({ message: "Essay not found" });
  }
  
  if (essay.authorId === reviewerId) {
    return res.status(403).json({ message: "You cannot review your own essay" });
  }
  
  const existingReview = await storage.getPeerReview(essayId, reviewerId);
  if (existingReview) {
    // Se o usuário já começou uma revisão, apenas retorna a existente
    return res.json(existingReview);
  }

  const reviewData = insertPeerReviewSchema.parse({
    ...req.body,
    reviewerId,
    essayId: essayId
  });
  const review = await storage.createPeerReview(reviewData);
  res.status(201).json(review);
}));


export default router;