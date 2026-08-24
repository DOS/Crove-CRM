# Zalo Official Account (OA) App for Twenty CRM

Connect your Zalo Official Account (OA) to Twenty CRM.

## Features

- **Automated Lead Capture**: Automatically receive webhook events when a user follows your OA, sends a message, or submits a lead form. Creates or updates `Person` records with Zalo UID, phone number, and name.
- **Workflow Actions**:
  - `Send Zalo CS Message`: Send customer support text messages to Zalo users directly from automated workflows.
  - `Send Zalo ZNS Template`: Trigger pre-approved Zalo Notification Service (ZNS) template messages (Order confirmation, booking reminder, payment alerts) directly from workflow actions.
  - `Get OA Profile`: Retrieve OA profile details, follower count, and verification status.
- **Command Menu Action**: Send custom Zalo messages to contacts from the Person page.

## Configuration

Set up your Zalo App credentials in Twenty App Settings:
1. `ZALO_APP_ID`: Your Zalo Developer Application ID (from `https://developers.zalo.me`).
2. `ZALO_APP_SECRET`: Your Zalo Developer Application Secret Key.
3. `ZALO_OA_SECRET_KEY`: Secret key for validating incoming webhook signatures.

## Webhook Endpoint

Configure your Zalo Developer Webhook URL:
`https://<your-crm-domain>/webhook/zalo`
