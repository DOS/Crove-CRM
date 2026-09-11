import { Injectable, Logger } from '@nestjs/common';

import axios from 'axios';

import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';

const REQUEST_TIMEOUT_MS = 5000;
const MAX_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 500;

@Injectable()
export class EcosystemEventPublisherService {
  private readonly logger = new Logger(EcosystemEventPublisherService.name);

  constructor(private readonly twentyConfigService: TwentyConfigService) {}

  // Retries are in-process only: they cover a transient DOS.Me outage, not a pod
  // restart. Durably closing that gap needs an outbox row written in the same
  // transaction as the record change and drained by a queue job.
  async publish(event: string, data: Record<string, unknown>): Promise<boolean> {
    const dosApiUrl = this.twentyConfigService.get('AUTH_DOS_API_URL');
    const apiKey = this.twentyConfigService.get('CROVE_DOS_WEBHOOK_SECRET');

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const response = await axios.post(
          `${dosApiUrl}/internal/events/publish`,
          { event, data },
          {
            headers: {
              'Content-Type': 'application/json',
              ...(apiKey ? { 'X-API-Key': apiKey } : {}),
            },
            timeout: REQUEST_TIMEOUT_MS,
          },
        );

        if (response.status >= 200 && response.status < 300) {
          return true;
        }

        this.logger.warn(
          `Ecosystem event "${event}" attempt ${attempt}/${MAX_ATTEMPTS} got HTTP ${response.status}`,
        );
      } catch (error) {
        this.logger.warn(
          `Ecosystem event "${event}" attempt ${attempt}/${MAX_ATTEMPTS} failed: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }

      if (attempt < MAX_ATTEMPTS) {
        await new Promise((resolve) =>
          setTimeout(resolve, BASE_BACKOFF_MS * attempt),
        );
      }
    }

    this.logger.error(
      `Ecosystem event "${event}" dropped after ${MAX_ATTEMPTS} attempts; there is no outbox yet, so this event is lost`,
    );

    return false;
  }
}
