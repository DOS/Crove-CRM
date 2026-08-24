# Crove CRM — Architecture Overview

> **Crove CRM** is the core customer relationship and business management system of the **Crove Business OS** ecosystem, forked and evolved from Twenty CRM.

---

## 1. System Ecosystem & Product Suite

Crove is an integrated, AI-native business platform for modern SMEs and solo founders. It brings together five tightly connected products sharing a unified identity and database infrastructure:

| Product | Subdomain | Technology Stack | Role in Crove OS |
| :--- | :--- | :--- | :--- |
| **Crove CRM** | `crm.crove.com` | React 18 + Jotai + NestJS + Twenty ORM | Core Customer & Deal Intelligence, Pipelines, Workflows |
| **Crove Post** | `post.crove.com` | Next.js + NestJS + Temporal + Redis (Postiz) | Social Media Scheduling, Multi-Channel Publishing |
| **Crove Cal** | `cal.crove.com` | Next.js + tRPC + Prisma (Cal.com) | Scheduling, Booking, Calendar Sync |
| **Crove Sign** | `sign.crove.com` | Next.js 16 + Prisma (Documenso) | Digital Signatures, Document Verification |
| **Crove Desk** | `desk.crove.com` | Go + Next.js + Qdrant (AgentDesk fork) | AI Customer Support, Live Chat, Ticket Operations |

---

## 2. Infrastructure & Deployment Architecture

```
                                    ┌────────────────────────────┐
                                    │    Cloudflare Edge DNS     │
                                    │      (SSL Termination)     │
                                    └──────────────┬─────────────┘
                                                   │
                                                   ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│ GCP Compute Engine VM: crove-server (Project: crove-os | IP: 34.87.89.118 | Zone: asia-southeast1-b)
│                                                                                                 │
│  ┌────────────────────────┐                                                                     │
│  │   crove-cloudflared    │  (Cloudflare Tunnel Ingress: crm.crove.com, post, cal, sign, desk)   │
│  └───────────┬────────────┘                                                                     │
│              │ (Docker Network: crove_postiz-network)                                           │
│              ├─────────────────────────────┬────────────────────────────┐                       │
│              ▼                             ▼                            ▼                       │
│    ┌──────────────────┐          ┌───────────────────┐        ┌──────────────────┐              │
│    │    crm-server    │ (3000)   │    crm-worker     │        │     crm-redis    │ (6379)       │
│    │ (twenty:latest)  │          │  (BullMQ Worker)  │        │  (redis:7-alpine)│              │
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
│  - System / Core Metadata Schema: core                                                          │
│  - Dynamic Multi-Tenant Schemas: workspace_<base36_uuid>                                        │
│  - Identity & OAuth Server: auth (Supabase Auth / OIDC Discovery)                               │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Database Architecture & Multi-Tenancy

Twenty CRM employs a **two-tier metadata-driven architecture**:

1. **`core` Schema (Fixed System Tables)**:
   - Stores tenant registries (`core.workspace`, `core.user`, `core.userWorkspace`).
   - Stores object & field definitions (`core.objectMetadata`, `core.fieldMetadata`).
   - Stores views, layout configurations, applications, and permissions.
   - Managed via TypeORM entities and versioned upgrade commands in `packages/twenty-server/src/database/commands/upgrade-version-command/`.

2. **`workspace_<uuid_base36>` Schemas (Dynamic Tenant Tables)**:
   - Created dynamically whenever a new Workspace is provisioned (`WorkspaceDataSourceService.createWorkspaceDBSchema`).
   - Contains dynamic CRM tables: `person`, `company`, `opportunity`, `task`, `note`, `attachment`, `timelineActivity`, etc.
   - Built and mutated dynamically at runtime by the Twenty ORM compiler based on `core.fieldMetadata`.

---

## 4. Authentication Architecture: DOS.ID Native Integration

Crove CRM delegates system-wide identity management to **DOS.ID** (Supabase Auth OAuth 2.1 / OIDC Server):

* **Identity Provider**: `https://gulptwduchsjcsbndmua.supabase.co/auth/v1`
* **Discovery Endpoint**: `https://gulptwduchsjcsbndmua.supabase.co/auth/v1/.well-known/openid-configuration`
* **Authorization URL**: `https://gulptwduchsjcsbndmua.supabase.co/auth/v1/oauth/authorize`
* **Token URL**: `https://gulptwduchsjcsbndmua.supabase.co/auth/v1/oauth/token`
* **UserInfo Endpoint**: `https://gulptwduchsjcsbndmua.supabase.co/auth/v1/oauth/userinfo`
* **OAuth App**: `Crove`
* **Client ID**: `18790ccb-4d71-48cd-ad24-aee5f3ced3da`
* **Redirect Callback**: `https://crm.crove.com/auth/dos-id/redirect`
* **Scopes**: `openid email profile offline_access orgs`

### 4.1. Hybrid Identity & Organization Sync (2-Phase Architecture)

1. **Phase 1: JIT (Just-In-Time) Provisioning during OIDC Login**:
   - `twenty-server` decodes `organizations` claim from UserInfo endpoint.
   - For each organization, checks if corresponding Workspace exists in `core.workspace`.
   - If Workspace exists, user is auto-added via `UserWorkspaceService.addUserToWorkspaceIfUserNotInWorkspace`.
   - If Workspace does not exist and user has `OWNER`/`ADMIN` role in DOS.Me, auto-provisions new Workspace via `SignInUpService.signUpOnNewWorkspace`.

2. **Phase 2: Real-time Event-Driven Webhooks (`POST /api/webhooks/dos-org-sync`)**:
   - Signature validation via `X-DOS-Signature: sha256=<hmac_sha256(payload, CROVE_DOS_WEBHOOK_SECRET)>`.
   - Supported events:
     - `organization.created` / `org.created`: Auto-creates & initializes workspace for owner.
     - `organization.updated` / `org.updated`: Syncs workspace display name.
     - `organization.deleted` / `org.deleted`: Suspends workspace.
     - `organization.member_added` / `org.member_added`: Syncs member into workspace.
     - `organization.member_removed` / `org.member_removed`: Removes user membership.
     - `user.updated`: Syncs profile names across `core.user`.

---

## 5. Backend Architecture (`packages/twenty-server`)

* **Framework**: NestJS 11 with modular domain slices.
* **ORM**: Hybrid TypeORM for `core` schema + Twenty ORM dynamic query runner for tenant schemas.
* **API Layers**:
  - `/graphql`: Dynamic CRM record queries generated on-the-fly from active field metadata.
  - `/metadata`: GraphQL endpoint for workspace settings, schema alterations, and app extensions.
  - `/rest`: REST endpoints for CRM data and external webhooks.
* **Job Queue**: BullMQ over Redis (`crm-redis`) for asynchronous worker tasks (messaging, calendar sync, webhooks, app installations).

---

## 6. Frontend Architecture (`packages/twenty-front`)

* **Framework**: React 18 SPA built with Vite and Linaria (zero-runtime CSS-in-JS).
* **State Management**: Jotai with custom family and component-instance scopes (`createAtomState`, `createAtomComponentState`).
* **Metadata Hydration**: Caches minimal workspace metadata in IndexedDB to deliver instant page loads before querying GraphQL.
* **UI Design System**: `twenty-ui` React components with tokenized theme variables.

---

## 7. Feedback, Ideas & Roadmap Portal (Frill.co)

Crove OS uses a dedicated Frill Company Portal for feedback collection, public feature voting, roadmap tracking, and announcements:

* **Public Portal Domain**: `feedback.crove.com`
* **MCP Integration**: Configured per workspace in `.mcp.json` using the Crove Frill API key.
* **In-App SSO**: Integrates via Frill JWT SSO using HMAC-SHA256 signature to allow seamless in-app feedback without separate user registration.

---

## 8. App Extension & Third-Party Integration Architecture

Crove CRM utilizes the upstream **Twenty SDK App Extension System** (`packages/twenty-apps`) to add custom business entities, integrations, and logic functions without modifying core server/frontend codebase.

```
                     ┌─────────────────────────────────────────────────────────┐
                     │          Third-Party Platforms / VN Channels            │
                     │ (Zalo OA / ZNS, Facebook Page, eSMS, OMICall, Stripe)   │
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

### 8.1. Guidelines for Adding New Integrations (e.g. Zalo OA / ZNS)
1. **Never modify `twenty-server` or `twenty-front` directly**: Always scaffold a dedicated app in `packages/twenty-apps/<app-name>` or publish an isolated npm package.
2. **Entity Registration (`twenty-sdk/define`)**:
   - `defineApplication`: Defines app metadata, logo, and encrypted `serverVariables` (`ZALO_APP_ID`, `ZALO_SECRET_KEY`).
   - `defineConnectionProvider`: Handles OAuth 2.0 PKCE authorization, token storage, and refresh lifecycle.
   - `defineLogicFunction`: Declares webhook receiver (`serverRouteTriggerSettings`) or workflow actions.
   - `defineFrontComponent`: Implements UI action buttons or chat widgets in CRM page layouts.
3. **Execution & Lifecycle**:
   - Apps are synced into workspace schema via `yarn twenty dev --once`.
   - Workflows in Twenty UI can directly consume actions exported by the app (e.g., "Send ZNS message when Order status is Completed").

