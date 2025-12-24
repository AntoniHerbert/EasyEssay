import { Router } from "express";
import { z } from "zod";
import { insertExploreItemSchema, type ExploreContentType } from "@shared/schema";
import { exploreService, profileService } from "../services"; 

const router = Router();

// GET /api/explore (Feed)
router.get("/", async (req, res) => {
  try {
    const { type, authorId } = req.query;
    const items = await exploreService.getFeed(
      req.session.userId,
      type as ExploreContentType | undefined,
      authorId as string | undefined
    );
    res.json(items);
  } catch (error) {
    console.error("Explore feed error:", error);
    res.status(500).json({ message: "Failed to fetch explore items" });
  }
});

// GET /api/explore/saved
router.get("/saved", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ message: "Not authenticated" });
  
  try {
    const items = await exploreService.getSavedItems(req.session.userId);
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch saved items" });
  }
});

// GET /api/explore/:id
router.get("/:id", async (req, res) => {
  try {
    const item = await exploreService.getItem(req.params.id, req.session.userId);
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch item" });
  }
});

// POST /api/explore (Create)
router.post("/", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ message: "Not authenticated" });

  try {
    const userProfile = await profileService.getProfileByUserId(req.session.userId);
    const authorName = userProfile?.displayName || "Anonymous";
    
    const itemData = insertExploreItemSchema.parse({
      ...req.body,
      authorId: req.session.userId,
      authorName: authorName, 
    });

    const item = await exploreService.createItem(itemData);
    res.status(201).json(item);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    console.error("Create explore item error:", error);
    res.status(500).json({ message: "Failed to create item" });
  }
});

// DELETE /api/explore/:id
router.delete("/:id", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ message: "Not authenticated" });

  try {
    await exploreService.deleteItem(req.params.id, req.session.userId);
    res.json({ message: "Item deleted" });
  } catch (error: any) {
    if (error.message === "Unauthorized") return res.status(403).json({ message: error.message });
    if (error.message === "Item not found") return res.status(404).json({ message: error.message });
    res.status(500).json({ message: "Failed to delete item" });
  }
});

// POST /api/explore/:id/like
router.post("/:id/like", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ message: "Not authenticated" });

  try {
    const item = await exploreService.getItem(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    const isLiked = await exploreService.toggleLike(req.params.id, req.session.userId);
    res.json({ isLiked });
  } catch (error) {
    res.status(500).json({ message: "Failed to toggle like" });
  }
});

// POST /api/explore/:id/save
router.post("/:id/save", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ message: "Not authenticated" });

  try {
    const item = await exploreService.getItem(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    const isSaved = await exploreService.toggleSave(req.params.id, req.session.userId);
    res.json({ isSaved });
  } catch (error) {
    res.status(500).json({ message: "Failed to toggle save" });
  }
});

export default router;