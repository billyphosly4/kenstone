-- CreateEnum
CREATE TYPE "DisputeCategory" AS ENUM ('LAND_PROPERTY', 'CIVIL', 'COMMERCIAL', 'FAMILY');

-- CreateEnum
CREATE TYPE "ContactMethod" AS ENUM ('EMAIL', 'PHONE');

-- CreateTable
CREATE TABLE "Enquiry" (
    "id" TEXT NOT NULL,
    "fullName" VARCHAR(150) NOT NULL,
    "email" VARCHAR(254),
    "phone" VARCHAR(40),
    "preferredContactMethod" "ContactMethod",
    "preferredContactTime" VARCHAR(120),
    "disputeCategory" "DisputeCategory" NOT NULL,
    "county" VARCHAR(100) NOT NULL,
    "opponentAware" BOOLEAN NOT NULL,
    "description" VARCHAR(2000) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Enquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademyRegistration" (
    "id" TEXT NOT NULL,
    "fullName" VARCHAR(150) NOT NULL,
    "email" VARCHAR(254),
    "phone" VARCHAR(40),
    "course" VARCHAR(150) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcademyRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsultancyEnquiry" (
    "id" TEXT NOT NULL,
    "organizationName" VARCHAR(200) NOT NULL,
    "contactName" VARCHAR(150) NOT NULL,
    "contactRole" VARCHAR(120),
    "email" VARCHAR(254),
    "phone" VARCHAR(40),
    "county" VARCHAR(100),
    "requestDetails" VARCHAR(2000) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsultancyEnquiry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Enquiry_createdAt_idx" ON "Enquiry"("createdAt");

-- CreateIndex
CREATE INDEX "Enquiry_disputeCategory_county_idx" ON "Enquiry"("disputeCategory", "county");

-- CreateIndex
CREATE INDEX "AcademyRegistration_createdAt_idx" ON "AcademyRegistration"("createdAt");

-- CreateIndex
CREATE INDEX "AcademyRegistration_course_idx" ON "AcademyRegistration"("course");

-- CreateIndex
CREATE INDEX "ConsultancyEnquiry_createdAt_idx" ON "ConsultancyEnquiry"("createdAt");

-- CreateIndex
CREATE INDEX "ConsultancyEnquiry_organizationName_idx" ON "ConsultancyEnquiry"("organizationName");
