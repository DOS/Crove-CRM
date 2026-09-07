import { describe, expect, it, vi } from 'vitest';

import { zaloApiRequest } from 'src/logic-functions/utils/zalo-api-request';

describe('zaloApiRequest', () => {
  it('returns data when Zalo API responds with error=0', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        error: 0,
        message: 'Success',
        data: { message_id: 'msg_123' },
      }),
    } as unknown as Response);

    const result = await zaloApiRequest({
      endpointUrl: 'https://openapi.zalo.me/v3.0/oa/message/cs',
      accessToken: 'test_token',
      body: { recipient: { user_id: 'user_1' }, message: { text: 'Hello' } },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({ message_id: 'msg_123' });
    }
  });

  it('returns failure when Zalo API responds with error code', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        error: -216,
        message: 'Access token is invalid or expired',
      }),
    } as unknown as Response);

    const result = await zaloApiRequest({
      endpointUrl: 'https://openapi.zalo.me/v3.0/oa/message/cs',
      accessToken: 'invalid_token',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errorCode).toBe(-216);
      expect(result.error).toContain('Access token is invalid');
    }
  });

  it('handles network error gracefully', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Connection timed out'));

    const result = await zaloApiRequest({
      endpointUrl: 'https://openapi.zalo.me/v3.0/oa/message/cs',
      accessToken: 'token',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('Connection timed out');
    }
  });
});
