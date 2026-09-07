import { type InputJsonSchema } from 'twenty-sdk/logic-function';

export const zaloSendMessageInputSchema: InputJsonSchema = {
  type: 'object',
  properties: {
    userId: {
      type: 'string',
      label: 'Zalo User ID',
      description:
        'The recipient Zalo User ID (obtained from follower event or user message).',
    },
    messageText: {
      type: 'string',
      label: 'Message Content',
      multiline: true,
      description: 'Text message to send to the customer via Zalo OA.',
    },
    accessToken: {
      type: 'string',
      label: 'Access Token',
      description:
        'Optional. OAuth Access token of the Zalo Official Account. Defaults to active connected account token.',
    },
  },
  required: ['userId', 'messageText'],
  additionalProperties: false,
};
