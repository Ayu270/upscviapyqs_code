'use client';

import React from 'react';
import { Box, Typography, Grid, Paper } from '@mui/material';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { useStore } from '@/store/useStore';

export default function DashboardWidget() {
  const { streak, attempts } = useStore();

  // Retrieve stats from store or fallback to mockups
  const streakCount = streak.count > 0 ? streak.count : 47;
  const solvedCount = Object.keys(attempts).length > 0 ? Object.keys(attempts).length : 1247;
  
  // Calculate accuracy from attempts or fallback to mockup (78.3%)
  const attemptsList = Object.values(attempts);
  const correctCount = attemptsList.filter(a => a.correct).length;
  const accuracyStr = attemptsList.length > 0 
    ? (Math.round((correctCount / attemptsList.length) * 1000) / 10).toFixed(1) + '%'
    : '78.3%';

  const metrics = [
    {
      label: `${streakCount} days`,
      sub: 'Streak',
      color: '#EF4444',
      icon: <LocalFireDepartmentIcon sx={{ color: '#EF4444', fontSize: '18px' }} />,
    },
    {
      label: accuracyStr,
      sub: 'Accuracy',
      color: '#8B5CF6',
      icon: <TrackChangesIcon sx={{ color: '#8B5CF6', fontSize: '18px' }} />,
    },
    {
      label: solvedCount.toLocaleString(),
      sub: 'Questions',
      color: '#10B981',
      icon: <LibraryBooksIcon sx={{ color: '#10B981', fontSize: '18px' }} />,
    },
  ];

  const chartData = [
    { day: 'M', height: '35%' },
    { day: 'T', height: '55%' },
    { day: 'W', height: '40%' },
    { day: 'T', height: '70%' },
    { day: 'F', height: '60%' },
    { day: 'S', height: '90%', active: true },
    { day: 'S', height: '50%' },
  ];

  const recentTopics = [
    { title: 'Article 370 & J&K Reorganization', tag: 'Policy', color: '#10B981' },
    { title: 'Westerlies and their climatic impact', tag: 'Geography', color: '#F5A623' },
    { title: 'India\'s Nuclear Doctrine', tag: 'IR', color: '#EF4444' },
  ];

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        bgcolor: '#0B132B',
        borderRadius: 4,
        border: '1.5px solid #1E293B',
        color: '#FFFFFF',
        maxWidth: '460px',
        width: '100%',
        boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
      }}
    >
      {/* Top row metrics */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {metrics.map((m, i) => (
          <Grid item xs={4} key={i}>
            <Box
              sx={{
                bgcolor: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.05)',
                p: 1.5,
                borderRadius: 2.5,
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              {m.icon}
              <Typography sx={{ fontWeight: 800, fontSize: '14px', color: '#FFFFFF', mt: 0.5 }}>
                {m.label}
              </Typography>
              <Typography sx={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase' }}>
                {m.sub}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* Chart Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle2" sx={{ fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', mb: 2, textTransform: 'uppercase' }}>
          Weekly Activity
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '80px', px: 1, mb: 1 }}>
          {chartData.map((bar, idx) => (
            <Box key={idx} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: 1 }}>
              <Box
                sx={{
                  width: '24px',
                  height: bar.height,
                  bgcolor: bar.active ? '#F5A623' : 'rgba(255,255,255,0.08)',
                  borderRadius: '4px',
                  transition: 'height 0.3s ease',
                  '&:hover': {
                    bgcolor: '#F5A623',
                  }
                }}
              />
              <Typography sx={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>
                {bar.day}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Recent topics list */}
      <Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {recentTopics.map((topic, i) => (
            <Box
              key={i}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 1.2,
                bgcolor: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.04)',
                borderRadius: 2,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, minWidth: 0 }}>
                <FiberManualRecordIcon sx={{ color: topic.color, fontSize: '8px', flexShrink: 0 }} />
                <Typography noWrap sx={{ fontSize: '12px', fontWeight: 600, color: '#FFFFFF' }}>
                  {topic.title}
                </Typography>
              </Box>
              <Box
                sx={{
                  fontSize: '9px',
                  fontWeight: 800,
                  px: 1.2,
                  py: 0.4,
                  borderRadius: '12px',
                  color: topic.color,
                  bgcolor: `${topic.color}15`,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  flexShrink: 0,
                }}
              >
                {topic.tag}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Paper>
  );
}
