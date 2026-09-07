SELECT id, name, "sourcePackage", "isConfigured" FROM core."applicationRegistration" WHERE name ILIKE '%slack%';
SELECT id, "applicationRegistrationId", key, "isSecret" FROM core."applicationRegistrationVariable";
