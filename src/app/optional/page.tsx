'use client';

import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  OutlinedInput,
  Button,
  Paper,
  Card,
  CardContent,
  CircularProgress,
  Pagination,
  IconButton,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import FlagIcon from '@mui/icons-material/Flag';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import LockIcon from '@mui/icons-material/Lock';
import MathContent from '@/components/shared/MathContent';
import UpgradeDialog from '@/components/shared/UpgradeDialog';
import { useStore } from '@/store/useStore';
import { useOptional } from '@/hooks/useContent';
import { mdToHtml, splitBody, keyPoints, coverage } from '@/lib/md';

const ITEMS_PER_PAGE = 10;
const ALL_YEARS = Array.from({ length: 14 }, (_, i) => 2026 - i);
const FREE_YEARS = [2025, 2026];
const PAPERS = ['Paper 1', 'Paper 2'];

const BlueBookIcon = ({ color }: { color: string }) => (
  <svg width="20" height="24" viewBox="0 0 20 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 2H17C18.1046 2 19 2.89543 19 4V20C19 21.1046 18.1046 22 17 22H3C1.89543 22 1 21.1046 1 20V4C1 2.89543 1.89543 2 3 2Z" fill={color} />
    <path d="M4 22H17C18.1046 22 19 21.1046 19 20H4V22Z" fill="#E5E7EB" />
    <path d="M4 2H5V22H4V2Z" fill="rgba(0,0,0,0.15)" />
    <path d="M12 2V12L14 10.5L16 12V2H12Z" fill="#F5A623" />
  </svg>
);

const FolderStackIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="7" width="14" height="14" rx="2" fill="#34D399" />
    <rect x="5" y="4" width="14" height="14" rx="2" fill="#F87171" />
    <rect x="8" y="1" width="14" height="14" rx="2" fill="#60A5FA" />
  </svg>
);

const SUBJECTS = [
  {
    id: 'Geography',
    name: 'Geography',
    stats: '7 questions · 2 papers · 2013-2025',
    iconType: 'book',
    color: '#3B82F6',
  },
  {
    id: 'History',
    name: 'History',
    stats: '7 questions · 2 papers · 2013-2025',
    iconType: 'book',
    color: '#F5A623',
  },
  {
    id: 'Political Science',
    name: 'Political Science',
    stats: '7 questions · 2 papers · 2013-2025',
    iconType: 'book',
    color: '#8B5CF6',
  },
  {
    id: 'Public Administration',
    name: 'Public Administration',
    stats: '8 questions · 2 papers · 2013-2025',
    iconType: 'stack',
    color: '#10B981',
  },
  {
    id: 'Sociology',
    name: 'Sociology',
    stats: '7 questions · 2 papers · 2013-2025',
    iconType: 'book',
    color: '#EF4444',
  }
];

export default function OptionalExplorer() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { data: optional, isLoading, error } = useOptional();
  const { isBookmarked, toggleBookmark, isRevise, toggleRevise, entitled, themeMode, recordPractice } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPapers, setSelectedPapers] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [showFilter, setShowFilter] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [page, setPage] = useState(1);

  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  // local question draft states
  const [draftingQIds, setDraftingQIds] = useState<Record<string, boolean>>({});
  const [revealedQIds, setRevealedQIds] = useState<Record<string, boolean>>({});
  const [draftTexts, setDraftTexts] = useState<Record<string, string>>({});
  const [coverages, setCoverages] = useState<Record<string, any[]>>({});

  const getSubjectStatsText = (subjectId: string, fallbackText: string) => {
    if (!optional) return fallbackText;
    const matching = optional.filter((q: any) => q.optional_subject?.toLowerCase() === subjectId.toLowerCase());
    if (matching.length > 0) {
      const count = matching.length;
      const papers = new Set(matching.map((q: any) => q.paper)).size;
      const years = matching.map((q: any) => q.year);
      const minYear = Math.min(...years);
      const maxYear = Math.max(...years);
      return `${count} questions · ${papers} papers · ${minYear}–${maxYear}`;
    }
    return fallbackText;
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 15, flex: 1 }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (error || !optional) {
    return (
      <Box sx={{ py: 15, textAlign: 'center' }}>
        <Typography color="error" variant="h6">Could not load Optional database.</Typography>
      </Box>
    );
  }

  const handleYearChange = (event: any) => {
    const value = event.target.value as string[];
    const hasLockedYear = value.some(yr => !FREE_YEARS.includes(Number(yr)) && !entitled);
    if (hasLockedYear) {
      setUpgradeOpen(true);
      return;
    }
    setSelectedYears(value);
    setPage(1);
  };

  const handleShowFilterChange = (event: any) => {
    setShowFilter(event.target.value as string[]);
    setPage(1);
  };

  // Filters
  const filteredOptional = optional.filter((q: any) => {
    if (selectedSubject) {
      const qSubject = q.optional_subject || 'Public Administration';
      if (qSubject.toLowerCase() !== selectedSubject.toLowerCase()) return false;
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchText = (q.question_md || '' + q.body_md || '').toLowerCase();
      if (!matchText.includes(query)) return false;
    }

    if (selectedPapers.length > 0 && !selectedPapers.includes(q.paper)) {
      return false;
    }

    if (selectedYears.length > 0 && !selectedYears.includes(String(q.year))) {
      return false;
    }

    if (showFilter.length > 0) {
      const matchesAny = showFilter.some(filter => {
        if (filter === 'book') return isBookmarked('optional', q.id);
        if (filter === 'rev') return isRevise('optional', q.id);
        return false;
      });
      if (!matchesAny) return false;
    }

    return true;
  });

  const hasActiveFilters = searchQuery.trim() !== '' || selectedPapers.length > 0 || selectedYears.length > 0 || showFilter.length > 0;

  // Sort
  const sortedOptional = [...filteredOptional].sort((a: any, b: any) => {
    if (sortBy === 'newest') {
      return b.year - a.year || b.q_number - a.q_number;
    } else {
      return a.year - b.year || a.q_number - b.q_number;
    }
  });

  const pageCount = Math.ceil(sortedOptional.length / ITEMS_PER_PAGE);
  const paginatedOptional = sortedOptional.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  if (!selectedSubject) {
    return (
      <Box sx={{ bgcolor: 'background.default', py: 6, flex: 1 }}>
        <Container maxWidth="md">
          {/* Header */}
          <Box sx={{ mb: 5 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: themeMode === 'light' ? '#16223E' : '#FFFFFF' }}>
              Choose an optional subject
            </Typography>
            <Typography variant="body1" sx={{ color: themeMode === 'light' ? '#7E8A9B' : 'text.secondary' }}>
              Pick your optional to browse its Previous Year Questions and model answers.
            </Typography>
          </Box>

          {/* Grid of subjects */}
          <Grid container spacing={3}>
            {SUBJECTS.map((sub) => {
              const statsText = getSubjectStatsText(sub.id, sub.stats);
              return (
                <Grid item xs={12} sm={6} md={4} key={sub.id}>
                  <Card
                    elevation={0}
                    onClick={() => setSelectedSubject(sub.id)}
                    sx={{
                      p: 3,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      background: themeMode === 'light'
                        ? `linear-gradient(180deg, ${sub.color}24 0%, #FFFFFF 100%)`
                        : `linear-gradient(180deg, ${sub.color}28 0%, #1C2541 100%)`,
                      border: '1.5px solid',
                      borderColor: themeMode === 'light' ? `${sub.color}45` : `${sub.color}75`,
                      borderRadius: 2,
                      transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: `0px 12px 24px ${sub.color}22`,
                        borderColor: sub.color,
                        cursor: 'pointer'
                      }
                    }}
                  >
                    <Box>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 2,
                          bgcolor: `${sub.color}25`,
                          border: '1px solid',
                          borderColor: `${sub.color}50`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: 2.5
                        }}
                      >
                        {sub.iconType === 'stack' ? <FolderStackIcon /> : <BlueBookIcon color={sub.color} />}
                      </Box>

                      <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5, color: themeMode === 'light' ? '#16223E' : '#FFFFFF', fontSize: '18px' }}>
                        {sub.name}
                      </Typography>

                      <Typography variant="body2" sx={{ color: themeMode === 'light' ? '#7E8A9B' : 'text.secondary', mb: 3, fontSize: '13px' }}>
                        {statsText}
                      </Typography>
                    </Box>

                    <Button
                      variant="outlined"
                      fullWidth
                      sx={{
                        borderRadius: 2.5,
                        py: 1,
                        fontWeight: 800,
                        fontSize: '12.5px',
                        textTransform: 'none',
                        color: themeMode === 'light' ? '#16223E' : '#FFFFFF',
                        borderColor: themeMode === 'light' ? `${sub.color}35` : `${sub.color}55`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 0.5,
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          bgcolor: `${sub.color}22`,
                          borderColor: sub.color,
                          color: sub.color,
                        }
                      }}
                    >
                      Explore Now &rarr;
                    </Button>
                  </Card>
                </Grid>
              );
            })}

            <Grid item xs={12} sm={6} md={4}>
              <Card
                elevation={0}
                sx={{
                  p: 3,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  bgcolor: themeMode === 'light' ? '#F9F6EE' : '#151D35',
                  border: '2px dashed',
                  borderColor: themeMode === 'light' ? '#E2E8F0' : 'rgba(255,255,255,0.15)',
                  borderRadius: 2,
                }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: themeMode === 'light' ? '#FFFFFF' : '#2C3550',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2.5,
                    boxShadow: themeMode === 'light' ? '0px 2px 8px rgba(0,0,0,0.05)' : 'none'
                  }}
                >
                  <Typography sx={{ color: '#8B5CF6', fontSize: '28px', fontWeight: 500, lineHeight: 1 }}>+</Typography>
                </Box>

                <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5, color: themeMode === 'light' ? '#7E8A9B' : 'text.secondary', fontSize: '18px' }}>
                  More subjects coming soon
                </Typography>

                <Typography variant="body2" sx={{ color: themeMode === 'light' ? '#7E8A9B' : 'text.secondary', fontSize: '13px' }}>
                  PSIR, Sociology, Geography, Anthropology and more are on the way.
                </Typography>
              </Card>
            </Grid>
          </Grid>
        </Container>
        <UpgradeDialog open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: 'background.default', py: 4, flex: 1 }}>
      <Container maxWidth="md">
        {/* Breadcrumb / Back Navigation */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Button
            onClick={() => {
              setSelectedSubject(null);
              setSearchQuery('');
              setSelectedPapers([]);
              setSelectedYears([]);
              setShowFilter([]);
              setPage(1);
            }}
            sx={{
              color: '#F5A623',
              fontWeight: 800,
              fontSize: '13px',
              textTransform: 'none',
              p: 0,
              minWidth: 0,
              '&:hover': { bgcolor: 'transparent', opacity: 0.8 }
            }}
          >
            &larr; Back to subjects
          </Button>
          <Typography variant="body2" sx={{ color: 'text.secondary', mx: 1 }}>
            /
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            {selectedSubject}
          </Typography>
        </Box>

        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>
            {selectedSubject} Optional
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Browse {selectedSubject} optional exam PYQs and comprehensive answer structures.
          </Typography>
        </Box>

        {/* Filters */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            mb: 3,
            border: '1.5px solid',
            borderColor: 'divider',
            borderRadius: 2,
            bgcolor: 'background.paper',
          }}
        >
          <Grid container spacing={2} alignItems="center">
            {/* Search */}
            <Grid item xs={12} sm={3.2}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search Optional questions..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                InputProps={{
                  sx: { borderRadius: 2 },
                }}
              />
            </Grid>

            {/* Paper Selector */}
            <Grid item xs={6} sm={2.2}>
              <FormControl fullWidth size="small">
                <Select
                  multiple
                  displayEmpty
                  value={selectedPapers}
                  onChange={(e) => {
                    setSelectedPapers(e.target.value as string[]);
                    setPage(1);
                  }}
                  input={<OutlinedInput />}
                  renderValue={(selected: any) => {
                    if (!selected || selected.length === 0) {
                      return <span style={{ color: themeMode === 'light' ? '#16223E' : '#FFFFFF', fontWeight: 700 }}>Paper</span>;
                    }
                    return (
                      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                        <span style={{ color: themeMode === 'light' ? '#16223E' : '#FFFFFF', fontWeight: 700 }}>Paper</span>
                        <span style={{ color: '#F5A623', marginLeft: '4px', fontWeight: 700 }}>({selected.length})</span>
                      </Box>
                    );
                  }}
                  sx={{
                    bgcolor: selectedPapers.length > 0
                      ? (themeMode === 'light' ? '#FAF7F0' : '#1C2541')
                      : (themeMode === 'light' ? '#FFFFFF' : 'background.paper'),
                    borderRadius: 2,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: selectedPapers.length > 0
                        ? '#F5A623'
                        : (themeMode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'),
                      borderWidth: '1.5px',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: themeMode === 'light' ? '#000000' : '#FFFFFF',
                      borderWidth: '2px',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#F5A623',
                    },
                    '& .MuiSelect-select': {
                      py: '8.5px',
                      px: '14px',
                    }
                  }}
                  MenuProps={{
                    anchorOrigin: {
                      vertical: 'bottom',
                      horizontal: 'left',
                    },
                    transformOrigin: {
                      vertical: 'top',
                      horizontal: 'left',
                    },
                    PaperProps: {
                      sx: {
                        mt: 1.5,
                        maxHeight: 300,
                        '& .MuiList-root': { padding: 0 }
                      }
                    }
                  }}
                >
                  <Box
                    onKeyDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    sx={{
                      display: 'flex',
                      gap: 2,
                      px: 2.5,
                      py: 1,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'background.default'
                    }}
                  >
                    <Button
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPapers(PAPERS);
                      }}
                      sx={{ fontSize: '11px', fontWeight: 800, color: '#F5A623', p: 0, minWidth: 0 }}
                    >
                      ALL
                    </Button>
                    <Button
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPapers([]);
                      }}
                      sx={{ fontSize: '11px', fontWeight: 800, color: '#F5A623', p: 0, minWidth: 0 }}
                    >
                      CLEAR
                    </Button>
                  </Box>
                  {PAPERS.map((paper) => (
                    <MenuItem key={paper} value={paper} sx={{ pl: 2.5 }}>
                      <Checkbox checked={selectedPapers.indexOf(paper) > -1} sx={{ color: 'text.secondary', '&.Mui-checked': { color: '#F5A623' } }} />
                      <ListItemText primary={paper} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Year Selector */}
            <Grid item xs={6} sm={2.2}>
              <FormControl fullWidth size="small">
                <Select
                  multiple
                  displayEmpty
                  value={selectedYears}
                  onChange={handleYearChange}
                  input={<OutlinedInput />}
                  renderValue={(selected: any) => {
                    if (!selected || selected.length === 0) {
                      return <span style={{ color: themeMode === 'light' ? '#16223E' : '#FFFFFF', fontWeight: 700 }}>Year</span>;
                    }
                    return (
                      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                        <span style={{ color: themeMode === 'light' ? '#16223E' : '#FFFFFF', fontWeight: 700 }}>Year</span>
                        <span style={{ color: '#F5A623', marginLeft: '4px', fontWeight: 700 }}>({selected.length})</span>
                      </Box>
                    );
                  }}
                  sx={{
                    bgcolor: selectedYears.length > 0
                      ? (themeMode === 'light' ? '#FAF7F0' : '#1C2541')
                      : (themeMode === 'light' ? '#FFFFFF' : 'background.paper'),
                    borderRadius: 2,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: selectedYears.length > 0
                        ? '#F5A623'
                        : (themeMode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'),
                      borderWidth: '1.5px',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: themeMode === 'light' ? '#000000' : '#FFFFFF',
                      borderWidth: '2px',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#F5A623',
                    },
                    '& .MuiSelect-select': {
                      py: '8.5px',
                      px: '14px',
                    }
                  }}
                  MenuProps={{
                    anchorOrigin: {
                      vertical: 'bottom',
                      horizontal: 'left',
                    },
                    transformOrigin: {
                      vertical: 'top',
                      horizontal: 'left',
                    },
                    PaperProps: {
                      sx: {
                        mt: 1.5,
                        maxHeight: 300,
                        '& .MuiList-root': { padding: 0 }
                      }
                    }
                  }}
                >
                  <Box
                    onKeyDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    sx={{
                      display: 'flex',
                      gap: 2,
                      px: 2.5,
                      py: 1,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'background.default'
                    }}
                  >
                    <Button
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        const available = entitled ? ALL_YEARS.map(String) : FREE_YEARS.map(String);
                        setSelectedYears(available);
                      }}
                      sx={{ fontSize: '11px', fontWeight: 800, color: '#F5A623', p: 0, minWidth: 0 }}
                    >
                      ALL
                    </Button>
                    <Button
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedYears([]);
                      }}
                      sx={{ fontSize: '11px', fontWeight: 800, color: '#F5A623', p: 0, minWidth: 0 }}
                    >
                      CLEAR
                    </Button>
                  </Box>
                  {ALL_YEARS.map((yr) => {
                    const isLocked = !FREE_YEARS.includes(yr) && !entitled;
                    return (
                      <MenuItem key={yr} value={String(yr)} sx={{ pl: 2.5 }}>
                        <Checkbox checked={selectedYears.indexOf(String(yr)) > -1} sx={{ color: 'text.secondary', '&.Mui-checked': { color: '#F5A623' } }} />
                        <ListItemText primary={yr + (isLocked ? ' 🔒' : '')} />
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>

            {/* Show Selector */}
            <Grid item xs={6} sm={2.2}>
              <FormControl fullWidth size="small">
                <Select
                  multiple
                  displayEmpty
                  value={showFilter}
                  onChange={handleShowFilterChange}
                  input={<OutlinedInput />}
                  renderValue={(selected: any) => {
                    if (!selected || selected.length === 0) {
                      return <span style={{ color: themeMode === 'light' ? '#16223E' : '#FFFFFF', fontWeight: 700 }}>Show</span>;
                    }
                    return (
                      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                        <span style={{ color: themeMode === 'light' ? '#16223E' : '#FFFFFF', fontWeight: 700 }}>Show</span>
                        <span style={{ color: '#F5A623', marginLeft: '4px', fontWeight: 700 }}>({selected.length})</span>
                      </Box>
                    );
                  }}
                  sx={{
                    bgcolor: showFilter.length > 0
                      ? (themeMode === 'light' ? '#FAF7F0' : '#1C2541')
                      : (themeMode === 'light' ? '#FFFFFF' : 'background.paper'),
                    borderRadius: 2,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: showFilter.length > 0
                        ? '#F5A623'
                        : (themeMode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'),
                      borderWidth: '1.5px',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: themeMode === 'light' ? '#000000' : '#FFFFFF',
                      borderWidth: '2px',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#F5A623',
                    },
                    '& .MuiSelect-select': {
                      py: '8.5px',
                      px: '14px',
                    }
                  }}
                  MenuProps={{
                    anchorOrigin: {
                      vertical: 'bottom',
                      horizontal: 'left',
                    },
                    transformOrigin: {
                      vertical: 'top',
                      horizontal: 'left',
                    },
                    PaperProps: {
                      sx: {
                        mt: 1.5,
                        maxHeight: 300,
                        '& .MuiList-root': { padding: 0 }
                      }
                    }
                  }}
                >
                  <Box
                    onKeyDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    sx={{
                      display: 'flex',
                      gap: 2,
                      px: 2.5,
                      py: 1,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'background.default'
                    }}
                  >
                    <Button
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowFilter(['book', 'rev']);
                      }}
                      sx={{ fontSize: '11px', fontWeight: 800, color: '#F5A623', p: 0, minWidth: 0 }}
                    >
                      ALL
                    </Button>
                    <Button
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowFilter([]);
                      }}
                      sx={{ fontSize: '11px', fontWeight: 800, color: '#F5A623', p: 0, minWidth: 0 }}
                    >
                      CLEAR
                    </Button>
                  </Box>
                  <MenuItem value="book" sx={{ pl: 2.5 }}>
                    <Checkbox checked={showFilter.indexOf('book') > -1} sx={{ color: 'text.secondary', '&.Mui-checked': { color: '#F5A623' } }} />
                    <ListItemText primary="★ Bookmarks" />
                  </MenuItem>
                  <MenuItem value="rev" sx={{ pl: 2.5 }}>
                    <Checkbox checked={showFilter.indexOf('rev') > -1} sx={{ color: 'text.secondary', '&.Mui-checked': { color: '#F5A623' } }} />
                    <ListItemText primary="⚑ For Revision" />
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Sort */}
            <Grid item xs={6} sm={2.2}>
              <FormControl fullWidth size="small">
                <InputLabel>Sort</InputLabel>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
                  input={<OutlinedInput label="Sort" sx={{ borderRadius: 2 }} />}
                  sx={{
                    '& .MuiSelect-select': {
                      py: '8.5px',
                      px: '10px',
                      fontSize: '13px'
                    }
                  }}
                >
                  <MenuItem value="newest">Newest</MenuItem>
                  <MenuItem value="oldest">Oldest</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                Showing {filteredOptional.length.toLocaleString()} questions
              </Typography>
              {hasActiveFilters && (
                <Button
                  size="small"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedPapers([]);
                    setSelectedYears([]);
                    setShowFilter([]);
                    setPage(1);
                  }}
                  sx={{
                    fontSize: '11px',
                    fontWeight: 800,
                    textTransform: 'none',
                    py: 0.1,
                    px: 1.2,
                    borderRadius: 1.5,
                    color: '#EF4444',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    '&:hover': {
                      bgcolor: 'rgba(239, 68, 68, 0.05)',
                      borderColor: '#EF4444',
                    }
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </Box>
            {!entitled && (
              <Button
                size="small"
                onClick={() => setUpgradeOpen(true)}
                startIcon={<LockIcon sx={{ fontSize: 14 }} />}
                sx={{
                  color: '#8B5CF6',
                  fontSize: '11px',
                  fontWeight: 800,
                  bgcolor: 'rgba(139,92,246,0.06)',
                  px: 1.5,
                  py: 0.5,
                  borderRadius: '12px',
                  '&:hover': { bgcolor: 'rgba(139,92,246,0.15)' },
                }}
              >
                Unlock Optional Archive (2013-2024)
              </Button>
            )}
          </Box>
        </Paper>

        {/* Optional Cards */}
        {paginatedOptional.length > 0 ? (
          paginatedOptional.map((q: any) => {
            const { stem, ans } = splitBody(q);
            const questionHtml = mdToHtml(q.question_md || stem);
            const answerHtml = mdToHtml(ans);
            const isDrafting = !!draftingQIds[q.id];
            const isRevealed = !!revealedQIds[q.id];
            const currentDraft = draftTexts[q.id] || '';
            const wordCount = currentDraft.trim().split(/\s+/).filter(Boolean).length;

            return (
              <Card
                key={q.id}
                sx={{
                  mb: 2.5,
                  borderRadius: 2,
                  border: '1.5px solid',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'divider',
                  bgcolor: 'background.paper',
                  boxShadow: 'none',
                }}
              >
                <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mb: 2 }}>
                    {/* Badge */}
                    <Box
                      sx={{
                        bgcolor: '#16223E',
                        color: '#FFFFFF',
                        borderRadius: 2,
                        px: 1.5,
                        py: 0.6,
                        textAlign: 'center',
                        minWidth: '70px',
                      }}
                    >
                      <Typography sx={{ fontSize: '13px', fontWeight: 800, color: '#8B5CF6', lineHeight: 1.1 }}>
                        {q.year}
                      </Typography>
                      <Typography sx={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)', fontWeight: 700, mt: 0.2 }}>
                        {q.paper}
                      </Typography>
                    </Box>

                    {/* Content */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <MathContent content={questionHtml} />
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1.5 }}>
                        {q.word_limit && (
                          <Chip
                            label={`${q.word_limit} Words`}
                            size="small"
                            sx={{ fontSize: '10px', fontWeight: 800, height: 20 }}
                          />
                        )}
                        {(q.topics || []).map((t: string) => (
                          <Chip
                            key={t}
                            label={t}
                            size="small"
                            sx={{
                              fontSize: '10px',
                              fontWeight: 800,
                              bgcolor: 'rgba(139,92,246,0.06)',
                              color: '#8B5CF6',
                              border: '1px solid rgba(139,92,246,0.15)',
                              height: 20,
                            }}
                          />
                        ))}
                      </Box>
                    </Box>

                    {/* Bookmarks */}
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton size="small" onClick={() => toggleBookmark('optional', q.id)} sx={{ color: isBookmarked('optional', q.id) ? '#F5A623' : 'text.secondary' }}>
                        {isBookmarked('optional', q.id) ? <StarIcon sx={{ fontSize: 20 }} /> : <StarBorderIcon sx={{ fontSize: 20 }} />}
                      </IconButton>
                      <IconButton size="small" onClick={() => toggleRevise('optional', q.id)} sx={{ color: isRevise('optional', q.id) ? '#EF4444' : 'text.secondary' }}>
                        {isRevise('optional', q.id) ? <FlagIcon sx={{ fontSize: 20 }} /> : <FlagOutlinedIcon sx={{ fontSize: 20 }} />}
                      </IconButton>
                    </Box>
                  </Box>

                  {/* Try First / Reveal Model Answer / Writing interface */}
                  <Box sx={{ mt: 3, pt: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
                    {!isDrafting && !isRevealed && (
                      <Box>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, mb: 1.5 }}>
                          <Button
                            variant="contained"
                            onClick={() => {
                              setDraftingQIds((prev) => ({ ...prev, [q.id]: true }));
                            }}
                            sx={{
                              bgcolor: '#C8963E',
                              color: '#16223E',
                              fontWeight: 800,
                              px: 3,
                              py: 1,
                              borderRadius: 2,
                              textTransform: 'none',
                              fontSize: '13.5px',
                              '&:hover': { bgcolor: '#B0832F' }
                            }}
                          >
                            ✍️ Try first
                          </Button>

                          <Button
                            variant="outlined"
                            onClick={() => {
                              setRevealedQIds((prev) => ({ ...prev, [q.id]: true }));
                              recordPractice('optional', q.id);
                            }}
                            sx={{
                              borderColor: themeMode === 'light' ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.25)',
                              color: themeMode === 'light' ? '#5A6A85' : '#E2E8F0',
                              fontWeight: 800,
                              px: 3,
                              py: 1,
                              borderRadius: 2,
                              textTransform: 'none',
                              fontSize: '13.5px',
                              bgcolor: 'transparent',
                              '&:hover': {
                                borderColor: themeMode === 'light' ? 'text.primary' : '#FFFFFF',
                                bgcolor: 'transparent'
                              }
                            }}
                          >
                            Reveal model answer
                          </Button>

                          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '13.5px' }}>
                            Recall beats re-reading — jot your points, then check coverage.
                          </Typography>
                        </Box>

                        {/* Breadcrumbs label */}
                        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontWeight: 600 }}>
                          {q.paper} › {q.topics?.join(', ') || 'General'}
                        </Typography>
                      </Box>
                    )}

                    {isDrafting && !isRevealed && (
                      <Box>
                        {/* Reveal and Prompt row */}
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, mb: 2 }}>
                          <Button
                            variant="outlined"
                            onClick={() => {
                              setRevealedQIds((prev) => ({ ...prev, [q.id]: true }));
                              setDraftingQIds((prev) => ({ ...prev, [q.id]: false }));
                              recordPractice('optional', q.id);
                            }}
                            sx={{
                              borderColor: themeMode === 'light' ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.25)',
                              color: themeMode === 'light' ? '#5A6A85' : '#E2E8F0',
                              fontWeight: 800,
                              px: 3,
                              py: 1,
                              borderRadius: 2,
                              textTransform: 'none',
                              fontSize: '13.5px',
                              bgcolor: 'transparent',
                              '&:hover': {
                                borderColor: themeMode === 'light' ? 'text.primary' : '#FFFFFF',
                                bgcolor: 'transparent'
                              }
                            }}
                          >
                            Reveal model answer
                          </Button>
                          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '13.5px' }}>
                            Recall beats re-reading — jot your points, then check coverage.
                          </Typography>
                        </Box>

                        {/* Draft Input */}
                        <TextField
                          fullWidth
                          multiline
                          rows={4}
                          placeholder="Outline the points you'd make — structure beats prose here."
                          value={currentDraft}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDraftTexts((prev) => ({ ...prev, [q.id]: val }));
                          }}
                          sx={{
                            mb: 1.5,
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#C8963E',
                                borderWidth: '1.5px'
                              }
                            }
                          }}
                        />

                        {/* Live Word Counter */}
                        <Typography
                          variant="caption"
                          sx={{ display: 'block', textAlign: 'right', fontWeight: 700, color: 'text.secondary', mb: 2 }}
                        >
                          {wordCount} words / {q.word_limit || 250}
                        </Typography>

                        {/* Submit Button */}
                        <Button
                          variant="contained"
                          onClick={() => {
                            const points = keyPoints(q.body_md);
                            const checks = coverage(currentDraft, points);
                            setCoverages((prev) => ({ ...prev, [q.id]: checks }));
                            setRevealedQIds((prev) => ({ ...prev, [q.id]: true }));
                            setDraftingQIds((prev) => ({ ...prev, [q.id]: false }));
                            recordPractice('optional', q.id);
                          }}
                          sx={{
                            bgcolor: '#C8963E',
                            color: '#FFFFFF',
                            fontWeight: 800,
                            px: 3,
                            py: 1,
                            borderRadius: 2,
                            textTransform: 'none',
                            fontSize: '13.5px',
                            '&:hover': { bgcolor: '#B0832F' }
                          }}
                        >
                          Submit & check &rarr;
                        </Button>
                      </Box>
                    )}

                    {isRevealed && (
                      <Box>
                        {/* Draft and Coverage results if they tried */}
                        {currentDraft.trim() && (
                          <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '11px', textTransform: 'uppercase', mb: 1 }}>
                              Your Draft Outline
                            </Typography>
                            <Box sx={{ p: 2, bgcolor: themeMode === 'light' ? '#FAF7F0' : '#1C2541', borderRadius: 2, mb: 2 }}>
                              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                {currentDraft}
                              </Typography>
                            </Box>

                            {/* Coverage checklist */}
                            {coverages[q.id] && coverages[q.id].length > 0 && (
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '11px', textTransform: 'uppercase', mb: 1.5 }}>
                                  Key Points Coverage Check
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                  {coverages[q.id].map((r: any, i: number) => (
                                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.2, bgcolor: themeMode === 'light' ? '#FAF7F0' : 'rgba(255,255,255,0.02)', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                      <Typography sx={{ fontSize: '12.5px', fontWeight: 600, color: 'text.primary' }}>{r.point}</Typography>
                                      <Chip
                                        label={r.hit ? 'Covered' : 'Missed'}
                                        color={r.hit ? 'success' : 'default'}
                                        size="small"
                                        sx={{ fontSize: '9px', fontWeight: 800, height: 18 }}
                                      />
                                    </Box>
                                  ))}
                                </Box>
                              </Box>
                            )}
                          </Box>
                        )}

                        {/* Model answer content */}
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '11px', textTransform: 'uppercase', mb: 1.5 }}>
                          Model Answer Outline
                        </Typography>
                        <Box
                          sx={{
                            p: 2.5,
                            border: '1.5px solid',
                            borderColor: themeMode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.15)',
                            borderRadius: 2,
                            mb: 2,
                            bgcolor: themeMode === 'light' ? '#FAF7F0' : '#1C2541'
                          }}
                        >
                          {q.has_answer ? (
                            <MathContent content={answerHtml} />
                          ) : (
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                              Answer outline is not available for this question.
                            </Typography>
                          )}
                        </Box>

                        {/* Reset / Toggle button */}
                        <Button
                          variant="text"
                          onClick={() => {
                            setRevealedQIds((prev) => ({ ...prev, [q.id]: false }));
                            setDraftingQIds((prev) => ({ ...prev, [q.id]: false }));
                          }}
                          sx={{ textTransform: 'none', fontWeight: 800, color: '#C8963E', fontSize: '13px', p: 0 }}
                        >
                          Reset / hide guidelines
                        </Button>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Box sx={{ py: 10, textAlign: 'center' }}>
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>No questions match your filters.</Typography>
          </Box>
        )}

        {/* Pager */}
        {pageCount > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination
              count={pageCount}
              page={page}
              onChange={(_, value) => {
                setPage(value);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              color="primary"
              shape="rounded"
            />
          </Box>
        )}
      </Container>

      {/* Upgrade Dialog */}
      <UpgradeDialog open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </Box>
  );
}
