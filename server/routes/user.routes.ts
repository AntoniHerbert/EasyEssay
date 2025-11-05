import { Router } from "express";
import { storage } from "../storage"; 
import { catchAsync } from "./middlewares/errorHandler"; 

const router = Router();

// =================================================================
// 🚀 Rota Pública (ou de Admin)
// =================================================================

/**
 * Busca uma lista de todos os usuários no sistema.
 */
router.get("/", catchAsync(async (req, res) => {
  // =================================================================
  // ⚠️ ATENÇÃO: COMENTÁRIO DE SEGURANÇA
  // =================================================================
  //
  // 1. ROTA PÚBLICA:
  // A lógica original (mantida aqui) não tinha autenticação.
  // Isso significa que QUALQUER pessoa na internet pode chamar
  // este endpoint e ver a lista de TODOS os usuários cadastrados.
  //
  // RECOMENDAÇÃO:
  // Esta rota quase sempre deve ser protegida e disponível
  // apenas para administradores.
  //
  // Exemplo de proteção (admin):
  // router.get("/", isAuthenticated, isAdmin, catchAsync(async (req, res) => { ...
  //
  // =================================================================

  const users = await storage.getAllUsers();
  res.json(users);
}));

export default router;