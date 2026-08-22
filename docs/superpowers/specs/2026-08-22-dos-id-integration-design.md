# Design Specification: DOS ID (OIDC / OAuth 2.1) Native Integration

**Document Version:** 1.0.0  
**Author:** Crove Engineering Team  
**Status:** Approved by DOS.Me & User  
**Target:** `packages/twenty-server` & `packages/twenty-front`

---

## 1. Objective

Integrate **DOS.ID** (Supabase Auth OAuth 2.1 / OIDC Server) natively into Crove CRM (Twenty CRM fork) as a first-class authentication provider, mirroring the standard pattern established for Google and Microsoft Social SSO.

---

## 2. Technical Parameters & Credentials

* **Issuer / Discovery Endpoint:** `https://gulptwduchsjcsbndmua.supabase.co/auth/v1`
* **Authorization Endpoint:** `https://gulptwduchsjcsbndmua.supabase.co/auth/v1/oauth/authorize`
* **Token Endpoint:** `https://gulptwduchsjcsbndmua.supabase.co/auth/v1/oauth/token`
* **UserInfo Endpoint:** `https://gulptwduchsjcsbndmua.supabase.co/auth/v1/oauth/userinfo`
* **Client ID:** `18790ccb-4d71-48cd-ad24-aee5f3ced3da`
* **Client Secret:** Loaded securely from GCP Secret Manager / `.env` (`AUTH_DOS_ID_CLIENT_SECRET`)
* **Redirect Callback URL:** `https://crm.crove.com/auth/dos-id/redirect`
* **Scopes:** `openid email profile`

---

## 3. Architecture & Components

```
User Click ("Continue with DOS ID")
       │
       ▼
[twenty-front] SignInUpWithDosId.tsx
       │ Redirects browser to:
       ▼
[twenty-server] GET /auth/dos-id
       │ Builds OIDC Authorization URL with PKCE & state
       ▼
[DOS ID Login Hub] https://id.dos.me/login
       │ User logs in (Email, Google, Web3 Wallet, etc.)
       ▼
[twenty-server] GET /auth/dos-id/redirect?code=...&state=...
       │ 1. Exchanges 'code' for Tokens at Supabase Token Endpoint
       │ 2. Fetches profile from Supabase UserInfo Endpoint
       │ 3. Calls AuthService.signInUpWithSocialSSO(user, AuthProviderEnum.DosId)
       ▼
[twenty-front] Returns ssoExchangeToken -> Navigates user directly to Workspace Dashboard
```

---

## 4. Implementation Specification

### 4.1. Backend (`packages/twenty-server`)

1. **Enum & Types**:
   - Add `DosId = 'dos-id'` to `AuthProviderEnum` in `src/engine/core-modules/workspace/types/workspace.type.ts`.
   - Update config variables in `src/engine/core-modules/twenty-config/config-variables.ts`:
     - `AUTH_DOS_ID_ENABLED` (boolean, default: false)
     - `AUTH_DOS_ID_CLIENT_ID` (string, optional)
     - `AUTH_DOS_ID_CLIENT_SECRET` (string, optional)
     - `AUTH_DOS_ID_ISSUER_URL` (string, optional)
     - `AUTH_DOS_ID_CALLBACK_URL` (string, optional)

2. **Passport Strategy & Guard**:
   - `src/engine/core-modules/auth/strategies/dos-id.auth.strategy.ts`:
     - Implements OpenID Connect Authorization Code Flow + PKCE using `openid-client` (or `passport-openidconnect`).
     - Extracts claims: `sub`, `email`, `given_name`, `family_name`, `name`, `picture`.
   - `src/engine/core-modules/auth/guards/dos-id-oauth.guard.ts` and `dos-id-provider-enabled.guard.ts`.

3. **Controller**:
   - `src/engine/core-modules/auth/controllers/dos-id-auth.controller.ts`:
     - `GET /auth/dos-id`: Triggers DOS ID login.
     - `GET /auth/dos-id/redirect`: Validates code, resolves user, and redirects to front with `ssoExchangeToken`.

4. **Module Registration**:
   - Wire `DosIdAuthController`, `DosIdStrategy`, and guards into `AuthModule` (`src/engine/core-modules/auth/auth.module.ts`).
   - Expose `authProviders.dosId` in `ClientConfigService` (`src/engine/core-modules/client-config/services/client-config.service.ts`).

---

### 4.2. Frontend (`packages/twenty-front`)

1. **State & Types**:
   - Add `dosId?: boolean` to `ClientConfigAuthProviders` in `src/modules/client-config/types/ClientConfig.ts`.
   - Add `DOS_ID = 'DOS_ID'` to `AuthenticatedMethod` enum.

2. **UI Component & Hook**:
   - `src/modules/auth/sign-in-up/hooks/useSignInWithDosId.ts`: Hook for triggering `/auth/dos-id` redirect.
   - `src/modules/auth/sign-in-up/components/internal/SignInUpWithDosId.tsx`:
     - Styled button with DOS logo and label **"Continue with DOS ID"**.
     - Placed at the top of social authentication options.

3. **Integration into Auth Pages**:
   - Include `SignInUpWithDosId` in `SignInUpGlobalScopeForm.tsx`, `SignInUpWorkspaceScopeForm.tsx`, and `SignInUpWithCredentials.tsx`.

---

## 5. Security & Validation Checklist

- [x] State parameter validated with CSRF protection.
- [x] PKCE code challenge method S256 enforced.
- [x] Case-insensitive email normalization on sign-in and account linking.
- [x] Config variables masked in logs and admin panel.
- [x] Clean zero-runtime CSS via Linaria and tokenized colors in `twenty-ui`.
