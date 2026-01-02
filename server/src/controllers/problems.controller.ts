import type { Request, Response } from "express";
import { problemRegistry } from "../features/problems/problems.registry";

export const getAllProblems = (req: Request, res: Response) => {
  res.json(problemRegistry);
};

export const getProblemBySlug = (req: Request, res: Response) => {
  const { slug } = req.params;
  const problem = problemRegistry.find((p) => p.slug === slug);
  
  if (!problem) {
    return res.status(404).json({ message: "Problem not found" });
  }
  
  res.json(problem);
};

export const submitSolution = (req: Request, res: Response) => {
    // Log the submission code
    console.log(req.body);

    const submitId = Math.random().toString(36).substring(7);

    res.json({
        success: true,
        submitId
    });
};
