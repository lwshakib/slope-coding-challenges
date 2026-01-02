import express from "express";
import { getContests, registerForContest, getContestStatus, getContestBySlug } from "../controllers/contests.controller";
import { requireAuth } from "../middlewares/auth.middlewares";

const router = express.Router();

router.get("/", requireAuth, getContests);
router.get("/s/:slug", requireAuth, getContestBySlug);
router.get("/:id/status", requireAuth, getContestStatus);
router.post("/:id/register", requireAuth, registerForContest);

export default router;
