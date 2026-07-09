'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Container, Typography, TextField, Button, Paper, Alert } from '@mui/material';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';

export default function SignIn() {
  const router = useRouter();
  const { setUser } = useStore();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
        },
      });

      if (error) {
        setMessage({ text: error.message, type: 'error' });
      } else {
        setMessage({
          text: 'Check your email for the magic link login!',
          type: 'success',
        });
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'An unexpected error occurred', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        bgcolor: 'background.default',
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
      }}
    >
      <Container maxWidth="xs">
        <Paper
          elevation={0}
          sx={{
            p: 4,
            border: '1.5px solid',
            borderColor: 'divider',
            borderRadius: 3.5,
            bgcolor: 'background.paper',
            textAlign: 'center',
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>
            Sign in to UPSC via <span style={{ color: '#F5A623' }}>PYQs</span>
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>
            Enter your email to receive a passwordless magic login link.
          </Typography>

          {message && (
            <Alert severity={message.type} sx={{ mb: 3, textAlign: 'left', fontSize: '13px' }}>
              {message.text}
            </Alert>
          )}

          <form onSubmit={handleSignIn}>
            <TextField
              fullWidth
              label="Email Address"
              variant="outlined"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2.5,
                },
              }}
            />
            <Button
              fullWidth
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{
                bgcolor: '#16223E',
                color: '#FFFFFF',
                py: 1.5,
                borderRadius: 2.5,
                fontWeight: 800,
                fontSize: '14px',
                '&:hover': { bgcolor: '#0B132B' },
                '&:disabled': { opacity: 0.6 },
              }}
            >
              {loading ? 'Sending link...' : 'Send Magic Link'}
            </Button>
          </form>

          <Typography variant="caption" sx={{ display: 'block', mt: 3, color: 'text.secondary' }}>
            No account? One will be created automatically on your first sign-in.
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}
