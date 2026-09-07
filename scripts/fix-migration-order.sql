-- Update createdAt timestamps in core."upgradeMigration" to be strictly chronological based on the command timestamp
-- The command name format is: <version>_<ClassName>_<timestamp>

UPDATE core."upgradeMigration"
SET "createdAt" = to_timestamp(substring(name from '_([0-9]{13})$')::bigint / 1000.0)
WHERE name ~ '_[0-9]{13}$';

-- Check top 10 latest instance commands by createdAt
SELECT name, status, "executedByVersion", "createdAt" 
FROM core."upgradeMigration" 
WHERE "workspaceId" IS NULL 
ORDER BY "createdAt" DESC 
LIMIT 10;
