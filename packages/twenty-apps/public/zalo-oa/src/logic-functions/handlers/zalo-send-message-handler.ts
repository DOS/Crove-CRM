import { isDefined } from 'src/utils/is-defined';

import {
  type ZaloSendMessageInput,
  type ZaloSendMessageResult,
} from 'src/logic-functions/types/zalo-send-message-input.type';
import { zaloApiRequest } from 'src/logic-functions/utils/zalo-api-request';

const ZALO_OPENAPI_MESSAGE_CS_URL =
  'https://openapi.zalo.me/v3.0/oa/message/cs';

type ZaloMessageResponse = {
  message_id?: string;
  user_id?: string;
};

export const zaloSendMessageHandler = async (
  parameters: ZaloSendMessageInput,
): Promise<ZaloSendMessageResult> => {
  const { userId, messageText, accessToken } = parameters;

  if (!isDefined(userId) || userId.trim().length === 0) {
    return {
      success: false,
      message: 'Failed to send Zalo message',
      error: '`userId` is required',
    };
  }

  if (!isDefined(messageText) || messageText.trim().length === 0) {
    return {
      success: false,
      message: 'Failed to send Zalo message',
      error: '`messageText` is required',
    };
  }

  const token = accessToken ?? process.env.ZALO_ACCESS_TOKEN;

  if (!isDefined(token) || token.trim().length === 0) {
    return {
      success: false,
      message: 'Zalo connection is not configured',
      error:
        'Missing Zalo access token. Connect your Zalo OA account in settings or pass `accessToken`.',
    };
  }

  const body = {
    recipient: {
      user_id: userId.trim(),
    },
    message: {
      text: messageText.trim(),
    },
  };

  const result = await zaloApiRequest<ZaloMessageResponse>({
    endpointUrl: ZALO_OPENAPI_MESSAGE_CS_URL,
    accessToken: token.trim(),
    method: 'POST',
    body,
  });

  if (!result.ok) {
    return {
      success: false,
      message: 'Failed to send Zalo message',
      error: result.error,
    };
  }

  return {
    success: true,
    message: `Zalo message sent successfully to user ${userId}`,
    messageId: result.data.message_id,
    userId,
  };
};
