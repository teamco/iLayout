import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Spin } from 'antd';
import { supabase } from '@/lib/supabase';

export function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        navigate({ to: '/' });
      }
    });

    // Timeout fallback — if no auth event after 10s, redirect to login
    const timeout = setTimeout(() => {
      navigate({ to: '/login' });
    }, 10_000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [navigate]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>
      <Spin size="large" />
    </div>
  );
}
