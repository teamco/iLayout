import { createSupabaseClient, AuthService } from '@idevconn/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY env vars',
  );
}

export type SupportedProvider = 'google' | 'github';

export const supabase = createSupabaseClient(supabaseUrl, supabaseKey);
export const authService = new AuthService<SupportedProvider>(supabase, {
  allowedProviders: ['google', 'github'],
});
