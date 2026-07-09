'use client';

import React, { useEffect, useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useStore } from '@/store/useStore';
import { lightTheme, darkTheme } from '@/theme/theme';
import { supabase } from '@/lib/supabase';

export default function Providers({ children }: { children: React.ReactNode }) {
  const { themeMode, setUser } = useStore();
  const [mounted, setMounted] = useState(false);
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        staleTime: 1000 * 60 * 5, // 5 minutes
      },
    },
  }));

  // Prevent server-side rendering mismatch for the theme state
  useEffect(() => {
    setMounted(true);
    // Set html theme dataset for globals.css variables
    document.documentElement.setAttribute('data-theme', themeMode);

    // Listen to Supabase auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        try {
          const { data } = await supabase
            .from('entitlements')
            .select('active, expires_at')
            .eq('user_id', session.user.id)
            .maybeSingle();

          const active = data?.active || false;
          const expiresAt = data?.expires_at ? new Date(data.expires_at) : null;
          const isEntitled = active && (!expiresAt || expiresAt > new Date());
          setUser(session.user, isEntitled);
        } catch (e) {
          console.error("Error checking entitlement status:", e);
          setUser(session.user, false);
        }
      } else {
        setUser(null, false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [themeMode, setUser]);

  if (!mounted) {
    // Render children with a placeholder or basic layout before hydration
    return (
      <ThemeProvider theme={lightTheme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    );
  }

  const activeTheme = themeMode === 'light' ? lightTheme : darkTheme;

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={activeTheme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
