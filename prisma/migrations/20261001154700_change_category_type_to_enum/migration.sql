-- CreateEnum
CREATE TYPE "CategoryType" AS ENUM ('POST', 'ACHIEVEMENT', 'PROJECT', 'EVENT');

-- DropForeignKey
ALTER TABLE "category" DROP CONSTRAINT "category_typeId_fkey";

-- DropIndex
DROP INDEX "category_typeId_idx";

-- DropIndex
DROP INDEX "category_typeId_slug_key";

-- AlterTable
ALTER TABLE "category" DROP COLUMN "typeId",
ADD COLUMN     "type" "CategoryType" NOT NULL DEFAULT 'POST';

-- DropTable
DROP TABLE "category_type";

-- CreateIndex
CREATE INDEX "category_type_idx" ON "category"("type");

-- CreateIndex
CREATE UNIQUE INDEX "category_type_slug_key" ON "category"("type", "slug");
