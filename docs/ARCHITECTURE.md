# Crove CRM — Architecture Overview

> **Crove CRM** is the core customer relationship, sales automation, and business intelligence platform of the **Crove Business OS** ecosystem, forked and evolved from Twenty CRM.

---

## 1. System Ecosystem & Product Suite

Crove is an integrated, AI-native business operating system tailored for modern SMEs, agencies, and solo founders. It unites five specialized open-source products sharing a unified identity, authorization, and database layer:

| Product | Production Domain | Technology Stack | Role in Crove OS |
| :--- | :--- | :--- | :--- |
| **Crove CRM** | `app.crove.io` & `*.crove.io` | React 18 + Jotai + NestJS + Twenty ORM | Customer & Deal Intelligence, Pipelines, Multi-tenant Workflows |
| **Crove Post** | `post.crove.com` | Next.js + NestJS + Temporal + Redis (Postiz) | Multi-Channel Social Scheduling & Conversion Analytics |
| **Crove Cal** | `cal.crove.com` | Next.js + tRPC + Prisma (Cal.com) | Team Scheduling, Client Bookings, 2-Way Calendar Sync |
| **Crove Sign** | `sign.crove.com` | Next.js 16 + Prisma (Documenso) | Digital Contracts, e-Signatures, Verification Audit Trail |
| **Crove Desk** | `desk.crove.com` | Go + Next.js + Qdrant (AgentDesk fork) | AI Customer Support, Omnichannel Live Chat & Ticketing |

---

## 2. Infrastructure & Deployment Architecture

```
                                    ┌────────────────────────────┐
                                    │    Cloudflare Edge DNS     │
                                    │ (SSL Termination & WAF)    │
                                    └──────────────┬─────────────┘
                                                   │
                   ┌───────────────────────────────┴───────────────────────────────┐
                   │                                                               │
                   ▼                                                               ▼
        https://app.crove.io / *.crove.io                               https://*.crove.com
       (Central Auth & Tenant Subdomains)                         (Post, Cal, Sign, Desk, Landing)
                   │                                                               │
                   └───────────────────────────────┬───────────────────────────────┘
                                                   │
                                                   ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│ GCP Compute Engine VM: crove-server (Project: crove-os | IP: 34.87.89.118 | Zone: asia-southeast1-b)
│                                                                                                 │
│  ┌────────────────────────┐                                                                     │
│  │   crove-cloudflared    │  (Ingress: crove.io, *.crove.io, crm.crove.com, post, cal, sign, desk)│
│  └───────────┬────────────┘                                                                     │
│              │ (Docker Network: crove_postiz-network & crm-network)                             │
│              ├─────────────────────────────┬────────────────────────────┐                       │
│              ▼                             ▼                            ▼                       │
│    ┌──────────────────┐          ┌───────────────────┐        ┌──────────────────┐              │
│    │    crm-server    │ (3000)   │    crm-worker     │        │     crm-redis    │ (6379)       │
│    │(ghcr.io/dos/crm) │          │  (BullMQ Worker)  │        │  (redis:7-alpine)│              │
│    └─────────┬────────┘          └─────────┬─────────┘        └──────────────────┘              │
│              │                             │                                                    │
│  ┌───────────┴─────────────────────────────┴───────────┐                                        │
│  │ WireGuard WARP Interface (IPv6 Gateway / MTU Clamped)│                                        │
│  └───────────────────────────┬─────────────────────────┘                                        │
└──────────────────────────────┼──────────────────────────────────────────────────────────────────┘
                               │ (Direct PostgreSQL Port 5432 / SSL Mode Require)
                               ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Supabase Production Database (Project: DOS | Ref: gulptwduchsjcsbndmua | AWS ap-southeast-1)     │
│                                                                                                 │
│  - User: crm_app (Direct host: db.gulptwduchsjcsbndmua.supabase.co:5432)                       │
│  - Core Schema: core (Tenant metadata, users, permissions, application registry)                │
│  - Dynamic Schemas: workspace_<base36_uuid> (Isolated CRM data per Organization)                │
│  - Auth Engine: auth (Supabase Auth / OIDC OAuth 2.1 Server)                                    │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Database Architecture & Multi-Tenancy

Crove CRM utilizes a **clean multi-tenant architecture with separate subdomains on `crove.io`**:

1. **Central Entry Hub (`app.crove.io`)**:
   - Handles global authentication (`IS_MULTIWORKSPACE_ENABLED=true`, `DEFAULT_SUBDOMAIN=app`).
   - Presents the **"Choose an Organization"** and **"Create Organization"** onboarding flows.
   - Handles the OAuth redirect endpoint (`/auth/dos-id/redirect`).

2. **Dedicated Tenant Origins (`<org-slug>.crove.io`, e.g. `dos.crove.io`, `crove.crove.io`)**:
   - Each tenant organization has its own clean subdomain.
   - Automatically provisions an isolated PostgreSQL schema: `workspace_<uuid_base36>`.
   - Dynamic CRM entities (`company`, `person`, `opportunity`, `task`, `note`, `attachment`, `timelineActivity`) are isolated per schema.
   - Cross-domain login is bridged transparently through short-lived `loginToken` verification without requiring secondary passwords.

3. **Core Metadata Schema (`core`)**:
   - System registries (`core.workspace`, `core.user`, `core.userWorkspace`).
   - Object and field schema configurations (`core.objectMetadata`, `core.fieldMetadata`).
   - Layout definitions, view configurations, and custom applications.

---

## 4. Authentication Architecture: DOS.ID Native Integration

Crove CRM delegates system-wide identity and single sign-on to **DOS.ID** (Supabase Auth OAuth 2.1 / OIDC Server):

* **Identity Provider**: `https://gulptwduchsjcsbndmua.supabase.co/auth/v1`
* **Discovery Endpoint**: `https://gulptwduchsjcsbndmua.supabase.co/auth/v1/.well-known/openid-configuration`
* **Authorization URL**: `https://gulptwduchsjcsbndmua.supabase.co/auth/v1/oauth/authorize`
* **Token URL**: `https://gulptwduchsjcsbndmua.supabase.co/auth/v1/oauth/token`
* **UserInfo Endpoint**: `https://gulptwduchsjcsbndmua.supabase.co/auth/v1/oauth/userinfo`
* **Client ID**: `18790ccb-4d71-48cd-ad24-aee5f3ced3da`
* **Redirect Callback URL**: `https://app.crove.io/auth/dos-id/redirect`
* **Scopes**: `openid email profile offline_access`
* **JWT Signature Algorithm**: `ES256` (`id_token_signed_response_alg`)

```
User Click ("Continue with DOS ID")
       │
       ▼
[twenty-front] SignInUpWithDosId.tsx
       │ Redirects browser to:
       ▼
[twenty-server] GET /auth/dos-id
       │ Initiates OIDC Authorization Code Flow with PKCE (S256)
       ▼
[DOS ID Login Hub] https://id.dos.me / Supabase Auth
       │ User authenticates (Passwordless, Google, Microsoft, Web3)
       ▼
[twenty-server] GET /auth/dos-id/redirect?code=...
       │ 1. Exchanges code at Token Endpoint using ES256 verification
       │ 2. Extracts claims: sub, email, name, avatar, organizations[]
       │ 3. Executes JIT Organization Provisioning & Member Linking
       │ 4. Generates ssoExchangeToken fragment
       ▼
[twenty-front] https://app.crove.io/welcome#ssoExchangeToken=...
       │ Consumes exchange token -> Issues session -> Redirects to https://<org>.crove.io/verify?loginToken=...
       ▼
[Tenant Dashboard] https://<org>.crove.io/ (Auto-logged in)
```

### 4.1. Hybrid Two-Way Sync (JIT + Webhooks)

1. **Phase 1: JIT (Just-In-Time) Provisioning during OIDC Login**:
   - `twenty-server` extracts the `organizations` array from UserInfo / Token Claims.
   - For each organization (`id`, `name`, `slug`, `role`):
     - Matches existing workspace by `id`, `subdomain` (`slug`), or `displayName`.
     - If matched: auto-adds user to the organization via `UserWorkspaceService.addUserToWorkspaceIfUserNotInWorkspace`.
     - If not found and role is `OWNER` or `ADMIN`: auto-provisions a new organization with matching `subdomain` (`slug`).

2. **Phase 2: Real-time Event Webhooks (`POST /api/webhooks/dos-org-sync`)**:
   - Validated via `X-DOS-Signature: sha256=<hmac_sha256(payload, CROVE_DOS_WEBHOOK_SECRET)>`.
   - Supported sync events:
     - `organization.created` / `org.created`: Instantly provisions workspace and schema for owner.
     - `organization.updated` / `org.updated`: Syncs organization display name and settings.
     - `organization.deleted` / `org.deleted`: Suspends organization access.
     - `organization.member_added` / `org.member_added`: Syncs new members into the organization.
     - `organization.member_removed` / `org.member_removed`: Revokes user membership.
     - `user.updated`: Syncs user profile details across all organizations.

---

## 5. Storage, Email & AI Engine Integrations

### 5.1. Cloudflare R2 Object Storage (Zero Egress)
* **Driver**: AWS S3 compatible driver (`STORAGE_TYPE=s3`).
* **Bucket**: `crove-crm` (APAC region).
* **Endpoint**: `https://5f2a58925e790423dfafa0e6bee46b28.r2.cloudflarestorage.com`.
* **Credentials**: Managed in GCP Secret Manager (`CLOUDFLARE_R2_ACCESS_KEY_ID`, `CLOUDFLARE_R2_SECRET_ACCESS_KEY`).

### 5.2. Transactional Email System
* **Provider**: Brevo SMTP Relay (`EMAIL_DRIVER=smtp`).
* **Host**: `smtp-relay.brevo.com` | **Port**: `587`.
* **Sender**: `crm@crove.com` (`Crove CRM`).
* **User Mailbox Sync**: IMAP/SMTP/CalDAV enabled for individual user inboxes and 2-way sync (`IS_IMAP_SMTP_CALDAV_ENABLED=true`).

### 5.3. DOS.AI AI-Native Engine
* **SDK Integration**: Vercel AI SDK `@ai-sdk/openai-compatible`.
* **Base URL**: `https://api.dos.ai/v1`.
* **Default Models**: `dos-ai/dos-auto` configured for both fast and smart tasks.
* **Credentials**: Managed in GCP Secret Manager (`DOS_AI_API_KEY`).

---

## 6. Automated Rebranding & Zero-Conflict Upstream Sync

To keep Crove CRM aligned with upstream `twentyhq/twenty` with **zero merge conflicts**, all branding transformations are handled through an automated pipeline:

### 6.1. Branding Patcher Script (`packages/twenty-utils/patch-crove-branding.ts`)
* **Terminology Translation**:
  - `Workspace` $\rightarrow$ `Organization` (English) / `Tổ chức` (Vietnamese).
  - `Workspaces` $\rightarrow$ `Organizations` (English) / `Các tổ chức` (Vietnamese).
  - `Twenty` $\rightarrow$ `Crove` / `Crove CRM`.
* **Visual Assets**:
  - Injects Crove SVG badge into `packages/twenty-front/public/images/integrations/twenty-logo.svg`.
  - Updates HTML page titles, social meta tags, and PWA manifest (`manifest.json`).
* **Execution**:
  - Run manually via `yarn patch:branding`.
  - Automatically triggered during Docker image build in `packages/twenty-docker/twenty/Dockerfile`.

### 6.2. Upstream Fork Rules (`.cursor/rules/fork-minimal-modification.mdc`)
* **Configuration Over Code**: Core Twenty code is preserved untouched. All customizations are driven via `.env`, build arguments, and SDK extensions.
* **Upstream Merges**: Merging from `upstream/main` requires no manual resolution on frontend TSX files, as terminology overrides remain in isolated localization catalogs.

---

## 7. App Extension & Third-Party Integration Architecture

Crove CRM utilizes the **Twenty SDK App Extension System** (`packages/twenty-apps`) to add custom business features without touching core engine files:

```
                     ┌─────────────────────────────────────────────────────────┐
                     │          Third-Party Platforms / Channels               │
                     │ (Zalo OA / ZNS, Facebook, eSMS, OMICall, Stripe, etc.)  │
                     └───────────────┬─────────────────────────┬───────────────┘
                                     │                         │
            OAuth Flow & Auth Tokens │                         │ Webhook Events / Inbound Data
                                     ▼                         ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Twenty App Extension Layer (`packages/twenty-apps/<app-name>`)                                         │
│                                                                                                        │
│  1. `connection-providers/`                                                                            │
│     - Declares `defineConnectionProvider`: OAuth 2.0 PKCE / API Key connection                         │
│     - Handles `onConnectLogicFunction` & `onDisconnectLogicFunction`                                  │
│                                                                                                        │
│  2. `logic-functions/` (Server Route & Trigger Handlers)                                               │
│     - Inbound Webhook Routes (`serverRouteTriggerSettings`): Verify HMAC signatures, route workspace   │
│     - Outbound Connectors / Handlers: Message sending (ZNS/SMS), conversions sync (CAPI)              │
│     - DB Event Listeners (`ObjectRecordUpdateEvent`, `ObjectRecordCreateEvent`)                        │
│                                                                                                        │
│  3. `objects/`, `fields/`, `views/`, `page-layouts/`                                                   │
│     - Declares custom syncable entities (`Product`, `Order`, `Appointment`) with stable UUIDs         │
│                                                                                                        │
│  4. `front-components/`                                                                                │
│     - Embedded React widgets rendered in isolated Remote DOM (`twenty-ui` primitives)                  │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

* Apps are synchronized into workspace schemas using one-shot synchronization: `yarn twenty dev --once`.
