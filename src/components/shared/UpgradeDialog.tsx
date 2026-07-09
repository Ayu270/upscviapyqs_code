'use client';

import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockIcon from '@mui/icons-material/Lock';
import { useStore } from '@/store/useStore';

interface UpgradeDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function UpgradeDialog({ open, onClose }: UpgradeDialogProps) {
  const { user } = useStore();

  const handleUpgrade = () => {
    // In production, this calls the Razorpay order creation API and launches Razorpay checkout.
    // For local mock verification, we'll simulate a successful payment after 1.5s
    alert('Simulating Razorpay Payment Gateway...\n\nProcessing ₹599 (Founder Price inclusive of GST)');
    setTimeout(() => {
      // Set entitled user state in the store
      useStore.getState().setUser(user || { email: 'premium_user@example.com' }, true);
      alert('Payment Successful!\n\nYour All-Access annual pass is now active.');
      onClose();
    }, 1500);
  };

  const features = [
    'Complete UPSC archive from 2013 to 2024',
    'GS I-IV structured model answers & essays',
    'All 48 Optional subjects fully covered',
    '29+ syllabus-wise revision frameworks',
    'Timed mock tests and chapter quizzes',
    '7-day full refund guarantee',
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: 3.5,
          p: 2,
          maxWidth: '440px',
        },
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: '50%', bgcolor: 'rgba(245,166,35,0.1)' }}>
            <LockIcon sx={{ color: '#F5A623', fontSize: 22 }} />
          </Box>
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>
          Unlock All-Access Pass
        </Typography>
      </DialogTitle>
      
      <DialogContent sx={{ pb: 2 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', mb: 3 }}>
          Upgrade to get full access to the complete UPSC PYQ learning archive.
        </Typography>
        
        <List sx={{ p: 0, mb: 2 }}>
          {features.map((f, i) => (
            <ListItem key={i} sx={{ p: 0, py: 0.6 }}>
              <ListItemIcon sx={{ minWidth: 28 }}>
                <CheckCircleIcon sx={{ color: '#10B981', fontSize: 16 }} />
              </ListItemIcon>
              <ListItemText
                primary={f}
                primaryTypographyProps={{ fontSize: '13px', fontWeight: 600, color: 'text.primary' }}
              />
            </ListItem>
          ))}
        </List>

        <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 2.5, textAlign: 'center', border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.5px' }}>
            Founder Price
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 900, color: '#F5A623', my: 0.5 }}>
            ₹599 <span style={{ fontSize: '14px', fontWeight: 600, color: 'text.secondary' }}>/ year</span>
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Normal price ₹999 + 18% GST (Save 50%)
          </Typography>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ justifyContent: 'center', px: 3, pb: 2, gap: 1 }}>
        <Button
          onClick={onClose}
          sx={{
            flex: 1,
            color: 'text.secondary',
            fontWeight: 700,
            border: '1.5px solid',
            borderColor: 'divider',
            '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleUpgrade}
          variant="contained"
          sx={{
            flex: 2,
            bgcolor: '#16223E',
            color: '#FFFFFF',
            fontWeight: 800,
            '&:hover': { bgcolor: '#0B132B' },
          }}
        >
          Upgrade Now
        </Button>
      </DialogActions>
    </Dialog>
  );
}
