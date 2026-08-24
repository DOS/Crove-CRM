import { defineConnectionProvider } from 'twenty-sdk/define';

import { ZALO_CONNECTION_PROVIDER_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

export default defineConnectionProvider({
  universalIdentifier: ZALO_CONNECTION_PROVIDER_UNIVERSAL_IDENTIFIER,
  name: 'zalo-oa',
  displayName: 'Zalo Official Account',
  type: 'oauth',
  oauth: {
    authorizationEndpoint: 'https://oauth.zaloapp.com/v4/oa/permission',
    tokenEndpoint: 'https://oauth.zaloapp.com/v4/oa/access_token',
    scopes: ['manage_oa', 'send_message', 'read_messages'],
    clientIdVariable: 'ZALO_APP_ID',
    clientSecretVariable: 'ZALO_APP_SECRET',
    tokenRequestContentType: 'form-urlencoded',
    usePkce: true,
  },
});
