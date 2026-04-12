import type {
  SupabaseClient,
  User,
  Session,
  AuthChangeEvent,
  Provider,
} from '@supabase/supabase-js';
import { handleError } from './errors';

export interface LoginOptions<P extends string = Provider> {
  email?: string;
  password?: string;
  provider?: P;
  redirectTo?: string;
}

export interface AuthConfig<P extends string = Provider> {
  allowedProviders?: P[];
}

export class AuthService<P extends string = Provider> {
  private supabase: SupabaseClient;
  private config: AuthConfig<P>;

  constructor(supabase: SupabaseClient, config: AuthConfig<P> = {}) {
    this.supabase = supabase;
    this.config = config;
  }

  async login(options: LoginOptions<P>) {
    try {
      if (options.provider) {
        // Optional runtime check if allowedProviders is configured
        if (
          this.config.allowedProviders &&
          !this.config.allowedProviders.includes(options.provider)
        ) {
          throw new Error(
            `Provider "${options.provider}" is not allowed by configuration.`,
          );
        }

        const { data, error } = await this.supabase.auth.signInWithOAuth({
          provider: options.provider as Provider,
          options: {
            redirectTo: options.redirectTo,
          },
        });
        if (error) handleError(error);
        return data;
      }

      if (options.email && !options.password) {
        const { data, error } = await this.supabase.auth.signInWithOtp({
          email: options.email,
          options: {
            emailRedirectTo: options.redirectTo,
          },
        });
        if (error) handleError(error);
        return data;
      }

      if (options.email && options.password) {
        const { data, error } = await this.supabase.auth.signInWithPassword({
          email: options.email,
          password: options.password,
        });
        if (error) handleError(error);
        return data;
      }

      throw new Error('Invalid login options');
    } catch (error) {
      handleError(error);
    }
  }

  async logout(onLogout?: () => void) {
    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) handleError(error);
      if (onLogout) onLogout();
    } catch (error) {
      handleError(error);
    }
  }

  async getCurrentUser(): Promise<{
    user: User | null;
    session: Session | null;
  }> {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await this.supabase.auth.getSession();
      if (sessionError) handleError(sessionError);

      const {
        data: { user },
        error: userError,
      } = await this.supabase.auth.getUser();
      if (userError) handleError(userError);

      return { user, session };
    } catch (error) {
      handleError(error);
      return { user: null, session: null };
    }
  }

  onAuthStateChange(
    callback: (event: AuthChangeEvent, session: Session | null) => void,
  ) {
    const {
      data: { subscription },
    } = this.supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
    return subscription;
  }
}
