import { Router } from "express";
import { userStore, profileStore } from "../storage/"; 
import { hashPassword, verifyPassword } from "../auth"; 
import { catchAsync } from "./middlewares/errorHandler";
import { isAuthenticated } from "./middlewares/isAuthenticated";

const router = Router();

router.post("/signup", catchAsync(async (req, res) => {
  const { username, password, displayName, bio } = req.body;

  if (!username || !password || !displayName) {
    return res.status(400).json({ message: "Username, password, and display name are required" });
  }
  
  const existingUser = await userStore.getUserByUsername(username);
  if (existingUser) {
    return res.status(400).json({ message: "Username already taken" });
  }

  const passwordHash = await hashPassword(password);
  const user = await userStore.createUser({ username, passwordHash });

  await profileStore.createUserProfile({
    userId: user.id,
    username,
    displayName,
    bio: bio || "",
  });

  req.session.userId = user.id;
  res.status(201).json({ id: user.id, username: user.username });
}));

router.post("/login", catchAsync(async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  const user = await userStore.getUserByUsername(username);
  if (!user) {
    return res.status(401).json({ message: "Invalid username or password" });
  }

  const isValid = await verifyPassword(user.passwordHash, password);
  if (!isValid) {
    return res.status(401).json({ message: "Invalid username or password" });
  }

  req.session.userId = user.id;
  res.json({ id: user.id, username: user.username });
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
  const user = await userStore.getUser(req.session.userId!); 
  if (!user) {
    // Isso pode acontecer se o usuário for deletado enquanto logado
    req.session.destroy(() => {});
    return res.status(404).json({ message: "User not found" });
  }
  res.json({ id: user.id, username: user.username });
}));

export default router;