# DOS ID (OIDC / OAuth 2.1) Native Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate DOS ID (Supabase Auth OIDC / OAuth 2.1) as a native first-class authentication provider in Crove CRM across backend (`twenty-server`) and frontend (`twenty-front`).

**Architecture:** Extend Twenty's standard Social SSO strategy pattern (analogous to `GoogleStrategy` and `MicrosoftStrategy`) to support OIDC Authorization Code Flow with PKCE against `https://gulptwduchsjcsbndmua.supabase.co/auth/v1`, exposing a priority "Continue with DOS ID" login option on the frontend.

**Tech Stack:** NestJS 11, Passport.js (`passport-openidconnect` / `openid-client`), React 18, Jotai, Linaria, `twenty-ui`.

## Global Constraints

- Backend files follow existing `packages/twenty-server` NestJS module conventions (no abbreviations, short `//` comments).
- Frontend files use Linaria for styling and theme tokens from `twenty-ui/theme-constants`.
- Client ID: `18790ccb-4d71-48cd-ad24-aee5f3ced3da`
- Issuer: `https://gulptwduchsjcsbndmua.supabase.co/auth/v1`
- Callback URL: `https://crm.crove.com/auth/dos-id/redirect`
- Scopes: `openid email profile`

---

### Task 1: Add DOS ID to Auth Provider Types and Server Configuration

**Files:**
- Modify: `packages/twenty-server/src/engine/core-modules/workspace/types/workspace.type.ts`
- Modify: `packages/twenty-server/src/engine/core-modules/twenty-config/config-variables.ts`
- Modify: `packages/twenty-server/src/engine/core-modules/twenty-config/constants/config-variables-masking-config.ts`

**Interfaces:**
- Produces: `AuthProviderEnum.DosId = 'dos-id'` and configuration variables (`AUTH_DOS_ID_ENABLED`, `AUTH_DOS_ID_CLIENT_ID`, `AUTH_DOS_ID_CLIENT_SECRET`, `AUTH_DOS_ID_ISSUER_URL`, `AUTH_DOS_ID_CALLBACK_URL`).

- [ ] **Step 1: Add `DosId` to `AuthProviderEnum`**
In `packages/twenty-server/src/engine/core-modules/workspace/types/workspace.type.ts`:
```typescript
export enum AuthProviderEnum {
  Google = 'google',
  Microsoft = 'microsoft',
  Password = 'password',
  SSO = 'sso',
  Impersonation = 'impersonation',
  DosId = 'dos-id',
}
```

- [ ] **Step 2: Add Config Variables for DOS ID**
In `packages/twenty-server/src/engine/core-modules/twenty-config/config-variables.ts`, declare:
```typescript
  @ConfigVariablesMetadata({
    group: ConfigVariablesGroup.AUTH,
    description: 'Enable or disable DOS ID authentication',
    type: ConfigVariableType.BOOLEAN,
  })
  @IsOptional()
  AUTH_DOS_ID_ENABLED = false;

  @ConfigVariablesMetadata({
    group: ConfigVariablesGroup.AUTH,
    description: 'Client ID for DOS ID OAuth provider',
    type: ConfigVariableType.STRING,
  })
  @IsOptional()
  AUTH_DOS_ID_CLIENT_ID?: string;

  @ConfigVariablesMetadata({
    group: ConfigVariablesGroup.AUTH,
    description: 'Client Secret for DOS ID OAuth provider',
    type: ConfigVariableType.STRING,
  })
  @IsOptional()
  AUTH_DOS_ID_CLIENT_SECRET?: string;

  @ConfigVariablesMetadata({
    group: ConfigVariablesGroup.AUTH,
    description: 'OIDC Issuer URL for DOS ID',
    type: ConfigVariableType.STRING,
  })
  @IsOptional()
  AUTH_DOS_ID_ISSUER_URL = 'https://gulptwduchsjcsbndmua.supabase.co/auth/v1';

  @ConfigVariablesMetadata({
    group: ConfigVariablesGroup.AUTH,
    description: 'Callback redirect URL for DOS ID OAuth flow',
    type: ConfigVariableType.STRING,
  })
  @IsOptional()
  AUTH_DOS_ID_CALLBACK_URL?: string;
```

- [ ] **Step 3: Mask Client Secret in Masking Config**
In `packages/twenty-server/src/engine/core-modules/twenty-config/constants/config-variables-masking-config.ts`, add `AUTH_DOS_ID_CLIENT_SECRET: { hidePassword: true }`.

---

### Task 2: Implement DOS ID Passport Strategy, Guards, and Controller

**Files:**
- Create: `packages/twenty-server/src/engine/core-modules/auth/strategies/dos-id.auth.strategy.ts`
- Create: `packages/twenty-server/src/engine/core-modules/auth/guards/dos-id-oauth.guard.ts`
- Create: `packages/twenty-server/src/engine/core-modules/auth/guards/dos-id-provider-enabled.guard.ts`
- Create: `packages/twenty-server/src/engine/core-modules/auth/controllers/dos-id-auth.controller.ts`
- Modify: `packages/twenty-server/src/engine/core-modules/auth/auth.module.ts`

**Interfaces:**
- Consumes: `TwentyConfigService`, `AuthService`, `AuthProviderEnum.DosId`
- Produces: `GET /auth/dos-id` and `GET /auth/dos-id/redirect` routes

- [ ] **Step 1: Create `DosIdStrategy`**
Create `packages/twenty-server/src/engine/core-modules/auth/strategies/dos-id.auth.strategy.ts` implementing the OIDC / OAuth2 strategy using `openid-client` discovery on `AUTH_DOS_ID_ISSUER_URL`.

- [ ] **Step 2: Create `DosIdOauthGuard` and `DosIdProviderEnabledGuard`**
Create the guards ensuring `AUTH_DOS_ID_ENABLED` is `true` and wrapping Passport's `AuthGuard('dos-id')`.

- [ ] **Step 3: Create `DosIdAuthController`**
Create `packages/twenty-server/src/engine/core-modules/auth/controllers/dos-id-auth.controller.ts` with routes:
  - `@Get()` -> `dosIdAuth()`
  - `@Get('redirect')` -> `dosIdAuthRedirect(@Req() req, @Res() res)` calling `authService.signInUpWithSocialSSO(req.user, AuthProviderEnum.DosId)`.

- [ ] **Step 4: Register Controller and Strategy in `AuthModule`**
Add `DosIdAuthController`, `DosIdStrategy`, `DosIdOauthGuard`, and `DosIdProviderEnabledGuard` to `packages/twenty-server/src/engine/core-modules/auth/auth.module.ts`.

---

### Task 3: Expose DOS ID in Client Configuration Service

**Files:**
- Modify: `packages/twenty-server/src/engine/core-modules/client-config/services/client-config.service.ts`
- Modify: `packages/twenty-front/src/modules/client-config/types/ClientConfig.ts`
- Modify: `packages/twenty-front/src/modules/client-config/states/authProvidersState.ts`

- [ ] **Step 1: Update Server `ClientConfigService`**
In `packages/twenty-server/src/engine/core-modules/client-config/services/client-config.service.ts`:
```typescript
authProviders: {
  google: this.twentyConfigService.get('AUTH_GOOGLE_ENABLED'),
  microsoft: this.twentyConfigService.get('AUTH_MICROSOFT_ENABLED'),
  password: this.twentyConfigService.get('AUTH_PASSWORD_ENABLED'),
  dosId: this.twentyConfigService.get('AUTH_DOS_ID_ENABLED'),
  magicLink: false,
  sso: [],
}
```

- [ ] **Step 2: Update Frontend Type Definition**
In `packages/twenty-front/src/modules/client-config/types/ClientConfig.ts`, update `ClientConfigAuthProviders`:
```typescript
export type ClientConfigAuthProviders = {
  google?: boolean;
  microsoft?: boolean;
  password?: boolean;
  magicLink?: boolean;
  dosId?: boolean;
  sso: SSOConnectionDTO[];
};
```

---

### Task 4: Implement Frontend UI Component and Integration

**Files:**
- Modify: `packages/twenty-front/src/modules/auth/types/AuthenticatedMethod.enum.ts`
- Create: `packages/twenty-front/src/modules/auth/sign-in-up/hooks/useSignInWithDosId.ts`
- Create: `packages/twenty-front/src/modules/auth/sign-in-up/components/internal/SignInUpWithDosId.tsx`
- Modify: `packages/twenty-front/src/modules/auth/hooks/useAuth.ts`
- Modify: `packages/twenty-front/src/modules/auth/sign-in-up/components/SignInUpGlobalScopeForm.tsx`
- Modify: `packages/twenty-front/src/modules/auth/sign-in-up/components/internal/SignInUpWithCredentials.tsx`

- [ ] **Step 1: Add `DOS_ID` to `AuthenticatedMethod`**
In `packages/twenty-front/src/modules/auth/types/AuthenticatedMethod.enum.ts`, add `DOS_ID = 'DOS_ID'`.

- [ ] **Step 2: Add `handleDosIdLogin` to `useAuth` hook**
In `packages/twenty-front/src/modules/auth/hooks/useAuth.ts`:
```typescript
const handleDosIdLogin = useCallback(
  (params: {
    workspacePersonalInviteToken?: string;
    workspaceInviteHash?: string;
    billingCheckoutSession?: BillingCheckoutSession;
    action: string;
  }) => {
    redirect(buildRedirectUrl('/auth/dos-id', params));
  },
  [buildRedirectUrl, redirect],
);
```

- [ ] **Step 3: Create `useSignInWithDosId` Hook**
In `packages/twenty-front/src/modules/auth/sign-in-up/hooks/useSignInWithDosId.ts`:
Expose `signInWithDosId: ({ action }) => signInWithDosId(...)`.

- [ ] **Step 4: Create `SignInUpWithDosId` Component**
In `packages/twenty-front/src/modules/auth/sign-in-up/components/internal/SignInUpWithDosId.tsx`:
Render a `MainButton` with DOS logo and title `Continue with DOS ID`.

- [ ] **Step 5: Place DOS ID Button in Sign In/Up Forms**
Add `SignInUpWithDosId` at the top of social authentication options in:
- `SignInUpGlobalScopeForm.tsx`
- `SignInUpWorkspaceScopeForm.tsx`
- `SignInUpWithCredentials.tsx`

---

### Task 5: Verification, VM Environment Configuration, and End-to-End Testing

**Files:**
- Modify: `packages/twenty-docker/.env` on `crove-server` VM

- [ ] **Step 1: Set Environment Variables on VM**
Add to `/opt/crove/crm/.env`:
```ini
AUTH_DOS_ID_ENABLED=true
AUTH_DOS_ID_CLIENT_ID=18790ccb-4d71-48cd-ad24-aee5f3ced3da
AUTH_DOS_ID_CLIENT_SECRET=<CROVE_OAUTH_CLIENT_SECRET>
AUTH_DOS_ID_ISSUER_URL=https://gulptwduchsjcsbndmua.supabase.co/auth/v1
AUTH_DOS_ID_CALLBACK_URL=https://crm.crove.com/auth/dos-id/redirect
```

- [ ] **Step 2: Build & Verify Locally**
Run: `npx nx lint:diff-with-main twenty-server` and `npx nx typecheck twenty-server`.

- [ ] **Step 3: Deploy & Test Live Flow**
Deploy updated container to VM and verify 1-click login on `https://crm.crove.com/welcome`.
