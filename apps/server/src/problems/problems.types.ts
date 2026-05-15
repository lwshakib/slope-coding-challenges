export type Difficulty = "Easy" | "Medium" | "Hard";

export interface TestCase {
  input: string;
  expectedOutput: string;
  isPublic: boolean;
}

export interface Problem {
  id: string;
  slug: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  category: string;
  tags: string[];
  testCases: TestCase[];
  functionName: string;
  acceptance?: string;
  starterCode?: Record<string, string>;
  timeComplexity?: string;
  spaceComplexity?: string;
  isContestOnly?: boolean;
  editorial?: {
    approach: string;
    solutionCode: Record<string, string>;
  };
}
