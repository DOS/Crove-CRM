import * as crypto from 'crypto';

import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
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
import { WorkspaceService } from 'src/engine/core-modules/workspace/services/workspace.service';
import { AuthProviderEnum } from 'src/engine/core-modules/workspace/types/workspace.type';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { PublicEndpointGuard } from 'src/engine/guards/public-endpoint.guard';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';

export function verifyEcosystemWebhook(
  rawBody: string | Buffer,
  signatureHeader: string,
  secret: string,
): boolean {
  if (!signatureHeader || !secret) return false;

  const rawBodyStr =
    typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');

  // Format 1: t=<timestamp>,v1=<signature> (DOS.Me Webhook Standard)
  if (signatureHeader.includes('t=') && signatureHeader.includes('v1=')) {
    const parts = signatureHeader.split(',');
    const timestampPart = parts.find((p) => p.startsWith('t='));
    const signaturePart = parts.find((p) => p.startsWith('v1='));

    if (!timestampPart || !signaturePart) return false;

    const timestamp = timestampPart.split('=')[1];
    const signature = signaturePart.split('=')[1];

    const timestampMs = Number(timestamp);

    // Replay attack prevention (5 minutes). A non-numeric t= parses to NaN and
    // NaN > threshold is false, so the plain comparison would silently disable
    // the entire window.
    const fiveMinutes = 5 * 60 * 1000;
    if (
      !Number.isFinite(timestampMs) ||
      Math.abs(Date.now() - timestampMs) > fiveMinutes
    ) {
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${timestamp}.${rawBodyStr}`)
      .digest('hex');

    if (signature.length !== expectedSignature.length) return false;

    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex'),
      );
    } catch {
      return false;
    }
  }

  // Format 2: sha256=<hex> or raw hex
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

// Fork-only provisioning hands activateWorkspace a raw UserEntity whose date
// columns are Date objects, while the resolver-facing AuthContextUser carries
// ISO strings (the auth-context storage serializes dates). Rebuild the exact
// declared shape instead of casting.
const toFlatAuthContextUser = (user: UserEntity) => ({
  id: user.id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  isEmailVerified: user.isEmailVerified,
  disabled: user.disabled,
  canImpersonate: user.canImpersonate,
  canAccessFullAdminPanel: user.canAccessFullAdminPanel,
  createdAt: user.createdAt.toISOString(),
  updatedAt: user.updatedAt.toISOString(),
  deletedAt: user.deletedAt.toISOString(),
  locale: user.locale,
});

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
    | 'company.deleted'
    | 'customer.created'
    | 'customer.updated'
    | 'customer.deleted'
    | 'ticket.created'
    | 'ticket.updated'
    | 'user.updated';
  timestamp: string;
  data: {
    // Set to 'crove_crm' on events this CRM published itself, so an echo coming
    // back through the router can be recognised and dropped.
    source?: string;
    // Org data
    id?: string;
    org_id?: string;
    global_org_id?: string;
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
    domain?: string;
    domain_name?: string;
    address?: string;
    tier?: string;
    tax_code?: string;
    account_owner_email?: string;

    // Customer data
    crm_person_id?: string;
    desk_customer_id?: string;
    email?: string;
    phone?: string;
    job_title?: string;
    company_id?: string;
    company_name?: string;

    // Ticket data
    ticket_id?: string;
    subject?: string;
    status?: string;
    customer_id?: string;
    priority?: string;
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
    private readonly workspaceOrmManager: WorkspaceOrmManager,
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(UserWorkspaceEntity)
    private readonly userWorkspaceRepository: Repository<UserWorkspaceEntity>,
    private readonly workspaceService: WorkspaceService,
  ) {}

  @Post('dos-org-sync')
  // Webhook receivers answer 200; Nest's default 201 Created misleads the caller.
  @HttpCode(HttpStatus.OK)
  @UseGuards(PublicEndpointGuard, NoPermissionGuard)
  async handleDosOrgSync(
    @Headers('x-dos-signature') signature: string,
    @Req() req: Request,
  ) {
    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
    const secret = this.twentyConfigService.get('CROVE_DOS_WEBHOOK_SECRET');

    if (!isNonEmptyString(secret)) {
      // Fail closed: without a secret every handler below would run against an
      // unauthenticated payload, on a workspace the payload itself picks.
      this.logger.error(
        'CROVE_DOS_WEBHOOK_SECRET is not set; rejecting all dos-org-sync traffic',
      );

      throw new UnauthorizedException('Invalid X-DOS-Signature');
    }

    if (!isNonEmptyString(signature)) {
      throw new UnauthorizedException('Missing X-DOS-Signature header');
    }

    const bodyBuffer = rawBody ?? Buffer.from(JSON.stringify(req.body));
    const isValid = verifyEcosystemWebhook(bodyBuffer, signature, secret);

    if (!isValid) {
      throw new UnauthorizedException('Invalid X-DOS-Signature');
    }

    const payload = req.body as EcosystemWebhookPayload;

    if (!payload?.event) {
      throw new BadRequestException('Invalid payload: event is required');
    }

    // Defense in depth against an echo loop: writes made here are also emitted
    // outbound tagged source 'crove_crm', so if the router ever rebroadcasts one
    // back, applying it would rewrite the same record and re-emit the event.
    if (payload.data?.source === 'crove_crm') {
      this.logger.warn(
        `Ignored echoed ecosystem event "${payload.event}" that originated from this CRM`,
      );

      return { received: true, status: 'ignored_echo' };
    }

    this.logger.log(`Received DOS ecosystem webhook event: ${payload.event}`);

    switch (payload.event) {
      case 'organization.created':
      case 'org.created': {
        const orgName = payload.data.name || payload.data.org_name;
        const ownerEmail = payload.data.owner_email?.toLowerCase();
        const orgId =
          payload.data.id ||
          payload.data.org_id ||
          payload.data.global_org_id;
        const orgSlug = payload.data.slug;

        if (isNonEmptyString(orgName) && isNonEmptyString(ownerEmail)) {
          // Match on unique identifiers only. displayName is attacker-supplied and
          // not unique, so OR-ing it in would bind this event to an arbitrary tenant.
          const existingWorkspace =
            isNonEmptyString(orgId) || isNonEmptyString(orgSlug)
              ? await this.workspaceRepository.findOne({
                  where: [
                    ...(isNonEmptyString(orgId) ? [{ id: orgId }] : []),
                    ...(isNonEmptyString(orgSlug)
                      ? [{ subdomain: orgSlug }]
                      : []),
                  ],
                })
              : undefined;

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
            const provisioned = await this.signInUpService.signUpOnNewWorkspace(
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

            // signUpOnNewWorkspace leaves the workspace in PENDING_CREATION and the
            // schema does not exist yet; there is no human on an onboarding screen
            // here, so the 7-day onboarding cron would soft-delete this tenant.
            try {
              await this.workspaceService.activateWorkspace(
                toFlatAuthContextUser(provisioned.user),
                provisioned.workspace,
              );
              this.logger.log(
                `Activated workspace ${provisioned.workspace.id} for org "${orgName}"`,
              );
            } catch (activationError) {
              this.logger.error(
                `Failed to activate workspace ${provisioned.workspace.id} for org "${orgName}": ${
                  activationError instanceof Error
                    ? activationError.message
                    : String(activationError)
                }`,
              );
            }
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
        const orgId =
          payload.data.id ||
          payload.data.org_id ||
          payload.data.global_org_id;

        if (isNonEmptyString(orgId) && isNonEmptyString(orgName)) {
          // Never match on orgName here: it is the NEW name from the payload, so
          // OR-ing it in lets a caller rename whichever tenant already bears it.
          const workspace = await this.workspaceRepository.findOne({
            where: { id: orgId },
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
        const orgId =
          payload.data.id ||
          payload.data.org_id ||
          payload.data.global_org_id;

        const workspace = isNonEmptyString(orgId)
          ? await this.workspaceRepository.findOne({ where: { id: orgId } })
          : null;

        if (isDefined(workspace)) {
          await this.workspaceRepository.update(workspace.id, {
            activationStatus: WorkspaceActivationStatus.SUSPENDED,
          });
          this.logger.log(`Suspended workspace ${workspace.id} due to org deletion`);
        } else {
          this.logger.warn(
            `Ignored org deletion event: no workspace matches orgId ${orgId ?? '(missing)'}`,
          );
        }
        break;
      }

      case 'organization.member.added':
      case 'organization.member_added':
      case 'org.member_added': {
        const userEmail = payload.data.user_email?.toLowerCase();
        const orgId =
          payload.data.id ||
          payload.data.org_id ||
          payload.data.global_org_id;

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
            ? await this.workspaceRepository.findOne({ where: { id: orgId } })
            : null;

          if (isDefined(user) && isDefined(workspace)) {
            await this.userWorkspaceService.addUserToWorkspaceIfUserNotInWorkspace(
              user,
              workspace,
            );
            this.logger.log(
              `Added user ${userEmail} to workspace ${workspace.id}`,
            );
          } else {
            this.logger.warn(
              `Ignored member addition: no workspace matches orgId ${orgId ?? '(missing)'}`,
            );
          }
        }
        break;
      }

      case 'organization.member.removed':
      case 'organization.member_removed':
      case 'org.member_removed': {
        const userEmail = payload.data.user_email?.toLowerCase();
        const orgId =
          payload.data.id ||
          payload.data.org_id ||
          payload.data.global_org_id;

        if (isNonEmptyString(userEmail)) {
          const user = await this.userService.findUserByEmail(userEmail);

          const workspace = isNonEmptyString(orgId)
            ? await this.workspaceRepository.findOne({ where: { id: orgId } })
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
        const orgId =
          payload.data.global_org_id ||
          payload.data.org_id ||
          payload.data.id;
        const companyName = payload.data.name || payload.data.company_name;
        const companyId =
          payload.data.crm_company_id ||
          payload.data.id ||
          payload.data.desk_company_id;
        const domainName = payload.data.domain || payload.data.domain_name;

        if (isNonEmptyString(orgId) && isNonEmptyString(companyName)) {
          const workspace = await this.workspaceRepository.findOne({
            where: { id: orgId },
          });

          if (isDefined(workspace)) {
            try {
              const authContext = buildSystemAuthContext(workspace.id);
              await this.workspaceOrmManager.executeInWorkspaceContext(
                async () => {
                  const companyRepo =
                    await this.workspaceOrmManager.getRepository(
                      'company',
                      { shouldBypassPermissionChecks: true },
                      { shouldSkipEventEmission: true },
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

      case 'company.deleted': {
        const orgId =
          payload.data.global_org_id ||
          payload.data.org_id ||
          payload.data.id;
        const companyId =
          payload.data.crm_company_id ||
          payload.data.id ||
          payload.data.desk_company_id;

        if (isNonEmptyString(orgId) && isNonEmptyString(companyId)) {
          const workspace = await this.workspaceRepository.findOne({
            where: { id: orgId },
          });

          if (isDefined(workspace)) {
            try {
              const authContext = buildSystemAuthContext(workspace.id);
              await this.workspaceOrmManager.executeInWorkspaceContext(
                async () => {
                  const companyRepo =
                    await this.workspaceOrmManager.getRepository(
                      'company',
                      { shouldBypassPermissionChecks: true },
                      { shouldSkipEventEmission: true },
                    );

                  await companyRepo.delete({ id: companyId });
                  this.logger.log(
                    `Deleted company "${companyId}" in workspace ${workspace.id}`,
                  );
                },
                authContext,
              );
            } catch (error) {
              this.logger.error(
                `Failed to delete company "${companyId}" in workspace ${workspace.id}: ${error}`,
              );
            }
          }
        }
        break;
      }

      case 'customer.created':
      case 'customer.updated': {
        const orgId =
          payload.data.global_org_id ||
          payload.data.org_id ||
          payload.data.id;
        const customerEmail = payload.data.email || payload.data.user_email;
        const customerName = payload.data.name || payload.data.user_name;
        const personId =
          payload.data.crm_person_id ||
          payload.data.id ||
          payload.data.desk_customer_id;
        const phone = payload.data.phone;
        const jobTitle = payload.data.job_title;
        const companyId =
          payload.data.crm_company_id || payload.data.company_id;

        if (isNonEmptyString(orgId) && isNonEmptyString(customerEmail)) {
          const workspace = await this.workspaceRepository.findOne({
            where: { id: orgId },
          });

          if (isDefined(workspace)) {
            try {
              const authContext = buildSystemAuthContext(workspace.id);
              await this.workspaceOrmManager.executeInWorkspaceContext(
                async () => {
                  const personRepo =
                    await this.workspaceOrmManager.getRepository(
                      'person',
                      { shouldBypassPermissionChecks: true },
                      { shouldSkipEventEmission: true },
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

      case 'customer.deleted': {
        const orgId =
          payload.data.global_org_id ||
          payload.data.org_id ||
          payload.data.id;
        const personId =
          payload.data.crm_person_id ||
          payload.data.id ||
          payload.data.desk_customer_id;
        const customerEmail = payload.data.email || payload.data.user_email;

        if (
          isNonEmptyString(orgId) &&
          (isNonEmptyString(personId) || isNonEmptyString(customerEmail))
        ) {
          const workspace = await this.workspaceRepository.findOne({
            where: { id: orgId },
          });

          if (isDefined(workspace)) {
            try {
              const authContext = buildSystemAuthContext(workspace.id);
              await this.workspaceOrmManager.executeInWorkspaceContext(
                async () => {
                  const personRepo =
                    await this.workspaceOrmManager.getRepository(
                      'person',
                      { shouldBypassPermissionChecks: true },
                      { shouldSkipEventEmission: true },
                    );

                  if (isNonEmptyString(personId)) {
                    await personRepo.delete({ id: personId });
                  } else if (isNonEmptyString(customerEmail)) {
                    await personRepo.delete({
                      emails: {
                        primaryEmail: customerEmail.toLowerCase(),
                      },
                    });
                  }
                  this.logger.log(
                    `Deleted customer "${personId || customerEmail}" in workspace ${workspace.id}`,
                  );
                },
                authContext,
              );
            } catch (error) {
              this.logger.error(
                `Failed to delete customer in workspace ${workspace.id}: ${error}`,
              );
            }
          }
        }
        break;
      }

      case 'ticket.created':
      case 'ticket.updated': {
        const orgId =
          payload.data.global_org_id ||
          payload.data.org_id ||
          payload.data.id;
        const ticketId = payload.data.ticket_id || payload.data.id;
        const subject = payload.data.subject || 'Desk Support Ticket';
        const status = payload.data.status || 'OPEN';

        if (isNonEmptyString(orgId) && isNonEmptyString(ticketId)) {
          const workspace = await this.workspaceRepository.findOne({
            where: { id: orgId },
          });

          if (isDefined(workspace)) {
            try {
              const authContext = buildSystemAuthContext(workspace.id);
              await this.workspaceOrmManager.executeInWorkspaceContext(
                async () => {
                  const noteRepo =
                    await this.workspaceOrmManager.getRepository(
                      'note',
                      { shouldBypassPermissionChecks: true },
                      { shouldSkipEventEmission: true },
                    );

                  // ticketId is the only stable key the payload carries. Keeping it in
                  // the title lets retries and status changes update one note instead of
                  // appending a duplicate per delivery.
                  const noteTitle = `[Crove Desk Ticket] ${ticketId}`;

                  const existingNote = await noteRepo.findOne({
                    where: { title: noteTitle },
                  });

                  await noteRepo.save({
                    ...(isDefined(existingNote) ? { id: existingNote.id } : {}),
                    title: noteTitle,
                    body: `Subject: ${subject}\nStatus: ${status}`,
                  });

                  this.logger.log(
                    `Recorded Desk Ticket note "${subject}" in workspace ${workspace.id}`,
                  );
                },
                authContext,
              );
            } catch (error) {
              this.logger.error(
                `Failed to record ticket note in workspace ${workspace.id}: ${error}`,
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

