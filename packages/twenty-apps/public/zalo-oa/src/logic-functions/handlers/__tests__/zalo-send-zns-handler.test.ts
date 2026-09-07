import { describe, expect, it, vi } from 'vitest';

import {
  normalizeVietnamPhone,
  zaloSendZnsHandler,
} from 'src/logic-functions/handlers/zalo-send-zns-handler';

describe('zaloSendZnsHandler', () => {
  it('normalizes local Vietnam phone numbers properly', () => {
    expect(normalizeVietnamPhone('0912345678')).toBe('84912345678');
    expect(normalizeVietnamPhone('+84912345678')).toBe('84912345678');
    expect(normalizeVietnamPhone('84 912 345 678')).toBe('84912345678');
  });

  it('sends ZNS template message successfully', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        error: 0,
        message: 'Success',
        data: { msg_id: 'zns_msg_112233', sent_time: '1700000000' },
      }),
    } as unknown as Response);

    const result = await zaloSendZnsHandler({
      phone: '0987654321',
      templateId: 'tpl_order_confirm',
      templateData: { customer_name: 'Nguyễn Văn A', order_code: 'OD001' },
      accessToken: 'test_token',
    });

    expect(result.success).toBe(true);
    expect(result.msgId).toBe('zns_msg_112233');
    expect(result.message).toContain('sent successfully to 84987654321');
  });

  it('handles JSON string templateData cleanly', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        error: 0,
        message: 'Success',
        data: { msg_id: 'zns_msg_99' },
      }),
    } as unknown as Response);

    const result = await zaloSendZnsHandler({
      phone: '0987654321',
      templateId: 'tpl_123',
      templateData: '{"code":"1234"}',
      accessToken: 'test_token',
    });

    expect(result.success).toBe(true);
  });

  it('fails with invalid JSON string templateData', async () => {
    const result = await zaloSendZnsHandler({
      phone: '0987654321',
      templateId: 'tpl_123',
      templateData: '{invalid_json',
      accessToken: 'test_token',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('valid JSON object');
  });
});
