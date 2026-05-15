import type { Request, Response, RequestHandler } from "express";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getProfile: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const user = {
    id: "GUEST_USER",
    name: "Guest Explorer",
    email: "guest@slope.app",
    image: null,
    points: 0,
    createdAt: new Date(),
    solvedCount: 0,
    difficultyCounts: {
      Easy: 0,
      Medium: 0,
      Hard: 0
    },
    recentSubmissions: []
  };

  return res.status(200).json(new ApiResponse(200, user, "Profile fetched successfully"));
});
