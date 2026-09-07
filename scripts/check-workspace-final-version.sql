SELECT DISTINCT ON (name) name, status, "executedByVersion", "createdAt" 
FROM core."upgradeMigration" 
WHERE "workspaceId" = 'ca970340-c49d-4360-90e1-5c9fae597337'
ORDER BY name, "createdAt" DESC;
