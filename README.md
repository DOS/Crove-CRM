<p align="center">
  <a href="https://crove.io">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="./packages/twenty-website/public/images/readme/github-cover-dark.webp" />
      <source media="(prefers-color-scheme: light)" srcset="./packages/twenty-website/public/images/readme/github-cover-light.webp" />
      <img src="./packages/twenty-website/public/images/readme/github-cover-light.webp" alt="Crove CRM Banner" />
    </picture>
  </a>
</p>

<h1 align="center">Crove CRM — The AI-Native Enterprise Business OS</h1>

<p align="center">
  <b>A hyper-charged, AI-first fork of Twenty CRM designed for solo founders, high-growth startups, and SMEs.</b>
</p>

<p align="center">
  <a href="https://crove.io"><img src="https://img.shields.io/badge/Website-crove.io-FF2E29?style=flat-square" alt="Website" /></a>
  <a href="https://crm.crove.com"><img src="https://img.shields.io/badge/Production-crm.crove.com-black?style=flat-square&logo=googlechrome" alt="Production CRM" /></a>
  <a href="https://github.com/twentyhq/twenty"><img src="https://img.shields.io/badge/Upstream-twentyhq%2Ftwenty-blue?style=flat-square&logo=github" alt="Upstream Fork" /></a>
  <a href="https://github.com/DOS/Crove-CRM/actions"><img src="https://img.shields.io/badge/Upstream%20Sync-Automated%20(6h)-success?style=flat-square&logo=githubactions" alt="Upstream Sync" /></a>
  <a href="https://github.com/DOS/Crove-CRM/blob/dev/LICENSE"><img src="https://img.shields.io/badge/License-AGPL--3.0-green?style=flat-square" alt="License" /></a>
</p>

---

## 🌟 What is Crove CRM?

**Crove CRM** is the customer relationship, sales intelligence, and business orchestration backbone of the **Crove Business OS** ecosystem. 

Building upon the open-source foundation of [Twenty CRM](https://github.com/twentyhq/twenty), Crove CRM elevates the platform into an **AI-Native Operating System** with unified multi-product single sign-on (DOS ID), single root domain multi-tenancy, cross-product event routing, zero-egress cloud storage, and regional business apps.

```
                     ┌─────────────────────────────────────────────────────────┐
                     │              DOS ID Unified SSO (OAuth 2.1)             │
                     │          https://api.dos.me (Single Source of Truth)    │
                     └────────────────────────────┬────────────────────────────┘
                                                  │
         ┌──────────────────┬─────────────────────┼────────────────────┬──────────────────┐
         ▼                  ▼                     ▼                    ▼                  ▼
   [ Crove CRM ]     [ Crove Desk ]        [ Crove Post ]       [ Crove Cal ]      [ Crove Sign ]
 Customer & Deals     AI Support & SLA     Social Scheduling    Team Calendar      e-Signatures
```

---

## 🚀 Key Superpowers & Differentiators

### 🤖 1. AI-Native Core & DOS.AI Integration
* **Universal Model Connectivity**: Powered by Vercel AI SDK (`@ai-sdk/openai-compatible`), seamlessly connecting with `https://api.dos.ai/v1` and custom model routers (`dos-auto`).
* **Ask AI Side-Panel**: An intelligent co-pilot embedded directly within the CRM (`@` shortcut) for natural language querying, deal forecasting, and record synthesis.
* **Smart Workflow Automation**: AI-driven triggers and action nodes for sentiment analysis, lead qualification, and automatic note summarization.
* **Model Context Protocol (MCP)**: Built-in native MCP Server Card (`io.crove/crm`) enabling external AI agents (Crove Desk AI, DOSClaw, OpenClaw) to securely query and manipulate CRM entities.

### 🌐 2. Single Root Domain Multi-Tenancy
* **Zero DNS/SSL Overhead**: In addition to traditional subdomains (`*.crove.io`), Crove CRM introduces `IS_MULTIWORKSPACE_SUBDOMAIN_ENABLED=false`, allowing multi-organization tenancy directly on a single root domain (e.g. `crm.crove.com`).
* **Seamless Tenant Switching**: Instant context switching between organizations using secure token verification (`/verify?loginToken=...`) without page reloads or wildcard DNS requirements.

### 🛡️ 3. Unified Identity & JIT Provisioning (DOS ID)
* **OpenID Connect & OAuth 2.1**: Native integration with Supabase Auth / DOS ID as the central identity provider.
* **Just-In-Time (JIT) Provisioning**: Automatically discovers user organizations from token claims on login, links memberships, and provisions new organizations mapped directly to `api.dos.me`.
* **Outbound Organization Sync**: Creating an organization in Crove CRM calls `POST https://api.dos.me/organizations` to ensure all products across the ecosystem share the identical Organization UUID.

### 🔄 4. 2-Tier Event Synchronization (CRM ↔ Desk)
* **Inbound Realtime Webhooks (`/webhooks/dos-org-sync`)**: High-throughput webhook processor secured with HMAC-SHA256 signatures (`X-DOS-Signature`) and 5-minute replay attack protection.
* **Outbound Event Listener (`EcosystemOutboundEventListener`)**: Automatically monitors TypeORM entity changes on `Company` and `Person` (Customer) and publishes events to `api.dos.me` for instant mirroring to Crove Desk.

### 📦 5. Custom Business & Regional Apps
Extended via the modular Twenty App SDK (`packages/twenty-apps`):
* 💬 **Zalo OA Integration (`packages/twenty-apps/public/zalo-oa`)**: Official Zalo Official Account connectivity — receive customer messages via webhooks, send text & rich interactive messages, send ZNS template notifications, and manage OA profile credentials.
* 🛍️ **Commerce & Order Management (`packages/twenty-apps/public/commerce`)**: Manage Products, Orders, and Order Items natively in CRM with automated total recalculations, status workflows, and customer association.
* 🔌 **Ecosystem Connectors**: Slack, Linear, Fireflies, and custom ecosystem bridges.

### ⚡ 6. Enterprise Infrastructure & Zero-Egress Cloud
* **Cloudflare R2 Object Storage**: S3-compatible file storage driver with zero egress fees for all documents, attachments, and avatars.
* **High-Throughput Database**: PostgreSQL with dedicated dynamic schemas per organization (`workspace_<id>`) backed by Supabase IPv4 connection pooler.
* **Transactional Email**: Brevo SMTP Relay (`smtp-relay.brevo.com:587`) for system emails + 2-way IMAP/SMTP/CalDAV mailbox & calendar synchronization.

### 🔄 7. Automated Upstream Sync & Rebranding Pipeline
* **Continuous Upstream Sync (`.github/workflows/upstream-sync.yml`)**: Scheduled GitHub Action automatically fetches new releases from `twentyhq/twenty` every 6 hours, cleanly merges updates into `dev`, and triggers automated deployment.
* **Zero-Conflict Localization & Branding (`packages/twenty-utils/patch-crove-branding.ts`)**: Injects Crove visual identity, logos, and terminology (English: *Organization*, Vietnamese: *Tổ chức*) dynamically during Docker builds without modifying upstream source files.

---

## 🏛️ System Architecture

```
                               ┌─────────────────────────────┐
                               │     Cloudflare Edge DNS     │
                               │   (WAF & Zero Trust Tunnel) │
                               └──────────────┬──────────────┘
                                              │
               ┌──────────────────────────────┴──────────────────────────────┐
               │                                                             │
               ▼                                                             ▼
     https://crm.crove.com                                          https://*.crove.com
 (Crove CRM Single-Domain App)                                (Desk, Post, Cal, Sign, Landing)
               │                                                             │
               └──────────────────────────────┬──────────────────────────────┘
                                              │
                                              ▼
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ GCP Compute Engine VM: crove-server (Zone: asia-southeast1-b)                            │
│                                                                                          │
│   ┌─────────────────────────┐                                                            │
│   │    crove-cloudflared    │ (Ingress Tunnel -> 127.0.0.1:3020)                         │
│   └────────────┬────────────┘                                                            │
│                │                                                                         │
│   ┌────────────┴─────────────┬─────────────────────────────┬─────────────────────────┐   │
│   ▼                          ▼                             ▼                         ▼   │
│ ┌──────────────────────┐   ┌───────────────────────┐     ┌───────────────────────┐       │
│ │      crm-server      │   │      crm-worker       │     │       crm-redis       │       │
│ │   (NestJS + React)   │   │    (BullMQ Worker)    │     │    (Session / Cache)  │       │
│ └──────────┬───────────┘   └───────────┬───────────┘     └───────────────────────┘       │
└────────────┼───────────────────────────┼─────────────────────────────────────────────────┘
             │                           │
             ▼                           ▼
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ Supabase Managed PostgreSQL (AWS ap-southeast-1)                                         │
│  - Core Schema: core (Tenant registry, user accounts, system configuration)              │
│  - Dynamic Schemas: workspace_<uuid> (Isolated data schema per Organization)             │
│  - IAM Engine: auth (OIDC SSO Server & Token Authority)                                  │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📦 Crove App Ecosystem

Crove CRM includes standard and custom extensions located in `packages/twenty-apps/`:

| App | Directory | Description |
| :--- | :--- | :--- |
| **Zalo OA** | `packages/twenty-apps/public/zalo-oa` | Official Zalo OA integration: Customer chat, Webhook router, ZNS templates |
| **Commerce** | `packages/twenty-apps/public/commerce` | E-Commerce pipeline: Products, Orders, Order Items, Pricing calculator |
| **Slack** | `packages/twenty-apps/public/slack` | Real-time deal alerts and team notification bot |
| **Linear** | `packages/twenty-apps/public/linear` | 2-way sync between CRM issues and Linear development tickets |
| **Fireflies** | `packages/twenty-apps/public/fireflies` | AI meeting transcription and conversation summary widgets |
| **Last Contact** | `packages/twenty-apps/public/last-contact` | Automated relationship recency tracking and stale lead warnings |

---

## 🛠️ Quick Start & Self-Hosting

### Option A: Docker Compose Deployment (Recommended)

1. Clone the repository:
   ```bash
   git clone -b dev https://github.com/DOS/Crove-CRM.git crove-crm
   cd crove-crm/packages/twenty-docker
   ```

2. Copy the environment configuration:
   ```bash
   cp .env.example .env
   ```

3. Configure your core environment variables in `.env`:
   ```env
   SERVER_URL=https://crm.crove.com
   FRONTEND_URL=https://crm.crove.com
   IS_MULTIWORKSPACE_ENABLED=true
   IS_MULTIWORKSPACE_SUBDOMAIN_ENABLED=false
   
   # Database & Redis
   PG_DATABASE_URL=postgres://postgres.<ref>:<password>@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
   REDIS_URL=redis://crm-redis:6379
   
   # DOS ID (OIDC SSO)
   AUTH_DOS_ID_ENABLED=true
   AUTH_DOS_ID_CLIENT_ID=your_client_id
   AUTH_DOS_ID_CLIENT_SECRET=your_client_secret
   AUTH_DOS_ID_ISSUER_URL=https://<supabase-ref>.supabase.co/auth/v1
   
   # Cloudflare R2 Object Storage
   STORAGE_TYPE=s3
   STORAGE_S3_REGION=auto
   STORAGE_S3_NAME=crove-crm
   STORAGE_S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
   STORAGE_S3_KEY=your_r2_access_key
   STORAGE_S3_SECRET=your_r2_secret_key
   ```

4. Launch the application stack:
   ```bash
   docker compose up -d
   ```

---

### Option B: Local Monorepo Development

Crove CRM uses an **Nx + Yarn 4** monorepo structure.

```bash
# 1. Install dependencies
yarn install

# 2. Build shared isomorphic libraries
npx nx build twenty-shared

# 3. Start Frontend & Backend development servers
yarn start
```

Useful commands:
```bash
# Typecheck
npx nx run twenty-server:typecheck
npx nx run twenty-front:typecheck

# Run unit tests
npx jest packages/twenty-server/src/engine/core-modules/auth/controllers/__tests__/dos-org-sync-webhook.controller.spec.ts --config=packages/twenty-server/jest.config.mjs

# Apply Crove branding patch manually
yarn patch:branding
```

---

## 📜 Upstream Fork Guidelines

Crove CRM follows the **Minimal Core Modification** philosophy:
1. **Configuration Over Code**: Prioritize environment variables (`.env`), build arguments, and SDK extensions over modifying core upstream engine files.
2. **Modular Extensions**: Custom business logic lives in `packages/twenty-apps/` or dedicated modules to guarantee zero merge conflicts during upstream updates.
3. **Automated Upstream Parity**: The `upstream-sync.yml` workflow continuously keeps Crove CRM aligned with the latest security fixes, performance improvements, and feature updates from `twentyhq/twenty`.

---

## 📄 License

Crove CRM is open-source software licensed under the **[AGPL-3.0 License](LICENSE)**, in alignment with upstream Twenty CRM.
