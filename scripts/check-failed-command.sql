SELECT name, status, "errorMessage", "createdAt" 
FROM core."upgradeMigration" 
WHERE name = '2.33.0_ReplaceTimelineActivityNameWithTypeCommand_1787400001000'
ORDER BY "createdAt" DESC LIMIT 5;
