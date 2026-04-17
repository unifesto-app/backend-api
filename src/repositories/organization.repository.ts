import { BaseRepository } from './base.repository';
import { Organization } from '@/src/types/entities';
import { PaginationParams } from '@/src/types';

export class OrganizationRepository extends BaseRepository {
  private readonly table = 'organizations';

  async findOrganizations(pagination: PaginationParams) {
    return this.findAll<Organization>(this.table, pagination, 'name', true);
  }

  async findOrganizationById(id: string): Promise<Organization | null> {
    return this.findById<Organization>(this.table, id);
  }

  async createOrganization(payload: any): Promise<Organization> {
    return this.create<Organization>(this.table, payload);
  }

  async updateOrganization(id: string, payload: any): Promise<Organization> {
    return this.update<Organization>(this.table, id, payload);
  }

  async deleteOrganization(id: string): Promise<void> {
    return this.delete(this.table, id);
  }
}
