import type { Request, Response } from "express";
import { problemRegistry } from "../features/problems/problems.registry";
import postgresService from "../services/postgres.services";
import rabbitmqService from "../services/rabbitmq.services";

export const getAllProblems = (req: Request, res: Response) => {
  // Filter out contest-only problems
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

    const problem = problemRegistry.find((p) => p.slug === slug);
    if (!problem) {
        return res.status(404).json({ message: "Problem not found" });
    }

    try {
        const id = crypto.randomUUID();
        const result = await postgresService.query(
            `INSERT INTO test_run (id, "problemSlug", code, language, status) 
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [id, slug, code, language, "PENDING"]
        );
        const testRun = result.rows[0];

        // Push public test cases to RabbitMQ
        const publicCases = problem.testCases.filter(tc => tc.isPublic !== false);
        for (let i = 0; i < publicCases.length; i++) {
            await rabbitmqService.sendToQueue(`${language}_queue`, {
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

    const problem = problemRegistry.find((p) => p.slug === slug);
    if (!problem) {
        return res.status(404).json({ message: "Problem not found" });
    }

    try {
        const id = crypto.randomUUID();
        const result = await postgresService.query(
            `INSERT INTO submission (id, "problemSlug", code, language, status) 
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [id, slug, code, language, "PENDING"]
        );
        const submission = result.rows[0];

        // Push all test cases to RabbitMQ
        for (let i = 0; i < problem.testCases.length; i++) {
            await rabbitmqService.sendToQueue(`${language}_queue`, {
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
    try {
        const result = await postgresService.query('SELECT * FROM submission WHERE id = $1', [id]);
        const submission = result.rows[0];

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
    try {
        const result = await postgresService.query('SELECT * FROM test_run WHERE id = $1', [id]);
        const testRun = result.rows[0];

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

    try {
        const result = await postgresService.query(
            'UPDATE submission SET notes = $1 WHERE id = $2 RETURNING *',
            [notes, id]
        );
        const submission = result.rows[0];
        res.json(submission);
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getSubmissionsBySlug = async (req: Request, res: Response) => {
    const { slug } = req.params;

    try {
        const result = await postgresService.query(
            'SELECT * FROM submission WHERE "problemSlug" = $1 ORDER BY "createdAt" DESC LIMIT 20',
            [slug]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getAllSolutionsBySlug = async (req: Request, res: Response) => {
    const { slug } = req.params;
    try {
        const result = await postgresService.query(
            `SELECT cs.*, 
                (SELECT COUNT(*)::int FROM comment WHERE "communitySolutionId" = cs.id) as comment_count 
             FROM community_solution cs 
             WHERE cs."problemSlug" = $1 
             ORDER BY cs."createdAt" DESC`,
            [slug]
        );
        const solutions = result.rows.map(row => ({
            ...row,
            _count: { comments: row.comment_count }
        }));
        res.json(solutions);
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};

export const postSolution = async (req: Request, res: Response) => {
    const { slug } = req.params;
    const { title, content, language, code } = req.body;
    if (!slug) {
        return res.status(400).json({ message: "Slug is required" });
    }

    try {
        const id = crypto.randomUUID();
        const result = await postgresService.query(
            `INSERT INTO community_solution (id, "problemSlug", title, content, language, code) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [id, slug, title, content, language, code]
        );
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};

export const likeSolution = async (req: Request, res: Response) => {
    const { solutionId } = req.params;
    try {
        const result = await postgresService.query(
            'UPDATE community_solution SET likes = likes + 1 WHERE id = $1 RETURNING *',
            [solutionId]
        );
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getCommentsBySolutionId = async (req: Request, res: Response) => {
    const { solutionId } = req.params;
    try {
        const result = await postgresService.query(
            'SELECT * FROM comment WHERE "communitySolutionId" = $1 ORDER BY "createdAt" ASC',
            [solutionId]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};

export const postComment = async (req: Request, res: Response) => {
    const { solutionId } = req.params;
    const { content } = req.body;
    if (!solutionId) {
        return res.status(400).json({ message: "solutionId is required" });
    }

    try {
        const id = crypto.randomUUID();
        const result = await postgresService.query(
            'INSERT INTO comment (id, "communitySolutionId", content) VALUES ($1, $2, $3) RETURNING *',
            [id, solutionId, content]
        );
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getPerformanceDistribution = async (req: Request, res: Response) => {
    const { slug } = req.params;
    const { language } = req.query;

    try {
        const result = await postgresService.query(
            `SELECT runtime, memory FROM submission 
             WHERE "problemSlug" = $1 AND language = $2 AND status = 'ACCEPTED' 
             AND runtime IS NOT NULL AND memory IS NOT NULL`,
            [slug, language]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};
