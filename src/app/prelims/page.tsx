'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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
  useTheme
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import FlagIcon from '@mui/icons-material/Flag';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import LockIcon from '@mui/icons-material/Lock';
import MathContent from '@/components/shared/MathContent';
import UpgradeDialog from '@/components/shared/UpgradeDialog';
import { useStore } from '@/store/useStore';
import { usePrelims } from '@/hooks/useContent';

const ITEMS_PER_PAGE = 10;

const ALL_YEARS = Array.from({ length: 14 }, (_, i) => 2026 - i); // 2026 down to 2013
const FREE_YEARS = [2025, 2026];

function PrelimsExplorerContent() {
  const searchParams = useSearchParams();
  const { data: questions, isLoading, error } = usePrelims();
  const {
    isBookmarked,
    toggleBookmark,
    isRevise,
    toggleRevise,
    attempts,
    recordAttempt,
    entitled,
    themeMode
  } = useStore();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [showFilter, setShowFilter] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [page, setPage] = useState(1);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);

  // Upgrade Dialog state
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  // Handle URL deep link query parameter
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) setSearchQuery(q);
  }, [searchParams]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 15, flex: 1 }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (error || !questions) {
    return (
      <Box sx={{ py: 15, textAlign: 'center' }}>
        <Typography color="error" variant="h6">Could not load Prelims database.</Typography>
      </Box>
    );
  }

  // Get distinct subjects from available questions
  const distinctSubjects = Array.from(new Set(questions.map((q: any) => q.subject).filter(Boolean))) as string[];

  const handleYearChange = (event: any) => {
    const value = event.target.value as string[];
    // Check if any selected year is locked
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

  // Filtering Logic
  const filteredQuestions = questions.filter((q: any) => {
    // 1. Text search on stem_html
    if (searchQuery.trim()) {
      const qLower = searchQuery.toLowerCase();
      const stemPlain = (q.stem_html || '').replace(/<[^>]+>/g, '').toLowerCase();
      if (!stemPlain.includes(qLower)) return false;
    }

    // 2. Subject filter
    if (selectedSubjects.length > 0 && !selectedSubjects.includes(q.subject)) {
      return false;
    }

    // 3. Year filter
    if (selectedYears.length > 0 && !selectedYears.includes(String(q.year))) {
      return false;
    }

    // 4. Progress Filter (bookmarked, revise list, got wrong, unattempted)
    if (showFilter.length > 0) {
      const matchesAny = showFilter.some(filter => {
        if (filter === 'book') return isBookmarked('prelims', q.id);
        if (filter === 'rev') return isRevise('prelims', q.id);
        if (filter === 'wrong') return attempts[q.id] && !attempts[q.id].correct;
        if (filter === 'unatt') return !attempts[q.id];
        return false;
      });
      if (!matchesAny) return false;
    }

    return true;
  });

  const hasActiveFilters = searchQuery.trim() !== '' || selectedSubjects.length > 0 || selectedYears.length > 0 || showFilter.length > 0;

  // Sorting Logic
  const sortedQuestions = [...filteredQuestions].sort((a: any, b: any) => {
    if (sortBy === 'newest') {
      return b.year - a.year || b.q_number - a.q_number;
    } else {
      return a.year - b.year || a.q_number - b.q_number;
    }
  });

  // Pagination
  const pageCount = Math.ceil(sortedQuestions.length / ITEMS_PER_PAGE);
  const paginatedQuestions = sortedQuestions.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  return (
    <Box sx={{ bgcolor: 'background.default', py: 4, flex: 1 }}>
      <Container maxWidth="md">
        {/* Header Title */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>
            Prelims Explorer
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Attempt Previous Year Questions (PYQs) and inspect their detailed explanations.
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
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search questions..."
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

            {/* Subject Dropdown */}
            <Grid item xs={6} sm={2.2}>
              <FormControl fullWidth size="small">
                <Select
                  multiple
                  displayEmpty
                  value={selectedSubjects}
                  onChange={(e) => {
                    setSelectedSubjects(e.target.value as string[]);
                    setPage(1);
                  }}
                  input={<OutlinedInput />}
                  renderValue={(selected: any) => {
                    if (!selected || selected.length === 0) {
                      return <span style={{ color: themeMode === 'light' ? '#16223E' : '#FFFFFF', fontWeight: 700 }}>Subject</span>;
                    }
                    return (
                      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                        <span style={{ color: themeMode === 'light' ? '#16223E' : '#FFFFFF', fontWeight: 700 }}>Subject</span>
                        <span style={{ color: '#F5A623', marginLeft: '4px', fontWeight: 700 }}>({selected.length})</span>
                      </Box>
                    );
                  }}
                  sx={{
                    bgcolor: selectedSubjects.length > 0 
                      ? (themeMode === 'light' ? '#FAF7F0' : '#1C2541') 
                      : (themeMode === 'light' ? '#FFFFFF' : 'background.paper'),
                    borderRadius: 2,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: selectedSubjects.length > 0
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
                        setSelectedSubjects(distinctSubjects);
                      }}
                      sx={{ fontSize: '11px', fontWeight: 800, color: '#F5A623', p: 0, minWidth: 0 }}
                    >
                      ALL
                    </Button>
                    <Button
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSubjects([]);
                      }}
                      sx={{ fontSize: '11px', fontWeight: 800, color: '#F5A623', p: 0, minWidth: 0 }}
                    >
                      CLEAR
                    </Button>
                  </Box>
                  {distinctSubjects.map((subject) => (
                    <MenuItem key={subject} value={subject} sx={{ pl: 2.5 }}>
                      <Checkbox checked={selectedSubjects.indexOf(subject) > -1} sx={{ color: 'text.secondary', '&.Mui-checked': { color: '#F5A623' } }} />
                      <ListItemText primary={subject} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Year Dropdown */}
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

            {/* Filter tags (bookmarks, etc) */}
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
                        setShowFilter(['book', 'rev', 'wrong', 'unatt']);
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
                  <MenuItem value="wrong" sx={{ pl: 2.5 }}>
                    <Checkbox checked={showFilter.indexOf('wrong') > -1} sx={{ color: 'text.secondary', '&.Mui-checked': { color: '#F5A623' } }} />
                    <ListItemText primary="✗ Got Wrong" />
                  </MenuItem>
                  <MenuItem value="unatt" sx={{ pl: 2.5 }}>
                    <Checkbox checked={showFilter.indexOf('unatt') > -1} sx={{ color: 'text.secondary', '&.Mui-checked': { color: '#F5A623' } }} />
                    <ListItemText primary="Unattempted" />
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Sort */}
            <Grid item xs={6} sm={2.4}>
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
                Showing {filteredQuestions.length.toLocaleString()} of {questions.length.toLocaleString()} questions
              </Typography>
              {hasActiveFilters && (
                <Button
                  size="small"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedSubjects([]);
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
                  color: '#F5A623',
                  fontSize: '11px',
                  fontWeight: 800,
                  bgcolor: 'rgba(245,166,35,0.06)',
                  px: 1.5,
                  py: 0.5,
                  borderRadius: '12px',
                  '&:hover': { bgcolor: 'rgba(245,166,35,0.15)' },
                }}
              >
                Unlock Archive (2013-2024)
              </Button>
            )}
          </Box>
        </Paper>

        {/* Question Cards */}
        {paginatedQuestions.length > 0 ? (
          paginatedQuestions.map((q: any) => {
            const attempt = attempts[q.id];
            const isDone = !!attempt;
            const chosenOption = attempt?.chosen;

            return (
              <QuestionCard
                key={q.id}
                q={q}
                isDone={isDone}
                chosenOption={chosenOption}
                attempt={attempt}
                onSelectOption={(letter: string) => {
                  if (isDone) return;
                  // If not attempted, record it
                  const correct = letter === q.correct_answer;
                  recordAttempt(q.id, letter, correct);
                }}
                isBookmarked={isBookmarked('prelims', q.id)}
                isRevise={isRevise('prelims', q.id)}
                onToggleBookmark={() => toggleBookmark('prelims', q.id)}
                onToggleRevise={() => toggleRevise('prelims', q.id)}
                relatedQuestions={questions
                  .filter((item: any) => item.subject === q.subject && item.id !== q.id)
                  .slice(0, 4)}
              />
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

// Inner QuestionCard Component for modularity
function QuestionCard({
  q,
  isDone,
  chosenOption,
  attempt,
  onSelectOption,
  isBookmarked,
  isRevise,
  onToggleBookmark,
  onToggleRevise,
  relatedQuestions
}: any) {
  const [selectedLetter, setSelectedLetter] = useState<string | null>(chosenOption || null);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const handleOptionClick = (letter: string) => {
    if (isDone) return;
    setSelectedLetter(letter);
  };

  const handleCheckClick = () => {
    if (!selectedLetter || isDone) return;
    onSelectOption(selectedLetter);
  };

  return (
    <Card
      sx={{
        mb: 2.5,
        borderRadius: 2,
        border: '1.5px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        boxShadow: 'none',
        overflow: 'visible',
      }}
    >
      <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
        {/* Top Header line */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mb: 2 }}>
          {/* Badge */}
          <Box
            sx={{
              bgcolor: '#16223E',
              color: '#FFFFFF',
              borderRadius: 1.5,
              px: 1.5,
              py: 0.6,
              textAlign: 'center',
              minWidth: '55px',
            }}
          >
            <Typography sx={{ fontSize: '13px', fontWeight: 800, color: '#F5A623', lineHeight: 1.1 }}>
              {q.year}
            </Typography>
            <Typography sx={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)', fontWeight: 700, mt: 0.2 }}>
              Q{q.q_number}
            </Typography>
          </Box>

          {/* Stem & Tags */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <MathContent content={q.stem_html} />
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
              {q.subject && (
                <Chip
                  label={q.subject}
                  size="small"
                  sx={{
                    fontSize: '10px',
                    fontWeight: 800,
                    bgcolor: 'rgba(245,166,35,0.06)',
                    color: '#F5A623',
                    border: '1px solid rgba(245,166,35,0.15)',
                    textTransform: 'uppercase',
                  }}
                />
              )}
              {isDone && (
                <Chip
                  label={attempt?.correct ? '✓ Solved' : '✗ Missed'}
                  size="small"
                  color={attempt?.correct ? 'success' : 'error'}
                  variant="outlined"
                  sx={{ fontSize: '10px', fontWeight: 800, height: 20 }}
                />
              )}
            </Box>
          </Box>

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton size="small" onClick={onToggleBookmark} sx={{ color: isBookmarked ? '#F5A623' : 'text.secondary' }}>
              {isBookmarked ? <StarIcon sx={{ fontSize: 20 }} /> : <StarBorderIcon sx={{ fontSize: 20 }} />}
            </IconButton>
            <IconButton size="small" onClick={onToggleRevise} sx={{ color: isRevise ? '#EF4444' : 'text.secondary' }}>
              {isRevise ? <FlagIcon sx={{ fontSize: 20 }} /> : <FlagOutlinedIcon sx={{ fontSize: 20 }} />}
            </IconButton>
          </Box>
        </Box>

        {/* Options */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2, pl: 0.5 }}>
          {(q.options || []).map((opt: any) => {
            const letter = opt.letter.toLowerCase();
            const correctLetter = (q.correct_answer || '').toLowerCase();

            let isSelected = selectedLetter === letter;
            let optColor = isDark ? 'rgba(255, 255, 255, 0.25)' : 'divider';
            let optBg = 'transparent';

            if (isDone) {
              if (letter === correctLetter) {
                optColor = '#10B981'; // Green correct outline
                optBg = isDark ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.06)';
              } else if (isSelected) {
                optColor = '#EF4444'; // Red wrong outline
                optBg = isDark ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.06)';
              }
            } else if (isSelected) {
              optColor = isDark ? '#F5A623' : '#16223E';
              optBg = isDark ? 'rgba(245,166,35,0.1)' : 'rgba(22,34,62,0.04)';
            }

            return (
              <Box
                key={letter}
                onClick={() => handleOptionClick(letter)}
                sx={{
                  display: 'flex',
                  gap: 1.5,
                  p: 1.5,
                  border: '1.5px solid',
                  borderColor: optColor,
                  borderRadius: 2.5,
                  bgcolor: optBg,
                  cursor: isDone ? 'default' : 'pointer',
                  transition: 'all 0.2s',
                  fontSize: '13.5px',
                  '&:hover': {
                    borderColor: isDone ? optColor : '#F5A623',
                  }
                }}
              >
                <Typography sx={{ fontWeight: 800, color: 'text.primary', flexShrink: 0 }}>
                  ({opt.letter})
                </Typography>
                <MathContent content={opt.html} />
              </Box>
            );
          })}
        </Box>

        {/* Action Button */}
        {!isDone && (
          <Button
            variant="contained"
            disabled={!selectedLetter}
            onClick={handleCheckClick}
            sx={{
              bgcolor: '#16223E',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '12px',
              px: 3,
              py: 0.8,
              borderRadius: 2,
              '&:hover': { bgcolor: '#0B132B' },
              '&:disabled': { opacity: 0.5, color: '#9CA3AF' }
            }}
          >
            Check Answer
          </Button>
        )}

        {/* Verdict and Autopsy */}
        {isDone && (
          <Box sx={{ mt: 3, borderTop: '1px dashed', borderColor: 'divider', pt: 3 }}>
            <Box sx={{ mb: 2 }}>
              {attempt?.correct ? (
                <Typography sx={{ color: '#10B981', fontWeight: 800, fontSize: '14px' }}>
                  ✓ Correct Answer
                </Typography>
              ) : (
                <Typography sx={{ color: '#EF4444', fontWeight: 800, fontSize: '14px' }}>
                  ✗ Incorrect — The correct answer is ({q.correct_answer.toUpperCase()})
                </Typography>
              )}
            </Box>

            <Box sx={{ bgcolor: 'rgba(0,0,0,0.01)', borderLeft: '3px solid #F5A623', px: 2.5, py: 1.5, borderRadius: '0 8px 8px 0', mb: 3 }}>
              <MathContent content={q.analysis_html} />
            </Box>

            {/* Related Questions */}
            {relatedQuestions.length > 0 && (
              <Box sx={{ borderTop: '1px solid', borderColor: 'rgba(0,0,0,0.05)', pt: 2 }}>
                <Typography variant="caption" sx={{ display: 'block', fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 1 }}>
                  More from {q.subject}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {relatedQuestions.map((rel: any) => (
                    <Typography
                      key={rel.id}
                      variant="body2"
                      sx={{
                        color: 'text.secondary',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        '&:hover': { color: '#F5A623' }
                      }}
                      onClick={() => {
                        // Scroll to top and search for this question's id
                        // In a real app we redirect to /prelims?q=... or dynamic path
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        // Set search query directly to find this item
                        const stem = rel.stem_html.replace(/<[^>]+>/g, '').slice(0, 30);
                        // Setting state directly to trigger visual focus
                        window.location.href = `/prelims?q=${encodeURIComponent(stem)}`;
                      }}
                    >
                      • {rel.stem_html.replace(/<[^>]+>/g, '').slice(0, 90)}...
                    </Typography>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default function PrelimsExplorer() {
  return (
    <Suspense fallback={
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 15, flex: 1 }}>
        <CircularProgress color="primary" />
      </Box>
    }>
      <PrelimsExplorerContent />
    </Suspense>
  );
}
