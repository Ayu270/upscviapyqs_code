'use client';

import { createTheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    prelims: Palette['primary'];
    mains: Palette['primary'];
    optional: Palette['primary'];
    frameworks: Palette['primary'];
    practice: Palette['primary'];
    dashboard: Palette['primary'];
  }
  interface PaletteOptions {
    prelims?: PaletteOptions['primary'];
    mains?: PaletteOptions['primary'];
    optional?: PaletteOptions['primary'];
    frameworks?: PaletteOptions['primary'];
    practice?: PaletteOptions['primary'];
    dashboard?: PaletteOptions['primary'];
  }
}

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#16223E',      // Navy primary
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#F5A623',    // Gold accent
      contrastText: '#16223E',
    },
    background: {
      default: '#FAF7F0',  // Cream/Off-white body
      paper: '#FFFFFF',    // White card background
    },
    text: {
      primary: '#1E1E2E',
      secondary: '#7A7A8A',
    },
    divider: '#E5DECF',
    prelims: { main: '#F5A623' },
    mains: { main: '#10B981' },
    optional: { main: '#8B5CF6' },
    frameworks: { main: '#3B82F6' },
    practice: { main: '#EF4444' },
    dashboard: { main: '#06B6D4' },
  },
  typography: {
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    h1: { fontWeight: 800, color: '#16223E' },
    h2: { fontWeight: 800, color: '#16223E' },
    h3: { fontWeight: 800, color: '#16223E' },
    h4: { fontWeight: 700, color: '#16223E' },
    h5: { fontWeight: 700, color: '#16223E' },
    h6: { fontWeight: 700, color: '#16223E' },
    body1: { fontSize: '15px', lineHeight: 1.6 },
    body2: { fontSize: '13.5px', color: '#7A7A8A' },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 700,
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1.5px solid #E5DECF',
          boxShadow: 'none',
          '&:hover': {
            borderColor: '#F5A623',
            boxShadow: '0 6px 20px rgba(245, 166, 35, 0.08)',
          },
        },
      },
    },
  },
});

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#F5A623',      // Gold accent
      contrastText: '#0A1128',
    },
    secondary: {
      main: '#1C2541',    // Slate blue secondary
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#0A1128',  // Deep navy default
      paper: '#1C2541',    // Slate blue card background
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#9CA3AF',
    },
    divider: '#2A3454',
    prelims: { main: '#F5A623' },
    mains: { main: '#10B981' },
    optional: { main: '#8B5CF6' },
    frameworks: { main: '#3B82F6' },
    practice: { main: '#EF4444' },
    dashboard: { main: '#06B6D4' },
  },
  typography: {
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    h1: { fontWeight: 800, color: '#FFFFFF' },
    h2: { fontWeight: 800, color: '#FFFFFF' },
    h3: { fontWeight: 800, color: '#FFFFFF' },
    h4: { fontWeight: 700, color: '#FFFFFF' },
    h5: { fontWeight: 700, color: '#FFFFFF' },
    h6: { fontWeight: 700, color: '#FFFFFF' },
    body1: { fontSize: '15px', lineHeight: 1.6, color: '#FFFFFF' },
    body2: { fontSize: '13.5px', color: '#9CA3AF' },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 700,
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1.5px solid #2A3454',
          boxShadow: 'none',
          '&:hover': {
            borderColor: '#F5A623',
            boxShadow: '0 6px 20px rgba(245, 166, 35, 0.12)',
          },
        },
      },
    },
  },
});
