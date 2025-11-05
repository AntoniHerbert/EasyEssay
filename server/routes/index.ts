import { Router } from "express";
import authRouter from "./auth.routes";
import essayRouter from "./essay.routes";
import profileRouter from "./profile.routes";
import friendshipRouter from "./friendship.routes";
import messageRouter from "./message.routes";
import peerReviewRouter from "./peerReview.routes";
import inspirationRouter from "./inspiration.routes";
import userRouter from "./user.routes";

const router = Router();

router.use("/auth", authRouter);
router.use("/essays", essayRouter);
router.use("/profile", profileRouter);       
router.use("/users", profileRouter);         
router.use("/friendships", friendshipRouter);
router.use("/messages", messageRouter);
router.use("/peer-reviews", peerReviewRouter);  
router.use("/inspirations", inspirationRouter);
router.use("/users", userRouter);

export default router;