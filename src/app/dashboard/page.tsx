'use client';

import React from 'react';
import Link from 'next/link';
import { Box, Container, Typography, Grid, Paper, Button, List, ListItem, ListItemText, Divider, LinearProgress } from '@mui/material';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StarIcon from '@mui/icons-material/Star';
import FlagIcon from '@mui/icons-material/Flag';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { useStore } from '@/store/useStore';

export default function Dashboard() {
  const { streak, attempts, bookmarks, revise, resetAll } = useStore();

  // Streak Stats
  const streakCount = streak.count > 0 ? streak.count : 0;
  const bestStreak = streak.best > 0 ? streak.best : 0;

  // Attempts Stats
  const attemptsList = Object.values(attempts);
  const solvedCount = attemptsList.length;
  const correctCount = attemptsList.filter(a => a.correct).length;
  const accuracyNum = solvedCount > 0 ? Math.round((correctCount / solvedCount) * 100) : 0;

  // Bookmarks count
  const bookmarkedPrelims = Object.keys(bookmarks['prelims'] || {});
  const bookmarkedMains = Object.keys(bookmarks['mains'] || {});
  const bookmarkedOptional = Object.keys(bookmarks['optional'] || {});
  const totalBookmarks = bookmarkedPrelims.length + bookmarkedMains.length + bookmarkedOptional.length;

  // Revise count
  const revisePrelims = Object.keys(revise['prelims'] || {});
  const reviseMains = Object.keys(revise['mains'] || {});
  const reviseOptional = Object.keys(revise['optional'] || {});
  const totalRevise = revisePrelims.length + reviseMains.length + reviseOptional.length;

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all your progress, streaks, bookmarks, and attempts? This cannot be undone.')) {
      resetAll();
    }
  };

  const cards = [
    {
      title: 'Current Streak',
      value: `${streakCount} Days`,
      sub: `Best streak: ${bestStreak} days`,
      color: '#EF4444',
      icon: <LocalFireDepartmentIcon sx={{ color: '#EF4444', fontSize: '28px' }} />,
    },
    {
      title: 'Overall Accuracy',
      value: `${accuracyNum}%`,
      sub: `${correctCount} correct of ${solvedCount} solved`,
      color: '#8B5CF6',
      icon: <TrackChangesIcon sx={{ color: '#8B5CF6', fontSize: '28px' }} />,
    },
    {
      title: 'Starred Items',
      value: `${totalBookmarks}`,
      sub: 'Bookmarks across segments',
      color: '#F5A623',
      icon: <StarIcon sx={{ color: '#F5A623', fontSize: '28px' }} />,
    },
    {
      title: 'Revision List',
      value: `${totalRevise}`,
      sub: 'Questions marked for review',
      color: '#EF4444',
      icon: <FlagIcon sx={{ color: '#EF4444', fontSize: '28px' }} />,
    },
  ];

  return (
    <Box sx={{ bgcolor: 'background.default', py: 6, flex: 1 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 5 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>
              Your Progress
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Analyze your performance metrics, streaks, and review bookmarked questions.
            </Typography>
          </Box>
          <Button
            variant="outlined"
            color="error"
            onClick={handleReset}
            sx={{ fontWeight: 700, borderRadius: 2 }}
          >
            Reset Progress
          </Button>
        </Box>

        {/* Stats Grid */}
        <Grid container spacing={3} sx={{ mb: 6 }}>
          {cards.map((c, i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  bgcolor: 'background.paper',
                  border: '1.5px solid',
                  borderColor: 'divider',
                  borderRadius: 3.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2.5,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: '50%', bgcolor: `${c.color}10` }}>
                  {c.icon}
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.2 }}>
                    {c.title}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.2 }}>
                    {c.value}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {c.sub}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Detail Splits */}
        <Grid container spacing={4}>
          {/* Left panel: accuracy indicators */}
          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                p: 4,
                border: '1.5px solid',
                borderColor: 'divider',
                borderRadius: 3.5,
                bgcolor: 'background.paper',
                height: '100%',
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, color: 'text.primary' }}>
                Topic Proficiency
              </Typography>
              {solvedCount > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Prelims Solved Ratio</Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{solvedCount} questions</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={Math.min((solvedCount / 72) * 100, 100)} sx={{ height: 6, borderRadius: 3, bgcolor: 'divider', '& .MuiLinearProgress-bar': { bgcolor: '#F5A623', borderRadius: 3 } }} />
                  </Box>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Prelims Accuracy Rate</Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{accuracyNum}%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={accuracyNum} sx={{ height: 6, borderRadius: 3, bgcolor: 'divider', '& .MuiLinearProgress-bar': { bgcolor: '#8B5CF6', borderRadius: 3 } }} />
                  </Box>
                </Box>
              ) : (
                <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
                  <Typography variant="body2" sx={{ mb: 2 }}>No solved MCQs yet.</Typography>
                  <Button component={Link} href="/prelims" variant="contained" sx={{ bgcolor: '#16223E', color: '#FFFFFF', fontWeight: 800, '&:hover': { bgcolor: '#0B132B' } }}>
                    Attempt MCQs
                  </Button>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Right panel: Bookmarked Items list */}
          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                p: 4,
                border: '1.5px solid',
                borderColor: 'divider',
                borderRadius: 3.5,
                bgcolor: 'background.paper',
                height: '100%',
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, color: 'text.primary' }}>
                Starred Questions ({totalBookmarks})
              </Typography>
              {totalBookmarks > 0 ? (
                <List sx={{ p: 0 }}>
                  {bookmarkedPrelims.map((id, index) => (
                    <React.Fragment key={id}>
                      {index > 0 && <Divider sx={{ my: 1.5 }} />}
                      <ListItem disablePadding sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <ListItemText
                          primary={`Prelims Question ID: ${id.slice(-6)}`}
                          primaryTypographyProps={{ fontSize: '13px', fontWeight: 600, color: 'text.primary' }}
                        />
                        <Button
                          component={Link}
                          href="/prelims"
                          size="small"
                          sx={{ fontSize: '11px', fontWeight: 800 }}
                          endIcon={<KeyboardArrowRightIcon sx={{ fontSize: 14 }} />}
                        >
                          View
                        </Button>
                      </ListItem>
                    </React.Fragment>
                  ))}
                  {bookmarkedMains.map((id) => (
                    <ListItem key={id} disablePadding sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <ListItemText
                        primary={`Mains Question ID: ${id.slice(-6)}`}
                        primaryTypographyProps={{ fontSize: '13px', fontWeight: 600, color: 'text.primary' }}
                      />
                      <Button component={Link} href="/mains" size="small" sx={{ fontSize: '11px', fontWeight: 800 }} endIcon={<KeyboardArrowRightIcon />}>
                        View
                      </Button>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
                  <Typography variant="body2">Your bookmarks list is empty.</Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
