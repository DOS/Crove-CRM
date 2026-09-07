# Zalo Official Account (OA) App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete, modular Twenty App (`@twentyhq/zalo-oa` located at `packages/twenty-apps/public/zalo-oa`) that integrates Zalo Official Account into Crove / Twenty CRM for automatic lead capture (webhooks), 1-on-1 customer messaging, Zalo Notification Service (ZNS), and workflow actions without modifying the core CRM codebase.

**Architecture:** Standalone Twenty App utilizing `twenty-sdk` and `twenty-client-sdk`. It declares application metadata, OAuth 2.0 PKCE connection provider, HTTP webhook listener for inbound Zalo events (`follow`, `user_send_text`, `user_submit_form`), workflow actions (`Send Zalo CS Message`, `Send Zalo ZNS Template`), and embedded frontend command menu form.

**Tech Stack:** TypeScript, `twenty-sdk`, `twenty-client-sdk`, `twenty-ui`, Vitest, Oxlint.

## Global Constraints
- Target location: `packages/twenty-apps/public/zalo-oa`
- All UUIDs must be valid UUID v4
- Zero core code modification (100% self-contained Twenty app)
- Types over interfaces, named exports only, short-form `//` comments, no abbreviations in variable names

---

### Task 1: Package Scaffolding & Configuration

**Files:**
- Create: `packages/twenty-apps/public/zalo-oa/package.json`
- Create: `packages/twenty-apps/public/zalo-oa/tsconfig.json`
- Create: `packages/twenty-apps/public/zalo-oa/tsconfig.spec.json`
- Create: `packages/twenty-apps/public/zalo-oa/vitest.config.ts`
- Create: `packages/twenty-apps/public/zalo-oa/vitest.unit.config.ts`
- Create: `packages/twenty-apps/public/zalo-oa/.oxlintrc.json`
- Create: `packages/twenty-apps/public/zalo-oa/.gitignore`
- Create: `packages/twenty-apps/public/zalo-oa/README.md`
- Create: `packages/twenty-apps/public/zalo-oa/public/zalo.svg`

**Interfaces:**
- Produces: Base configuration files for `@twentyhq/zalo-oa` app.

- [ ] **Step 1: Create package.json and workspace configuration**
- [ ] **Step 2: Create tsconfig, vitest and lint configurations**
- [ ] **Step 3: Create app asset logo `public/zalo.svg` and README**
- [ ] **Step 4: Verify package setup with typecheck script**

---

### Task 2: Application Definition, Identifiers & Role

**Files:**
- Create: `packages/twenty-apps/public/zalo-oa/src/constants/universal-identifiers.ts`
- Create: `packages/twenty-apps/public/zalo-oa/src/application.config.ts`
- Create: `packages/twenty-apps/public/zalo-oa/src/roles/default-function.role.ts`
- Create: `packages/twenty-apps/public/zalo-oa/src/connection-providers/zalo-oa-connection.ts`

**Interfaces:**
- Produces: `APPLICATION_UNIVERSAL_IDENTIFIER`, `ZALO_CONNECTION_PROVIDER_UNIVERSAL_IDENTIFIER`, and application metadata with OAuth 2.0 PKCE config.

- [ ] **Step 1: Write universal-identifiers.ts with valid UUID v4 constants**
- [ ] **Step 2: Write application.config.ts defining ZALO_APP_ID, ZALO_APP_SECRET, ZALO_OA_SECRET_KEY**
- [ ] **Step 3: Write default-function.role.ts and zalo-oa-connection.ts**
- [ ] **Step 4: Validate types with `yarn twenty dev:typecheck`**

---

### Task 3: Zalo API Client & Webhook Signature Utilities

**Files:**
- Create: `packages/twenty-apps/public/zalo-oa/src/logic-functions/utils/get-zalo-credentials.ts`
- Create: `packages/twenty-apps/public/zalo-oa/src/logic-functions/utils/verify-zalo-webhook-signature.ts`
- Create: `packages/twenty-apps/public/zalo-oa/src/logic-functions/utils/zalo-api-request.ts`
- Create: `packages/twenty-apps/public/zalo-oa/src/logic-functions/utils/__tests__/verify-zalo-webhook-signature.test.ts`
- Create: `packages/twenty-apps/public/zalo-oa/src/logic-functions/utils/__tests__/zalo-api-request.test.ts`

**Interfaces:**
- Produces: `verifyZaloWebhookSignature({ rawBody, signatureHeader, secretKey })`, `zaloApiRequest({ path, accessToken, body })`.

- [ ] **Step 1: Write tests for signature verification and API request builder**
- [ ] **Step 2: Implement signature verification with SHA256 HMAC / Mac**
- [ ] **Step 3: Implement Zalo API request utility with error handling**
- [ ] **Step 4: Run unit tests to verify 100% pass**

---

### Task 4: Inbound Webhook & Automatic Lead Capture (`zalo-webhook`)

**Files:**
- Create: `packages/twenty-apps/public/zalo-oa/src/logic-functions/types/zalo-webhook.type.ts`
- Create: `packages/twenty-apps/public/zalo-oa/src/logic-functions/handlers/zalo-webhook-handler.ts`
- Create: `packages/twenty-apps/public/zalo-oa/src/logic-functions/zalo-webhook.ts`
- Create: `packages/twenty-apps/public/zalo-oa/src/logic-functions/handlers/__tests__/zalo-webhook-handler.test.ts`

**Interfaces:**
- Produces: Logic Function `zalo-webhook` at path `/webhook/zalo` which captures `user_send_text`, `follow`, and `user_submit_form` events and creates/updates `person` records in Twenty CRM.

- [ ] **Step 1: Write unit tests for webhook payload parsing and person upsert logic**
- [ ] **Step 2: Implement `zalo-webhook-handler.ts` with `CoreApiClient` (find person by phone/Zalo ID or create new lead)**
- [ ] **Step 3: Define `zalo-webhook.ts` with `httpRouteTriggerSettings`**
- [ ] **Step 4: Run tests to verify lead capture logic**

---

### Task 5: Outbound Messaging & ZNS Workflow Actions

**Files:**
- Create: `packages/twenty-apps/public/zalo-oa/src/logic-functions/schemas/zalo-send-message-input.schema.ts`
- Create: `packages/twenty-apps/public/zalo-oa/src/logic-functions/schemas/zalo-send-zns-input.schema.ts`
- Create: `packages/twenty-apps/public/zalo-oa/src/logic-functions/handlers/zalo-send-message-handler.ts`
- Create: `packages/twenty-apps/public/zalo-oa/src/logic-functions/handlers/zalo-send-zns-handler.ts`
- Create: `packages/twenty-apps/public/zalo-oa/src/logic-functions/zalo-send-message.ts`
- Create: `packages/twenty-apps/public/zalo-oa/src/logic-functions/zalo-send-zns.ts`
- Create: `packages/twenty-apps/public/zalo-oa/src/logic-functions/handlers/__tests__/zalo-send-message-handler.test.ts`
- Create: `packages/twenty-apps/public/zalo-oa/src/logic-functions/handlers/__tests__/zalo-send-zns-handler.test.ts`

**Interfaces:**
- Produces: Workflow action blocks `zalo-send-message` and `zalo-send-zns` for Twenty Workflow Builder.

- [ ] **Step 1: Write unit tests for send message and send ZNS handlers**
- [ ] **Step 2: Implement schemas and handlers calling Zalo Open API (`/v3.0/oa/message/cs` and `/message/template`)**
- [ ] **Step 3: Declare `defineLogicFunction` with `workflowActionTriggerSettings`**
- [ ] **Step 4: Run tests and verify payload transformations**

---

### Task 6: UI Command Menu & Embedded Front Component

**Files:**
- Create: `packages/twenty-apps/public/zalo-oa/src/command-menu-items/send-zalo-message.command-menu-item.ts`
- Create: `packages/twenty-apps/public/zalo-oa/src/components/send-zalo-message-form.front-component.tsx`

**Interfaces:**
- Produces: Interactive "Send Zalo Message" button in Person record action menu opening a drawer/modal to send instant message.

- [ ] **Step 1: Declare `defineCommandMenuItem` for Person object**
- [ ] **Step 2: Implement `send-zalo-message-form.front-component.tsx` using `twenty-ui` components and `twenty-client-sdk`**
- [ ] **Step 3: Run typecheck and linting across the package**

---

### Task 7: App Validation & Documentation

**Files:**
- Modify: `docs/ROADMAP.md` (Update Zalo OA status)
- Modify: `packages/twenty-apps/public/zalo-oa/README.md` (Complete configuration and developer guide)

- [ ] **Step 1: Run full test suite for `@twentyhq/zalo-oa`**
- [ ] **Step 2: Update ROADMAP.md and architecture documentation**
- [ ] **Step 3: Verify git status and clean up temporary files**
