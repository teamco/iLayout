import { useEffect, useState, useCallback, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { AuthContext } from '@/lib/hooks/useAuth';

async function setOnlineStatus(userId: string, isOnline: boolean) {
  await supabase
    .from('profiles')
    .update({ is_online: isOnline, updated_at: new Date().toISOString() })
    .eq('id', userId);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (session?.user) {
        void setOnlineStatus(session.user.id, true);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setLoading(false);

      if (event === 'SIGNED_IN' && session?.user) {
        void setOnlineStatus(session.user.id, true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Set offline on tab close / navigate away
  useEffect(() => {
    const handleBeforeUnload = () => {
      const userId = session?.user?.id;
      const token = session?.access_token;
      if (!userId || !token) return;
      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`;
      // Use fetch + keepalive for reliability during unload (supports headers unlike sendBeacon)
      void fetch(url, {
        method: 'PATCH',
        keepalive: true,
        headers: {
          'Content-Type': 'application/json',
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          is_online: false,
          updated_at: new Date().toISOString(),
        }),
      });
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [session?.access_token, session?.user?.id]);

  const signOut = useCallback(async () => {
    const userId = session?.user?.id;
    if (userId) {
      await setOnlineStatus(userId, false);
    }
    await supabase.auth.signOut();
  }, [session?.user?.id]);

  return (
    <AuthContext.Provider
      value={{ session, user: session?.user ?? null, loading, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}
