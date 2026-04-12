import { describe, it, expect } from 'vitest';
import { handleError, SupabaseApiError } from '../errors';
import type { PostgrestError } from '@supabase/supabase-js';

describe('handleError', () => {
  it('returns null if no error is provided', () => {
    expect(handleError(null)).toBeNull();
    expect(handleError(undefined)).toBeNull();
  });

  it('handles PostgrestError PGRST116 (not found) by returning null', () => {
    const pgError: PostgrestError = {
      name: '',
      stack: '',
      toJSON(): {
        name: string;
        message: string;
        details: string;
        hint: string;
        code: string;
      } {
        return { code: '', details: '', hint: '', message: '', name: '' };
      },
      code: 'PGRST116',
      message: 'JSON object requested, but 0 rows returned',
      details: '',
      hint: '',
    };
    expect(handleError(pgError)).toBeNull();
  });

  it('wraps other PostgrestErrors in SupabaseApiError', () => {
    const pgError: PostgrestError = {
      name: '',
      stack: '',
      toJSON(): {
        name: string;
        message: string;
        details: string;
        hint: string;
        code: string;
      } {
        return { code: '', details: '', hint: '', message: '', name: '' };
      },
      code: 'PGRST999',
      message: 'Some DB error',
      details: 'details',
      hint: 'hint',
    };
    expect(() => handleError(pgError)).toThrow(SupabaseApiError);
    try {
      handleError(pgError);
    } catch (e: any) {
      expect(e.message).toBe('Some DB error');
      expect(e.code).toBe('PGRST999');
      expect(e.name).toBe('SupabaseApiError');
    }
  });

  it('wraps AuthError in SupabaseApiError', () => {
    const authError = {
      name: 'AuthError',
      message: 'Invalid credentials',
      status: 400,
    };
    expect(() => handleError(authError)).toThrow(SupabaseApiError);
    try {
      handleError(authError);
    } catch (e: any) {
      expect(e.message).toBe('Invalid credentials');
      expect(e.status).toBe(400);
    }
  });

  it('handles generic Error objects', () => {
    const genericError = new Error('Generic error');
    expect(() => handleError(genericError)).toThrow(SupabaseApiError);
    try {
      handleError(genericError);
    } catch (e: any) {
      expect(e.message).toBe('Generic error');
    }
  });

  it('handles unknown error types', () => {
    const unknownError = 'Something went wrong';
    expect(() => handleError(unknownError)).toThrow(SupabaseApiError);
    try {
      handleError(unknownError);
    } catch (e: any) {
      expect(e.message).toBe('An unknown error occurred');
    }
  });
});
