CREATE UNIQUE INDEX "Schedule_projectId_id_key" ON "Schedule"("projectId", "id");

CREATE TABLE "ScheduleScreen" (
    "projectId" UUID NOT NULL,
    "scheduleId" UUID NOT NULL,
    "screenId" UUID NOT NULL,
    CONSTRAINT "ScheduleScreen_pkey" PRIMARY KEY ("scheduleId", "screenId")
);

CREATE INDEX "ScheduleScreen_projectId_screenId_idx" ON "ScheduleScreen"("projectId", "screenId");

ALTER TABLE "ScheduleScreen" ADD CONSTRAINT "ScheduleScreen_projectId_scheduleId_fkey"
    FOREIGN KEY ("projectId", "scheduleId") REFERENCES "Schedule"("projectId", "id") ON DELETE CASCADE ON UPDATE RESTRICT;
ALTER TABLE "ScheduleScreen" ADD CONSTRAINT "ScheduleScreen_projectId_screenId_fkey"
    FOREIGN KEY ("projectId", "screenId") REFERENCES "Screen"("projectId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
