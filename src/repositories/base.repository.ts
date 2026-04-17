import { PaginationParams } from '@/src/types';

export abstract class BaseRepository {
  constructor(protected supabase: any) {}

  protected async findById<T>(table: string, id: string): Promise<T | null> {
    const { data, error } = await this.supabase
      .from(table)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  protected async findAll<T>(
    table: string,
    pagination?: PaginationParams,
    orderBy: string = 'created_at',
    ascending: boolean = false
  ): Promise<{ data: T[]; count: number }> {
    let query = this.supabase
      .from(table)
      .select('*', { count: 'exact' })
      .order(orderBy, { ascending });

    if (pagination) {
      query = query.range(pagination.offset, pagination.offset + pagination.limit - 1);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return { data: data ?? [], count: count ?? 0 };
  }

  protected async create<T>(table: string, payload: any): Promise<T> {
    const { data, error } = await this.supabase
      .from(table)
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  protected async update<T>(table: string, id: string, payload: any): Promise<T> {
    const { data, error } = await this.supabase
      .from(table)
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  protected async delete(table: string, id: string): Promise<void> {
    const { error } = await this.supabase.from(table).delete().eq('id', id);
    if (error) throw error;
  }
}
