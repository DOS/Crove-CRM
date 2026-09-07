-- Run all instance schema migrations for timelineActivityType from 2.33 to 2.38
ALTER TABLE "core"."timelineActivityType" ADD COLUMN IF NOT EXISTS "targetRelationFieldUniversalIdentifier" uuid;
ALTER TABLE "core"."timelineActivityType" ADD COLUMN IF NOT EXISTS "triggerFieldUniversalIdentifiers" uuid[];
ALTER TABLE "core"."timelineActivityType" ADD COLUMN IF NOT EXISTS "happensAtFieldUniversalIdentifier" uuid;
ALTER TABLE "core"."timelineActivityType" ADD COLUMN IF NOT EXISTS "replacesTimelineActivityTypeUniversalIdentifier" uuid;
ALTER TABLE "core"."timelineActivityType" ADD COLUMN IF NOT EXISTS "frontComponentUniversalIdentifier" uuid;
ALTER TABLE "core"."timelineActivityType" ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true;
ALTER TABLE "core"."timelineActivityType" ADD COLUMN IF NOT EXISTS "overrides" text;

SELECT column_name, data_type FROM information_schema.columns 
WHERE table_schema = 'core' AND table_name = 'timelineActivityType';
