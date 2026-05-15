import type { Request, Response, NextFunction, RequestHandler } from "express"

const asyncHandler =
  <T = unknown>(
    requestHandler: (
      req: Request,
      res: Response,
      next: NextFunction
    ) => Promise<T>
  ): RequestHandler =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(requestHandler(req, res, next)).catch(next)
  }

export { asyncHandler }
