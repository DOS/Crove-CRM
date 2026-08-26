import * as crypto from 'crypto';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { DosOrgSyncWebhookController } from 'src/engine/core-modules/auth/controllers/dos-org-sync-webhook.controller';
import { WorkspaceActivationStatus } from 'twenty-shared/workspace';

describe('DosOrgSyncWebhookController', () => {
  let controller: DosOrgSyncWebhookController;
  let mockTwentyConfigService: any;
  let mockUserWorkspaceService: any;
  let mockSignInUpService: any;
  let mockUserService: any;
  let mockWorkspaceRepository: any;
  let mockUserRepository: any;
  let mockUserWorkspaceRepository: any;

  const WEBHOOK_SECRET = 'test_secret_123';

  beforeEach(() => {
    mockTwentyConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'CROVE_DOS_WEBHOOK_SECRET') return WEBHOOK_SECRET;
        return undefined;
      }),
    };

    mockUserWorkspaceService = {
      addUserToWorkspaceIfUserNotInWorkspace: jest.fn().mockResolvedValue(undefined),
      deleteUserWorkspace: jest.fn().mockResolvedValue(undefined),
    };

    mockSignInUpService = {
      signUpWithoutWorkspace: jest.fn().mockResolvedValue({ id: 'user-1', email: 'owner@example.com' }),
      signUpOnNewWorkspace: jest.fn().mockResolvedValue({
        user: { id: 'user-1' },
        workspace: { id: 'org-123' },
      }),
    };

    mockUserService = {
      findUserByEmail: jest.fn().mockResolvedValue(null),
    };

    mockWorkspaceRepository = {
      findOne: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue(undefined),
    };

    mockUserRepository = {
      update: jest.fn().mockResolvedValue(undefined),
    };

    mockUserWorkspaceRepository = {
      findOne: jest.fn().mockResolvedValue(null),
    };

    controller = new DosOrgSyncWebhookController(
      mockTwentyConfigService,
      mockUserWorkspaceService,
      mockSignInUpService,
      mockUserService,
      mockWorkspaceRepository,
      mockUserRepository,
      mockUserWorkspaceRepository,
    );
  });

  const createSignedRequest = (payload: any, secret = WEBHOOK_SECRET) => {
    const rawBody = Buffer.from(JSON.stringify(payload));
    const signature = `sha256=${crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex')}`;

    return {
      req: {
        body: payload,
        rawBody,
      } as any,
      signature,
    };
  };

  describe('HMAC Signature Verification', () => {
    it('should throw UnauthorizedException when signature is missing', async () => {
      const payload = { event: 'organization.created', timestamp: '', data: {} };
      const { req } = createSignedRequest(payload);

      await expect(
        controller.handleDosOrgSync('', req),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when signature is invalid', async () => {
      const payload = { event: 'organization.created', timestamp: '', data: {} };
      const { req } = createSignedRequest(payload);

      await expect(
        controller.handleDosOrgSync('sha256=invalid_signature', req),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException when event is missing in payload', async () => {
      const payload = { timestamp: '', data: {} } as any;
      const { req, signature } = createSignedRequest(payload);

      await expect(
        controller.handleDosOrgSync(signature, req),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Event: organization.created / org.created', () => {
    it('should provision workspace with specific org ID from DOS.Me', async () => {
      const payload = {
        event: 'organization.created' as const,
        timestamp: new Date().toISOString(),
        data: {
          id: 'ca970340-c49d-4360-90e1-5c9fae597337',
          name: 'Crove Corporation',
          slug: 'crove-corp',
          owner_email: 'owner@crove.com',
          user_name: 'John Doe',
        },
      };
      const { req, signature } = createSignedRequest(payload);

      const result = await controller.handleDosOrgSync(signature, req);

      expect(result).toEqual({ received: true, status: 'processed' });
      expect(mockSignInUpService.signUpWithoutWorkspace).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'owner@crove.com' }),
        expect.anything(),
      );
      expect(mockSignInUpService.signUpOnNewWorkspace).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'existingUser' }),
        expect.objectContaining({
          displayName: 'Crove Corporation',
          subdomain: 'crove-corp',
          workspaceId: 'ca970340-c49d-4360-90e1-5c9fae597337',
        }),
      );
    });

    it('should link user if workspace already exists', async () => {
      const existingWorkspace = { id: 'existing-ws-1', displayName: 'Crove Corporation' };
      mockWorkspaceRepository.findOne.mockResolvedValue(existingWorkspace);
      mockUserService.findUserByEmail.mockResolvedValue({ id: 'user-1', email: 'owner@crove.com' });

      const payload = {
        event: 'org.created' as const,
        timestamp: new Date().toISOString(),
        data: {
          org_id: 'existing-ws-1',
          org_name: 'Crove Corporation',
          owner_email: 'owner@crove.com',
        },
      };
      const { req, signature } = createSignedRequest(payload);

      await controller.handleDosOrgSync(signature, req);

      expect(mockUserWorkspaceService.addUserToWorkspaceIfUserNotInWorkspace).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'user-1' }),
        existingWorkspace,
      );
      expect(mockSignInUpService.signUpOnNewWorkspace).not.toHaveBeenCalled();
    });
  });

  describe('Event: organization.updated / org.updated', () => {
    it('should update workspace displayName', async () => {
      const existingWorkspace = { id: 'ws-123', displayName: 'Old Name' };
      mockWorkspaceRepository.findOne.mockResolvedValue(existingWorkspace);

      const payload = {
        event: 'organization.updated' as const,
        timestamp: new Date().toISOString(),
        data: {
          org_id: 'ws-123',
          name: 'New Name',
        },
      };
      const { req, signature } = createSignedRequest(payload);

      await controller.handleDosOrgSync(signature, req);

      expect(mockWorkspaceRepository.update).toHaveBeenCalledWith('ws-123', {
        displayName: 'New Name',
      });
    });
  });

  describe('Event: organization.deleted / org.deleted', () => {
    it('should suspend workspace activation status', async () => {
      const existingWorkspace = { id: 'ws-123' };
      mockWorkspaceRepository.findOne.mockResolvedValue(existingWorkspace);

      const payload = {
        event: 'organization.deleted' as const,
        timestamp: new Date().toISOString(),
        data: {
          org_id: 'ws-123',
        },
      };
      const { req, signature } = createSignedRequest(payload);

      await controller.handleDosOrgSync(signature, req);

      expect(mockWorkspaceRepository.update).toHaveBeenCalledWith('ws-123', {
        activationStatus: WorkspaceActivationStatus.SUSPENDED,
      });
    });
  });

  describe('Event: organization.member.added', () => {
    it('should add user to workspace', async () => {
      const user = { id: 'user-2', email: 'member@crove.com' };
      const workspace = { id: 'ws-123' };
      mockUserService.findUserByEmail.mockResolvedValue(user);
      mockWorkspaceRepository.findOne.mockResolvedValue(workspace);

      const payload = {
        event: 'organization.member.added' as const,
        timestamp: new Date().toISOString(),
        data: {
          org_id: 'ws-123',
          user_email: 'member@crove.com',
        },
      };
      const { req, signature } = createSignedRequest(payload);

      await controller.handleDosOrgSync(signature, req);

      expect(mockUserWorkspaceService.addUserToWorkspaceIfUserNotInWorkspace).toHaveBeenCalledWith(
        user,
        workspace,
      );
    });
  });

  describe('Event: organization.member.removed', () => {
    it('should remove user from workspace', async () => {
      const user = { id: 'user-2', email: 'member@crove.com' };
      const workspace = { id: 'ws-123' };
      const userWorkspace = { id: 'uw-1', userId: 'user-2', workspaceId: 'ws-123' };

      mockUserService.findUserByEmail.mockResolvedValue(user);
      mockWorkspaceRepository.findOne.mockResolvedValue(workspace);
      mockUserWorkspaceRepository.findOne.mockResolvedValue(userWorkspace);

      const payload = {
        event: 'organization.member.removed' as const,
        timestamp: new Date().toISOString(),
        data: {
          org_id: 'ws-123',
          user_email: 'member@crove.com',
        },
      };
      const { req, signature } = createSignedRequest(payload);

      await controller.handleDosOrgSync(signature, req);

      expect(mockUserWorkspaceService.deleteUserWorkspace).toHaveBeenCalledWith({
        userWorkspaceId: 'uw-1',
        workspaceId: 'ws-123',
      });
    });
  });

  describe('Event: user.updated', () => {
    it('should update user name', async () => {
      const user = { id: 'user-1', email: 'user@crove.com', firstName: 'Old', lastName: 'Name' };
      mockUserService.findUserByEmail.mockResolvedValue(user);

      const payload = {
        event: 'user.updated' as const,
        timestamp: new Date().toISOString(),
        data: {
          email: 'user@crove.com',
          display_name: 'Alice Wonder',
        },
      };
      const { req, signature } = createSignedRequest(payload);

      await controller.handleDosOrgSync(signature, req);

      expect(mockUserRepository.update).toHaveBeenCalledWith('user-1', {
        firstName: 'Alice',
        lastName: 'Wonder',
      });
    });
  });
});
