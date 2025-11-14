import { Router } from "express";
import { storage } from "../storage"; 
import { inspirationStore } from "../storage/"; 
import { catchAsync } from "./middlewares/errorHandler"; 

const router = Router();

// =================================================================
// 🚀 Rotas Públicas (Não exigem login)
// =================================================================

/**
 * Busca uma lista de inspirações (temas, prompts, etc.)
 * @query category {string} Filtra por categoria.
 * @query type {string} Filtra por tipo.
 */
router.get("/", catchAsync(async (req, res) => {
  const { category, type } = req.query;
  const inspirations = await inspirationStore.getInspirations(
    category as string,
    type as string
  );
  res.json(inspirations);
}));

/**
 * Busca uma inspiração específica pelo ID.
 */
router.get("/:id", catchAsync(async (req, res) => {
  const inspiration = await inspirationStore.getInspiration(req.params.id);
  if (!inspiration) {
    return res.status(404).json({ message: "Inspiration not found" });
  }
  res.json(inspiration);
}));


// TODO: Se você planeja adicionar rotas de admin no futuro 
// (ex: POST, PUT, DELETE para /inspirations),
// lembre-se de protegê-las com os middlewares 'isAuthenticated' e 'isAdmin'.
// Ex: router.post("/", isAuthenticated, isAdmin, catchAsync(async (req, res) => { ... }));

export default router;