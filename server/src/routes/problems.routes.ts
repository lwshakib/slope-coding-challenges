import express from "express";
import { getAllProblems, getProblemBySlug, submitSolution } from "../controllers/problems.controller";

import { requireAuth } from "../middlewares/auth.middlewares";

const router = express.Router();

router.use(requireAuth);

router.get("/", getAllProblems);
router.get("/:slug", getProblemBySlug);
router.post("/submit", submitSolution);

export default router;
