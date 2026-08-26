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
import { isNonEmptyString } from '@sniptt/guards';
import axios from 'axios';
import { ApiPath } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
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
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';

export function verifyEcosystemWebhook(
  rawBody: string | Buffer,
  signatureHeader: string,
  secret: string,
): boolean {
  if (!signatureHeader || !secret) return false;
  const cleanSignature = signatureHeader.replace(/^sha256=/, '').trim();
  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  if (cleanSignature.length !== expected.length) {
    return false;
  }

  try {
    return crypto.timingSafeEqual(
      Buffer.from(cleanSignature, 'hex'),
      Buffer.from(expected, 'hex'),
    );
  } catch {
    return false;
  }
}

export type EcosystemWebhookPayload = {
  id?: string;
  event:
    | 'organization.created'
    | 'org.created'
    | 'organization.updated'
    | 'org.updated'
    | 'organization.deleted'
    | 'org.deleted'
    | 'organization.member.added'
    | 'organization.member_added'
    | 'org.member_added'
    | 'organization.member.removed'
    | 'organization.member_removed'
    | 'org.member_removed'
    | 'company.created'
    | 'company.updated'
    | 'customer.created'
    | 'customer.updated'
    | 'user.updated';
  timestamp: string;
  data: {
    // Org data
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

    // Company data
    crm_company_id?: string;
    desk_company_id?: string;
    domain_name?: string;
    address?: string;
    tier?: string;
    account_owner_email?: string;

    // Customer data
    crm_person_id?: string;
    desk_customer_id?: string;
    email?: string;
    phone?: string;
    job_title?: string;
    company_id?: string;
    company_name?: string;
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
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
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
      const isValid = verifyEcosystemWebhook(bodyBuffer, signature, secret);

      if (!isValid) {
        throw new UnauthorizedException('Invalid X-DOS-Signature');
      }
    }

    const payload = req.body as EcosystemWebhookPayload;

    if (!payload?.event) {
      throw new BadRequestException('Invalid payload: event is required');
    }

    this.logger.log(`Received DOS ecosystem webhook event: ${payload.event}`);

    switch (payload.event) {
      case 'organization.created':
      case 'org.created': {
        const orgName = payload.data.name || payload.data.org_name;
        const ownerEmail = payload.data.owner_email?.toLowerCase();
        const orgId = payload.data.id || payload.data.org_id;
        const orgSlug = payload.data.slug;

        if (isNonEmptyString(orgName) && isNonEmptyString(ownerEmail)) {
          const existingWorkspace = await this.workspaceRepository.findOne({
            where: [
              ...(isNonEmptyString(orgId) ? [{ id: orgId }] : []),
              ...(isNonEmptyString(orgSlug) ? [{ subdomain: orgSlug }] : []),
              { displayName: orgName.trim() },
            ],
          });

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

          if (isDefined(existingWorkspace)) {
            await this.userWorkspaceService.addUserToWorkspaceIfUserNotInWorkspace(
              user,
              existingWorkspace,
            );
            this.logger.log(
              `Workspace "${orgName}" already exists, ensured owner ${ownerEmail} is linked`,
            );
            break;
          }

          try {
            await this.signInUpService.signUpOnNewWorkspace(
              { type: 'existingUser', existingUser: user },
              {
                displayName: orgName.trim(),
                subdomain: isNonEmptyString(orgSlug) ? orgSlug : undefined,
                workspaceId: isNonEmptyString(orgId) ? orgId : undefined,
              },
            );
            this.logger.log(
              `Successfully provisioned workspace "${orgName}" with ID ${orgId ?? 'generated'} for owner ${ownerEmail}`,
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

      case 'organization.member.added':
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

      case 'organization.member.removed':
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

      case 'company.created':
      case 'company.updated': {
        const orgId = payload.data.org_id;
        const companyName = payload.data.name || payload.data.company_name;
        const companyId = payload.data.crm_company_id || payload.data.id;
        const domainName = payload.data.domain_name;

        if (isNonEmptyString(orgId) && isNonEmptyString(companyName)) {
          const workspace = await this.workspaceRepository.findOne({
            where: { id: orgId },
          });

          if (isDefined(workspace)) {
            try {
              const authContext = buildSystemAuthContext(workspace.id);
              await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
                async () => {
                  const companyRepo =
                    await this.globalWorkspaceOrmManager.getRepository(
                      workspace.id,
                      'company',
                      { shouldBypassPermissionChecks: true },
                    );

                  const existing = isNonEmptyString(companyId)
                    ? await companyRepo.findOne({ where: { id: companyId } })
                    : await companyRepo.findOne({
                        where: { name: companyName.trim() },
                      });

                  if (existing) {
                    await companyRepo.update(
                      { id: existing.id },
                      {
                        name: companyName.trim(),
                        ...(isNonEmptyString(domainName)
                          ? {
                              domainName: {
                                primaryLinkUrl: `https://${domainName}`,
                                primaryLinkLabel: domainName,
                                secondaryLinks: [],
                              },
                            }
                          : {}),
                      },
                    );
                    this.logger.log(
                      `Updated company "${companyName}" in workspace ${workspace.id}`,
                    );
                  } else {
                    await companyRepo.save({
                      ...(isNonEmptyString(companyId) ? { id: companyId } : {}),
                      name: companyName.trim(),
                      ...(isNonEmptyString(domainName)
                        ? {
                            domainName: {
                              primaryLinkUrl: `https://${domainName}`,
                              primaryLinkLabel: domainName,
                              secondaryLinks: [],
                            },
                          }
                        : {}),
                    });
                    this.logger.log(
                      `Created company "${companyName}" in workspace ${workspace.id}`,
                    );
                  }
                },
                authContext,
              );
            } catch (error) {
              this.logger.error(
                `Failed to sync company "${companyName}" in workspace ${workspace.id}: ${error}`,
              );
            }
          }
        }
        break;
      }

      case 'customer.created':
      case 'customer.updated': {
        const orgId = payload.data.org_id;
        const customerEmail = payload.data.email || payload.data.user_email;
        const customerName = payload.data.name || payload.data.user_name;
        const personId = payload.data.crm_person_id || payload.data.id;
        const phone = payload.data.phone;
        const jobTitle = payload.data.job_title;
        const companyId = payload.data.crm_company_id || payload.data.company_id;

        if (isNonEmptyString(orgId) && isNonEmptyString(customerEmail)) {
          const workspace = await this.workspaceRepository.findOne({
            where: { id: orgId },
          });

          if (isDefined(workspace)) {
            try {
              const authContext = buildSystemAuthContext(workspace.id);
              await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
                async () => {
                  const personRepo =
                    await this.globalWorkspaceOrmManager.getRepository(
                      workspace.id,
                      'person',
                      { shouldBypassPermissionChecks: true },
                    );

                  const nameParts = customerName?.split(' ') || [];
                  const firstName = nameParts[0] || '';
                  const lastName = nameParts.slice(1).join(' ') || '';

                  const existing = isNonEmptyString(personId)
                    ? await personRepo.findOne({ where: { id: personId } })
                    : await personRepo.findOne({
                        where: {
                          emails: {
                            primaryEmail: customerEmail.toLowerCase(),
                          },
                        },
                      });

                  if (existing) {
                    await personRepo.update(
                      { id: existing.id },
                      {
                        name: {
                          firstName: firstName || existing.name?.firstName || '',
                          lastName: lastName || existing.name?.lastName || '',
                        },
                        ...(isNonEmptyString(jobTitle) ? { jobTitle } : {}),
                        ...(isNonEmptyString(phone)
                          ? {
                              phones: {
                                primaryPhoneNumber: phone,
                                primaryPhoneCallingCode: '+84',
                                primaryPhoneCountryCode: 'VN',
                                additionalPhones: null,
                              },
                            }
                          : {}),
                        ...(isNonEmptyString(companyId) ? { companyId } : {}),
                      },
                    );
                    this.logger.log(
                      `Updated person "${customerEmail}" in workspace ${workspace.id}`,
                    );
                  } else {
                    await personRepo.save({
                      ...(isNonEmptyString(personId) ? { id: personId } : {}),
                      name: {
                        firstName,
                        lastName,
                      },
                      emails: {
                        primaryEmail: customerEmail.toLowerCase(),
                        additionalEmails: null,
                      },
                      ...(isNonEmptyString(jobTitle) ? { jobTitle } : {}),
                      ...(isNonEmptyString(phone)
                        ? {
                            phones: {
                              primaryPhoneNumber: phone,
                              primaryPhoneCallingCode: '+84',
                              primaryPhoneCountryCode: 'VN',
                              additionalPhones: null,
                            },
                          }
                        : {}),
                      ...(isNonEmptyString(companyId) ? { companyId } : {}),
                    });
                    this.logger.log(
                      `Created person "${customerEmail}" in workspace ${workspace.id}`,
                    );
                  }
                },
                authContext,
              );
            } catch (error) {
              this.logger.error(
                `Failed to sync person "${customerEmail}" in workspace ${workspace.id}: ${error}`,
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

export async function sendEcosystemEvent(
  twentyConfigService: TwentyConfigService,
  event: string,
  data: Record<string, unknown>,
): Promise<boolean> {
  const logger = new Logger('EcosystemEventSender');
  const dosApiUrl =
    twentyConfigService.get('AUTH_DOS_API_URL') || 'https://api.dos.me';
  const apiKey = twentyConfigService.get('CROVE_DOS_WEBHOOK_SECRET');

  try {
    const response = await axios.post(
      `${dosApiUrl}/internal/events/publish`,
      {
        event,
        data,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { 'X-API-Key': apiKey } : {}),
        },
        timeout: 5000,
      },
    );

    return response.status >= 200 && response.status < 300;
  } catch (error) {
    logger.warn(`Failed to dispatch ecosystem event "${event}": ${error}`);
    return false;
  }
}
