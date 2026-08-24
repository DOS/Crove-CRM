import { defineApplication } from 'twenty-sdk/define';

import { APPLICATION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

export default defineApplication({
  universalIdentifier: APPLICATION_UNIVERSAL_IDENTIFIER,
  displayName: 'Zalo OA',
  description:
    'Connect Zalo Official Account to Twenty. Receive webhook events to automatically capture leads (new followers, messages), send customer care messages and Zalo ZNS notifications from workflows.',
  logoUrl: 'public/zalo.svg',
  author: 'Twenty',
  category: 'Communication',
  websiteUrl: 'https://docs.twenty.com/developers/extend/apps/getting-started',
  termsUrl: 'https://www.twenty.com/terms',
  emailSupport: 'contact@twenty.com',
  issueReportUrl: 'https://github.com/twentyhq/twenty/issues',
  serverVariables: {
    ZALO_APP_ID: {
      description:
        'App ID from your Zalo Developer application (developers.zalo.me). Public in OAuth flows; only the app secret must stay confidential.',
      isSecret: false,
      isRequired: true,
    },
    ZALO_APP_SECRET: {
      description:
        'Secret key from your Zalo Developer application. Stored encrypted; never exposed in API responses.',
      isSecret: true,
      isRequired: true,
    },
    ZALO_OA_SECRET_KEY: {
      description:
        'Secret key used to verify incoming webhook signatures from Zalo OA events.',
      isSecret: true,
      isRequired: false,
    },
  },
});
