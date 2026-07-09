'use client';

import React, { useState } from 'react';
import { Box, Container, Typography, Grid, Paper, List, ListItem, ListItemButton, ListItemText, Button, CircularProgress, Chip } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import MathContent from '@/components/shared/MathContent';
import UpgradeDialog from '@/components/shared/UpgradeDialog';
import { useStore } from '@/store/useStore';
import { useFrameworks } from '@/hooks/useContent';
import { mdToHtml } from '@/lib/md';

export default function FrameworksPage() {
  const { data: frameworks, isLoading, error } = useFrameworks();
  const { entitled } = useStore();

  const [activeFwId, setActiveFwId] = useState<string | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 15, flex: 1 }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (error || !frameworks || frameworks.length === 0) {
    return (
      <Box sx={{ py: 15, textAlign: 'center' }}>
        <Typography color="error" variant="h6">Could not load Frameworks library.</Typography>
      </Box>
    );
  }

  // Determine active framework
  const selectedFw = frameworks.find((fw: any) => fw.id === activeFwId) || frameworks[0];
  const isSelectedLocked = selectedFw && !entitled && frameworks.indexOf(selectedFw) > 0;

  return (
    <Box sx={{ bgcolor: 'background.default', py: 4, flex: 1 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>
            Syllabus Frameworks
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Revision structures to analyze and write answers for abstract Mains questions.
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Sidebar menu lists */}
          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                border: '1.5px solid',
                borderColor: 'divider',
                borderRadius: 2,
                bgcolor: 'background.paper',
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '11px' }}>
                Frameworks Index
              </Typography>
              <List sx={{ p: 0, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {frameworks.map((fw: any, idx: number) => {
                  const isLocked = idx > 0 && !entitled;
                  const isActive = selectedFw.id === fw.id;

                  return (
                    <ListItem key={fw.id} disablePadding>
                      <ListItemButton
                        onClick={() => setActiveFwId(fw.id)}
                        sx={{
                          borderRadius: 2,
                          py: 1,
                          bgcolor: isActive ? 'rgba(59,130,246,0.06)' : 'transparent',
                          border: '1.5px solid',
                          borderColor: isActive ? '#3B82F6' : 'transparent',
                          color: isActive ? '#3B82F6' : 'text.primary',
                          '&:hover': {
                            bgcolor: 'rgba(59,130,246,0.04)',
                          }
                        }}
                      >
                        <ListItemText
                          primary={fw.title}
                          primaryTypographyProps={{
                            fontSize: '13px',
                            fontWeight: isActive ? 800 : 600,
                          }}
                        />
                        {isLocked && <LockIcon sx={{ fontSize: 13, color: 'text.secondary', ml: 1 }} />}
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            </Paper>
          </Grid>

          {/* Details pane */}
          <Grid item xs={12} md={8}>
            <Paper
              elevation={0}
              sx={{
                p: 4,
                border: '1.5px solid',
                borderColor: 'divider',
                borderRadius: 2,
                bgcolor: 'background.paper',
                minHeight: '400px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {isSelectedLocked ? (
                /* Locked state UI overlay */
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 6, textAlign: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 50, height: 50, borderRadius: '50%', bgcolor: 'rgba(59,130,246,0.08)', mb: 2 }}>
                    <LockIcon sx={{ color: '#3B82F6', fontSize: 24 }} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>
                    {selectedFw.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3.5, maxWidth: '380px', lineHeight: 1.6 }}>
                    This framework contains advanced response templates and exam-grade revision structures. Upgrade to get instant access.
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => setUpgradeOpen(true)}
                    sx={{
                      bgcolor: '#16223E',
                      color: '#FFFFFF',
                      px: 3.5,
                      py: 1,
                      fontWeight: 800,
                      '&:hover': { bgcolor: '#0B132B' },
                    }}
                  >
                    Unlock Framework
                  </Button>
                </Box>
              ) : (
                /* Unlocked state HTML details */
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, borderBottom: '1px solid', borderColor: 'divider', pb: 2 }}>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: 'text.primary' }}>
                      {selectedFw.title}
                    </Typography>
                    <Chip
                      label={selectedFw.axis || 'General'}
                      size="small"
                      icon={<AutoAwesomeIcon sx={{ fontSize: '10px !important' }} />}
                      sx={{
                        fontSize: '9px',
                        fontWeight: 800,
                        bgcolor: 'rgba(59,130,246,0.06)',
                        color: '#3B82F6',
                        border: '1px solid rgba(59,130,246,0.15)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    />
                  </Box>

                  <MathContent content={mdToHtml(selectedFw.body_md)} />
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* Upgrade Dialog */}
      <UpgradeDialog open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </Box>
  );
}
