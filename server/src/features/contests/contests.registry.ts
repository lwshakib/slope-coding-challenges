import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import type { Contest } from "./contests.types";
import { prisma } from "../../services/prisma.services";
import logger from "../../logger/winston.logger";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, "data");

const loadContests = (): Contest[] => {
  const contests: Contest[] = [];
  
  if (!fs.existsSync(DATA_DIR)) {
    return [];
  }

  const contestFolders = fs.readdirSync(DATA_DIR);

  for (const folder of contestFolders) {
    const folderPath = path.join(DATA_DIR, folder);
    
    if (fs.statSync(folderPath).isDirectory()) {
      try {
        const metadataPath = path.join(folderPath, "metadata.json");
        const descriptionPath = path.join(folderPath, "description.md");

        if (!fs.existsSync(metadataPath)) continue;

        const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
        const description = fs.existsSync(descriptionPath) 
          ? fs.readFileSync(descriptionPath, "utf8") 
          : "";
        
        contests.push({
          ...metadata,
          description: description || metadata.description,
        });
      } catch (error) {
        console.error(`Failed to load contest from ${folder}:`, error);
      }
    }
  }

  return contests.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
};

export const contestRegistry: Contest[] = loadContests();

export const syncContestsToDB = async () => {
  logger.info("Syncing contests to database...");
  for (const contest of contestRegistry) {
    try {
      const dbContest = await (prisma as any).contest.upsert({
        where: { id: contest.id },
        update: {
          title: contest.title,
          description: contest.description,
          slug: contest.slug,
          startTime: new Date(contest.startTime),
          endTime: new Date(contest.endTime),
          prizes: contest.prizes
        },
        create: {
          id: contest.id,
          title: contest.title,
          description: contest.description,
          slug: contest.slug,
          startTime: new Date(contest.startTime),
          endTime: new Date(contest.endTime),
          prizes: contest.prizes
        }
      });

      // Sync problems for this contest
      if (contest.problemSlugs) {
        // Delete problems not in the registry anymore? 
        // For simplicity, let's just create/update them
        for (let i = 0; i < contest.problemSlugs.length; i++) {
          const problemSlug = contest.problemSlugs[i];
          await (prisma as any).contestProblem.upsert({
            where: {
              contestId_problemSlug: {
                contestId: dbContest.id,
                problemSlug
              }
            },
            update: {
              order: i
            },
            create: {
              contestId: dbContest.id,
              problemSlug,
              order: i
            }
          });
        }
      }
    } catch (error) {
      logger.error(`Failed to sync contest ${contest.id}:`, error);
    }
  }
  logger.info("Contests sync complete.");
};
