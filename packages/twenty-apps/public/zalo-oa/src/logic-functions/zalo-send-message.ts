import { defineLogicFunction } from 'twenty-sdk/define';

import { ZALO_SEND_MESSAGE_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { zaloSendMessageHandler } from 'src/logic-functions/handlers/zalo-send-message-handler';
import { zaloSendMessageInputSchema } from 'src/logic-functions/schemas/zalo-send-message-input.schema';
import { jsonSchemaToInputSchema } from 'src/logic-functions/utils/json-schema-to-input-schema';

export default defineLogicFunction({
  universalIdentifier: ZALO_SEND_MESSAGE_UNIVERSAL_IDENTIFIER,
  name: 'zalo-send-message',
  description:
    'Send a 1-on-1 customer service text message to a customer via Zalo Official Account.',
  timeoutSeconds: 30,
  toolTriggerSettings: {
    inputSchema: zaloSendMessageInputSchema,
  },
  workflowActionTriggerSettings: {
    label: 'Send Zalo Message',
    icon: 'IconBrandTelegram',
    inputSchema: jsonSchemaToInputSchema(zaloSendMessageInputSchema),
    outputSchema: [
      {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          messageId: { type: 'string' },
          userId: { type: 'string' },
          error: { type: 'string' },
        },
      },
    ],
  },
  handler: zaloSendMessageHandler,
});
