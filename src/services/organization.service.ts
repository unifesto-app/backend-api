import { OrganizationRepository } from '@/src/repositories/organization.repository';
import { CreateOrganizationDto, UpdateOrganizationDto } from '@/src/types/dto';
import { Organization } from '@/src/types/entities';
import { PaginationParams } from '@/src/types';
import { validateRequired, ValidationError } from '@/src/utils/validation';

export class OrganizationService {
  constructor(private repository: OrganizationRepository) {}

  async listOrganizations(pagination: PaginationParams) {
    return this.repository.findOrganizations(pagination);
  }

  async getOrganizationById(id: string): Promise<Organization> {
    const org = await this.repository.findOrganizationById(id);
    if (!org) throw new ValidationError('Organization not found');
    return org;
  }

  async createOrganization(dto: CreateOrganizationDto): Promise<Organization> {
    validateRequired(dto.name, 'name');
    return this.repository.createOrganization(dto);
  }

  async updateOrganization(id: string, dto: UpdateOrganizationDto): Promise<Organization> {
    await this.getOrganizationById(id);
    return this.repository.updateOrganization(id, dto);
  }

  async deleteOrganization(id: string): Promise<void> {
    await this.getOrganizationById(id);
    return this.repository.deleteOrganization(id);
  }
}
