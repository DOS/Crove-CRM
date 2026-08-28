import {
  type ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';

import { type Request } from 'express';
import { Repository } from 'typeorm';

import {
  AuthException,
  AuthExceptionCode,
} from 'src/engine/core-modules/auth/auth.exception';
import { WorkspaceDomainsService } from 'src/engine/core-modules/domain/workspace-domains/services/workspace-domains.service';
import { GuardRedirectService } from 'src/engine/core-modules/guard-redirect/services/guard-redirect.service';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';

@Injectable()
export class DosIdOauthGuard extends AuthGuard('dos-id') {
  private readonly logger = new Logger(DosIdOauthGuard.name);

  constructor(
    private readonly guardRedirectService: GuardRedirectService,
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
    private readonly workspaceDomainsService: WorkspaceDomainsService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    let workspace: WorkspaceEntity | null = null;

    try {
      if (
        request.query.workspaceId &&
        typeof request.query.workspaceId === 'string'
      ) {
        request.params.workspaceId = request.query.workspaceId;
        workspace = await this.workspaceRepository.findOneBy({
          id: request.query.workspaceId,
        });
      }

      if (request.query.error === 'access_denied') {
        throw new AuthException(
          'DOS ID authentication access denied',
          AuthExceptionCode.OAUTH_ACCESS_DENIED,
        );
      }

      return (await super.canActivate(context)) as boolean;
    } catch (err) {
      this.logger.error(`DOS ID OAuth guard error: ${err}`, (err as Error)?.stack);

      this.guardRedirectService.dispatchErrorFromGuard(
        context,
        err,
        this.workspaceDomainsService.getSubdomainAndCustomDomainFromWorkspaceFallbackOnDefaultSubdomain(
          workspace,
        ),
      );

      return false;
    }
  }

  // oxlint-disable-next-line typescript/no-explicit-any
  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      const responseBody = err?.response?.body
        ? typeof err.response.body === 'string'
          ? err.response.body
          : JSON.stringify(err.response.body)
        : null;

      const errorMessage =
        err?.response?.body?.msg ||
        err?.response?.body?.error_description ||
        err?.response?.body?.error ||
        err?.message ??
        info?.message ??
        'DOS ID authentication failed';

      this.logger.error(
        `DOS ID OAuth handleRequest failed: ${errorMessage}${responseBody ? ` | Response: ${responseBody}` : ''}`,
        err?.stack ?? info,
      );

      const exception = new AuthException(
        errorMessage,
        AuthExceptionCode.UNAUTHENTICATED,
      );

      throw exception;
    }

    return user;
  }
}
