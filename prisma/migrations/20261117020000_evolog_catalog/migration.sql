ALTER TABLE "Project" ADD COLUMN "integrationKey" VARCHAR(64);
ALTER TABLE "Screen" ALTER COLUMN "route" DROP NOT NULL,
    ADD COLUMN "sourceDirectory" VARCHAR(1000);
ALTER TABLE "TestCase" ADD COLUMN "specPath" VARCHAR(1000),
    ADD COLUMN "specAvailable" BOOLEAN NOT NULL DEFAULT true;

CREATE UNIQUE INDEX "Project_integrationKey_key" ON "Project"("integrationKey");
CREATE UNIQUE INDEX "Screen_projectId_sourceDirectory_key" ON "Screen"("projectId", "sourceDirectory");
CREATE UNIQUE INDEX "TestCase_projectId_specPath_key" ON "TestCase"("projectId", "specPath");

WITH selected AS (
    SELECT "id" FROM "Project"
    WHERE lower("name") = 'evologcypress'
    ORDER BY "createdAt", "id"
    LIMIT 1
)
UPDATE "Project"
SET "integrationKey" = 'evolog-cypress', "name" = 'evologCypress', "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" IN (SELECT "id" FROM selected);

INSERT INTO "Project" ("id", "name", "integrationKey", "updatedAt")
SELECT '9700ca86-ea96-4c20-95fb-9522a71f2665'::uuid, 'evologCypress', 'evolog-cypress', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Project" WHERE "integrationKey" = 'evolog-cypress');
