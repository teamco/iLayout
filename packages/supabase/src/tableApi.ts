import type { SupabaseClient } from '@supabase/supabase-js';
import { handleError } from './errors';

export interface QueryOptions {
  select?: string;
  order?: { column: string; ascending?: boolean };
  limit?: number;
  offset?: number;
}

export class TableApi<T extends object> {
  protected supabase: SupabaseClient;
  protected tableName: string;

  constructor(supabase: SupabaseClient, tableName: string) {
    this.supabase = supabase;
    this.tableName = tableName;
  }

  async getAll(options: QueryOptions = {}): Promise<T[]> {
    try {
      let query = this.supabase
        .from(this.tableName)
        .select(options.select || '*');

      if (options.order) {
        query = query.order(options.order.column, {
          ascending: options.order.ascending ?? true,
        });
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(
          options.offset,
          options.offset + (options.limit || 10) - 1,
        );
      }

      const { data, error } = await query;
      if (error) handleError(error);
      return data as unknown as T[];
    } catch (error) {
      handleError(error);
      return [];
    }
  }

  async getById(id: string | number): Promise<T | null> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) return handleError(error);
      return data as unknown as T;
    } catch (error) {
      return handleError(error);
    }
  }

  async upsert(record: Partial<T>): Promise<T | null> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .upsert(record as any)
        .select()
        .single();

      if (error) handleError(error);
      return data as unknown as T;
    } catch (error) {
      handleError(error);
      return null;
    }
  }

  async update(id: string | number, updates: Partial<T>): Promise<T | null> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (error) handleError(error);
      return data as unknown as T;
    } catch (error) {
      handleError(error);
      return null;
    }
  }

  async delete(id: string | number): Promise<void> {
    try {
      const { error } = await this.supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) handleError(error);
    } catch (error) {
      handleError(error);
    }
  }

  // Helper for custom queries
  query() {
    return this.supabase.from(this.tableName);
  }
}

export function createTableApi<T extends object>(
  supabase: SupabaseClient,
  tableName: string,
): TableApi<T> {
  return new TableApi<T>(supabase, tableName);
}
