-- AlterTable
ALTER TABLE "setting" ADD COLUMN     "batchMemberLimit" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isAutoStudentIdEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "studentIdBatch" TEXT NOT NULL DEFAULT '24',
ADD COLUMN     "studentIdPrefix" TEXT NOT NULL DEFAULT 'DPICS';
