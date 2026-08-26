import { Injectable, Logger } from '@nestjs/common';

import {
  type ObjectRecordCreateEvent,
  type ObjectRecordUpdateEvent,
} from 'twenty-shared/database-events';
import { isDefined } from 'twenty-shared/utils';

import { OnDatabaseBatchEvent } from 'src/engine/api/graphql/graphql-query-runner/decorators/on-database-batch-event.decorator';
import { DatabaseEventAction } from 'src/engine/api/graphql/graphql-query-runner/enums/database-event-action';
import { sendEcosystemEvent } from 'src/engine/core-modules/auth/controllers/dos-org-sync-webhook.controller';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { WorkspaceEventBatch } from 'src/engine/workspace-event-emitter/types/workspace-event-batch.type';
import { type CompanyWorkspaceEntity } from 'src/modules/company/standard-objects/company.workspace-entity';
import { type PersonWorkspaceEntity } from 'src/modules/person/standard-objects/person.workspace-entity';

@Injectable()
export class EcosystemOutboundEventListener {
  private readonly logger = new Logger(EcosystemOutboundEventListener.name);

  constructor(private readonly twentyConfigService: TwentyConfigService) {}

  @OnDatabaseBatchEvent('company', DatabaseEventAction.CREATED)
  async handleCompanyCreated(
    payload: WorkspaceEventBatch<
      ObjectRecordCreateEvent<CompanyWorkspaceEntity>
    >,
  ) {
    if (!this.twentyConfigService.get('AUTH_DOS_ID_ENABLED')) return;

    for (const event of payload.events) {
      const company = event.properties.after;
      const domain =
        company.domainName?.primaryLinkLabel ||
        company.domainName?.primaryLinkUrl?.replace(/^https?:\/\//, '');

      await sendEcosystemEvent(this.twentyConfigService, 'company.created', {
        id: event.recordId,
        crm_company_id: event.recordId,
        org_id: payload.workspaceId,
        global_org_id: payload.workspaceId,
        name: company.name,
        domain: domain,
        domain_name: domain,
        address: company.address?.addressCity
          ? `${company.address.addressStreet1 ?? ''}, ${company.address.addressCity ?? ''}`.trim()
          : undefined,
        source: 'twenty_crm',
      });
    }
  }

  @OnDatabaseBatchEvent('company', DatabaseEventAction.UPDATED)
  async handleCompanyUpdated(
    payload: WorkspaceEventBatch<
      ObjectRecordUpdateEvent<CompanyWorkspaceEntity>
    >,
  ) {
    if (!this.twentyConfigService.get('AUTH_DOS_ID_ENABLED')) return;

    for (const event of payload.events) {
      const company = event.properties.after;
      const domain =
        company.domainName?.primaryLinkLabel ||
        company.domainName?.primaryLinkUrl?.replace(/^https?:\/\//, '');

      await sendEcosystemEvent(this.twentyConfigService, 'company.updated', {
        id: event.recordId,
        crm_company_id: event.recordId,
        org_id: payload.workspaceId,
        global_org_id: payload.workspaceId,
        name: company.name,
        domain: domain,
        domain_name: domain,
        address: company.address?.addressCity
          ? `${company.address.addressStreet1 ?? ''}, ${company.address.addressCity ?? ''}`.trim()
          : undefined,
        source: 'twenty_crm',
      });
    }
  }

  @OnDatabaseBatchEvent('person', DatabaseEventAction.CREATED)
  async handlePersonCreated(
    payload: WorkspaceEventBatch<
      ObjectRecordCreateEvent<PersonWorkspaceEntity>
    >,
  ) {
    if (!this.twentyConfigService.get('AUTH_DOS_ID_ENABLED')) return;

    for (const event of payload.events) {
      const person = event.properties.after;
      const email = person.emails?.primaryEmail;
      const fullName = [person.name?.firstName, person.name?.lastName]
        .filter(Boolean)
        .join(' ');

      if (isDefined(email)) {
        await sendEcosystemEvent(this.twentyConfigService, 'customer.created', {
          id: event.recordId,
          crm_person_id: event.recordId,
          org_id: payload.workspaceId,
          global_org_id: payload.workspaceId,
          email,
          name: fullName || email,
          phone: person.phones?.primaryPhoneNumber,
          job_title: person.jobTitle,
          company_id: person.companyId,
          source: 'twenty_crm',
        });
      }
    }
  }

  @OnDatabaseBatchEvent('person', DatabaseEventAction.UPDATED)
  async handlePersonUpdated(
    payload: WorkspaceEventBatch<
      ObjectRecordUpdateEvent<PersonWorkspaceEntity>
    >,
  ) {
    if (!this.twentyConfigService.get('AUTH_DOS_ID_ENABLED')) return;

    for (const event of payload.events) {
      const person = event.properties.after;
      const email = person.emails?.primaryEmail;
      const fullName = [person.name?.firstName, person.name?.lastName]
        .filter(Boolean)
        .join(' ');

      if (isDefined(email)) {
        await sendEcosystemEvent(this.twentyConfigService, 'customer.updated', {
          id: event.recordId,
          crm_person_id: event.recordId,
          org_id: payload.workspaceId,
          global_org_id: payload.workspaceId,
          email,
          name: fullName || email,
          phone: person.phones?.primaryPhoneNumber,
          job_title: person.jobTitle,
          company_id: person.companyId,
          source: 'twenty_crm',
        });
      }
    }
  }
}
