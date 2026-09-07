import { isDefined } from 'src/utils/is-defined';

type ZaloCredentialsSuccess = {
  success: true;
  appId: string;
  appSecret: string;
  oaSecretKey?: string;
};

type ZaloCredentialsFailure = {
  success: false;
  error: string;
};

export type ZaloCredentialsResult =
  | ZaloCredentialsSuccess
  | ZaloCredentialsFailure;

export const getZaloCredentials = (): ZaloCredentialsResult => {
  const appId = process.env.ZALO_APP_ID;
  const appSecret = process.env.ZALO_APP_SECRET;
  const oaSecretKey = process.env.ZALO_OA_SECRET_KEY;

  if (
    !isDefined(appId) ||
    appId.trim().length === 0 ||
    !isDefined(appSecret) ||
    appSecret.trim().length === 0
  ) {
    return {
      success: false,
      error:
        'Zalo credentials are not configured. Set ZALO_APP_ID and ZALO_APP_SECRET in the Zalo OA app settings.',
    };
  }

  return {
    success: true,
    appId: appId.trim(),
    appSecret: appSecret.trim(),
    oaSecretKey:
      isDefined(oaSecretKey) && oaSecretKey.trim().length > 0
        ? oaSecretKey.trim()
        : undefined,
  };
};
