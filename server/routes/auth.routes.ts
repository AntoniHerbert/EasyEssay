import { Router } from "express";
import { authService } from "../services/auth.service";
import { hashPassword, verifyPassword } from "../auth"; 
import { catchAsync } from "./middlewares/errorHandler";
import { isAuthenticated } from "./middlewares/isAuthenticated";

const router = Router();

router.post("/signup", catchAsync(async (req, res) => {
  try {
      const user = await authService.registerUser(req.body);

      req.session.userId = user.id;
      
      res.status(201).json({ id: user.id, username: user.username });
    } catch (error: any) {
      if (error.message === "MISSING_FIELDS") {
        return res.status(400).json({ message: "Username, password, and display name are required" });
      }
      if (error.message === "USERNAME_TAKEN") {
        return res.status(400).json({ message: "Username already taken" });
      }
      throw error;
    }
}));

router.post("/login", catchAsync(async (req, res) => {
  try {
      const user = await authService.loginUser(req.body);

      req.session.userId = user.id;
      res.json({ id: user.id, username: user.username });
    } catch (error: any) {
      if (error.message === "MISSING_FIELDS") {
        return res.status(400).json({ message: "Username and password are required" });
      }
      if (error.message === "INVALID_CREDENTIALS") {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      throw error;
    }
}));

router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Failed to log out" });
    }
    res.json({ message: "Logged out successfully" });
  });
});


router.get("/me", isAuthenticated, catchAsync(async (req, res) => {
  const user = await authService.getCurrentUser(req.session.userId!);
  if (!user) {
    // Isso pode acontecer se o usuário for deletado enquanto logado
    req.session.destroy(() => {});
    return res.status(404).json({ message: "User not found" });
  }
  res.json({ id: user.id, username: user.username });
}));

export default router;