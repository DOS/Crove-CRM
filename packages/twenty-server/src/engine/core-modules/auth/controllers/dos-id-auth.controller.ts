import {
  Controller,
  Get,
  Req,
  Res,
  UseFilters,
  UseGuards,
} from '@nestjs/common';

import { Response } from 'express';
import { ApiPath } from 'twenty-shared/types';

import { AuthOAuthExceptionFilter } from 'src/engine/core-modules/auth/filters/auth-oauth-exception.filter';
import { AuthRestApiExceptionFilter } from 'src/engine/core-modules/auth/filters/auth-rest-api-exception.filter';
import { DosIdOauthGuard } from 'src/engine/core-modules/auth/guards/dos-id-oauth.guard';
import { DosIdProviderEnabledGuard } from 'src/engine/core-modules/auth/guards/dos-id-provider-enabled.guard';
import { AuthService } from 'src/engine/core-modules/auth/services/auth.service';
import { DosIdRequest } from 'src/engine/core-modules/auth/strategies/dos-id.auth.strategy';
import { AuthProviderEnum } from 'src/engine/core-modules/workspace/types/workspace.type';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { PublicEndpointGuard } from 'src/engine/guards/public-endpoint.guard';

@Controller(`${ApiPath.Auth}/dos-id`)
@UseFilters(AuthRestApiExceptionFilter)
export class DosIdAuthController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  @UseGuards(
    DosIdProviderEnabledGuard,
    DosIdOauthGuard,
    PublicEndpointGuard,
    NoPermissionGuard,
  )
  async dosIdAuth() {
    // Triggers DOS ID OIDC flow
    return;
  }

  @Get('redirect')
  @UseGuards(
    DosIdProviderEnabledGuard,
    DosIdOauthGuard,
    PublicEndpointGuard,
    NoPermissionGuard,
  )
  @UseFilters(AuthOAuthExceptionFilter)
  async dosIdAuthRedirect(@Req() req: DosIdRequest, @Res() res: Response) {
    return res.redirect(
      await this.authService.signInUpWithSocialSSO(
        req.user,
        AuthProviderEnum.DosId,
      ),
    );
  }
}
