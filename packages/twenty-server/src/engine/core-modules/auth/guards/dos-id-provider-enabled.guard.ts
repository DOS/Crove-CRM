import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
} from '@nestjs/common';

import {
  AuthException,
  AuthExceptionCode,
} from 'src/engine/core-modules/auth/auth.exception';
import {
  createDosIdClient,
  DosIdStrategy,
} from 'src/engine/core-modules/auth/strategies/dos-id.auth.strategy';
import { GuardRedirectService } from 'src/engine/core-modules/guard-redirect/services/guard-redirect.service';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';

@Injectable()
export class DosIdProviderEnabledGuard implements CanActivate {
  constructor(
    private readonly twentyConfigService: TwentyConfigService,
    private readonly guardRedirectService: GuardRedirectService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      if (!this.twentyConfigService.get('AUTH_DOS_ID_ENABLED')) {
        throw new AuthException(
          'DOS ID authentication is not enabled',
          AuthExceptionCode.FORBIDDEN_EXCEPTION,
        );
      }

      const client = await createDosIdClient(this.twentyConfigService);

      new DosIdStrategy(client);

      return true;
    } catch (err) {
      this.guardRedirectService.dispatchErrorFromGuard(
        context,
        err,
        this.guardRedirectService.getSubdomainAndCustomDomainFromContext(
          context,
        ),
      );

      return false;
    }
  }
}
