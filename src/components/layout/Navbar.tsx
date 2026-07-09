'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Box, Container, Typography, IconButton, InputBase, Avatar, Badge } from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { useStore } from '@/store/useStore';

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.text.primary, 0.05),
  '&:hover': {
    backgroundColor: alpha(theme.palette.text.primary, 0.08),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: theme.palette.text.secondary,
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  fontSize: '13px',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '180px',
    },
  },
}));

export default function Navbar() {
  const pathname = usePathname();
  const { themeMode, setThemeMode, user } = useStore();

  const toggleTheme = () => {
    setThemeMode(themeMode === 'light' ? 'dark' : 'light');
  };

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Prelims', href: '/prelims' },
    { label: 'Mains', href: '/mains' },
    { label: 'Optional', href: '/optional' },
    { label: 'Frameworks', href: '/frameworks' },
    { label: 'Practice', href: '/practice' },
    { label: 'Dashboard', href: '/dashboard' },
  ];

  return (
    <Box
      sx={{
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        py: 1.5,
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <Container maxWidth="xl" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Brand */}
        <Link href="/" style={{ textDecoration: 'none' }}>
          <Typography variant="h6" sx={{ fontSize: '18px', fontWeight: 800, color: 'text.primary' }}>
            UPSC via <span style={{ color: '#F5A623' }}>PYQs</span>
          </Typography>
        </Link>

        {/* Links */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, alignItems: 'center' }}>
          {navLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link key={link.href} href={link.href} style={{ textDecoration: 'none' }}>
                <Box
                  sx={{
                    px: 2,
                    py: 0.8,
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: active ? '#FFFFFF' : 'text.secondary',
                    bgcolor: active ? '#16223E' : 'transparent',
                    border: '1.5px solid transparent',
                    transition: 'all 0.2s',
                    '&:hover': {
                      color: active ? '#FFFFFF' : 'text.primary',
                      borderColor: active ? 'transparent' : 'divider',
                    },
                    ...((active && themeMode === 'dark') && {
                      bgcolor: '#F5A623',
                      color: '#0A1128',
                    })
                  }}
                >
                  {link.label}
                </Box>
              </Link>
            );
          })}
        </Box>

        {/* Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {/* Search bar */}
          <Search sx={{ display: { xs: 'none', sm: 'block' } }}>
            <SearchIconWrapper>
              <SearchIcon sx={{ fontSize: 18 }} />
            </SearchIconWrapper>
            <StyledInputBase placeholder="Search..." inputProps={{ 'aria-label': 'search' }} />
          </Search>

          {/* Notifications */}
          <IconButton size="small" sx={{ color: 'text.secondary' }}>
            <Badge color="error" variant="dot">
              <NotificationsNoneIcon sx={{ fontSize: 20 }} />
            </Badge>
          </IconButton>

          {/* Theme Switcher */}
          <IconButton size="small" onClick={toggleTheme} sx={{ color: 'text.secondary' }}>
            {themeMode === 'light' ? (
              <DarkModeIcon sx={{ fontSize: 20 }} />
            ) : (
              <LightModeIcon sx={{ fontSize: 20 }} />
            )}
          </IconButton>

          {/* User Profile initials */}
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: '#16223E',
              color: '#F5A623',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              border: '1.5px solid #F5A623',
              ...(themeMode === 'dark' && {
                bgcolor: '#F5A623',
                color: '#0A1128',
              })
            }}
          >
            {user ? user.email.slice(0, 2).toUpperCase() : 'AR'}
          </Avatar>
        </Box>
      </Container>
    </Box>
  );
}
