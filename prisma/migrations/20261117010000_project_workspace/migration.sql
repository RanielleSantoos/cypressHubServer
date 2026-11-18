-- CreateEnum
CREATE TYPE "Recurrence" AS ENUM ('ONCE', 'DAILY', 'WEEKLY');

-- CreateTable
CREATE TABLE "Screen" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "route" VARCHAR(300) NOT NULL,

    CONSTRAINT "Screen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestCase" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "screenId" UUID,
    "name" VARCHAR(120) NOT NULL,

    CONSTRAINT "TestCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Schedule" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "screenId" UUID,
    "testId" UUID,
    "startAt" TIMESTAMPTZ(3) NOT NULL,
    "recurrence" "Recurrence" NOT NULL,

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Screen_projectId_name_id_idx" ON "Screen"("projectId", "name", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Screen_projectId_id_key" ON "Screen"("projectId", "id");

-- CreateIndex
CREATE INDEX "TestCase_projectId_name_id_idx" ON "TestCase"("projectId", "name", "id");

-- CreateIndex
CREATE INDEX "TestCase_screenId_idx" ON "TestCase"("screenId");

-- CreateIndex
CREATE UNIQUE INDEX "TestCase_projectId_id_key" ON "TestCase"("projectId", "id");

-- CreateIndex
CREATE INDEX "Schedule_projectId_startAt_id_idx" ON "Schedule"("projectId", "startAt", "id");

-- CreateIndex
CREATE INDEX "Schedule_screenId_idx" ON "Schedule"("screenId");

-- CreateIndex
CREATE INDEX "Schedule_testId_idx" ON "Schedule"("testId");

-- AddForeignKey
ALTER TABLE "Screen" ADD CONSTRAINT "Screen_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestCase" ADD CONSTRAINT "TestCase_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestCase" ADD CONSTRAINT "TestCase_projectId_screenId_fkey" FOREIGN KEY ("projectId", "screenId") REFERENCES "Screen"("projectId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_projectId_screenId_fkey" FOREIGN KEY ("projectId", "screenId") REFERENCES "Screen"("projectId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_projectId_testId_fkey" FOREIGN KEY ("projectId", "testId") REFERENCES "TestCase"("projectId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;


-- A schedule targets the entire project, one screen, or one test.
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_one_target" CHECK (num_nonnulls("screenId", "testId") <= 1);
