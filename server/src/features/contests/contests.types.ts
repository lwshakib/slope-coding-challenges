export interface Contest {
  id: string;
  slug: string;
  title: string;
  description: string;
  startTime: string; // ISO format
  endTime: string;   // ISO format
  prizes?: string;
  problemSlugs: string[]; // Slugs of problems included in this contest
}
