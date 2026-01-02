import type { Request, Response } from "express";
import { problemRegistry } from "../features/problems/problems.registry";
import { prisma } from "../services/prisma.services";
import { sendToQueue } from "../services/rabbitmq.services";

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

export const submitSolution = async (req: Request, res: Response) => {
    const { slug, code, language } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const problem = problemRegistry.find((p) => p.slug === slug);
    if (!problem) {
        return res.status(404).json({ message: "Problem not found" });
    }

    try {
        const submission = await prisma.submission.create({
            data: {
                userId,
                problemSlug: slug,
                code,
                language,
                status: "PENDING"
            }
        });

        // Push individual test cases to RabbitMQ for parallel execution
        for (let i = 0; i < problem.testCases.length; i++) {
            await sendToQueue(`${language}_queue`, {
                submissionId: submission.id,
                slug,
                code,
                language,
                functionName: problem.functionName,
                testCase: problem.testCases[i],
                caseIdx: i,
                totalCases: problem.testCases.length
            });
        }

        res.json({
            success: true,
            submissionId: submission.id
        });
    } catch (error) {
        console.error("Submission failed:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getSubmissionStatus = async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const submission = await prisma.submission.findUnique({
            where: { id, userId }
        });

        if (!submission) {
            return res.status(404).json({ message: "Submission not found" });
        }

        res.json(submission);
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};
