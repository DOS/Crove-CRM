import { isDefined } from 'src/utils/is-defined';

import {
  type ZaloSendZnsInput,
  type ZaloSendZnsResult,
} from 'src/logic-functions/types/zalo-send-zns-input.type';
import { zaloApiRequest } from 'src/logic-functions/utils/zalo-api-request';

const ZALO_BUSINESS_ZNS_URL =
  'https://business.openapi.zalo.me/message/template';

type ZnsResponseData = {
  msg_id?: string;
  sent_time?: string;
};

export const normalizeVietnamPhone = (rawPhone: string): string => {
  let cleaned = rawPhone.replace(/[\s\-().+]/g, '');

  if (cleaned.startsWith('0')) {
    cleaned = `84${cleaned.slice(1)}`;
  }

  return cleaned;
};

export const zaloSendZnsHandler = async (
  parameters: ZaloSendZnsInput,
): Promise<ZaloSendZnsResult> => {
  const { phone, templateId, templateData, mode, trackingId, accessToken } =
    parameters;

  if (!isDefined(phone) || phone.trim().length === 0) {
    return {
      success: false,
      message: 'Failed to send Zalo ZNS',
      error: '`phone` is required',
    };
  }

  if (!isDefined(templateId) || templateId.trim().length === 0) {
    return {
      success: false,
      message: 'Failed to send Zalo ZNS',
      error: '`templateId` is required',
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

  let parsedTemplateData: Record<string, unknown> = {};

  if (typeof templateData === 'string') {
    try {
      parsedTemplateData = JSON.parse(templateData) as Record<string, unknown>;
    } catch {
      return {
        success: false,
        message: 'Invalid templateData format',
        error: '`templateData` must be a valid JSON object',
      };
    }
  } else if (isDefined(templateData) && typeof templateData === 'object') {
    parsedTemplateData = templateData;
  }

  const normalizedPhone = normalizeVietnamPhone(phone);

  const body: Record<string, unknown> = {
    phone: normalizedPhone,
    template_id: templateId.trim(),
    template_data: parsedTemplateData,
    mode: mode === 'development' ? 'development' : 'production',
  };

  if (isDefined(trackingId) && trackingId.trim().length > 0) {
    body.tracking_id = trackingId.trim();
  }

  const result = await zaloApiRequest<ZnsResponseData>({
    endpointUrl: ZALO_BUSINESS_ZNS_URL,
    accessToken: token.trim(),
    method: 'POST',
    body,
  });

  if (!result.ok) {
    return {
      success: false,
      message: 'Failed to send Zalo ZNS message',
      error: result.error,
    };
  }

  return {
    success: true,
    message: `ZNS template ${templateId} sent successfully to ${normalizedPhone}`,
    msgId: result.data.msg_id,
    sentTime: result.data.sent_time,
  };
};
