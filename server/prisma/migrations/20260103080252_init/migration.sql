-- CreateTable
CREATE TABLE "test_run" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "problemSlug" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "output" TEXT,
    "runtime" DOUBLE PRECISION,
    "memory" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "test_run_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_run_result" (
    "id" TEXT NOT NULL,
    "testRunId" TEXT NOT NULL,
    "caseIdx" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "input" TEXT NOT NULL,
    "expected" TEXT NOT NULL,
    "actual" TEXT,
    "error" TEXT,
    "runtime" DOUBLE PRECISION,
    "memory" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "test_run_result_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "test_run_userId_idx" ON "test_run"("userId");

-- CreateIndex
CREATE INDEX "test_run_problemSlug_idx" ON "test_run"("problemSlug");

-- CreateIndex
CREATE INDEX "test_run_result_testRunId_idx" ON "test_run_result"("testRunId");

-- AddForeignKey
ALTER TABLE "test_run" ADD CONSTRAINT "test_run_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_run_result" ADD CONSTRAINT "test_run_result_testRunId_fkey" FOREIGN KEY ("testRunId") REFERENCES "test_run"("id") ON DELETE CASCADE ON UPDATE CASCADE;
