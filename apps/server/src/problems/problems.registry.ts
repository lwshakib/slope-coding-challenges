import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { Problem } from "./problems.types.js";
import logger from "../logger/winston.logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, "..", "..", "problems-data");

const loadProblems = (): Problem[] => {
  const problems: Problem[] = [];
  
  if (!fs.existsSync(DATA_DIR)) {
    logger.warn(`Problems data directory not found: ${DATA_DIR}`);
    return [];
  }

  const problemFolders = fs.readdirSync(DATA_DIR);

  for (const folder of problemFolders) {
    const folderPath = path.join(DATA_DIR, folder);
    
    if (fs.statSync(folderPath).isDirectory()) {
      try {
        const metadata = JSON.parse(fs.readFileSync(path.join(folderPath, "metadata.json"), "utf8"));
        const description = fs.readFileSync(path.join(folderPath, "description.md"), "utf8");
        const testCases = JSON.parse(fs.readFileSync(path.join(folderPath, "test-cases.json"), "utf8"));
        
        let starterCode = {};
        const starterCodePath = path.join(folderPath, "starter-code.json");
        if (fs.existsSync(starterCodePath)) {
          starterCode = JSON.parse(fs.readFileSync(starterCodePath, "utf8"));
        }

        let editorial = undefined;
        const editorialPath = path.join(folderPath, "editorial.json");
        if (fs.existsSync(editorialPath)) {
          editorial = JSON.parse(fs.readFileSync(editorialPath, "utf8"));
        }

        problems.push({
          ...metadata,
          description,
          testCases,
          starterCode,
          editorial
        });
      } catch (error) {
        logger.error(`Failed to load problem from ${folder}: ${error}`);
      }
    }
  }

  return problems.sort((a, b) => Number(a.id) - Number(b.id));
};

export const problemRegistry: Problem[] = loadProblems();
