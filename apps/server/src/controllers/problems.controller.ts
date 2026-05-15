import type { Request, Response, RequestHandler } from "express"
import { problemRegistry } from "../problems/problems.registry.js"
import postgresService from "../services/postgres.services.js"
import rabbitmqService from "../services/rabbitmq.services.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"

export const getAllProblems: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    return res
      .status(200)
      .json(
        new ApiResponse(200, problemRegistry, "Problems fetched successfully")
      )
  }
)

export const getProblemBySlug: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { slug } = req.params
    const problem = problemRegistry.find((p) => p.slug === slug)

    if (!problem) {
      throw new ApiError(404, "Problem not found")
    }

    return res
      .status(200)
      .json(new ApiResponse(200, problem, "Problem fetched successfully"))
  }
)

export const runSolution: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { slug, code, language } = req.body

    const problem = problemRegistry.find((p) => p.slug === slug)
    if (!problem) {
      throw new ApiError(404, "Problem not found")
    }

    const id = crypto.randomUUID()
    const result = await postgresService.query(
      `INSERT INTO test_run (id, "problemSlug", code, language, status) 
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [id, slug, code, language, "PENDING"]
    )
    const testRun = result.rows[0]

    const publicCases = problem.testCases.filter((tc) => tc.isPublic !== false)
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
        isTest: true,
      })
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, { submissionId: testRun.id }, "Test run started")
      )
  }
)

export const submitSolution: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { slug, code, language } = req.body

    const problem = problemRegistry.find((p) => p.slug === slug)
    if (!problem) {
      throw new ApiError(404, "Problem not found")
    }

    const id = crypto.randomUUID()
    const result = await postgresService.query(
      `INSERT INTO submission (id, "problemSlug", code, language, status) 
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [id, slug, code, language, "PENDING"]
    )
    const submission = result.rows[0]

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
        isTest: false,
      })
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { submissionId: submission.id },
          "Submission started"
        )
      )
  }
)

export const getSubmissionStatus: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params
    const result = await postgresService.query(
      "SELECT * FROM submission WHERE id = $1",
      [id]
    )
    const submission = result.rows[0]

    if (!submission) {
      throw new ApiError(404, "Submission not found")
    }

    return res
      .status(200)
      .json(new ApiResponse(200, submission, "Submission status fetched"))
  }
)

export const getTestRunStatus: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params
    const result = await postgresService.query(
      "SELECT * FROM test_run WHERE id = $1",
      [id]
    )
    const testRun = result.rows[0]

    if (!testRun) {
      throw new ApiError(404, "Test run not found")
    }

    return res
      .status(200)
      .json(new ApiResponse(200, testRun, "Test run status fetched"))
  }
)

export const updateSubmissionNotes: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params
    const { notes } = req.body

    const result = await postgresService.query(
      "UPDATE submission SET notes = $1 WHERE id = $2 RETURNING *",
      [notes, id]
    )
    const submission = result.rows[0]

    if (!submission) {
      throw new ApiError(404, "Submission not found")
    }

    return res
      .status(200)
      .json(new ApiResponse(200, submission, "Notes updated successfully"))
  }
)

export const getSubmissionsBySlug: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { slug } = req.params

    const result = await postgresService.query(
      'SELECT * FROM submission WHERE "problemSlug" = $1 ORDER BY "createdAt" DESC LIMIT 20',
      [slug]
    )
    return res
      .status(200)
      .json(
        new ApiResponse(200, result.rows, "Submissions fetched successfully")
      )
  }
)

export const getAllSolutionsBySlug: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { slug } = req.params
    const result = await postgresService.query(
      `SELECT cs.*, 
            (SELECT COUNT(*)::int FROM comment WHERE "communitySolutionId" = cs.id) as comment_count 
         FROM community_solution cs 
         WHERE cs."problemSlug" = $1 
         ORDER BY cs."createdAt" DESC`,
      [slug]
    )
    const solutions = result.rows.map((row) => ({
      ...row,
      _count: { comments: row.comment_count },
    }))
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          solutions,
          "Community solutions fetched successfully"
        )
      )
  }
)

export const postSolution: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { slug } = req.params
    const { title, content, language, code } = req.body

    if (!slug) {
      throw new ApiError(400, "Slug is required")
    }

    const id = crypto.randomUUID()
    const result = await postgresService.query(
      `INSERT INTO community_solution (id, "problemSlug", title, content, language, code) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [id, slug, title, content, language, code]
    )
    return res
      .status(201)
      .json(
        new ApiResponse(201, result.rows[0], "Solution posted successfully")
      )
  }
)

export const likeSolution: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { solutionId } = req.params
    const result = await postgresService.query(
      "UPDATE community_solution SET likes = likes + 1 WHERE id = $1 RETURNING *",
      [solutionId]
    )

    if (result.rows.length === 0) {
      throw new ApiError(404, "Solution not found")
    }

    return res
      .status(200)
      .json(new ApiResponse(200, result.rows[0], "Solution liked successfully"))
  }
)

export const getCommentsBySolutionId: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { solutionId } = req.params
    const result = await postgresService.query(
      'SELECT * FROM comment WHERE "communitySolutionId" = $1 ORDER BY "createdAt" ASC',
      [solutionId]
    )
    return res
      .status(200)
      .json(new ApiResponse(200, result.rows, "Comments fetched successfully"))
  }
)

export const postComment: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { solutionId } = req.params
    const { content } = req.body

    if (!solutionId) {
      throw new ApiError(400, "solutionId is required")
    }

    const id = crypto.randomUUID()
    const result = await postgresService.query(
      'INSERT INTO comment (id, "communitySolutionId", content) VALUES ($1, $2, $3) RETURNING *',
      [id, solutionId, content]
    )
    return res
      .status(201)
      .json(new ApiResponse(201, result.rows[0], "Comment posted successfully"))
  }
)

export const getPerformanceDistribution: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { slug } = req.params
    const { language } = req.query

    const result = await postgresService.query(
      `SELECT runtime, memory FROM submission 
         WHERE "problemSlug" = $1 AND language = $2 AND status = 'ACCEPTED' 
         AND runtime IS NOT NULL AND memory IS NOT NULL`,
      [slug, language]
    )
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          result.rows,
          "Performance distribution fetched successfully"
        )
      )
  }
)
