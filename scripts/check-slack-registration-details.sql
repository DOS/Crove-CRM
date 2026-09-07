SELECT id, name, "sourcePackage", "sourceType", "isListed", "isVetted" 
FROM core."applicationRegistration" 
WHERE name ILIKE '%slack%';
