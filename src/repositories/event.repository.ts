import { BaseRepository } from './base.repository';
import { Event } from '@/src/types/entities';
import { PaginationParams } from '@/src/types';
import { EventFilterDto } from '@/src/types/dto';

export class EventRepository extends BaseRepository {
  private readonly table = 'events';

  async findEvents(
    pagination: PaginationParams,
    filters: EventFilterDto
  ): Promise<{ data: Event[]; count: number }> {
    let query = this.supabase
      .from(this.table)
      .select('*, organizations(name)', { count: 'exact' })
      .range(pagination.offset, pagination.offset + pagination.limit - 1)
      .order('created_at', { ascending: false });

    if (filters.search) query = query.ilike('title', `%${filters.search}%`);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.category) query = query.eq('category', filters.category);
    if (filters.date) query = query.gte('start_date', filters.date);

    const { data, error, count } = await query;
    if (error) throw error;

    return { data: data ?? [], count: count ?? 0 };
  }

  async findEventById(id: string): Promise<Event | null> {
    const { data, error } = await this.supabase
      .from(this.table)
      .select('*, organizations(name)')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async createEvent(payload: any): Promise<Event> {
    return this.create<Event>(this.table, { ...payload, status: 'draft' });
  }

  async updateEvent(id: string, payload: any): Promise<Event> {
    return this.update<Event>(this.table, id, payload);
  }

  async deleteEvent(id: string): Promise<void> {
    return this.delete(this.table, id);
  }
}
