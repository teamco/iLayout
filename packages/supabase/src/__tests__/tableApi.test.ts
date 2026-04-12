import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTableApi } from '../tableApi';
import type { SupabaseClient } from '@supabase/supabase-js';

describe('TableApi', () => {
  let mockSupabase: any;
  let tableApi: any;
  let mockQuery: any;

  beforeEach(() => {
    mockQuery = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: {}, error: null }),
      insert: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
    };

    // Default resolve for the chain
    mockQuery.then = vi.fn().mockImplementation((onFulfilled) => {
      return Promise.resolve(onFulfilled({ data: [], error: null }));
    });

    mockSupabase = {
      from: vi.fn().mockReturnValue(mockQuery),
    };

    tableApi = createTableApi(mockSupabase as SupabaseClient, 'test_table');
  });

  it('getAll calls correct Supabase methods with default options', async () => {
    await tableApi.getAll();
    expect(mockSupabase.from).toHaveBeenCalledWith('test_table');
    expect(mockQuery.select).toHaveBeenCalledWith('*');
  });

  it('getAll applies query options correctly', async () => {
    await tableApi.getAll({
      select: 'id, name',
      order: { column: 'name', ascending: false },
      limit: 10,
      offset: 20,
    });

    expect(mockQuery.select).toHaveBeenCalledWith('id, name');
    expect(mockQuery.order).toHaveBeenCalledWith('name', { ascending: false });
    expect(mockQuery.limit).toHaveBeenCalledWith(10);
    expect(mockQuery.range).toHaveBeenCalledWith(20, 29);
  });

  it('getById calls correct Supabase methods', async () => {
    mockQuery.single.mockResolvedValueOnce({ data: { id: '1' }, error: null });

    const result = await tableApi.getById('1');
    expect(mockQuery.select).toHaveBeenCalledWith('*');
    expect(mockQuery.eq).toHaveBeenCalledWith('id', '1');
    expect(mockQuery.single).toHaveBeenCalled();
    expect(result).toEqual({ id: '1' });
  });

  it('upsert calls correct Supabase methods', async () => {
    const record = { id: '1', name: 'Test' };
    mockQuery.single.mockResolvedValueOnce({ data: record, error: null });

    const result = await tableApi.upsert(record);
    expect(mockQuery.upsert).toHaveBeenCalledWith(record);
    expect(mockQuery.select).toHaveBeenCalled();
    expect(mockQuery.single).toHaveBeenCalled();
    expect(result).toEqual(record);
  });

  it('update calls correct Supabase methods', async () => {
    const updates = { name: 'Updated' };
    mockQuery.single.mockResolvedValueOnce({
      data: { id: '1', ...updates },
      error: null,
    });

    const result = await tableApi.update('1', updates);
    expect(mockQuery.update).toHaveBeenCalledWith(updates);
    expect(mockQuery.eq).toHaveBeenCalledWith('id', '1');
    expect(mockQuery.select).toHaveBeenCalled();
    expect(mockQuery.single).toHaveBeenCalled();
    expect(result).toEqual({ id: '1', name: 'Updated' });
  });

  it('delete calls correct Supabase methods', async () => {
    // Override the chain's promise for this test
    mockQuery.then.mockImplementationOnce((onFulfilled) => {
      return Promise.resolve(onFulfilled({ error: null }));
    });

    await tableApi.delete('1');
    expect(mockQuery.delete).toHaveBeenCalled();
    expect(mockQuery.eq).toHaveBeenCalledWith('id', '1');
  });
});
