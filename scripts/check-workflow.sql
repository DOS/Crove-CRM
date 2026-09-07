SELECT id, name, statuses, "lastPublishedVersionId" 
FROM "workspace_ca970340_c49d_4360_90e1_5c9fae597337"."workflow" 
WHERE id = '0f8f4e0c-48d0-42ed-a90f-8657d0df4529';

SELECT id, name, status, "workflowId", trigger, steps
FROM "workspace_ca970340_c49d_4360_90e1_5c9fae597337"."workflowVersion" 
WHERE "workflowId" = '0f8f4e0c-48d0-42ed-a90f-8657d0df4529';
