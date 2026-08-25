import * as crypto from 'crypto';

import {
  BadRequestException,
  Controller,
  Headers,
  Logger,
  Post,
  Req,
  UnauthorizedException,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { type Request } from 'express';
import { ApiPath } from 'twenty-shared/types';
import { isDefined, isNonEmptyString } from 'twenty-shared/utils';
import { WorkspaceActivationStatus } from 'twenty-shared/workspace';
import { Repository } from 'typeorm';

import { AuthRestApiExceptionFilter } from 'src/engine/core-modules/auth/filters/auth-rest-api-exception.filter';
import { SignInUpService } from 'src/engine/core-modules/auth/services/sign-in-up.service';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { UserWorkspaceEntity } from 'src/engine/core-modules/user-workspace/user-workspace.entity';
import { UserWorkspaceService } from 'src/engine/core-modules/user-workspace/user-workspace.service';
import { UserService } from 'src/engine/core-modules/user/services/user.service';
import { UserEntity } from 'src/engine/core-modules/user/user.entity';
import { AuthProviderEnum } from 'src/engine/core-modules/workspace/types/workspace.type';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { PublicEndpointGuard } from 'src/engine/guards/public-endpoint.guard';

type DosOrgSyncPayload = {
  event:
    | 'organization.created'
    | 'org.created'
    | 'organization.updated'
    | 'org.updated'
    | 'organization.deleted'
    | 'org.deleted'
    | 'organization.member_added'
    | 'org.member_added'
    | 'organization.member_removed'
    | 'org.member_removed'
    | 'user.updated';
  timestamp: string;
  data: {
    org_id?: string;
    org_name?: string;
    name?: string;
    slug?: string;
    owner_id?: string;
    owner_email?: string;
    user_id?: string;
    user_email?: string;
    user_name?: string;
    display_name?: string;
    avatar_url?: string;
    role?: 'OWNER' | 'ADMIN' | 'MEMBER';
  };
};

@Controller(ApiPath.Webhooks)
@UseFilters(AuthRestApiExceptionFilter)
export class DosOrgSyncWebhookController {
  private readonly logger = new Logger(DosOrgSyncWebhookController.name);

  constructor(
    private readonly twentyConfigService: TwentyConfigService,
    private readonly userWorkspaceService: UserWorkspaceService,
    private readonly signInUpService: SignInUpService,
    private readonly userService: UserService,
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(UserWorkspaceEntity)
    private readonly userWorkspaceRepository: Repository<UserWorkspaceEntity>,
  ) {}

  @Post('dos-org-sync')
  @UseGuards(PublicEndpointGuard, NoPermissionGuard)
  async handleDosOrgSync(
    @Headers('x-dos-signature') signature: string,
    @Req() req: Request,
  ) {
    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
    const secret = this.twentyConfigService.get('CROVE_DOS_WEBHOOK_SECRET');

    if (isNonEmptyString(secret)) {
      if (!isNonEmptyString(signature)) {
        throw new UnauthorizedException('Missing X-DOS-Signature header');
      }

      const bodyBuffer = rawBody ?? Buffer.from(JSON.stringify(req.body));
      const expectedSignature = `sha256=${crypto
        .createHmac('sha256', secret)
        .update(bodyBuffer)
        .digest('hex')}`;

      if (signature !== expectedSignature) {
        throw new UnauthorizedException('Invalid X-DOS-Signature');
      }
    }

    const payload = req.body as DosOrgSyncPayload;

    if (!payload?.event) {
      throw new BadRequestException('Invalid payload: event is required');
    }

    this.logger.log(`Received DOS sync webhook event: ${payload.event}`);

    switch (payload.event) {
      case 'organization.created':
      case 'org.created': {
        const orgName = payload.data.name || payload.data.org_name;
        const ownerEmail = payload.data.owner_email?.toLowerCase();

        if (isNonEmptyString(orgName) && isNonEmptyString(ownerEmail)) {
          const existingWorkspace = await this.workspaceRepository.findOne({
            where: [{ displayName: orgName.trim() }],
          });

          if (isDefined(existingWorkspace)) {
            this.logger.log(
              `Workspace with name "${orgName}" already exists, skipping creation`,
            );
            break;
          }

          let user = await this.userService.findUserByEmail(ownerEmail);

          if (!user) {
            user = await this.signInUpService.signUpWithoutWorkspace(
              {
                email: ownerEmail,
                firstName: payload.data.user_name?.split(' ')?.[0] || '',
                lastName:
                  payload.data.user_name?.split(' ')?.slice(1)?.join(' ') ||
                  '',
                picture: payload.data.avatar_url || null,
                isEmailAlreadyVerified: true,
              },
              { provider: AuthProviderEnum.DosId },
            );
          }

          try {
            const orgId = payload.data.id || payload.data.org_id;
            await this.signInUpService.signUpOnNewWorkspace(
              { type: 'existingUser', existingUser: user },
              {
                displayName: orgName.trim(),
                subdomain: isNonEmptyString(payload.data.slug)
                  ? payload.data.slug
                  : undefined,
                workspaceId: isNonEmptyString(orgId) ? orgId : undefined,
              },
            );
            this.logger.log(
              `Successfully provisioned workspace "${orgName}" for owner ${ownerEmail}`,
            );
          } catch (error) {
            this.logger.error(
              `Failed to provision workspace "${orgName}": ${
                error instanceof Error ? error.message : String(error)
              }`,
            );
          }
        }
        break;
      }

      case 'organization.updated':
      case 'org.updated': {
        const orgName = payload.data.name || payload.data.org_name;
        const orgId = payload.data.org_id;

        if (isNonEmptyString(orgId) && isNonEmptyString(orgName)) {
          const workspace = await this.workspaceRepository.findOne({
            where: [{ id: orgId }, { displayName: orgName.trim() }],
          });

          if (isDefined(workspace)) {
            await this.workspaceRepository.update(workspace.id, {
              displayName: orgName.trim(),
            });
            this.logger.log(
              `Updated workspace ${workspace.id} name to ${orgName}`,
            );
          }
        }
        break;
      }

      case 'organization.deleted':
      case 'org.deleted': {
        const orgId = payload.data.org_id;
        const orgName = payload.data.name || payload.data.org_name;

        const workspace = isNonEmptyString(orgId)
          ? await this.workspaceRepository.findOne({
              where: [{ id: orgId }, ...(orgName ? [{ displayName: orgName }] : [])],
            })
          : null;

        if (isDefined(workspace)) {
          await this.workspaceRepository.update(workspace.id, {
            activationStatus: WorkspaceActivationStatus.SUSPENDED,
          });
          this.logger.log(`Suspended workspace ${workspace.id} due to org deletion`);
        }
        break;
      }

      case 'organization.member_added':
      case 'org.member_added': {
        const userEmail = payload.data.user_email?.toLowerCase();
        const orgId = payload.data.org_id;
        const orgName = payload.data.org_name || payload.data.name;

        if (isNonEmptyString(userEmail)) {
          let user = await this.userService.findUserByEmail(userEmail);

          if (!user) {
            user = await this.signInUpService.signUpWithoutWorkspace(
              {
                email: userEmail,
                firstName: payload.data.user_name?.split(' ')?.[0] || '',
                lastName:
                  payload.data.user_name?.split(' ')?.slice(1)?.join(' ') ||
                  '',
                picture: payload.data.avatar_url || null,
                isEmailAlreadyVerified: true,
              },
              { provider: AuthProviderEnum.DosId },
            );
          }

          const workspace = isNonEmptyString(orgId)
            ? await this.workspaceRepository.findOne({
                where: [{ id: orgId }, ...(orgName ? [{ displayName: orgName }] : [])],
              })
            : null;

          if (isDefined(user) && isDefined(workspace)) {
            await this.userWorkspaceService.addUserToWorkspaceIfUserNotInWorkspace(
              user,
              workspace,
            );
            this.logger.log(
              `Added user ${userEmail} to workspace ${workspace.id}`,
            );
          }
        }
        break;
      }

      case 'organization.member_removed':
      case 'org.member_removed': {
        const userEmail = payload.data.user_email?.toLowerCase();
        const orgId = payload.data.org_id;
        const orgName = payload.data.org_name || payload.data.name;

        if (isNonEmptyString(userEmail)) {
          const user = await this.userService.findUserByEmail(userEmail);

          const workspace = isNonEmptyString(orgId)
            ? await this.workspaceRepository.findOne({
                where: [{ id: orgId }, ...(orgName ? [{ displayName: orgName }] : [])],
              })
            : null;

          if (isDefined(user) && isDefined(workspace)) {
            const userWorkspace = await this.userWorkspaceRepository.findOne({
              where: { userId: user.id, workspaceId: workspace.id },
            });

            if (isDefined(userWorkspace)) {
              await this.userWorkspaceService.deleteUserWorkspace({
                userWorkspaceId: userWorkspace.id,
                workspaceId: workspace.id,
              });
              this.logger.log(
                `Removed user ${userEmail} from workspace ${workspace.id}`,
              );
            }
          }
        }
        break;
      }

      case 'user.updated': {
        const userEmail =
          payload.data.email?.toLowerCase() ||
          payload.data.user_email?.toLowerCase();
        const displayName =
          payload.data.display_name || payload.data.user_name;

        if (isNonEmptyString(userEmail)) {
          const user = await this.userService.findUserByEmail(userEmail);

          if (isDefined(user)) {
            const nameParts = displayName?.split(' ') || [];
            const firstName = nameParts[0] || user.firstName;
            const lastName = nameParts.slice(1).join(' ') || user.lastName;

            await this.userRepository.update(user.id, {
              firstName,
              lastName,
            });
            this.logger.log(`Updated profile for user ${userEmail}`);
          }
        }
        break;
      }

      default:
        this.logger.log(`Unhandled webhook event: ${payload.event}`);
    }

    return { received: true, status: 'processed' };
  }
}
