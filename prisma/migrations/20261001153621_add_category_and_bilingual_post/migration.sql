-- DropIndex
DROP INDEX "Post_category_idx";

-- CreateTable
CREATE TABLE "category_type" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameBn" TEXT,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category" (
    "id" TEXT NOT NULL,
    "typeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameBn" TEXT,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "category_type_name_key" ON "category_type"("name");

-- CreateIndex
CREATE UNIQUE INDEX "category_type_slug_key" ON "category_type"("slug");

-- CreateIndex
CREATE INDEX "category_typeId_idx" ON "category"("typeId");

-- CreateIndex
CREATE UNIQUE INDEX "category_typeId_slug_key" ON "category"("typeId", "slug");

-- AddForeignKey
ALTER TABLE "category" ADD CONSTRAINT "category_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "category_type"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Insert default CategoryTypes for reuse
INSERT INTO "category_type" ("id", "name", "nameBn", "slug", "description", "isActive", "createdAt", "updatedAt")
VALUES
    ('ctype_post', 'Post', 'পোস্ট', 'post', 'Categories for blog articles and announcements', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('ctype_project', 'Project', 'প্রজেক্ট', 'project', 'Categories for showcase projects and repositories', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('ctype_event', 'Event', 'ইভেন্ট', 'event', 'Categories for workshops, seminars, and contests', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('ctype_achievement', 'Achievement', 'অর্জন', 'achievement', 'Categories for awards, recognitions, and milestones', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;

-- Insert default Categories for Post
INSERT INTO "category" ("id", "typeId", "name", "nameBn", "slug", "description", "isActive", "createdAt", "updatedAt")
VALUES
    ('cat_post_announcement', 'ctype_post', 'Announcement', 'ঘোষণা', 'announcement', 'Society announcements and news', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('cat_post_tutorial', 'ctype_post', 'Tutorial', 'টিউটোরিয়াল', 'tutorial', 'Guides and tutorials', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('cat_post_workshop', 'ctype_post', 'Workshop', 'ওয়ার্কশপ', 'workshop', 'Hands-on workshop content', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('cat_post_event_recap', 'ctype_post', 'Event recap', 'ইভেন্ট রিক্যাপ', 'event-recap', 'Summaries of past events', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('cat_post_technical', 'ctype_post', 'Technical', 'টেকনিক্যাল', 'technical', 'In-depth engineering writeups', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('cat_post_research', 'ctype_post', 'Research', 'গবেষণা', 'research', 'Research papers and explorations', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('cat_post_achievement', 'ctype_post', 'Achievement', 'অর্জন', 'achievement', 'Competition wins and recognitions', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('cat_post_general', 'ctype_post', 'General', 'সাধারণ', 'general', 'General computing topics', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("typeId", "slug") DO NOTHING;

-- AlterTable Post: add new columns
ALTER TABLE "Post"
ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "contentBn" TEXT,
ADD COLUMN     "excerptBn" TEXT,
ADD COLUMN     "titleBn" TEXT;

-- Migrate existing Post categories to categoryId if any exist
UPDATE "Post" SET "categoryId" = 'cat_post_announcement' WHERE "category"::text = 'ANNOUNCEMENT';
UPDATE "Post" SET "categoryId" = 'cat_post_tutorial' WHERE "category"::text = 'TUTORIAL';
UPDATE "Post" SET "categoryId" = 'cat_post_workshop' WHERE "category"::text = 'WORKSHOP';
UPDATE "Post" SET "categoryId" = 'cat_post_event_recap' WHERE "category"::text = 'EVENT_RECAP';
UPDATE "Post" SET "categoryId" = 'cat_post_technical' WHERE "category"::text = 'TECHNICAL';
UPDATE "Post" SET "categoryId" = 'cat_post_research' WHERE "category"::text = 'RESEARCH';
UPDATE "Post" SET "categoryId" = 'cat_post_achievement' WHERE "category"::text = 'ACHIEVEMENT';
UPDATE "Post" SET "categoryId" = 'cat_post_general' WHERE "category"::text = 'GENERAL';

-- Drop the old category column and enum
ALTER TABLE "Post" DROP COLUMN "category";
DROP TYPE "PostCategory";

-- CreateIndex
CREATE INDEX "Post_categoryId_idx" ON "Post"("categoryId");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
