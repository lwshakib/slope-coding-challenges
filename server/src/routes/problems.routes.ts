import express from "express";
import { getAllProblems, getProblemBySlug, submitSolution, getSubmissionStatus, getSubmissionsBySlug } from "../controllers/problems.controller";

import { requireAuth } from "../middlewares/auth.middlewares";

const router = express.Router();

router.use(requireAuth);

router.get("/", getAllProblems);
router.get("/:slug", getProblemBySlug);
router.post("/submit", submitSolution);
router.get("/submission/:id", getSubmissionStatus);
router.get("/submissions/:slug", getSubmissionsBySlug);

export default router;
