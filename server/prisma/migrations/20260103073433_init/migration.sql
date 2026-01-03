-- AlterTable
ALTER TABLE "submission" ADD COLUMN     "memory" DOUBLE PRECISION,
ADD COLUMN     "runtime" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "test_case_result" ADD COLUMN     "memory" DOUBLE PRECISION,
ALTER COLUMN "runtime" SET DATA TYPE DOUBLE PRECISION;
