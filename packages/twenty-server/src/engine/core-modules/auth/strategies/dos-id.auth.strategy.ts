import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

import { type Request } from 'express';
import { Issuer, Strategy, type TokenSet } from 'openid-client';
import { type APP_LOCALES } from 'twenty-shared/translations';
import { parseJson } from 'twenty-shared/utils';

import {
  AuthException,
  AuthExceptionCode,
} from 'src/engine/core-modules/auth/auth.exception';
import { type SocialSSOSignInUpActionType } from 'src/engine/core-modules/auth/types/signInUp.type';
import { type SocialSSOState } from 'src/engine/core-modules/auth/types/social-sso-state.type';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';

const logger = new Logger('DosIdStrategy');

export type DosIdRequest = Omit<
  Request,
  'user' | 'workspace' | 'workspaceMetadataVersion'
> & {
  user: {
    firstName?: string | null;
    lastName?: string | null;
    email: string;
    picture: string | null;
    locale?: keyof typeof APP_LOCALES | null;
    workspaceInviteHash?: string;
    action: SocialSSOSignInUpActionType;
    workspaceId?: string;
    billingCheckoutSessionState?: string;
    returnToPath?: string;
    organizations?: Array<{
      id: string;
      name: string;
      role: 'OWNER' | 'ADMIN' | 'MEMBER';
    }>;
  };
};

export const createDosIdClient = async (
  twentyConfigService: TwentyConfigService,
) => {
  const issuerUrl =
    twentyConfigService.get('AUTH_DOS_ID_ISSUER_URL') ||
    'https://gulptwduchsjcsbndmua.supabase.co/auth/v1';

  const issuer = await Issuer.discover(issuerUrl);

  const serverUrl = twentyConfigService.get('SERVER_URL');
  const callbackUrl =
    twentyConfigService.get('AUTH_DOS_ID_CALLBACK_URL') ||
    new URL('/auth/dos-id/redirect', serverUrl).toString();

  const idTokenSignedResponseAlg =
    issuer.metadata.id_token_signing_alg_values_supported?.includes('ES256')
      ? 'ES256'
      : (issuer.metadata.id_token_signing_alg_values_supported?.[0] ?? 'RS256');

  return new issuer.Client({
    client_id: twentyConfigService.get('AUTH_DOS_ID_CLIENT_ID') ?? '',
    client_secret: twentyConfigService.get('AUTH_DOS_ID_CLIENT_SECRET') ?? '',
    redirect_uris: [callbackUrl],
    response_types: ['code'],
    id_token_signed_response_alg: idTokenSignedResponseAlg,
  });
};

@Injectable()
export class DosIdStrategy extends PassportStrategy(Strategy, 'dos-id') {
  // oxlint-disable-next-line typescript/no-explicit-any
  constructor(client: any) {
    super({
      client,
      params: {
        scope: 'openid email profile offline_access',
        code_challenge_method: 'S256',
      },
      usePKCE: true,
      passReqToCallback: true,
    });
  }

  // oxlint-disable-next-line typescript/no-explicit-any
  authenticate(req: Request, options: any) {
    if (!req.query.code) {
      options = {
        ...options,
        state: JSON.stringify({
          workspaceInviteHash: req.query.workspaceInviteHash,
          workspaceId: req.params.workspaceId,
          billingCheckoutSessionState: req.query.billingCheckoutSessionState,
          action: req.query.action,
          locale: req.query.locale,
          returnToPath: req.query.returnToPath,
        }),
      };
    }

    return super.authenticate(req, options);
  }

  async validate(
    request: Request,
    tokenset: TokenSet,
    // oxlint-disable-next-line typescript/no-explicit-any
    done: (err: any, user?: DosIdRequest['user']) => void,
  ): Promise<void> {
    try {
      const state = parseJson<SocialSSOState>(request.query.state as string);

      let userinfo: any = {};
      try {
        // oxlint-disable-next-line typescript/no-explicit-any
        userinfo = await (this as any)._client.userinfo(tokenset);
      } catch (userinfoError) {
        logger.warn(
          `Failed to fetch userinfo from DOS ID, falling back to claims: ${userinfoError}`,
        );
        userinfo = {};
      }

      // oxlint-disable-next-line typescript/no-explicit-any
      const claims: any = tokenset.claims ? tokenset.claims() : {};
      const userMetadata = claims?.user_metadata ?? userinfo?.user_metadata ?? {};

      const email =
        userinfo.email ??
        claims.email ??
        userinfo.upn ??
        claims.upn ??
        userMetadata.email;

      if (!email || typeof email !== 'string') {
        throw new AuthException(
          'Email not found from DOS ID profile',
          AuthExceptionCode.EMAIL_NOT_VERIFIED,
        );
      }

      const firstName =
        (userinfo.given_name as string) ??
        (claims.given_name as string) ??
        (userMetadata.first_name as string) ??
        (userinfo.name as string)?.split(' ')?.[0] ??
        (claims.name as string)?.split(' ')?.[0] ??
        (userMetadata.full_name as string)?.split(' ')?.[0] ??
        null;

      const lastName =
        (userinfo.family_name as string) ??
        (claims.family_name as string) ??
        (userMetadata.last_name as string) ??
        (userinfo.name as string)?.split(' ')?.slice(1)?.join(' ') ??
        (claims.name as string)?.split(' ')?.slice(1)?.join(' ') ??
        (userMetadata.full_name as string)?.split(' ')?.slice(1)?.join(' ') ??
        null;

      const picture =
        (userinfo.picture as string) ??
        (claims.picture as string) ??
        (userMetadata.avatar_url as string) ??
        (userMetadata.picture as string) ??
        (userinfo.avatar_url as string) ??
        null;

      const user: DosIdRequest['user'] = {
        email: email.toLowerCase(),
        firstName,
        lastName,
        picture,
        workspaceInviteHash: state?.workspaceInviteHash,
        workspaceId: state?.workspaceId,
        billingCheckoutSessionState: state?.billingCheckoutSessionState,
        action: state?.action ?? 'list-available-workspaces',
        locale: state?.locale,
        returnToPath: state?.returnToPath,
        organizations:
          (userinfo.organizations as DosIdRequest['user']['organizations']) ??
          (claims.organizations as DosIdRequest['user']['organizations']),
      };

      done(null, user);
    } catch (error) {
      logger.error(`Validation error in DosIdStrategy: ${error}`, error);
      done(error);
    }
  }
}
