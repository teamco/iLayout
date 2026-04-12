import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Spin } from 'antd';
import { authService } from '@/lib/supabase';
import { ERoutes } from '@/routes';

export function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if session already exists (e.g. code exchange completed before mount)
    void authService.getCurrentUser().then(async ({ session }) => {
      if (session) {
        await navigate({ to: ERoutes.HOME });
      }
    });

    const subscription = authService.onAuthStateChange((event) => {
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
