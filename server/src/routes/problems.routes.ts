import express from "express";
import { getAllProblems, getProblemBySlug } from "../controllers/problems.controller";

const router = express.Router();

router.get("/", getAllProblems);
router.get("/:slug", getProblemBySlug);

export default router;
