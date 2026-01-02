-- CreateTable
CREATE TABLE "test_case_result" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "caseIdx" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "input" TEXT NOT NULL,
    "expected" TEXT NOT NULL,
    "actual" TEXT,
    "error" TEXT,
    "runtime" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "test_case_result_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "test_case_result_submissionId_idx" ON "test_case_result"("submissionId");

-- AddForeignKey
ALTER TABLE "test_case_result" ADD CONSTRAINT "test_case_result_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
