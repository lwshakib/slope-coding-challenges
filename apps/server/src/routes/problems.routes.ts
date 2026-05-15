import { Router } from "express";
import { 
    getAllProblems, getProblemBySlug, submitSolution, runSolution, getSubmissionStatus, getTestRunStatus,
    getSubmissionsBySlug, getAllSolutionsBySlug, postSolution, likeSolution, getCommentsBySolutionId,
    postComment, updateSubmissionNotes, getPerformanceDistribution
} from "../controllers/problems.controller.js";

const router: Router = Router();

router.get("/", getAllProblems);
router.get("/:slug", getProblemBySlug);
router.post("/run", runSolution);
router.get("/run/:id", getTestRunStatus);
router.post("/submit", submitSolution);
router.get("/submission/:id", getSubmissionStatus);
router.put("/submission/:id/notes", updateSubmissionNotes);
router.get("/submissions/:slug", getSubmissionsBySlug);

router.get("/:slug/distribution", getPerformanceDistribution);

router.get("/:slug/solutions", getAllSolutionsBySlug);
router.post("/:slug/solutions", postSolution);
router.post("/solutions/:solutionId/like", likeSolution);

router.get("/solutions/:solutionId/comments", getCommentsBySolutionId);
router.post("/solutions/:solutionId/comments", postComment);

export default router;
