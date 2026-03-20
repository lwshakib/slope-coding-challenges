/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `contest` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "contest" ADD COLUMN     "slug" TEXT;

-- AlterTable
ALTER TABLE "submission" ADD COLUMN     "contestId" TEXT;

-- AlterTable
ALTER TABLE "test_run" ADD COLUMN     "contestId" TEXT;

-- CreateTable
CREATE TABLE "contest_problem" (
    "id" TEXT NOT NULL,
    "contestId" TEXT NOT NULL,
    "problemSlug" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "contest_problem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contest_progress" (
    "id" TEXT NOT NULL,
    "contestId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentOrder" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contest_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "contest_problem_contestId_problemSlug_key" ON "contest_problem"("contestId", "problemSlug");

-- CreateIndex
CREATE UNIQUE INDEX "contest_problem_contestId_order_key" ON "contest_problem"("contestId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "contest_progress_contestId_userId_key" ON "contest_progress"("contestId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "contest_slug_key" ON "contest"("slug");

-- AddForeignKey
ALTER TABLE "contest_problem" ADD CONSTRAINT "contest_problem_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
