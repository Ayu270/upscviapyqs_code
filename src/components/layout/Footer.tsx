'use client';

import React from 'react';
import Link from 'next/link';
import { Box, Container, Grid, Typography, IconButton } from '@mui/material';
import TwitterIcon from '@mui/icons-material/Twitter';
import YouTubeIcon from '@mui/icons-material/YouTube';
import TelegramIcon from '@mui/icons-material/Telegram';
import GitHubIcon from '@mui/icons-material/GitHub';

export default function Footer() {
  const columns = [
    {
      title: 'Platform',
      links: [
        { label: 'Prelims', href: '/prelims' },
        { label: 'Mains', href: '/mains' },
        { label: 'Optional', href: '/optional' },
        { label: 'Frameworks', href: '/frameworks' },
        { label: 'Practice', href: '/practice' },
        { label: 'Dashboard', href: '/dashboard' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About Us', href: '#' },
        { label: 'Blog', href: '#' },
        { label: 'Careers', href: '#' },
        { label: 'Press', href: '#' },
        { label: 'Contact', href: '#' },
      ],
    },
    {
      title: 'Support',
      links: [
        { label: 'Help Center', href: '#' },
        { label: 'Privacy Policy', href: '#' },
        { label: 'Terms of Use', href: '#' },
        { label: 'Refund Policy', href: '#' },
      ],
    },
  ];

  return (
    <Box sx={{ bgcolor: '#080E1E', color: 'rgba(255, 255, 255, 0.7)', pt: 8, pb: 4, mt: 'auto', borderTop: '1px solid #1E293B' }}>
      <Container maxWidth="lg">
        <Grid container spacing={4} sx={{ mb: 6 }}>
          {/* Brand Col */}
          <Grid item xs={12} md={4} sx={{ mb: { xs: 4, md: 0 } }}>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <Typography variant="h6" sx={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF', mb: 2 }}>
                UPSC via <span style={{ color: '#F5A623' }}>PYQs</span>
              </Typography>
            </Link>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)', mb: 3, maxWidth: '280px', lineHeight: 1.6 }}>
              India's most comprehensive UPSC preparation platform, trusted by many aspirants nationwide.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.6)', '&:hover': { color: '#FFFFFF' } }}>
                <TwitterIcon sx={{ fontSize: 18 }} />
              </IconButton>
              <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.6)', '&:hover': { color: '#FFFFFF' } }}>
                <YouTubeIcon sx={{ fontSize: 18 }} />
              </IconButton>
              <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.6)', '&:hover': { color: '#FFFFFF' } }}>
                <TelegramIcon sx={{ fontSize: 18 }} />
              </IconButton>
              <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.6)', '&:hover': { color: '#FFFFFF' } }}>
                <GitHubIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>
          </Grid>

          {/* Links Cols */}
          {columns.map((col) => (
            <Grid item xs={6} md={2.6} key={col.title}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#FFFFFF', mb: 2.5, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '11px' }}>
                {col.title}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {col.links.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    style={{
                      textDecoration: 'none',
                      color: 'rgba(255, 255, 255, 0.5)',
                      fontSize: '13px',
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)')}
                  >
                    {link.label}
                  </Link>
                ))}
              </Box>
            </Grid>
          ))}
        </Grid>

        {/* Bottom */}
        <Box sx={{ pt: 4, borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
          <Typography sx={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)' }}>
            © 2026 UPSC via PYQs. All rights reserved.
          </Typography>
          <Typography sx={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)' }}>
            Made with ♥ for UPSC aspirants across India
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
