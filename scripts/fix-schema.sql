-- 1. Ensure state column exists in core.application and has no nulls
ALTER TABLE "core"."application" ADD COLUMN IF NOT EXISTS "state" text NOT NULL DEFAULT 'INSTALLED';
UPDATE "core"."application" SET "state" = 'INSTALLED' WHERE "state" IS NULL;

-- 2. Ensure core.timelineActivityType table exists
CREATE TABLE IF NOT EXISTS "core"."timelineActivityType" (
  "workspaceId" uuid NOT NULL,
  "universalIdentifier" uuid NOT NULL,
  "applicationId" uuid NOT NULL,
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "name" character varying NOT NULL,
  "label" character varying NOT NULL,
  "action" character varying,
  "icon" character varying,
  "renderer" character varying,
  "objectUniversalIdentifier" uuid,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT "IDX_TIMELINE_ACTIVITY_TYPE_NAME_APPLICATION_WORKSPACE_UNIQUE" UNIQUE ("name", "applicationId", "workspaceId"),
  CONSTRAINT "PK_timeline_activity_type_id" PRIMARY KEY ("id")
);

-- 3. Check core.application contents
SELECT id, name, state FROM "core"."application";
