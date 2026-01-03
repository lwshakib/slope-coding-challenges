import type { Request, Response } from "express";
import { prisma } from "../services/prisma.services";
import { problemRegistry } from "../features/problems/problems.registry";

export const getProfile = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;

    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                points: true,
                createdAt: true,
            }
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Count unique problems solved and group by difficulty
        const solvedSubmissions = await prisma.submission.groupBy({
            by: ['problemSlug'],
            where: {
                userId,
                status: 'ACCEPTED'
            }
        });

        const solvedSlugs = solvedSubmissions.map(s => s.problemSlug);
        
        const difficultyCounts = {
            Easy: 0,
            Medium: 0,
            Hard: 0
        };

        solvedSlugs.forEach(slug => {
            const problem = problemRegistry.find(p => p.slug === slug);
            if (problem && problem.difficulty in difficultyCounts) {
                difficultyCounts[problem.difficulty as keyof typeof difficultyCounts]++;
            }
        });

        // Get recent submissions
        const recentSubmissions = await prisma.submission.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: {
                id: true,
                problemSlug: true,
                status: true,
                language: true,
                createdAt: true,
            }
        });

        res.json({
            ...user,
            solvedCount: solvedSlugs.length,
            difficultyCounts,
            recentSubmissions
        });
    } catch (error) {
        console.error("Failed to fetch profile:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
