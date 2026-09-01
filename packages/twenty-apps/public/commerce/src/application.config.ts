import { defineApplication } from 'twenty-sdk/define';

import { APPLICATION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

export default defineApplication({
  universalIdentifier: APPLICATION_UNIVERSAL_IDENTIFIER,
  displayName: 'Commerce & Orders',
  description:
    'Manage Products, Services, Packages, and Orders. Track sales pipelines, inventory, multi-item checkouts, customer purchasing history and automated order total recalculation.',
  logoUrl: 'public/commerce.svg',
  author: 'Crove',
  category: 'Sales',
  websiteUrl: 'https://crove.io',
  termsUrl: 'https://crove.io/terms',
  emailSupport: 'support@crove.com',
  issueReportUrl: 'https://github.com/DOS/Crove-CRM/issues',
});
