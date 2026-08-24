import { type InputJsonSchema } from 'twenty-sdk/logic-function';

export const zaloSendZnsInputSchema: InputJsonSchema = {
  type: 'object',
  properties: {
    phone: {
      type: 'string',
      label: 'Phone Number',
      description:
        'Recipient phone number (e.g. 0912345678 or 84912345678). Auto-normalized for ZNS standard.',
    },
    templateId: {
      type: 'string',
      label: 'ZNS Template ID',
      description:
        'The pre-approved Zalo Notification Service Template ID from Zalo Cloud.',
    },
    templateData: {
      type: 'object',
      label: 'Template Data Parameters',
      description:
        'JSON key-value parameters matching the registered ZNS template variables (e.g. customer_name, order_code, price).',
    },
    mode: {
      type: 'string',
      label: 'Sending Mode',
      enum: ['production', 'development'],
      description:
        'Optional. Use "development" mode to test with OA admin/developer phone numbers before going live.',
    },
    trackingId: {
      type: 'string',
      label: 'Tracking ID',
      description:
        'Optional custom identifier for tracking and reconciliation.',
    },
    accessToken: {
      type: 'string',
      label: 'Access Token',
      description:
        'Optional. Zalo OA OAuth access token. Defaults to connected account token.',
    },
  },
  required: ['phone', 'templateId', 'templateData'],
  additionalProperties: false,
};
