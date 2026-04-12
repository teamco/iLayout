import type { PostgrestError, AuthError } from '@supabase/supabase-js';

export class SupabaseApiError extends Error {
  public code: string | null;
  public status: number | null;

  constructor(
    message: string,
    code: string | null = null,
    status: number | null = null,
  ) {
    super(message);
    this.name = 'SupabaseApiError';
    this.code = code;
    this.status = status;
  }
}

function isPostgrestError(error: unknown): error is PostgrestError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'details' in error &&
    'hint' in error &&
    'message' in error
  );
}

function isAuthError(error: unknown): error is AuthError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    'name' in error &&
    (error as any).name === 'AuthError'
  );
}

export function handleError(error: unknown): never | null {
  if (!error) return null;

  // Log error (can be extended to use a custom logger)
  console.error('[Supabase API Error]:', error);

  // Handle PostgrestError
  if (isPostgrestError(error)) {
    // PGRST116: "The result contains 0 rows" (single() query)
    if (error.code === 'PGRST116') {
      return null;
    }

    throw new SupabaseApiError(error.message, error.code, null);
  }

  // Handle AuthError
  if (isAuthError(error)) {
    throw new SupabaseApiError(error.message, null, error.status);
  }

  // Generic error
  const message =
    error instanceof Error ? error.message : 'An unknown error occurred';
  const code = (error as any)?.code || null;
  const status = (error as any)?.status || null;

  throw new SupabaseApiError(message, code, status);
}
