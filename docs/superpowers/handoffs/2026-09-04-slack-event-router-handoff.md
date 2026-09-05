# [HANDOFF] Multi-Tenant Slack Event Router Specification for `api.dos.me`

**To**: `api.dos.me` Core Team  
**From**: Crove CRM Team  
**Date**: September 4, 2026  
**Status**: Ready for Implementation  

---

## 1. Overview & Objective

To enable a single, unified Slack App across the entire Crove OS ecosystem (Crove CRM, Crove Desk, DOS.AI Assistant), `api.dos.me` acts as the central **Inbound Webhook Event Router & Signature Verifier**.

* **Public Slack Request URL**: `https://api.dos.me/webhooks/slack`
* **Target Destinations**:
  * **Crove CRM**: `https://crm.crove.com/webhooks/server/9ad6fa20-dff5-4d3f-ad5f-084f3c8b0b09`
  * **Crove Desk**: `https://desk.crove.com/api/v1/integrations/slack/events`

---

## 2. Ingress & Routing Flow

```
                  ┌──────────────────────────────────────────────┐
                  │                 Slack API                    │
                  │        (Event Subscriptions Webhook)         │
                  └──────────────────────┬───────────────────────┘
                                         │ POST https://api.dos.me/webhooks/slack
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │                  api.dos.me                  │
                  │  1. Answer url_verification handshake        │
                  │  2. Verify x-slack-signature with Secret     │
                  │  3. Route event asynchronously               │
                  └──────────────┬────────────────┬──────────────┘
                                 │                │
            CRM & AI Events      │                │ Support & Ticket Events
                                 ▼                ▼
     ┌────────────────────────────────────┐      ┌────────────────────────────────────┐
     │             Crove CRM              │      │             Crove Desk             │
     │ POST /webhooks/server/:functionId  │      │ POST /api/v1/slack/events          │
     │ ID: 9ad6fa20-dff5-4d3f-ad5f-       │      │ (Customer Tickets & Auto-reply)    │
     │      084f3c8b0b09                  │      └────────────────────────────────────┘
     └────────────────────────────────────┘
```

---

## 3. Implementation Requirements for `api.dos.me`

### 3.1. Environment Variables
* `SLACK_SIGNING_SECRET`: Slack App Signing Secret from Slack App Settings > Basic Information > App Credentials.
* `CROVE_CRM_SLACK_WEBHOOK_URL`: `https://crm.crove.com/webhooks/server/9ad6fa20-dff5-4d3f-ad5f-084f3c8b0b09`
* `CROVE_DESK_SLACK_WEBHOOK_URL`: `https://desk.crove.com/api/v1/integrations/slack/events`

### 3.2. Verification & Handshake Rules
1. **URL Verification Handshake**:
   When Slack sends `{ type: "url_verification", challenge: "..." }`, return HTTP 200 with `{ challenge: req.body.challenge }` immediately.
2. **Signature Verification**:
   Compute HMAC-SHA256 of `v0:${req.headers['x-slack-request-timestamp']}:${rawBody}` using `SLACK_SIGNING_SECRET`.
   Compare with `req.headers['x-slack-signature']` using constant-time comparison.
   Reject requests older than 300 seconds (5 minutes) to prevent replay attacks.
3. **Immediate Acknowledgment**:
   Return HTTP 200 OK to Slack immediately to prevent timeouts and duplicate webhooks.
4. **Asynchronous Forwarding**:
   Forward payload to Crove CRM preserving the headers:
   * `x-slack-signature`
   * `x-slack-request-timestamp`
   * `content-type: application/json`

---

## 4. Reference Implementation (TypeScript / Express / NestJS)

```typescript
import * as crypto from 'crypto';
import { Request, Response } from 'express';
import axios from 'axios';

const CROVE_CRM_SLACK_WEBHOOK_URL =
  process.env.CROVE_CRM_SLACK_WEBHOOK_URL ||
  'https://crm.crove.com/webhooks/server/9ad6fa20-dff5-4d3f-ad5f-084f3c8b0b09';

export async function handleSlackWebhook(req: Request, res: Response) {
  const body = req.body;

  // 1. Handshake URL Verification
  if (body?.type === 'url_verification') {
    return res.status(200).json({ challenge: body.challenge });
  }

  // 2. Verify Slack Signature
  const signature = req.headers['x-slack-signature'] as string;
  const timestamp = req.headers['x-slack-request-timestamp'] as string;
  const signingSecret = process.env.SLACK_SIGNING_SECRET || '';

  if (!signature || !timestamp || !signingSecret) {
    return res.status(401).send('Unauthorized');
  }

  // Prevent Replay Attacks (5 minutes window)
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) {
    return res.status(400).send('Request timestamp out of range');
  }

  const rawBody = (req as any).rawBody 
    ? (req as any).rawBody.toString('utf8') 
    : JSON.stringify(body);

  const sigBasestring = `v0:${timestamp}:${rawBody}`;
  const expectedSignature = `v0=${crypto
    .createHmac('sha256', signingSecret)
    .update(sigBasestring)
    .digest('hex')}`;

  const isValid = crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature),
  );

  if (!isValid) {
    return res.status(401).send('Invalid signature');
  }

  // 3. Acknowledge Slack immediately
  res.status(200).send('OK');

  // 4. Asynchronously forward event to Crove CRM
  const eventType = body?.event?.type;
  const isCrmEvent = [
    'app_mention',
    'message',
    'app_home_opened',
    'member_joined_channel',
    'tokens_revoked',
    'app_uninstalled',
  ].includes(eventType);

  if (isCrmEvent) {
    try {
      await axios.post(CROVE_CRM_SLACK_WEBHOOK_URL, body, {
        headers: {
          'x-slack-signature': signature,
          'x-slack-request-timestamp': timestamp,
          'content-type': 'application/json',
        },
        timeout: 5000,
      });
    } catch (err) {
      console.error('Failed to forward event to Crove CRM:', err);
    }
  }
}
```
