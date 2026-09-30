/*
  Warnings:

  - The `image` column on the `user` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[phone]` on the table `user` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'MEMBER', 'INSTRUCTOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'EXPIRED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('BKASH', 'NAGAD', 'ROCKET', 'HAND_TO_HAND', 'CASH');

-- CreateEnum
CREATE TYPE "Department" AS ENUM ('COMPUTER_SCIENCE_AND_TECHNOLOGY', 'CIVIL_TECHNOLOGY', 'ELECTRICAL_TECHNOLOGY', 'ELECTRONICS_TECHNOLOGY', 'MECHANICAL_TECHNOLOGY', 'POWER_TECHNOLOGY', 'RAC_TECHNOLOGY', 'ARCHITECTURE_TECHNOLOGY', 'FOOD_TECHNOLOGY', 'CHEMICAL_TECHNOLOGY', 'TELECOMMUNICATION_TECHNOLOGY', 'AUTOMOBILE_TECHNOLOGY', 'CONSTRUCTION_TECHNOLOGY', 'ENVIRONMENTAL_TECHNOLOGY', 'GRAPHIC_DESIGN_TECHNOLOGY', 'SURVEYING_TECHNOLOGY', 'OTHER');

-- CreateEnum
CREATE TYPE "Semester" AS ENUM ('FIRST', 'SECOND', 'THIRD', 'FOURTH', 'FIFTH', 'SIXTH', 'SEVENTH', 'EIGHTH');

-- CreateEnum
CREATE TYPE "Shift" AS ENUM ('MORNING', 'DAY');

-- CreateEnum
CREATE TYPE "InstructorStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED');

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "phone" TEXT,
DROP COLUMN "image",
ADD COLUMN     "image" TEXT[];

-- CreateTable
CREATE TABLE "UserRole" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'PENDING',
    "joinedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "studentId" TEXT,
    "whatsapp" TEXT NOT NULL,
    "department" "Department" NOT NULL,
    "session" TEXT NOT NULL,
    "semester" "Semester" NOT NULL,
    "shift" "Shift" NOT NULL,
    "studentIdCardUrl" TEXT,
    "nidorbirthUrl" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedAt" TIMESTAMP(3),
    "verifiedById" TEXT,
    "hasPaidMembershipFee" BOOLEAN NOT NULL DEFAULT false,
    "paymentMethod" "PaymentMethod",
    "senderNumber" TEXT,
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Instructor" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "instructorId" TEXT,
    "bio" TEXT,
    "expertise" TEXT,
    "status" "InstructorStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Instructor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Committee" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Committee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommitteeRole" (
    "id" TEXT NOT NULL,
    "committeeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommitteeRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCommitteeRole" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserCommitteeRole_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserRole_userId_idx" ON "UserRole"("userId");

-- CreateIndex
CREATE INDEX "UserRole_role_idx" ON "UserRole"("role");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_userId_role_key" ON "UserRole"("userId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "Member_userId_key" ON "Member"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Member_studentId_key" ON "Member"("studentId");

-- CreateIndex
CREATE INDEX "Member_department_idx" ON "Member"("department");

-- CreateIndex
CREATE INDEX "Member_session_idx" ON "Member"("session");

-- CreateIndex
CREATE INDEX "Member_semester_idx" ON "Member"("semester");

-- CreateIndex
CREATE INDEX "Member_status_idx" ON "Member"("status");

-- CreateIndex
CREATE INDEX "Member_transactionId_idx" ON "Member"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "Instructor_userId_key" ON "Instructor"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Instructor_instructorId_key" ON "Instructor"("instructorId");

-- CreateIndex
CREATE UNIQUE INDEX "Committee_slug_key" ON "Committee"("slug");

-- CreateIndex
CREATE INDEX "CommitteeRole_committeeId_idx" ON "CommitteeRole"("committeeId");

-- CreateIndex
CREATE UNIQUE INDEX "CommitteeRole_committeeId_slug_key" ON "CommitteeRole"("committeeId", "slug");

-- CreateIndex
CREATE INDEX "UserCommitteeRole_userId_idx" ON "UserCommitteeRole"("userId");

-- CreateIndex
CREATE INDEX "UserCommitteeRole_roleId_idx" ON "UserCommitteeRole"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "UserCommitteeRole_userId_roleId_key" ON "UserCommitteeRole"("userId", "roleId");

-- CreateIndex
CREATE UNIQUE INDEX "user_phone_key" ON "user"("phone");

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Instructor" ADD CONSTRAINT "Instructor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommitteeRole" ADD CONSTRAINT "CommitteeRole_committeeId_fkey" FOREIGN KEY ("committeeId") REFERENCES "Committee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCommitteeRole" ADD CONSTRAINT "UserCommitteeRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCommitteeRole" ADD CONSTRAINT "UserCommitteeRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "CommitteeRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;
