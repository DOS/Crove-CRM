const { Client } = require("pg");

async function fix() {
  const client = new Client({
    connectionString: process.env.PG_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  console.log("Connected to PostgreSQL successfully.");

  // Check columns in core.application
  const res = await client.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'core' AND table_name = 'application'
  `);
  console.log("core.application columns:", res.rows);

  // Check if state column exists
  const hasState = res.rows.some(r => r.column_name === 'state');
  if (!hasState) {
    console.log("Adding state column to core.application...");
    await client.query(`
      ALTER TABLE "core"."application" 
      ADD COLUMN IF NOT EXISTS "state" text NOT NULL DEFAULT 'INSTALLED'
    `);
    console.log("Added state column.");
  } else {
    console.log("Updating null states to INSTALLED...");
    await client.query(`
      UPDATE "core"."application" 
      SET "state" = 'INSTALLED' 
      WHERE "state" IS NULL
    `);
    console.log("Updated null states.");
  }

  // Check timelineActivityType table
  const tabRes = await client.query(`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'core' AND table_name = 'timelineActivityType'
    );
  `);
  console.log("timelineActivityType exists:", tabRes.rows[0].exists);

  if (!tabRes.rows[0].exists) {
    console.log("Creating core.timelineActivityType table...");
    await client.query(`
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
    `);
    console.log("Created core.timelineActivityType table.");
  }

  await client.end();
  console.log("Done!");
}

fix().catch(err => {
  console.error("Fix script error:", err);
  process.exit(1);
});
