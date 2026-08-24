import { defineApplication } from 'twenty-sdk/define';

import { APPLICATION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

export default defineApplication({
  universalIdentifier: APPLICATION_UNIVERSAL_IDENTIFIER,
  displayName: 'Commerce & Orders',
  description:
    'Manage Products, Services, Packages, and Orders. Track sales pipelines, inventory, multi-item checkouts, customer purchasing history and automated order total recalculation.',
  logoUrl: 'public/commerce.svg',
  author: 'Twenty',
  category: 'Sales',
  websiteUrl: 'https://docs.twenty.com/developers/extend/apps/getting-started',
  termsUrl: 'https://www.twenty.com/terms',
  emailSupport: 'contact@twenty.com',
  issueReportUrl: 'https://github.com/twentyhq/twenty/issues',
});
