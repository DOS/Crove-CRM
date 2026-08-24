import { CoreApiClient } from 'twenty-client-sdk/core';
import { isDefined } from 'src/utils/is-defined';

import {
  type ZaloWebhookPayload,
  type ZaloWebhookResult,
} from 'src/logic-functions/types/zalo-webhook.type';

export const parseFullName = (
  fullName: string,
): { firstName: string; lastName: string } => {
  const parts = fullName.trim().split(/\s+/);

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }

  const lastName = parts.pop() || '';
  const firstName = parts.join(' ');

  return { firstName, lastName };
};

export const zaloWebhookHandler = async (
  payload: ZaloWebhookPayload,
  client: CoreApiClient = new CoreApiClient(),
): Promise<ZaloWebhookResult> => {
  const { event_name, info } = payload;
  const zaloUserId = payload.user_id_by_app ?? payload.sender?.id ?? '';

  if (event_name === 'unfollow') {
    return {
      success: true,
      message: `Zalo user ${zaloUserId} unfollowed OA`,
      action: 'ignored',
    };
  }

  if (
    event_name !== 'follow' &&
    event_name !== 'user_send_text' &&
    event_name !== 'user_submit_form' &&
    event_name !== 'user_send_image'
  ) {
    return {
      success: true,
      message: `Event ${event_name} acknowledged`,
      action: 'ignored',
    };
  }

  const rawName =
    info?.name ??
    (zaloUserId.length > 0
      ? `Zalo Lead ${zaloUserId.slice(-4)}`
      : 'Zalo Lead');

  const { firstName, lastName } = parseFullName(rawName);
  const rawPhone = info?.phone?.trim();

  try {
    // If phone number is available, search if Person already exists
    if (isDefined(rawPhone) && rawPhone.length > 0) {
      const existing = (await client.query({
        people: {
          __args: {
            filter: {
              phones: {
                primaryPhoneNumber: { eq: rawPhone },
              },
            },
            first: 1,
          },
          edges: {
            node: {
              id: true,
              name: { firstName: true, lastName: true },
            },
          },
        },
      })) as { people?: { edges?: { node: { id: string } }[] } };

      const foundPerson = existing.people?.edges?.[0]?.node;

      if (isDefined(foundPerson) && isDefined(foundPerson.id)) {
        return {
          success: true,
          message: `Found existing Person (id=${foundPerson.id}) for phone ${rawPhone}`,
          action: 'updated_lead',
          personId: foundPerson.id,
        };
      }
    }

    // Create new Person lead
    const createData: Record<string, unknown> = {
      name: {
        firstName,
        lastName,
      },
      jobTitle: 'Zalo Lead',
    };

    if (isDefined(rawPhone) && rawPhone.length > 0) {
      createData.phones = {
        primaryPhoneNumber: rawPhone,
        primaryPhoneCountryCode: 'VN',
        primaryPhoneCallingCode: '+84',
      };
    }

    const created = (await client.mutation({
      createPerson: {
        __args: {
          data: createData,
        },
        id: true,
      },
    })) as { createPerson?: { id: string } };

    const personId = created.createPerson?.id;

    return {
      success: true,
      message: `Successfully created new Zalo lead (id=${personId})`,
      action: 'created_lead',
      personId,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to process Zalo lead in CRM',
      error: (error as Error).message,
    };
  }
};
