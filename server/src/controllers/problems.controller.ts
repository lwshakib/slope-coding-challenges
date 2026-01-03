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

export const runSolution = async (req: Request, res: Response) => {
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
        const testRun = await prisma.testRun.create({
            data: {
                userId,
                problemSlug: slug,
                code,
                language,
                status: "PENDING"
            }
        });

        // Push public test cases to RabbitMQ
        const publicCases = problem.testCases.filter(tc => tc.isPublic !== false);
        for (let i = 0; i < publicCases.length; i++) {
            await sendToQueue(`${language}_queue`, {
                submissionId: testRun.id,
                slug,
                code,
                language,
                functionName: problem.functionName,
                testCase: publicCases[i],
                caseIdx: i,
                totalCases: publicCases.length,
                isTest: true
            });
        }

        res.json({
            success: true,
            submissionId: testRun.id
        });
    } catch (error) {
        console.error("Test run failed:", error);
        res.status(500).json({ message: "Internal server error" });
    }
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

        // Push all test cases to RabbitMQ
        for (let i = 0; i < problem.testCases.length; i++) {
            await sendToQueue(`${language}_queue`, {
                submissionId: submission.id,
                slug,
                code,
                language,
                functionName: problem.functionName,
                testCase: problem.testCases[i],
                caseIdx: i,
                totalCases: problem.testCases.length,
                isTest: false
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

export const getTestRunStatus = async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const testRun = await prisma.testRun.findUnique({
            where: { id, userId }
        });

        if (!testRun) {
            return res.status(404).json({ message: "Test run not found" });
        }

        res.json(testRun);
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};

export const updateSubmissionNotes = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { notes } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const submission = await prisma.submission.update({
            where: { id, userId },
            data: { notes }
        });
        res.json(submission);
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getSubmissionsBySlug = async (req: Request, res: Response) => {
    const { slug } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const submissions = await prisma.submission.findMany({
            where: { 
                problemSlug: slug,
                userId 
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 20
        });

        res.json(submissions);
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getAllSolutionsBySlug = async (req: Request, res: Response) => {
    const { slug } = req.params;
    try {
        const solutions = await prisma.communitySolution.findMany({
            where: { problemSlug: slug },
            include: {
                user: {
                    select: { name: true, image: true }
                },
                _count: {
                    select: { comments: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(solutions);
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};

export const postSolution = async (req: Request, res: Response) => {
    const { slug } = req.params;
    const { title, content, language, code } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    if (!slug) {
        return res.status(400).json({ message: "Slug is required" });
    }

    try {
        const solution = await prisma.communitySolution.create({
            data: {
                userId,
                problemSlug: slug,
                title,
                content,
                language,
                code
            }
        });
        res.json(solution);
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};

export const likeSolution = async (req: Request, res: Response) => {
    const { solutionId } = req.params;
    try {
        const solution = await prisma.communitySolution.update({
            where: { id: solutionId },
            data: {
                likes: { increment: 1 }
            }
        });
        res.json(solution);
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getCommentsBySolutionId = async (req: Request, res: Response) => {
    const { solutionId } = req.params;
    try {
        const comments = await prisma.comment.findMany({
            where: { communitySolutionId: solutionId },
            include: {
                user: {
                    select: { name: true, image: true }
                }
            },
            orderBy: { createdAt: 'asc' }
        });
        res.json(comments);
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};

export const postComment = async (req: Request, res: Response) => {
    const { solutionId } = req.params;
    const { content } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    if (!solutionId) {
        return res.status(400).json({ message: "solutionId is required" });
    }

    try {
        const comment = await prisma.comment.create({
            data: {
                userId,
                communitySolutionId: solutionId,
                content
            },
            include: {
                user: {
                    select: { name: true, image: true }
                }
            }
        });
        res.json(comment);
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};
export const getPerformanceDistribution = async (req: Request, res: Response) => {
    const { slug } = req.params;
    const { language } = req.query;

    try {
        const acceptedSubmissions = await prisma.submission.findMany({
            where: {
                problemSlug: slug,
                language: language as string,
                status: "ACCEPTED",
                runtime: { not: null },
                memory: { not: null }
            },
            select: {
                runtime: true,
                memory: true
            }
        });

        res.json(acceptedSubmissions);
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};
