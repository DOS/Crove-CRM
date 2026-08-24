import { describe, expect, it, vi } from 'vitest';

import { zaloSendMessageHandler } from 'src/logic-functions/handlers/zalo-send-message-handler';

describe('zaloSendMessageHandler', () => {
  it('sends customer support message successfully', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        error: 0,
        message: 'Success',
        data: { message_id: 'msg_987654321' },
      }),
    } as unknown as Response);

    const result = await zaloSendMessageHandler({
      userId: 'zalo_user_123',
      messageText: 'Chào bạn, đơn hàng của bạn đã sẵn sàng!',
      accessToken: 'test_token_zalo',
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBe('msg_987654321');
    expect(result.userId).toBe('zalo_user_123');
  });

  it('fails with validation error when userId is missing', async () => {
    const result = await zaloSendMessageHandler({
      userId: '',
      messageText: 'Hello',
      accessToken: 'token',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('`userId` is required');
  });

  it('fails with validation error when messageText is missing', async () => {
    const result = await zaloSendMessageHandler({
      userId: 'user_1',
      messageText: '',
      accessToken: 'token',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('`messageText` is required');
  });

  it('fails when no access token is available', async () => {
    delete process.env.ZALO_ACCESS_TOKEN;

    const result = await zaloSendMessageHandler({
      userId: 'user_1',
      messageText: 'Test message',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Missing Zalo access token');
  });
});
