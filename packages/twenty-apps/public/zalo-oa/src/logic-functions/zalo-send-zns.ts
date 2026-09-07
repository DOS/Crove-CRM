import { defineLogicFunction } from 'twenty-sdk/define';

import { ZALO_SEND_ZNS_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { zaloSendZnsHandler } from 'src/logic-functions/handlers/zalo-send-zns-handler';
import { zaloSendZnsInputSchema } from 'src/logic-functions/schemas/zalo-send-zns-input.schema';
import { jsonSchemaToInputSchema } from 'src/logic-functions/utils/json-schema-to-input-schema';

export default defineLogicFunction({
  universalIdentifier: ZALO_SEND_ZNS_UNIVERSAL_IDENTIFIER,
  name: 'zalo-send-zns',
  description:
    'Send automated Zalo Notification Service (ZNS) template notifications (Order confirmation, booking reminder, payment alert) to phone numbers.',
  timeoutSeconds: 30,
  toolTriggerSettings: {
    inputSchema: zaloSendZnsInputSchema,
  },
  workflowActionTriggerSettings: {
    label: 'Send Zalo ZNS Template',
    icon: 'IconBell',
    inputSchema: jsonSchemaToInputSchema(zaloSendZnsInputSchema),
    outputSchema: [
      {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          msgId: { type: 'string' },
          sentTime: { type: 'string' },
          error: { type: 'string' },
        },
      },
    ],
  },
  handler: zaloSendZnsHandler,
});
