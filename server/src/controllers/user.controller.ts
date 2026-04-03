import type { Request, Response } from "express";

export const getProfile = async (req: Request, res: Response) => {
    try {
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

        res.json(user);
    } catch (error) {
        console.error("Failed to fetch profile:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
