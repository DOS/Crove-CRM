import { describe, expect, it, vi } from 'vitest';
import { CoreApiClient } from 'twenty-client-sdk/core';

import {
  parseFullName,
  zaloWebhookHandler,
} from 'src/logic-functions/handlers/zalo-webhook-handler';

describe('zaloWebhookHandler', () => {
  it('parses full names into first and last name correctly', () => {
    expect(parseFullName('Nguyễn Văn An')).toEqual({
      firstName: 'Nguyễn Văn',
      lastName: 'An',
    });
    expect(parseFullName('John')).toEqual({
      firstName: 'John',
      lastName: '',
    });
  });

  it('creates new person lead when follow event is received', async () => {
    const mockClient = {
      query: vi.fn().mockResolvedValue({ people: { edges: [] } }),
      mutation: vi
        .fn()
        .mockResolvedValue({ createPerson: { id: 'person_new_123' } }),
    } as unknown as CoreApiClient;

    const result = await zaloWebhookHandler(
      {
        event_name: 'follow',
        oa_id: '123456789',
        user_id_by_app: 'zalo_user_9999',
        info: {
          name: 'Trần Thị Mai',
          phone: '0912345678',
        },
      },
      mockClient,
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('created_lead');
    expect(result.personId).toBe('person_new_123');
    expect(mockClient.mutation).toHaveBeenCalledWith({
      createPerson: {
        __args: {
          data: {
            name: { firstName: 'Trần Thị', lastName: 'Mai' },
            jobTitle: 'Zalo Lead',
            phones: {
              primaryPhoneNumber: '0912345678',
              primaryPhoneCountryCode: 'VN',
              primaryPhoneCallingCode: '+84',
            },
          },
        },
        id: true,
      },
    });
  });

  it('matches existing person when phone number already exists', async () => {
    const mockClient = {
      query: vi.fn().mockResolvedValue({
        people: {
          edges: [{ node: { id: 'person_existing_456' } }],
        },
      }),
      mutation: vi.fn(),
    } as unknown as CoreApiClient;

    const result = await zaloWebhookHandler(
      {
        event_name: 'user_send_text',
        oa_id: '123456789',
        user_id_by_app: 'zalo_user_8888',
        info: {
          name: 'Lê Văn Cường',
          phone: '0987654321',
        },
      },
      mockClient,
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('updated_lead');
    expect(result.personId).toBe('person_existing_456');
    expect(mockClient.mutation).not.toHaveBeenCalled();
  });

  it('ignores unfollow event cleanly', async () => {
    const mockClient = {
      query: vi.fn(),
      mutation: vi.fn(),
    } as unknown as CoreApiClient;

    const result = await zaloWebhookHandler(
      {
        event_name: 'unfollow',
        oa_id: '123456789',
        user_id_by_app: 'zalo_user_7777',
      },
      mockClient,
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('ignored');
  });
});
