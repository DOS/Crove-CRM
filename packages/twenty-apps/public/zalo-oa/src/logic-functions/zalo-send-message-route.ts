import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { ZALO_SEND_MESSAGE_ROUTE_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { zaloSendMessageHandler } from 'src/logic-functions/handlers/zalo-send-message-handler';

const handler = async (event: RoutePayload) => {
  const body = event.body as Record<string, unknown> | null;
  const rawUserId = body?.userId;
  const rawMessageText = body?.messageText;

  if (typeof rawUserId !== 'string' || typeof rawMessageText !== 'string') {
    return {
      success: false,
      message: 'Failed to send Zalo message',
      error: '`userId` and `messageText` must be strings.',
    };
  }

  const userId = rawUserId.trim();
  const messageText = rawMessageText.trim();

  if (userId.length === 0 || messageText.length === 0) {
    return {
      success: false,
      message: 'Failed to send Zalo message',
      error: '`userId` and `messageText` are required.',
    };
  }

  return zaloSendMessageHandler({ userId, messageText });
};

export default defineLogicFunction({
  universalIdentifier: ZALO_SEND_MESSAGE_ROUTE_UNIVERSAL_IDENTIFIER,
  name: 'zalo-send-message-route',
  timeoutSeconds: 30,
  handler,
  httpRouteTriggerSettings: {
    path: '/zalo/messages',
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
