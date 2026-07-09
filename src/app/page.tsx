'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Box, Container, Typography, Grid, Button, InputBase, Paper, LinearProgress } from '@mui/material';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import StarIcon from '@mui/icons-material/Star';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import TargetIcon from '@mui/icons-material/TrackChanges';
import PsychologicalIcon from '@mui/icons-material/Psychology';
import SearchIcon from '@mui/icons-material/Search';
import DashboardWidget from '@/components/shared/DashboardWidget';
import { useStore } from '@/store/useStore';

export default function Home() {
  const router = useRouter();
  const [searchVal, setSearchVal] = useState('');
  const { themeMode, streak, attempts, bookmarks, revise } = useStore();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      router.push(`/prelims?q=${encodeURIComponent(searchVal.trim())}`);
    } else {
      router.push('/prelims');
    }
  };

  // Live progress metrics
  const streakCount = streak.count > 0 ? streak.count : 47;
  const solvedCount = Object.keys(attempts).length > 0 ? Object.keys(attempts).length : 1247;
  const starredCount = Object.keys(bookmarks).reduce((acc, k) => acc + Object.keys(bookmarks[k] || {}).length, 0) || 15;
  const flaggedCount = Object.keys(revise).reduce((acc, k) => acc + Object.keys(revise[k] || {}).length, 0) || 23;

  const attemptsList = Object.values(attempts);
  const correctCount = attemptsList.filter(a => a.correct).length;
  const accuracyStr = attemptsList.length > 0
    ? (Math.round((correctCount / attemptsList.length) * 1000) / 10).toFixed(1) + '%'
    : '78.3%';

  const statsList = [
    { value: `${streakCount} Day Streak`, emoji: '🔥' },
    { value: `${accuracyStr} Accuracy`, emoji: '🎯' },
    { value: `${solvedCount} Solved`, emoji: '📝' },
    { value: `${starredCount} Starred`, emoji: '⭐' },
    { value: `${flaggedCount} Flagged`, emoji: '⚑' }
  ];

  const exploreCards = [
    {
      title: 'Prelims Explorer',
      desc: 'PYQs, topic-wise analysis, and practice sets for GS Paper 1 & CSAT',
      count: '6,842',
      progress: 47,
      color: '#F5A623',
      badge: 'Most Popular',
      href: '/prelims',
      emoji: '📝',
    },
    {
      title: 'Mains Explorer',
      desc: 'GS I-IV model answers, essay frameworks, and examiner insights',
      count: '4,216',
      progress: 28,
      color: '#10B981',
      badge: 'New Content',
      href: '/mains',
      emoji: '🖋️',
    },
    {
      title: 'Optional Explorer',
      desc: 'In-depth coverage for all 48 optional subjects with PYQs',
      count: '3,948',
      progress: 18,
      color: '#8B5CF6',
      badge: '48 Subjects',
      href: '/optional',
      emoji: '📚',
    },
    {
      title: 'Answer Frameworks',
      desc: 'Proven templates and structures for writing top-scoring answers',
      count: '890',
      progress: 35,
      color: '#3B82F6',
      badge: 'Trending',
      href: '/frameworks',
      emoji: '🧭',
    },
    {
      title: 'Practice Zone',
      desc: 'Timed tests, chapter quizzes, and full-length simulations',
      count: '2,100',
      progress: 33,
      color: '#EF4444',
      badge: 'Live Tools',
      href: '/practice',
      emoji: '⏱️',
    },
    {
      title: 'My Dashboard',
      desc: 'Personalized insights, heatmaps, weak areas, and revision schedule',
      count: 'Active',
      progress: 100,
      color: '#06B6D4',
      badge: 'Personal Goal',
      href: '/dashboard',
      emoji: '📊',
    },
  ];

  const workCards = [
    {
      title: 'Attempt-First',
      desc: 'You commit to an answer before the explanation and decision-rule are revealed – the exam skill is deciding under uncertainty.',
      icon: <FlashOnIcon sx={{ color: '#EF4444', fontSize: '24px' }} />,
      color: 'rgba(239,68,68,0.06)',
      accentColor: '#EF4444'
    },
    {
      title: 'Frameworks, not blank pages',
      desc: 'Reusable, sectioned frameworks turn an unseen Mains question into a structure you can fill.',
      icon: <TargetIcon sx={{ color: '#3B82F6', fontSize: '24px' }} />,
      color: 'rgba(59,130,246,0.06)',
      accentColor: '#3B82F6'
    },
    {
      title: 'Practise & track',
      desc: 'Bookmark, revise, take timed tests; your streak and accuracy build up locally – free, no account.',
      icon: <PsychologicalIcon sx={{ color: '#8B5CF6', fontSize: '24px' }} />,
      color: 'rgba(139,92,246,0.06)',
      accentColor: '#8B5CF6'
    }
  ];

  return (
    <Box sx={{ bgcolor: 'background.default', flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: '#0A1128',
          background: 'linear-gradient(135deg, #0A1128 0%, #16223E 100%)',
          color: '#FFFFFF',
          pt: { xs: 6, md: 10 },
          pb: { xs: 10, md: 13 },
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            right: '-100px',
            top: '-100px',
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(245,166,35,0.08), transparent 70%)',
            pointerEvents: 'none',
          }
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            {/* Left Col */}
            <Grid item xs={12} md={7} sx={{ pr: { md: 4 } }}>
              {/* Badge */}
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 2,
                  py: 0.6,
                  borderRadius: '20px',
                  bgcolor: 'rgba(245,166,35,0.1)',
                  border: '1px solid rgba(245,166,35,0.2)',
                  mb: 3,
                }}
              >
                <StarIcon sx={{ color: '#F5A623', fontSize: '13px' }} />
                <Typography sx={{ fontSize: '11px', fontWeight: 800, color: '#F5A623', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  India's Premier UPSC Platform
                </Typography>
              </Box>

              {/* Title */}
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '32px', sm: '42px', md: '52px' },
                  lineHeight: 1.15,
                  fontWeight: 900,
                  color: '#FFFFFF',
                  mb: 2.5,
                }}
              >
                Crack UPSC by dissecting{' '}
                <span style={{ color: '#F5A623' }}>every Previous Year Question</span>
              </Typography>

              {/* Description */}
              <Typography sx={{ fontSize: { xs: '15px', md: '17px' }, color: 'rgba(255,255,255,0.7)', mb: 4, lineHeight: 1.6, maxWidth: '580px' }}>
                Learn through PYQs, structured model answers, AI-powered explanations, revision frameworks, and timed practice.
              </Typography>

              {/* Search Bar */}
              <form onSubmit={handleSearchSubmit}>
                <Paper
                  elevation={0}
                  sx={{
                    p: '2px 4px',
                    display: 'flex',
                    alignItems: 'center',
                    bgcolor: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 1.5,
                    height: '50px',
                    mb: 4,
                    maxWidth: '520px',
                    width: '100%',
                    '&:focus-within': {
                      borderColor: '#F5A623',
                      boxShadow: '0 0 0 2px rgba(245,166,35,0.15)',
                    }
                  }}
                >
                  <SearchIcon sx={{ p: '10px', color: 'rgba(255,255,255,0.4)', fontSize: '20px' }} />
                  <InputBase
                    sx={{ ml: 1, flex: 1, color: '#FFFFFF', fontSize: '13.5px' }}
                    placeholder="Search a topic... e.g. Hormuz, judicial review, monsoon"
                    value={searchVal}
                    onChange={(e) => setSearchVal(e.target.value)}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    sx={{
                      bgcolor: '#F5A623',
                      color: '#0A1128',
                      fontWeight: 800,
                      px: 1,
                      py: 1,
                      borderRadius: 2,
                      fontSize: '12px',
                      '&:hover': { bgcolor: '#E09B1F' }
                    }}
                  >
                    Search
                  </Button>
                </Paper>
              </form>

              {/* Buttons */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  component={Link}
                  href="/prelims"
                  variant="contained"
                  sx={{
                    bgcolor: '#F5A623',
                    color: '#0A1128',
                    px: 3.5,
                    py: 1.5,
                    borderRadius: 2.5,
                    fontWeight: 800,
                    fontSize: '13.5px',
                    '&:hover': { bgcolor: '#E09B1F' }
                  }}
                >
                  Start Learning
                </Button>
                <Button
                  component={Link}
                  href="/practice"
                  variant="outlined"
                  sx={{
                    borderColor: 'rgba(255,255,255,0.2)',
                    color: '#FFFFFF',
                    px: 3.5,
                    py: 1.5,
                    borderRadius: 2.5,
                    fontWeight: 700,
                    fontSize: '13.5px',
                    '&:hover': {
                      borderColor: '#FFFFFF',
                      bgcolor: 'rgba(255,255,255,0.04)',
                    }
                  }}
                >
                  Take Practice Test <KeyboardArrowRightIcon sx={{ ml: 0.5, fontSize: '16px' }} />
                </Button>
              </Box>

              {/* Little tags strip */}
              {/* <Grid container spacing={3} sx={{ mt: 5, borderTop: '1px solid rgba(255,255,255,0.08)', pt: 3 }}>
                {[
                  { title: '2.4L+', label: 'Active Learners' },
                  { title: '18K+', label: 'PYQs Covered' },
                  { title: '94%', label: 'Success Rate' },
                ].map((tag, idx) => (
                  <Grid item xs={4} key={idx}>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: '#F5A623', fontSize: '18px' }}>
                      {tag.title}
                    </Typography>
                    <Typography sx={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                      {tag.label}
                    </Typography>
                  </Grid>
                ))}
              </Grid> */}
            </Grid>

            {/* Right Col */}
            <Grid item xs={12} md={5} sx={{ display: 'flex', justifyContent: { xs: 'center', md: 'flex-end' } }}>
              <DashboardWidget />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Progress Strip */}
      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', py: 3 }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '50%', bgcolor: '#16223E', color: '#F5A623', border: '1px solid #F5A623' }}>
                👤
              </Box>
              <Typography sx={{ fontSize: '13px', fontWeight: 800, color: 'text.primary' }}>
                Your Progress <span style={{ color: 'rgba(0,0,0,0.3)', fontWeight: 500, fontSize: '11px', marginLeft: '6px' }}>Today, July 1, 2026</span>
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 2, md: 4 }, flexWrap: 'wrap' }}>
              {statsList.map((stat, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography sx={{ fontSize: '12px' }}>{stat.emoji}</Typography>
                  <Typography sx={{ fontSize: '12.5px', fontWeight: 700, color: 'text.primary' }}>
                    {stat.value}
                  </Typography>
                </Box>
              ))}

              <Button
                component={Link}
                href="/dashboard"
                variant="contained"
                sx={{
                  bgcolor: '#16223E',
                  color: '#FFFFFF',
                  px: 2,
                  py: 0.6,
                  borderRadius: '16px',
                  fontSize: '11px',
                  fontWeight: 800,
                  '&:hover': { bgcolor: '#0B132B' },
                  ...(themeMode === 'dark' && {
                    bgcolor: '#F5A623',
                    color: '#0A1128',
                    '&:hover': { bgcolor: '#E09B1F' },
                  })
                }}
              >
                View All
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Explore Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ mb: 6 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>
            Explore
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '14.5px' }}>
            Comprehensive preparation resources
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {exploreCards.map((card, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  background: themeMode === 'light'
                    ? `linear-gradient(180deg, ${card.color}15 0%, #FFFFFF 100%)`
                    : `linear-gradient(180deg, ${card.color}18 0%, #1C2541 100%)`,
                  border: '1.5px solid',
                  borderColor: themeMode === 'light' ? `${card.color}35` : `${card.color}60`,
                  borderRadius: 2,
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  transition: 'all 0.22s ease-in-out',
                  '&:hover': {
                    borderColor: card.color,
                    boxShadow: `0 8px 24px ${card.color}16`,
                    transform: 'translateY(-4px)',
                  }
                }}
              >
                {/* Badge Tag */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    fontSize: '9px',
                    fontWeight: 800,
                    px: 1.2,
                    py: 0.4,
                    borderRadius: '12px',
                    color: card.color,
                    bgcolor: `${card.color}15`,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                >
                  {card.badge}
                </Box>

                {/* Tag Icon */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 36,
                    height: 36,
                    borderRadius: 2.5,
                    bgcolor: `${card.color}12`,
                    border: '1px solid',
                    borderColor: `${card.color}33`,
                    fontSize: '18px',
                    mb: 2.5,
                    alignSelf: 'flex-start',
                  }}
                >
                  {card.emoji}
                </Box>

                {/* Title */}
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', mb: 1, fontSize: '15px' }}>
                  {card.title}
                </Typography>

                {/* Desc */}
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3.5, minHeight: '38px', lineHeight: 1.5 }}>
                  {card.desc}
                </Typography>

                {/* Stats */}
                <Box sx={{ mt: 'auto', mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography sx={{ fontSize: '11px', color: 'text.secondary', fontWeight: 600 }}>Questions</Typography>
                    <Typography sx={{ fontSize: '12px', color: 'text.primary', fontWeight: 800 }}>{card.count}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.8 }}>
                    <Typography sx={{ fontSize: '11px', color: 'text.secondary', fontWeight: 600 }}>Progress</Typography>
                    <Typography sx={{ fontSize: '11px', color: 'text.primary', fontWeight: 800 }}>{card.progress}%</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={card.progress}
                    sx={{
                      height: 5,
                      borderRadius: 2.5,
                      bgcolor: 'divider',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: card.color,
                        borderRadius: 2.5,
                      }
                    }}
                  />
                </Box>

                {/* CTA Link */}
                <Button
                  component={Link}
                  href={card.href}
                  variant="outlined"
                  fullWidth
                  sx={{
                    borderRadius: 2.5,
                    py: 1,
                    fontWeight: 800,
                    fontSize: '12.5px',
                    textTransform: 'none',
                    color: 'text.primary',
                    borderColor: themeMode === 'light' ? 'divider' : 'rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 0.5,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      bgcolor: `${card.color}08`,
                      borderColor: card.color,
                      color: card.color,
                    }
                  }}
                >
                  Explore Now →
                </Button>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* How it Works Section */}
      <Box sx={{ bgcolor: 'rgba(0,0,0,0.01)', borderTop: '1px solid', borderBottom: '1px solid', borderColor: 'divider', py: 8 }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>
              How it Works
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {workCards.map((card, i) => (
              <Grid item xs={12} md={4} key={i}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    height: '100%',
                    background: themeMode === 'light'
                      ? `linear-gradient(180deg, ${card.accentColor}12 0%, #FFFFFF 100%)`
                      : `linear-gradient(180deg, ${card.accentColor}15 0%, #1C2541 100%)`,
                    border: '1.5px solid',
                    borderColor: themeMode === 'light' ? `${card.accentColor}35` : `${card.accentColor}60`,
                    borderRadius: 2,
                    transition: 'all 0.22s ease-in-out',
                    '&:hover': {
                      borderColor: card.accentColor,
                      boxShadow: `0 8px 24px ${card.accentColor}16`,
                      transform: 'translateY(-4px)',
                    }
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      bgcolor: card.color,
                      mb: 2.5,
                    }}
                  >
                    {card.icon}
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5, color: 'text.primary', fontSize: '14.5px' }}>
                    {card.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6, fontSize: '13px' }}>
                    {card.desc}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    </Box>
  );
}
