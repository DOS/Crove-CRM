import { defineLogicFunction } from 'twenty-sdk/define';

import { ZALO_GET_OA_PROFILE_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { zaloGetOaProfileHandler } from 'src/logic-functions/handlers/zalo-get-oa-profile-handler';

export default defineLogicFunction({
  universalIdentifier: ZALO_GET_OA_PROFILE_UNIVERSAL_IDENTIFIER,
  name: 'zalo-get-oa-profile',
  description:
    'Retrieve profile information, follower count, and verification status of the connected Zalo Official Account.',
  timeoutSeconds: 30,
  workflowActionTriggerSettings: {
    label: 'Get Zalo OA Profile',
    icon: 'IconInfoCircle',
    inputSchema: [],
    outputSchema: [
      {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          error: { type: 'string' },
        },
      },
    ],
  },
  handler: zaloGetOaProfileHandler,
});
