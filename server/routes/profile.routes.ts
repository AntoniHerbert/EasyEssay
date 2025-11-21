import { Router } from "express";
import { profileService } from "../services/profile.service";
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
const profile = await profileService.getProfileByUserId(req.params.userId); 
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
  try {
      const profile = await profileService.createProfile(
        req.session.userId!, 
        req.body
      );
      res.status(201).json(profile);
    } catch (error: any) {
      if (error.message === "PROFILE_ALREADY_EXISTS") {
        return res.status(409).json({ message: "Profile already exists for this user" });
      }
      throw error;
    }
}));


// =================================================================
// 🔒 Rotas Protegidas (Exigem login)
// =================================================================

router.use(isAuthenticated);

/**
 * Atualiza o perfil do próprio usuário.
 */
router.put("/:userId", catchAsync(async (req, res) => {
  try {
      const profile = await profileService.updateProfile(
        req.params.userId,
        req.session.userId!,
        req.body
      );
      
      res.json(profile);
    } catch (error: any) {
      if (error.message === "FORBIDDEN_ACCESS") {
        return res.status(403).json({ message: "Forbidden: You can only update your own profile" });
      }
      if (error.message === "PROFILE_NOT_FOUND") {
        return res.status(404).json({ message: "Profile not found" });
      }
      throw error;
    }
}));

export default router;