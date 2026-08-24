import { createHash, createHmac } from 'crypto';
import { describe, expect, it } from 'vitest';

import { verifyZaloWebhookSignature } from 'src/logic-functions/utils/verify-zalo-webhook-signature';

describe('verifyZaloWebhookSignature', () => {
  const secretKey = 'my_test_zalo_secret';
  const rawBody = JSON.stringify({ event_name: 'follow', oa_id: '123456' });

  it('validates HMAC-SHA256 signature', () => {
    const signature = createHmac('sha256', secretKey)
      .update(rawBody, 'utf8')
      .digest('hex');

    const result = verifyZaloWebhookSignature({
      rawBody,
      signatureHeader: `mac=${signature}`,
      secretKey,
    });

    expect(result.valid).toBe(true);
  });

  it('validates Zalo timestamp signature', () => {
    const timestamp = '1700000000';
    const appId = 'app_123456';
    const signature = createHash('sha256')
      .update(`${appId}${rawBody}${timestamp}${secretKey}`, 'utf8')
      .digest('hex');

    const result = verifyZaloWebhookSignature({
      rawBody,
      signatureHeader: signature,
      timestampHeader: timestamp,
      appId,
      secretKey,
    });

    expect(result.valid).toBe(true);
  });

  it('rejects invalid signature', () => {
    const result = verifyZaloWebhookSignature({
      rawBody,
      signatureHeader: 'invalid_signature_hex_1234567890abcdef',
      secretKey,
    });

    expect(result.valid).toBe(false);
  });

  it('rejects missing signature', () => {
    const result = verifyZaloWebhookSignature({
      rawBody,
      signatureHeader: undefined,
      secretKey,
    });

    expect(result.valid).toBe(false);
  });
});
