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
  acceptance?: string;
  starterCode?: Record<string, string>;
}
