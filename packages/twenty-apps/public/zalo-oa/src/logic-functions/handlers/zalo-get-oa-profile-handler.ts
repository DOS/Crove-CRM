import { isDefined } from 'src/utils/is-defined';

import { zaloApiRequest } from 'src/logic-functions/utils/zalo-api-request';

const ZALO_OPENAPI_GET_OA_URL = 'https://openapi.zalo.me/v2.0/oa/getoa';

export type ZaloOaProfile = {
  oa_id?: string;
  name?: string;
  description?: string;
  avatar?: string;
  cover?: string;
  is_verified?: boolean;
  num_follower?: number;
};

export type ZaloGetOaProfileResult = {
  success: boolean;
  message: string;
  data?: ZaloOaProfile;
  error?: string;
};

export const zaloGetOaProfileHandler = async (parameters?: {
  accessToken?: string;
}): Promise<ZaloGetOaProfileResult> => {
  const token = parameters?.accessToken ?? process.env.ZALO_ACCESS_TOKEN;

  if (!isDefined(token) || token.trim().length === 0) {
    return {
      success: false,
      message: 'Zalo connection is not configured',
      error: 'Missing Zalo access token.',
    };
  }

  const result = await zaloApiRequest<ZaloOaProfile>({
    endpointUrl: ZALO_OPENAPI_GET_OA_URL,
    accessToken: token.trim(),
    method: 'GET',
  });

  if (!result.ok) {
    return {
      success: false,
      message: 'Failed to fetch Zalo OA profile',
      error: result.error,
    };
  }

  return {
    success: true,
    message: 'Zalo OA profile fetched successfully',
    data: result.data,
  };
};
