import { BaseRepository } from './base.repository';
import { PaginationParams } from '@/src/types';

export class AdminRepository extends BaseRepository {
  async getSettings() {
    const { data, error } = await this.supabase.from('settings').select('*').single();
    if (error) throw error;
    return data;
  }

  async updateSettings(updates: any) {
    const { data, error } = await this.supabase
      .from('settings')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', 1)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async getAuditLogs(pagination: PaginationParams, filters: any) {
    let query = this.supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .range(pagination.offset, pagination.offset + pagination.limit - 1)
      .order('created_at', { ascending: false });

    if (filters.action) query = query.eq('action', filters.action);
    if (filters.module) query = query.eq('module', filters.module);
    if (filters.from) query = query.gte('created_at', filters.from);
    if (filters.to) query = query.lte('created_at', filters.to);

    const { data, error, count } = await query;
    if (error) throw error;
    return { data: data ?? [], count: count ?? 0 };
  }

  async getApiKeys() {
    const { data, error } = await this.supabase
      .from('api_keys')
      .select('id, name, permissions, expires_at, last_used_at, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  }

  async createApiKey(payload: any) {
    return this.create('api_keys', payload);
  }

  async deleteApiKey(id: string) {
    return this.delete('api_keys', id);
  }

  async getAnnouncements() {
    const { data, error } = await this.supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  }

  async createAnnouncement(payload: any) {
    return this.create('announcements', payload);
  }

  async updateAnnouncement(id: string, payload: any) {
    return this.update('announcements', id, payload);
  }

  async deleteAnnouncement(id: string) {
    return this.delete('announcements', id);
  }

  async getCategories() {
    const { data, error } = await this.supabase
      .from('categories')
      .select('*, events(count)')
      .order('name');
    if (error) throw error;
    return data ?? [];
  }

  async createCategory(payload: any) {
    return this.create('categories', payload);
  }

  async deleteCategory(id: string) {
    return this.delete('categories', id);
  }

  async getRoles() {
    const { data, error } = await this.supabase
      .from('roles')
      .select('id, name, description, permissions, is_system, created_at')
      .order('name');
    if (error) throw error;
    return data ?? [];
  }

  async getRoleById(id: string) {
    const { data, error } = await this.supabase
      .from('roles')
      .select('is_system')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  async createRole(payload: any) {
    return this.create('roles', payload);
  }

  async updateRole(id: string, payload: any) {
    return this.update('roles', id, payload);
  }

  async deleteRole(id: string) {
    return this.delete('roles', id);
  }
}
