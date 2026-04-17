import crypto from 'crypto';
import { AdminRepository } from '@/src/repositories/admin.repository';
import { PaginationParams } from '@/src/types';
import { validateRequired, ValidationError } from '@/src/utils/validation';

export class AdminService {
  constructor(
    private repository: AdminRepository,
    private userId: string
  ) {}

  async getSettings() {
    return this.repository.getSettings();
  }

  async updateSettings(updates: any) {
    const allowed = [
      'platform_name', 'support_email', 'timezone', 'currency',
      'allow_registration', 'require_email_verification',
      'allow_organizer_self_registration', 'maintenance_mode',
      'smtp_host', 'smtp_port', 'smtp_user',
    ];
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([k]) => allowed.includes(k))
    );
    return this.repository.updateSettings(filtered);
  }

  async getAuditLogs(pagination: PaginationParams, filters: any) {
    return this.repository.getAuditLogs(pagination, filters);
  }

  async getApiKeys() {
    return this.repository.getApiKeys();
  }

  async createApiKey(dto: any) {
    validateRequired(dto.name, 'name');

    const rawKey = `unif_${crypto.randomBytes(24).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    const data = await this.repository.createApiKey({
      name: dto.name,
      key_hash: keyHash,
      permissions: dto.permissions ?? 'read',
      expires_at: dto.expires_at ?? null,
      created_by: this.userId,
    });

    return { ...data, key: rawKey };
  }

  async deleteApiKey(id: string) {
    return this.repository.deleteApiKey(id);
  }

  async getAnnouncements() {
    return this.repository.getAnnouncements();
  }

  async createAnnouncement(dto: any) {
    validateRequired(dto.title, 'title');
    validateRequired(dto.message, 'message');
    validateRequired(dto.audience, 'audience');

    return this.repository.createAnnouncement({
      title: dto.title,
      message: dto.message,
      audience: dto.audience,
      severity: dto.severity ?? 'info',
      created_by: this.userId,
    });
  }

  async updateAnnouncement(id: string, updates: any) {
    return this.repository.updateAnnouncement(id, updates);
  }

  async deleteAnnouncement(id: string) {
    return this.repository.deleteAnnouncement(id);
  }

  async getCategories() {
    return this.repository.getCategories();
  }

  async createCategory(dto: any) {
    validateRequired(dto.name, 'name');
    validateRequired(dto.slug, 'slug');
    return this.repository.createCategory(dto);
  }

  async deleteCategory(id: string) {
    return this.repository.deleteCategory(id);
  }

  async getRoles() {
    return this.repository.getRoles();
  }

  async createRole(dto: any) {
    validateRequired(dto.name, 'name');
    return this.repository.createRole({
      name: dto.name,
      description: dto.description ?? '',
      permissions: Array.isArray(dto.permissions) ? dto.permissions : [],
      is_system: false,
      created_by: this.userId,
    });
  }

  async updateRole(id: string, updates: any) {
    const existing = await this.repository.getRoleById(id);
    if (existing?.is_system) {
      throw new ValidationError('System roles cannot be edited');
    }

    const payload = {
      ...(typeof updates.name === 'string' ? { name: updates.name } : {}),
      ...(typeof updates.description === 'string' ? { description: updates.description } : {}),
      ...(Array.isArray(updates.permissions) ? { permissions: updates.permissions } : {}),
    };

    return this.repository.updateRole(id, payload);
  }

  async deleteRole(id: string) {
    const existing = await this.repository.getRoleById(id);
    if (existing?.is_system) {
      throw new ValidationError('System roles cannot be deleted');
    }
    return this.repository.deleteRole(id);
  }
}
