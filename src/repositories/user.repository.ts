import { BaseRepository } from './base.repository';
import { Profile } from '@/src/types/entities';
import { PaginationParams } from '@/src/types';
import { UserFilterDto } from '@/src/types/dto';

export class UserRepository extends BaseRepository {
  private readonly table = 'profiles';

  async findUsers(
    pagination: PaginationParams,
    filters: UserFilterDto
  ): Promise<{ data: Profile[]; count: number }> {
    let query = this.supabase
      .from(this.table)
      .select('*', { count: 'exact' })
      .range(pagination.offset, pagination.offset + pagination.limit - 1)
      .order('created_at', { ascending: false });

    if (filters.search) {
      query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
    }
    if (filters.role) query = query.eq('role', filters.role);
    if (filters.status) query = query.eq('status', filters.status);

    const { data, error, count } = await query;
    if (error) throw error;

    return { data: data ?? [], count: count ?? 0 };
  }

  async findUserById(id: string): Promise<Profile | null> {
    return this.findById<Profile>(this.table, id);
  }

  async createUser(payload: any): Promise<Profile> {
    return this.create<Profile>(this.table, {
      ...payload,
      id: crypto.randomUUID(),
      status: 'active',
    });
  }

  async updateUser(id: string, payload: any): Promise<Profile> {
    return this.update<Profile>(this.table, id, payload);
  }

  async deleteUser(id: string): Promise<void> {
    return this.delete(this.table, id);
  }
}
