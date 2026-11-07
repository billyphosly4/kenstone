CREATE TABLE "AcademyCourse" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(180) NOT NULL,
    "summary" VARCHAR(2000) NOT NULL,
    "requirements" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "learningOutcomes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcademyCourse_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AcademyCourse_title_key" ON "AcademyCourse"("title");
CREATE INDEX "AcademyCourse_isPublished_title_idx" ON "AcademyCourse"("isPublished", "title");

ALTER TABLE "AcademyRegistration"
    ADD COLUMN "courseId" TEXT,
    ADD COLUMN "phoneNumber" VARCHAR(40),
    ADD COLUMN "notes" VARCHAR(1000);

CREATE INDEX "AcademyRegistration_courseId_idx" ON "AcademyRegistration"("courseId");

ALTER TABLE "AcademyRegistration"
    ADD CONSTRAINT "AcademyRegistration_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "AcademyCourse"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
