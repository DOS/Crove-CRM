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
* **Scopes**: `openid email profile`

### Authentication Flow (Social SSO Strategy Pattern):
1. **Initiate**: User clicks **"Continue with DOS ID"** on `https://crm.crove.com/welcome`.
2. **Authorize**: Browser is redirected to `https://id.dos.me/login` with `client_id`, PKCE challenge, and CSRF `state`.
3. **Authenticate**: User logs in using Web3 Wallet, Google, X, Discord, or Email OTP on DOS ID.
4. **Callback**: DOS ID redirects to `https://crm.crove.com/auth/dos-id/redirect?code=...&state=...`.
5. **Token & Profile Exchange**: `twenty-server` exchanges `code` with Supabase Token URL, retrieves User Info (`sub`, `email`, `name`, `picture`).
6. **Workspace Resolution**: `AuthService.signInUpWithSocialSSO` auto-provisions or resolves the user's workspace and issues a session token.

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
