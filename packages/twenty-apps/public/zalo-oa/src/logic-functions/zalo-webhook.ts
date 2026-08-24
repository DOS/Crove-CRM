import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';
import { isDefined } from 'src/utils/is-defined';

import { ZALO_WEBHOOK_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { zaloWebhookHandler } from 'src/logic-functions/handlers/zalo-webhook-handler';
import {
  type ZaloWebhookPayload,
  type ZaloWebhookResult,
} from 'src/logic-functions/types/zalo-webhook.type';
import { getZaloCredentials } from 'src/logic-functions/utils/get-zalo-credentials';
import { verifyZaloWebhookSignature } from 'src/logic-functions/utils/verify-zalo-webhook-signature';

const zaloWebhookRouteHandler = async (
  routePayload: RoutePayload<ZaloWebhookPayload>,
): Promise<ZaloWebhookResult> => {
  const credentials = getZaloCredentials();

  // If secret key is configured, verify HMAC signature
  if (credentials.success && isDefined(credentials.oaSecretKey)) {
    const rawBody = routePayload.rawBody;
    const signatureHeader =
      (routePayload.headers['x-zes-signature'] as string | undefined) ??
      (routePayload.headers['mac'] as string | undefined);
    const timestampHeader = routePayload.headers['x-zes-timestamp'] as
      | string
      | undefined;

    if (isDefined(rawBody) && isDefined(signatureHeader)) {
      const check = verifyZaloWebhookSignature({
        rawBody,
        signatureHeader,
        timestampHeader,
        appId: credentials.appId,
        secretKey: credentials.oaSecretKey,
      });

      if (!check.valid) {
        return {
          success: false,
          message: 'Webhook signature verification failed',
          error: check.error,
        };
      }
    }
  }

  const body = routePayload.body;

  if (!isDefined(body) || !isDefined(body.event_name)) {
    return {
      success: false,
      message: 'Invalid or empty Zalo webhook payload',
      error: 'Missing `event_name` in request body',
    };
  }

  return zaloWebhookHandler(body);
};

export default defineLogicFunction({
  universalIdentifier: ZALO_WEBHOOK_UNIVERSAL_IDENTIFIER,
  name: 'zalo-webhook',
  description:
    'Receives webhook events from Zalo Official Account (follower, message, lead form) and automatically creates or updates CRM Person records.',
  timeoutSeconds: 60,
  handler: zaloWebhookRouteHandler,
  httpRouteTriggerSettings: {
    path: '/webhook/zalo',
    httpMethod: 'POST',
    isAuthRequired: false,
    forwardedRequestHeaders: ['x-zes-signature', 'x-zes-timestamp', 'mac'],
  },
});
