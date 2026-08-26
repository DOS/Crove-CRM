import * as crypto from 'crypto';

interface WebhookTestData {
  event: string;
  url: string;
  secret?: string;
  orgId?: string;
  orgName?: string;
  orgSlug?: string;
  ownerEmail?: string;
  userEmail?: string;
  userName?: string;
}

function parseArgs(): WebhookTestData {
  const args = process.argv.slice(2);
  const data: WebhookTestData = {
    event: 'organization.created',
    url: 'https://crove.io/webhooks/dos-org-sync',
    secret: process.env.CROVE_DOS_WEBHOOK_SECRET || '',
    orgId: 'ca970340-c49d-4360-90e1-5c9fae597337',
    orgName: 'Crove Corporation',
    orgSlug: 'crove-corp',
    ownerEmail: 'joy@dos.ai',
    userEmail: 'member@crove.com',
    userName: 'JOY',
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--url' && args[i + 1]) {
      data.url = args[++i];
    } else if (arg === '--secret' && args[i + 1]) {
      data.secret = args[++i];
    } else if (arg === '--event' && args[i + 1]) {
      data.event = args[++i];
    } else if (arg === '--org-id' && args[i + 1]) {
      data.orgId = args[++i];
    } else if (arg === '--org-name' && args[i + 1]) {
      data.orgName = args[++i];
    } else if (arg === '--org-slug' && args[i + 1]) {
      data.orgSlug = args[++i];
    } else if (arg === '--owner-email' && args[i + 1]) {
      data.ownerEmail = args[++i];
    } else if (arg === '--user-email' && args[i + 1]) {
      data.userEmail = args[++i];
    }
  }

  return data;
}

function generatePayload(opts: WebhookTestData) {
  const timestamp = new Date().toISOString();

  switch (opts.event) {
    case 'organization.created':
    case 'org.created':
      return {
        event: opts.event,
        timestamp,
        data: {
          id: opts.orgId,
          org_id: opts.orgId,
          name: opts.orgName,
          org_name: opts.orgName,
          slug: opts.orgSlug,
          owner_email: opts.ownerEmail,
          user_name: opts.userName,
        },
      };

    case 'organization.updated':
    case 'org.updated':
      return {
        event: opts.event,
        timestamp,
        data: {
          org_id: opts.orgId,
          name: `${opts.orgName} (Updated)`,
          org_name: `${opts.orgName} (Updated)`,
        },
      };

    case 'organization.deleted':
    case 'org.deleted':
      return {
        event: opts.event,
        timestamp,
        data: {
          org_id: opts.orgId,
          name: opts.orgName,
        },
      };

    case 'organization.member.added':
    case 'organization.member_added':
    case 'org.member_added':
      return {
        event: opts.event,
        timestamp,
        data: {
          org_id: opts.orgId,
          org_name: opts.orgName,
          user_email: opts.userEmail,
          user_name: 'Jane Doe',
          role: 'MEMBER',
        },
      };

    case 'organization.member.removed':
    case 'organization.member_removed':
    case 'org.member_removed':
      return {
        event: opts.event,
        timestamp,
        data: {
          org_id: opts.orgId,
          org_name: opts.orgName,
          user_email: opts.userEmail,
        },
      };

    case 'user.updated':
      return {
        event: opts.event,
        timestamp,
        data: {
          email: opts.ownerEmail,
          display_name: 'JOY Updated',
        },
      };

    default:
      return {
        event: opts.event,
        timestamp,
        data: {
          org_id: opts.orgId,
          name: opts.orgName,
        },
      };
  }
}

async function run() {
  const opts = parseArgs();
  const payload = generatePayload(opts);
  const jsonBody = JSON.stringify(payload);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (opts.secret) {
    const signature = `sha256=${crypto
      .createHmac('sha256', opts.secret)
      .update(Buffer.from(jsonBody))
      .digest('hex')}`;
    headers['x-dos-signature'] = signature;
  }

  console.log('----------------------------------------------------');
  console.log(`[DOS Webhook Tester] Target URL: ${opts.url}`);
  console.log(`[DOS Webhook Tester] Event:      ${opts.event}`);
  console.log(`[DOS Webhook Tester] Signature:  ${headers['x-dos-signature'] || '(none)'}`);
  console.log('----------------------------------------------------');
  console.log('Payload:');
  console.log(JSON.stringify(payload, null, 2));
  console.log('----------------------------------------------------');

  const startTime = Date.now();
  try {
    const response = await fetch(opts.url, {
      method: 'POST',
      headers,
      body: jsonBody,
    });

    const elapsed = Date.now() - startTime;
    const text = await response.text();
    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }

    console.log(`Response Status: ${response.status} ${response.statusText} (${elapsed}ms)`);
    console.log('Response Body:', typeof parsed === 'object' ? JSON.stringify(parsed, null, 2) : parsed);

    if (response.ok) {
      console.log('✅ Webhook sent and processed successfully!');
    } else {
      console.error('❌ Server returned non-200 status code.');
    }
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`❌ Request failed (${elapsed}ms):`, error);
  }
}

run();
