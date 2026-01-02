import type { Request, Response } from "express";
import { prisma } from "../services/prisma.services";
import logger from "../logger/winston.logger";

import { contestRegistry } from "../features/contests/contests.registry";

interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        name: string;
    }
}

export const getContests = async (req: AuthRequest, res: Response) => {
  try {
    const contestIds = contestRegistry.map(c => c.id);
    
    // Get registration counts from DB
    const registrationCounts = await (prisma as any).contestRegistration.groupBy({
      by: ['contestId'],
      where: {
        contestId: { in: contestIds }
      },
      _count: {
        id: true
      }
    });

    const countsMap = Object.fromEntries(
      registrationCounts.map((rc: any) => [rc.contestId, rc._count.id])
    );

    // Get user registrations if authenticated
    let userRegistrations: Set<string> = new Set();
    const userId = (req as any).user?.id;
    if (userId) {
      const registrations = await (prisma as any).contestRegistration.findMany({
        where: { userId },
        select: { contestId: true }
      });
      userRegistrations = new Set(registrations.map((r: any) => r.contestId));
    }

    const contests = contestRegistry.map(contest => ({
      ...contest,
      registrationCount: countsMap[contest.id] || 0,
      isRegistered: userRegistrations.has(contest.id)
    }));

    res.json(contests);
  } catch (error) {
    logger.error("Failed to fetch contests:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const registerForContest = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    // We check existence against registry
    const contest = contestRegistry.find(c => c.id === id);

    if (!contest) {
      return res.status(404).json({ message: "Contest not found" });
    }

    if (new Date() > new Date(contest.endTime)) {
      return res.status(400).json({ message: "Contest has already ended." });
    }

    const registration = await (prisma as any).contestRegistration.upsert({
      where: {
        contestId_userId: {
          contestId: id,
          userId
        }
      },
      create: {
        contestId: id,
        userId
      },
      update: {}
    });

    res.json(registration);
  } catch (error) {
    logger.error("Failed to register for contest:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getContestStatus = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;
  
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
  
    try {
      const registration = await (prisma as any).contestRegistration.findUnique({
        where: {
          contestId_userId: {
            contestId: id,
            userId
          }
        }
      });
  
      res.json({ registered: !!registration });
    } catch (error) {
      logger.error("Failed to get contest status:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

export const getContestBySlug = async (req: AuthRequest, res: Response) => {
    const { slug } = req.params;
    const userId = req.user?.id;

    try {
        const contest = contestRegistry.find(c => c.slug === slug);
        if (!contest) {
            return res.status(404).json({ message: "Contest not found" });
        }

        // Get registration count
        const registrationCount = await (prisma as any).contestRegistration.count({
            where: { contestId: contest.id }
        });

        // Check if current user is registered
        let isRegistered = false;
        if (userId) {
            const reg = await (prisma as any).contestRegistration.findUnique({
                where: {
                    contestId_userId: {
                        contestId: contest.id,
                        userId
                    }
                }
            });
            isRegistered = !!reg;
        }

        // Fetch problems for the contest
        const problems = await Promise.all(contest.problemSlugs.map(async (pSlug) => {
            // Internal fetch or registry access? 
            // We can just return the slugs for now or fetch basic info
            return {
                slug: pSlug,
                title: pSlug.split('-').map(w => w.charAt(0)).join('').toUpperCase(), // Mock title if info not readily available here
            };
        }));

        res.json({
            ...contest,
            registrationCount,
            isRegistered,
            problems
        });
    } catch (error) {
        logger.error("Failed to get contest by slug:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Admin/Internal helper to create a contest (Mocked for now since using registry)
export const createContest = async (req: Request, res: Response) => {
   res.status(403).json({ message: "Contests are managed via registry files." });
};
