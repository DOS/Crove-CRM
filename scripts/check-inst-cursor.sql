-- Let's check the instance cursor:
SELECT name, status, "executedByVersion", "createdAt" 
FROM core."upgradeMigration" 
WHERE "workspaceId" IS NULL AND "isInitial" = false 
ORDER BY "createdAt" DESC 
LIMIT 5;
