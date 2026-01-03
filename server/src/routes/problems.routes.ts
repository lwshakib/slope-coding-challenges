import express from "express";
import { 
    getAllProblems, getProblemBySlug, submitSolution, runSolution, getSubmissionStatus, getTestRunStatus,
    getSubmissionsBySlug, getAllSolutionsBySlug, postSolution, likeSolution, getCommentsBySolutionId,
    postComment, updateSubmissionNotes, getPerformanceDistribution
} from "../controllers/problems.controller";

import { requireAuth } from "../middlewares/auth.middlewares";

const router = express.Router();

router.use(requireAuth);

router.get("/", getAllProblems);
router.get("/:slug", getProblemBySlug);
router.post("/run", runSolution);
router.get("/run/:id", getTestRunStatus);
router.post("/submit", submitSolution);
router.get("/submission/:id", getSubmissionStatus);
router.put("/submission/:id/notes", updateSubmissionNotes);
router.get("/submissions/:slug", getSubmissionsBySlug);

// Performance Distribution
router.get("/:slug/distribution", getPerformanceDistribution);

// Community Solutions
router.get("/:slug/solutions", getAllSolutionsBySlug);
router.post("/:slug/solutions", postSolution);
router.post("/solutions/:solutionId/like", likeSolution);

// Comments
router.get("/solutions/:solutionId/comments", getCommentsBySolutionId);
router.post("/solutions/:solutionId/comments", postComment);

export default router;
