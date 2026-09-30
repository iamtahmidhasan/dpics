-- CreateTable
CREATE TABLE "setting" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "isSignupEnabled" BOOLEAN NOT NULL DEFAULT true,
    "isMemberSignupEnabled" BOOLEAN NOT NULL DEFAULT true,
    "isInstructorSignupEnabled" BOOLEAN NOT NULL DEFAULT true,
    "isRegistrationFeeRequired" BOOLEAN NOT NULL DEFAULT false,
    "registrationFee" INTEGER NOT NULL DEFAULT 0,
    "bkashPersonalNumber" TEXT,
    "bkashAgentNumber" TEXT,
    "nagadPersonalNumber" TEXT,
    "nagadAgentNumber" TEXT,
    "rocketPersonalNumber" TEXT,
    "rocketAgentNumber" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "setting_pkey" PRIMARY KEY ("id")
);
