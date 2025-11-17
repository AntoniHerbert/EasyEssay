import { Router } from "express";
import { profileStore } from "../storage/"; 
import { insertUserProfileSchema } from "@shared/schema"; 
import { catchAsync } from "./middlewares/errorHandler"; 
import { isAuthenticated } from "./middlewares/isAuthenticated"; 

const router = Router();

// =================================================================
// 🚀 Rotas Públicas (Não exigem login)
// =================================================================

/**
 * Busca um perfil de usuário público.
 * Qualquer pessoa (logada ou não) pode ver o perfil de outro usuário.
 */
router.get("/:userId", catchAsync(async (req, res) => {
  const profile = await profileStore.getUserProfile(req.params.userId);
  if (!profile) {
    return res.status(404).json({ message: "Profile not found" });
  }
  res.json(profile);
}));

/**
 * Cria um novo perfil de usuário.
 * (Mantendo a lógica original conforme solicitado)
 */
router.post("/", catchAsync(async (req, res) => {
  // =================================================================
  // ⚠️ ATENÇÃO: COMENTÁRIO DE SEGURANÇA
  // =================================================================
  //
  // 1. FALTA DE AUTENTICAÇÃO:
  // A lógica original desta rota (mantida aqui) não possui
  // autenticação. Ela está na seção "Rotas Públicas", o que
  // significa que QUALQUER pessoa na internet pode chamar
  // este endpoint e tentar criar perfis.
  //
  // 2. FALHA DE AUTORIZAÇÃO (IDOR - Insecure Direct Object Reference):
  // A rota aceita 'userId' diretamente do 'req.body' (através do
  // 'insertUserProfileSchema'). Isso permite que qualquer pessoa
  // crie um perfil para *qualquer* 'userId' que ela desejar.
  //
  // RECOMENDAÇÃO:
  // A rota 'POST /api/auth/signup' já não deveria criar o perfil?
  // Se não, esta rota deveria (no mínimo) estar na seção
  // 'Rotas Protegidas' abaixo e usar 'req.session.userId'
  // em vez de 'req.body.userId'.
  //
  // =================================================================

  // Lógica original (insegura):
  const profileData = insertUserProfileSchema.parse(req.body);

  // TODO: Você deveria pelo menos verificar se um perfil já existe
  // const existingProfile = await storage.getUserProfile(profileData.userId);
  // if (existingProfile) {
  //   return res.status(400).json({ message: "Profile already exists." });
  // }

  const profile = await profileStore.createUserProfile(profileData);
  res.status(201).json(profile);
}));


// =================================================================
// 🔒 Rotas Protegidas (Exigem login)
// =================================================================

router.use(isAuthenticated);

/**
 * Atualiza o perfil do próprio usuário.
 */
router.put("/:userId", catchAsync(async (req, res) => {
  // VERIFICAÇÃO DE SEGURANÇA (CORRETA):
  // Esta rota está correta. Ela garante que o usuário da sessão
  // (req.session.userId) é o mesmo do parâmetro da URL (req.params.userId).
  if (req.params.userId !== req.session.userId) {
    return res
      .status(403)
      .json({ message: "Forbidden: You can only update your own profile" });
  }

  const updates = insertUserProfileSchema.partial().parse(req.body);
  const profile = await profileStore.updateUserProfile(req.params.userId, updates);

  if (!profile) {
    return res.status(404).json({ message: "Profile not found" });
  }
  res.json(profile);
}));

export default router;