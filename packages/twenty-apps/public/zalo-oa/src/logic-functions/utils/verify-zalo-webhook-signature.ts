import { createHash, createHmac, timingSafeEqual } from 'crypto';

import { isDefined } from 'src/utils/is-defined';

export const verifyZaloWebhookSignature = ({
  rawBody,
  signatureHeader,
  timestampHeader,
  appId,
  secretKey,
}: {
  rawBody: string;
  signatureHeader: string | undefined;
  timestampHeader?: string | undefined;
  appId?: string;
  secretKey: string;
}): { valid: true } | { valid: false; error: string } => {
  if (!isDefined(signatureHeader) || signatureHeader.trim().length === 0) {
    return { valid: false, error: 'Missing signature header' };
  }

  const cleanedSignature = signatureHeader
    .replace(/^mac=/i, '')
    .replace(/^sha256=/i, '')
    .trim()
    .toLowerCase();

  const candidates: string[] = [];

  // 1. Zalo signature with timestamp and appId: sha256(appId + rawBody + timestamp + secretKey)
  if (isDefined(timestampHeader) && isDefined(appId)) {
    const hashPayload = `${appId}${rawBody}${timestampHeader}${secretKey}`;

    candidates.push(
      createHash('sha256').update(hashPayload, 'utf8').digest('hex'),
    );
  }

  // 2. HMAC-SHA256 of raw body
  candidates.push(
    createHmac('sha256', secretKey).update(rawBody, 'utf8').digest('hex'),
  );

  // 3. Simple SHA256 of raw body + secretKey
  candidates.push(
    createHash('sha256')
      .update(`${rawBody}${secretKey}`, 'utf8')
      .digest('hex'),
  );

  for (const candidate of candidates) {
    if (candidate.length === cleanedSignature.length) {
      const candidateBuffer = Buffer.from(candidate, 'hex');
      const providedBuffer = Buffer.from(cleanedSignature, 'hex');

      if (
        candidateBuffer.length > 0 &&
        timingSafeEqual(candidateBuffer, providedBuffer)
      ) {
        return { valid: true };
      }
    }
  }

  return { valid: false, error: 'Signature verification failed' };
};
