SELECT name, status, "executedByVersion", "createdAt" 
FROM core."upgradeMigration" 
WHERE "workspaceId" IS NULL
ORDER BY "createdAt" DESC LIMIT 20;
