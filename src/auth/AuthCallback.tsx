import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Spin } from 'antd';
import { supabase } from '@/lib/supabase';
import { ERoutes } from '@/routes';

export function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if session already exists (e.g. code exchange completed before mount)
    void supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        await navigate({ to: ERoutes.HOME });
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        void navigate({ to: ERoutes.HOME });
      }
    });

    // Timeout fallback — if no auth event after 10s, redirect to login
    const timeout = setTimeout(() => {
      void navigate({ to: ERoutes.LOGIN });
    }, 10_000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [navigate]);

  return <Spin size="large" fullscreen />;
}
