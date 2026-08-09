import type { BusinessConfigBootstrap, ConfigDomain, ConfigEntityType } from '../src/config/types';
import type { QiahaoDatabase } from './db';
import { getBusinessConfigBootstrap } from './config-repository';
import { mutateConfigEntity } from './config-mutation-repository';

export interface ConfigInvalidationEvent {
  domain: ConfigDomain;
  revision: number;
}

export class BusinessConfigService {
  private cachedBootstrap: Promise<BusinessConfigBootstrap> | null = null;

  private remotePublish?: (event: ConfigInvalidationEvent) => void;

  constructor(private readonly database: QiahaoDatabase) {}

  setRemotePublisher(publisher: (event: ConfigInvalidationEvent) => void): void {
    this.remotePublish = publisher;
  }

  invalidateLocal(): void {
    this.cachedBootstrap = null;
  }

  getBootstrap(includeDisabled = false): Promise<BusinessConfigBootstrap> {
    if (includeDisabled) return getBusinessConfigBootstrap(this.database, true);
    this.cachedBootstrap ??= getBusinessConfigBootstrap(this.database).catch((error) => {
      this.cachedBootstrap = null;
      throw error;
    });
    return this.cachedBootstrap;
  }

  async mutate(input: {
    domain: ConfigDomain;
    entityType: ConfigEntityType;
    key: string;
    values?: Record<string, unknown>;
    expectedRevision: number;
    actorId: string;
    mode: 'create' | 'update' | 'disable' | 'restore';
  }): Promise<{ revision: number; entity: Record<string, unknown> }> {
    const result = await mutateConfigEntity(this.database, input);
    this.invalidateLocal();
    this.remotePublish?.({ domain: input.domain, revision: result.revision });
    return result;
  }
}
