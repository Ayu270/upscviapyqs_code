'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Box, Container, Typography, Grid, Paper, Button, Radio, RadioGroup, FormControlLabel, FormControl, FormLabel, TextField, LinearProgress, CircularProgress, Chip, useTheme, Select, MenuItem, OutlinedInput, Card } from '@mui/material';
import TimerIcon from '@mui/icons-material/Timer';
import ScoreboardIcon from '@mui/icons-material/Scoreboard';
import ModeEditIcon from '@mui/icons-material/ModeEdit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MathContent from '@/components/shared/MathContent';
import { usePrelims, useMains } from '@/hooks/useContent';
import { mdToHtml, splitBody, keyPoints, coverage } from '@/lib/md';
import { useStore } from '@/store/useStore';

type Mode = 'menu' | 'prelims_setup' | 'mains_setup' | 'prelims_quiz' | 'mains_quiz' | 'score_summary' | 'mains_score_summary';

export default function Practice() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { data: prelimsData, isLoading: loadingP } = usePrelims();
  const { data: mainsData, isLoading: loadingM } = useMains();
  const { recordAttempt, recordPractice, themeMode, toggleBookmark, bookmarks } = useStore();

  const [mode, setMode] = useState<Mode>('menu');

  // Quiz states
  const [selectedPaper, setSelectedPaper] = useState('GS1');
  const [qCount, setQCount] = useState(10);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);

  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('All subjects');
  const [selectedYearFilter, setSelectedYearFilter] = useState('All years');
  const [timerLimit, setTimerLimit] = useState<'off' | '60' | '90'>('off');
  const [expandedCardIdx, setExpandedCardIdx] = useState<number | null>(null);

  const distinctSubjects = Array.from(new Set((prelimsData || []).map((q: any) => q.subject).filter(Boolean))) as string[];
  const distinctYears = Array.from(new Set((prelimsData || []).map((q: any) => String(q.year)).filter(Boolean))).sort((a, b) => Number(b) - Number(a)) as string[];

  const filteredAvailable = (prelimsData || []).filter((q: any) => {
    if (selectedSubjectFilter !== 'All subjects' && q.subject !== selectedSubjectFilter) return false;
    if (selectedYearFilter !== 'All years' && String(q.year) !== selectedYearFilter) return false;
    return true;
  });
  const availableCount = filteredAvailable.length;

  // Timer states
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Mains drill filter parameters
  const [selectedMainsPaperFilter, setSelectedMainsPaperFilter] = useState('All papers');
  const [selectedMainsTopicFilter, setSelectedMainsTopicFilter] = useState('All topics');
  const [selectedMainsWordFilter, setSelectedMainsWordFilter] = useState('Any words');
  const [mainsQCount, setMainsQCount] = useState(3);
  const [mainsTimerType, setMainsTimerType] = useState<'off' | 'pace'>('off');

  // Mains active session states
  const [mainsQuestions, setMainsQuestions] = useState<any[]>([]);
  const [currentMainsIdx, setCurrentMainsIdx] = useState(0);
  const [userDraft, setUserDraft] = useState('');
  const [mainsDrafts, setMainsDrafts] = useState<Record<number, string>>({});
  const [mainsSkipped, setMainsSkipped] = useState<Record<number, boolean>>({});
  const [mainsCoverages, setMainsCoverages] = useState<Record<number, any[]>>({});
  const [mainsExpandedCardIdx, setMainsExpandedCardIdx] = useState<number | null>(null);

  // Mains dynamic helpers
  const distinctMainsTopics = Array.from(new Set((mainsData || []).map((q: any) => q.topic).filter(Boolean))) as string[];
  const distinctMainsWords = Array.from(new Set((mainsData || []).map((q: any) => q.word_limit).filter(Boolean))).map(String) as string[];

  const filteredMainsAvailable = (mainsData || []).filter((q: any) => {
    if (selectedMainsPaperFilter !== 'All papers') {
      const matchPaper = q.paper?.toUpperCase() === selectedMainsPaperFilter.replace(/\s+/g, '').toUpperCase();
      if (!matchPaper) return false;
    }
    if (selectedMainsTopicFilter !== 'All topics' && q.topic !== selectedMainsTopicFilter) return false;
    if (selectedMainsWordFilter !== 'Any words' && String(q.word_limit) !== selectedMainsWordFilter) return false;
    return true;
  });
  const mainsAvailableCount = filteredMainsAvailable.length;

  useEffect(() => {
    return () => stopTimer();
  }, []);

  const startTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (timerLimit !== 'off') {
      const totalLimit = qCount * Number(timerLimit);
      setSeconds(totalLimit);
      timerRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s <= 1) {
            clearInterval(timerRef.current!);
            timerRef.current = null;
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      setSeconds(0);
      timerRef.current = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    }
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Scaffolding customized Prelims Quiz
  const handleStartPrelims = () => {
    if (!prelimsData) return;
    let pool = [...prelimsData];
    if (selectedSubjectFilter !== 'All subjects') {
      pool = pool.filter((q: any) => q.subject === selectedSubjectFilter);
    }
    if (selectedYearFilter !== 'All years') {
      pool = pool.filter((q: any) => String(q.year) === selectedYearFilter);
    }
    // Shuffle and pick
    const shuffled = pool.sort(() => 0.5 - Math.random());
    setQuizQuestions(shuffled.slice(0, Math.min(qCount, shuffled.length)));
    setCurrentIdx(0);
    setQuizScore(0);
    setWrongCount(0);
    setSelectedOption(null);
    setIsAnswerChecked(false);
    setMode('prelims_quiz');
    startTimer();
  };

  const handleNextQuestion = () => {
    if (currentIdx + 1 < quizQuestions.length) {
      setCurrentIdx(currentIdx + 1);
      setSelectedOption(null);
      setIsAnswerChecked(false);
    } else {
      stopTimer();
      setMode('score_summary');
    }
  };

  const handleSkip = () => {
    const currentQ = quizQuestions[currentIdx];
    currentQ.userAnswer = null;
    currentQ.attemptStatus = 'skipped';

    if (currentIdx + 1 < quizQuestions.length) {
      setCurrentIdx(currentIdx + 1);
      setSelectedOption(null);
      setIsAnswerChecked(false);
    } else {
      stopTimer();
      setMode('score_summary');
    }
  };

  const handleEndScore = () => {
    // Mark remaining questions as skipped
    for (let i = currentIdx; i < quizQuestions.length; i++) {
      if (!quizQuestions[i].attemptStatus) {
        quizQuestions[i].userAnswer = null;
        quizQuestions[i].attemptStatus = 'skipped';
      }
    }
    stopTimer();
    setMode('score_summary');
  };

  const handleBookmarkWrong = () => {
    let count = 0;
    quizQuestions.forEach((q) => {
      if (q.attemptStatus === 'incorrect') {
        const isBooked = bookmarks['prelims'] && bookmarks['prelims'][q.id];
        if (!isBooked) {
          toggleBookmark('prelims', q.id);
          count++;
        }
      }
    });
    alert(`Bookmarked ${count} incorrect questions!`);
  };

  const handleSubmitNext = () => {
    if (!selectedOption) return;
    const currentQ = quizQuestions[currentIdx];
    const isCorrect = selectedOption === currentQ.correct_answer;

    // Save to store
    recordAttempt(currentQ.id, selectedOption, isCorrect);

    if (isCorrect) {
      setQuizScore(score => score + 1);
    } else {
      setWrongCount(w => w + 1);
    }

    // Record option and status for final summary review
    currentQ.userAnswer = selectedOption;
    currentQ.attemptStatus = isCorrect ? 'correct' : 'incorrect';

    if (currentIdx + 1 < quizQuestions.length) {
      setCurrentIdx(currentIdx + 1);
      setSelectedOption(null);
      setIsAnswerChecked(false);
    } else {
      stopTimer();
      setMode('score_summary');
    }
  };

  useEffect(() => {
    if (mode !== 'prelims_quiz' || quizQuestions.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      // Option selection
      if (['a', 'b', 'c', 'd'].includes(key)) {
        setSelectedOption(key);
      }
      if (['1', '2', '3', '4'].includes(key)) {
        const index = Number(key) - 1;
        const letters = ['a', 'b', 'c', 'd'];
        setSelectedOption(letters[index]);
      }
      // Skip
      if (key === 's') {
        handleSkip();
      }
      // Submit
      if (key === 'enter' && selectedOption) {
        handleSubmitNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, quizQuestions, currentIdx, selectedOption]);

  // Mains Mock Setup
  const handleStartMains = () => {
    if (!mainsData) return;
    let pool = [...mainsData];
    if (selectedMainsPaperFilter !== 'All papers') {
      pool = pool.filter((q: any) => q.paper?.toUpperCase() === selectedMainsPaperFilter.replace(/\s+/g, '').toUpperCase());
    }
    if (selectedMainsTopicFilter !== 'All topics') {
      pool = pool.filter((q: any) => q.topic === selectedMainsTopicFilter);
    }
    if (selectedMainsWordFilter !== 'Any words') {
      pool = pool.filter((q: any) => String(q.word_limit) === selectedMainsWordFilter);
    }

    if (pool.length === 0) {
      alert("No questions match your filter criteria.");
      return;
    }

    // Shuffle and pick
    const shuffled = pool.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(mainsQCount, pool.length));
    setMainsQuestions(selected);
    setCurrentMainsIdx(0);
    setUserDraft('');
    setMainsDrafts({});
    setMainsSkipped({});
    setMainsCoverages({});
    setMainsExpandedCardIdx(null);
    setMode('mains_quiz');

    // Start timer pace countdown or count-up
    if (mainsTimerType === 'pace') {
      const totalPaceLimit = selected.reduce((acc, q) => {
        const limit = q.word_limit === 150 ? 420 : (q.word_limit === 250 ? 660 : 600);
        return acc + limit;
      }, 0);
      setSeconds(totalPaceLimit);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s <= 1) {
            clearInterval(timerRef.current!);
            timerRef.current = null;
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      setSeconds(0);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    }
  };

  const handleSubmitMainsNext = () => {
    if (mainsQuestions.length === 0) return;
    const currentQ = mainsQuestions[currentMainsIdx];

    // Evaluate coverage results
    const points = keyPoints(currentQ.body_md);
    const checks = coverage(userDraft, points);

    // Save active state
    setMainsDrafts(prev => ({ ...prev, [currentMainsIdx]: userDraft }));
    setMainsCoverages(prev => ({ ...prev, [currentMainsIdx]: checks }));
    setMainsSkipped(prev => ({ ...prev, [currentMainsIdx]: false }));

    recordPractice('mains', currentQ.id);

    // Reset editor
    setUserDraft('');

    // Advance or end
    if (currentMainsIdx + 1 < mainsQuestions.length) {
      setCurrentMainsIdx(currentMainsIdx + 1);
    } else {
      stopTimer();
      setMode('mains_score_summary');
    }
  };

  const handleMainsSkip = () => {
    if (mainsQuestions.length === 0) return;
    setMainsDrafts(prev => ({ ...prev, [currentMainsIdx]: '' }));
    setMainsCoverages(prev => ({ ...prev, [currentMainsIdx]: [] }));
    setMainsSkipped(prev => ({ ...prev, [currentMainsIdx]: true }));

    setUserDraft('');

    if (currentMainsIdx + 1 < mainsQuestions.length) {
      setCurrentMainsIdx(currentMainsIdx + 1);
    } else {
      stopTimer();
      setMode('mains_score_summary');
    }
  };

  const handleMainsEndScore = () => {
    // Fill remainder questions as skipped
    setMainsDrafts(prev => {
      const updated = { ...prev };
      const updatedSkipped = { ...mainsSkipped };
      const updatedCoverages = { ...mainsCoverages };
      for (let i = currentMainsIdx; i < mainsQuestions.length; i++) {
        if (updated[i] === undefined) {
          updated[i] = '';
          updatedSkipped[i] = true;
          updatedCoverages[i] = [];
        }
      }
      setMainsSkipped(updatedSkipped);
      setMainsCoverages(updatedCoverages);
      return updated;
    });

    stopTimer();
    setMode('mains_score_summary');
  };

  if (loadingP || loadingM) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 15, flex: 1 }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: 'background.default', py: 6, flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Container maxWidth="md">

        {/* Menu Options Screen */}
        {mode === 'menu' && (
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>
              Practice Zone
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>
              Set up timed attempts, mock drills, and test your answer-writing accuracy.
            </Typography>

            <Grid container spacing={3}>
              {/* Prelims setup card */}
              <Grid item xs={12} sm={6}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    border: '1.5px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    bgcolor: 'background.paper',
                    cursor: 'pointer',
                    '&:hover': { borderColor: '#F5A623' },
                  }}
                  onClick={() => setMode('prelims_setup')}
                >
                  <Typography variant="h3" sx={{ mb: 1 }}>📝</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>Prelims Quiz Test</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                    Attempt a timed MCQ challenge with auto-scoring and answer breakdowns.
                  </Typography>
                  <Button variant="outlined" sx={{ borderRadius: 2 }}>Configure Test</Button>
                </Paper>
              </Grid>

              {/* Mains setup card */}
              <Grid item xs={12} sm={6}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    border: '1.5px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    bgcolor: 'background.paper',
                    cursor: 'pointer',
                    '&:hover': { borderColor: '#10B981' },
                  }}
                  onClick={() => setMode('mains_setup')}
                >
                  <Typography variant="h3" sx={{ mb: 1 }}>🖋️</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>Mains Writing Drill</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                    Draft answers against word limits, track writing time, and self-check keywords.
                  </Typography>
                  <Button variant="outlined" sx={{ borderRadius: 2 }}>Configure Drill</Button>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Prelims Setup Parameters */}
        {mode === 'prelims_setup' && (
          <Paper
            elevation={0}
            sx={{
              p: 4,
              border: '1.5px solid',
              borderColor: 'divider',
              borderRadius: 2,
              bgcolor: 'background.paper'
            }}
          >
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" sx={{ fontWeight: 900, mb: 0.5, color: themeMode === 'light' ? '#16223E' : '#FFFFFF' }}>
                Prelims practice set
              </Typography>
              <Typography variant="body2" sx={{ color: themeMode === 'light' ? '#7E8A9B' : 'text.secondary' }}>
                Attempt-first, one at a time. Scored, and saved to your dashboard.
              </Typography>
            </Box>

            {/* Subject Select */}
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  fontWeight: 800,
                  fontSize: '11px',
                  color: themeMode === 'light' ? '#7E8A9B' : 'text.secondary',
                  letterSpacing: '0.8px',
                  mb: 1,
                  textTransform: 'uppercase'
                }}
              >
                Subject
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={selectedSubjectFilter}
                  onChange={(e) => setSelectedSubjectFilter(e.target.value)}
                  input={<OutlinedInput />}
                  sx={{
                    bgcolor: themeMode === 'light' ? '#FAF7F0' : '#1C2541',
                    borderRadius: 2,
                    fontWeight: 700,
                    color: themeMode === 'light' ? '#16223E' : '#FFFFFF',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(0,0,0,0.08)',
                      borderWidth: '1.5px'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#FAF7F0',
                      borderWidth: '2px'
                    }
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        mt: 1,
                        maxHeight: 300
                      }
                    }
                  }}
                >
                  <MenuItem value="All subjects" sx={{ pl: 2.5, fontWeight: 700 }}>All subjects</MenuItem>
                  {distinctSubjects.map((sub) => (
                    <MenuItem key={sub} value={sub} sx={{ pl: 2.5 }}>
                      {sub}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Year Select */}
            <Box sx={{ mb: 3.5 }}>
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  fontWeight: 800,
                  fontSize: '11px',
                  color: themeMode === 'light' ? '#7E8A9B' : 'text.secondary',
                  letterSpacing: '0.8px',
                  mb: 1,
                  textTransform: 'uppercase'
                }}
              >
                Year
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={selectedYearFilter}
                  onChange={(e) => setSelectedYearFilter(e.target.value)}
                  input={<OutlinedInput />}
                  sx={{
                    bgcolor: themeMode === 'light' ? '#FAF7F0' : '#1C2541',
                    borderRadius: 2,
                    fontWeight: 700,
                    color: themeMode === 'light' ? '#16223E' : '#FFFFFF',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(0,0,0,0.08)',
                      borderWidth: '1.5px'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#FAF7F0',
                      borderWidth: '2px'
                    }
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        mt: 1,
                        maxHeight: 300
                      }
                    }
                  }}
                >
                  <MenuItem value="All years" sx={{ pl: 2.5, fontWeight: 700 }}>All years</MenuItem>
                  {distinctYears.map((yr) => (
                    <MenuItem key={yr} value={yr} sx={{ pl: 2.5 }}>
                      {yr}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Number of Questions Pills */}
            <Box sx={{ mb: 3.5 }}>
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  fontWeight: 800,
                  fontSize: '11px',
                  color: themeMode === 'light' ? '#7E8A9B' : 'text.secondary',
                  letterSpacing: '0.8px',
                  mb: 1,
                  textTransform: 'uppercase'
                }}
              >
                Number of questions
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                {[10, 20, 30, 50].map((num) => {
                  const isSelected = qCount === num;
                  return (
                    <Button
                      key={num}
                      onClick={() => setQCount(num)}
                      sx={{
                        borderRadius: '24px',
                        px: 3,
                        py: 0.8,
                        fontSize: '13px',
                        fontWeight: 800,
                        textTransform: 'none',
                        bgcolor: isSelected
                          ? (themeMode === 'light' ? '#16223E' : '#FFFFFF')
                          : (themeMode === 'light' ? '#FAF7F0' : '#1C2541'),
                        color: isSelected
                          ? (themeMode === 'light' ? '#FFFFFF' : '#16223E')
                          : (themeMode === 'light' ? '#16223E' : '#FFFFFF'),
                        border: isSelected ? 'none' : '1px solid rgba(0,0,0,0.08)',
                        '&:hover': {
                          bgcolor: isSelected
                            ? (themeMode === 'light' ? '#0F182C' : '#E2E8F0')
                            : 'rgba(0,0,0,0.04)'
                        }
                      }}
                    >
                      {num}
                    </Button>
                  );
                })}
              </Box>
            </Box>

            {/* Timer Pills */}
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  fontWeight: 800,
                  fontSize: '11px',
                  color: themeMode === 'light' ? '#7E8A9B' : 'text.secondary',
                  letterSpacing: '0.8px',
                  mb: 1,
                  textTransform: 'uppercase'
                }}
              >
                Timer
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                {[
                  { value: 'off', label: 'Off' },
                  { value: '60', label: '1 min/Q' },
                  { value: '90', label: '1.5 min/Q' }
                ].map((t) => {
                  const isSelected = timerLimit === t.value;
                  return (
                    <Button
                      key={t.value}
                      onClick={() => setTimerLimit(t.value as any)}
                      sx={{
                        borderRadius: '24px',
                        px: 3,
                        py: 0.8,
                        fontSize: '13px',
                        fontWeight: 800,
                        textTransform: 'none',
                        bgcolor: isSelected
                          ? (themeMode === 'light' ? '#16223E' : '#FFFFFF')
                          : (themeMode === 'light' ? '#FAF7F0' : '#1C2541'),
                        color: isSelected
                          ? (themeMode === 'light' ? '#FFFFFF' : '#16223E')
                          : (themeMode === 'light' ? '#16223E' : '#FFFFFF'),
                        border: isSelected ? 'none' : '1px solid rgba(0,0,0,0.08)',
                        '&:hover': {
                          bgcolor: isSelected
                            ? (themeMode === 'light' ? '#0F182C' : '#E2E8F0')
                            : 'rgba(0,0,0,0.04)'
                        }
                      }}
                    >
                      {t.label}
                    </Button>
                  );
                })}
              </Box>
            </Box>

            {/* Start Button & Back */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleStartPrelims}
                disabled={availableCount === 0}
                sx={{
                  bgcolor: '#C8963E',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  px: 4,
                  py: 1.2,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '14px',
                  '&:hover': { bgcolor: '#B0832F' }
                }}
              >
                Start &rarr;
              </Button>

              <Typography sx={{ fontWeight: 600, fontSize: '14px', color: 'text.secondary' }}>
                {availableCount} available
              </Typography>

              <Button
                variant="text"
                onClick={() => setMode('menu')}
                sx={{ ml: 'auto', fontWeight: 700, color: 'text.secondary', textTransform: 'none' }}
              >
                Back
              </Button>
            </Box>
          </Paper>
        )}

        {/* Mains Setup Parameters */}
        {mode === 'mains_setup' && (
          <Paper
            elevation={0}
            sx={{
              p: 4,
              border: '1.5px solid',
              borderColor: 'divider',
              borderRadius: 2,
              bgcolor: 'background.paper'
            }}
          >
            {/* Back button link */}
            <Typography
              onClick={() => setMode('menu')}
              sx={{
                cursor: 'pointer',
                color: '#C8963E',
                fontWeight: 700,
                fontSize: '13px',
                mb: 2,
                display: 'inline-flex',
                alignItems: 'center',
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              &larr; all modes
            </Typography>

            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" sx={{ fontWeight: 900, mb: 0.5, color: themeMode === 'light' ? '#16223E' : '#FFFFFF' }}>
                Mains answer-writing
              </Typography>
              <Typography variant="body2" sx={{ color: themeMode === 'light' ? '#7E8A9B' : 'text.secondary' }}>
                Write your answer under time & word limit, then self-check it against the model answer.
              </Typography>
            </Box>

            {/* Paper Select */}
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  fontWeight: 800,
                  fontSize: '11px',
                  color: themeMode === 'light' ? '#7E8A9B' : 'text.secondary',
                  letterSpacing: '0.8px',
                  mb: 1,
                  textTransform: 'uppercase'
                }}
              >
                Paper
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={selectedMainsPaperFilter}
                  onChange={(e) => setSelectedMainsPaperFilter(e.target.value)}
                  input={<OutlinedInput />}
                  sx={{
                    bgcolor: themeMode === 'light' ? '#FAF7F0' : '#1C2541',
                    borderRadius: 2,
                    fontWeight: 700,
                    color: themeMode === 'light' ? '#16223E' : '#FFFFFF',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(0,0,0,0.08)',
                      borderWidth: '1.5px'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#FAF7F0',
                      borderWidth: '2px'
                    }
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        mt: 1,
                        maxHeight: 300
                      }
                    }
                  }}
                >
                  {['All papers', 'Essay', 'GS 1', 'GS 2', 'GS 3', 'GS 4'].map((p) => (
                    <MenuItem key={p} value={p} sx={{ pl: 2.5, fontWeight: p === 'All papers' ? 700 : 500 }}>
                      {p}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Topic Select */}
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  fontWeight: 800,
                  fontSize: '11px',
                  color: themeMode === 'light' ? '#7E8A9B' : 'text.secondary',
                  letterSpacing: '0.8px',
                  mb: 1,
                  textTransform: 'uppercase'
                }}
              >
                Topic
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={selectedMainsTopicFilter}
                  onChange={(e) => setSelectedMainsTopicFilter(e.target.value)}
                  input={<OutlinedInput />}
                  sx={{
                    bgcolor: themeMode === 'light' ? '#FAF7F0' : '#1C2541',
                    borderRadius: 2,
                    fontWeight: 700,
                    color: themeMode === 'light' ? '#16223E' : '#FFFFFF',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(0,0,0,0.08)',
                      borderWidth: '1.5px'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#FAF7F0',
                      borderWidth: '2px'
                    }
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        mt: 1,
                        maxHeight: 300
                      }
                    }
                  }}
                >
                  <MenuItem value="All topics" sx={{ pl: 2.5, fontWeight: 700 }}>All topics</MenuItem>
                  {distinctMainsTopics.map((topic) => (
                    <MenuItem key={topic} value={topic} sx={{ pl: 2.5 }}>
                      {topic}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Word Limit Select */}
            <Box sx={{ mb: 3.5 }}>
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  fontWeight: 800,
                  fontSize: '11px',
                  color: themeMode === 'light' ? '#7E8A9B' : 'text.secondary',
                  letterSpacing: '0.8px',
                  mb: 1,
                  textTransform: 'uppercase'
                }}
              >
                Word Limit
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={selectedMainsWordFilter}
                  onChange={(e) => setSelectedMainsWordFilter(e.target.value)}
                  input={<OutlinedInput />}
                  sx={{
                    bgcolor: themeMode === 'light' ? '#FAF7F0' : '#1C2541',
                    borderRadius: 2,
                    fontWeight: 700,
                    color: themeMode === 'light' ? '#16223E' : '#FFFFFF',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(0,0,0,0.08)',
                      borderWidth: '1.5px'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#FAF7F0',
                      borderWidth: '2px'
                    }
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        mt: 1,
                        maxHeight: 300
                      }
                    }
                  }}
                >
                  <MenuItem value="Any words" sx={{ pl: 2.5, fontWeight: 700 }}>Any words</MenuItem>
                  {distinctMainsWords.map((w) => (
                    <MenuItem key={w} value={w} sx={{ pl: 2.5 }}>
                      {w} words
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Number of Questions Pills */}
            <Box sx={{ mb: 3.5 }}>
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  fontWeight: 800,
                  fontSize: '11px',
                  color: themeMode === 'light' ? '#7E8A9B' : 'text.secondary',
                  letterSpacing: '0.8px',
                  mb: 1,
                  textTransform: 'uppercase'
                }}
              >
                Number of questions
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                {[3, 5, 10].map((num) => {
                  const isSelected = mainsQCount === num;
                  return (
                    <Button
                      key={num}
                      onClick={() => setMainsQCount(num)}
                      sx={{
                        borderRadius: '24px',
                        px: 3,
                        py: 0.8,
                        fontSize: '13px',
                        fontWeight: 800,
                        textTransform: 'none',
                        bgcolor: isSelected
                          ? (themeMode === 'light' ? '#16223E' : '#FFFFFF')
                          : (themeMode === 'light' ? '#FAF7F0' : '#1C2541'),
                        color: isSelected
                          ? (themeMode === 'light' ? '#FFFFFF' : '#16223E')
                          : (themeMode === 'light' ? '#16223E' : '#FFFFFF'),
                        border: isSelected ? 'none' : '1px solid rgba(0,0,0,0.08)',
                        '&:hover': {
                          bgcolor: isSelected
                            ? (themeMode === 'light' ? '#0F182C' : '#E2E8F0')
                            : 'rgba(0,0,0,0.04)'
                        }
                      }}
                    >
                      {num}
                    </Button>
                  );
                })}
              </Box>
            </Box>

            {/* Timer Pills */}
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  fontWeight: 800,
                  fontSize: '11px',
                  color: themeMode === 'light' ? '#7E8A9B' : 'text.secondary',
                  letterSpacing: '0.8px',
                  mb: 1,
                  textTransform: 'uppercase'
                }}
              >
                Timer
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                {[
                  { value: 'off', label: 'Off' },
                  { value: 'pace', label: 'Exam pace (by word limit)' }
                ].map((t) => {
                  const isSelected = mainsTimerType === t.value;
                  return (
                    <Button
                      key={t.value}
                      onClick={() => setMainsTimerType(t.value as any)}
                      sx={{
                        borderRadius: '24px',
                        px: 3,
                        py: 0.8,
                        fontSize: '13px',
                        fontWeight: 800,
                        textTransform: 'none',
                        bgcolor: isSelected
                          ? (themeMode === 'light' ? '#16223E' : '#FFFFFF')
                          : (themeMode === 'light' ? '#FAF7F0' : '#1C2541'),
                        color: isSelected
                          ? (themeMode === 'light' ? '#FFFFFF' : '#16223E')
                          : (themeMode === 'light' ? '#16223E' : '#FFFFFF'),
                        border: isSelected ? 'none' : '1px solid rgba(0,0,0,0.08)',
                        '&:hover': {
                          bgcolor: isSelected
                            ? (themeMode === 'light' ? '#0F182C' : '#E2E8F0')
                            : 'rgba(0,0,0,0.04)'
                        }
                      }}
                    >
                      {t.label}
                    </Button>
                  );
                })}
              </Box>
            </Box>

            {/* Start Button */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleStartMains}
                disabled={mainsAvailableCount === 0}
                sx={{
                  bgcolor: '#C8963E',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  px: 4,
                  py: 1.2,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '14px',
                  '&:hover': { bgcolor: '#B0832F' }
                }}
              >
                Start &rarr;
              </Button>

              <Typography sx={{ fontWeight: 600, fontSize: '14px', color: 'text.secondary' }}>
                {mainsAvailableCount} available
              </Typography>
            </Box>
          </Paper>
        )}

        {/* Prelims MCQ Quiz Session */}
        {mode === 'prelims_quiz' && quizQuestions.length > 0 && (
          <Box>
            {/* Header timer */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography sx={{ fontWeight: 800 }}>Question {currentIdx + 1} of {quizQuestions.length}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: 'rgba(0,0,0,0.02)', px: 1.5, py: 0.5, borderRadius: 2 }}>
                <TimerIcon sx={{ fontSize: 16 }} />
                <Typography sx={{ fontSize: '13px', fontWeight: 800 }}>{formatTime(seconds)}</Typography>
              </Box>
            </Box>

            <LinearProgress variant="determinate" value={((currentIdx) / quizQuestions.length) * 100} sx={{ height: 6, borderRadius: 3, mb: 4 }} />

            <Paper elevation={0} sx={{ p: 4, border: '1.5px solid', borderColor: 'divider', borderRadius: 3.5, bgcolor: 'background.paper', mb: 3 }}>
              <MathContent content={quizQuestions[currentIdx].stem_html} />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, my: 3 }}>
                {quizQuestions[currentIdx].options.map((opt: any) => {
                  const letter = opt.letter.toLowerCase();
                  const isSelected = selectedOption === letter;
                  const isCorrect = letter === quizQuestions[currentIdx].correct_answer;

                  let borderColor = isDark ? 'rgba(255, 255, 255, 0.25)' : 'divider';
                  let bgcolor = 'transparent';

                  if (isAnswerChecked) {
                    if (isCorrect) {
                      borderColor = '#10B981';
                      bgcolor = isDark ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.06)';
                    } else if (isSelected) {
                      borderColor = '#EF4444';
                      bgcolor = isDark ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.06)';
                    }
                  } else if (isSelected) {
                    borderColor = isDark ? '#F5A623' : '#16223E';
                    bgcolor = isDark ? 'rgba(245,166,35,0.1)' : 'rgba(22,34,62,0.04)';
                  }

                  return (
                    <Box
                      key={letter}
                      onClick={() => !isAnswerChecked && setSelectedOption(letter)}
                      sx={{
                        display: 'flex',
                        gap: 1.5,
                        p: 1.5,
                        border: '1.5px solid',
                        borderColor,
                        borderRadius: 2.5,
                        bgcolor,
                        cursor: isAnswerChecked ? 'default' : 'pointer',
                        fontSize: '13.5px',
                        '&:hover': { borderColor: isAnswerChecked ? borderColor : '#F5A623' }
                      }}
                    >
                      <Typography sx={{ fontWeight: 800 }}>({opt.letter})</Typography>
                      <MathContent content={opt.html} />
                    </Box>
                  );
                })}
              </Box>

              {/* Action Buttons Footer */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3, pt: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
                {/* Left side: End & score */}
                <Button
                  variant="outlined"
                  onClick={handleEndScore}
                  sx={{
                    borderRadius: 2.5,
                    px: 3,
                    py: 1,
                    fontWeight: 800,
                    fontSize: '13.5px',
                    textTransform: 'none',
                    borderColor: 'divider',
                    color: themeMode === 'light' ? '#16223E' : '#FFFFFF',
                    '&:hover': {
                      borderColor: 'text.primary',
                      bgcolor: 'transparent'
                    }
                  }}
                >
                  End & score
                </Button>

                {/* Right side: Skip and Submit & next */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={handleSkip}
                    sx={{
                      borderRadius: 2.5,
                      px: 3.5,
                      py: 1,
                      fontWeight: 800,
                      fontSize: '13.5px',
                      textTransform: 'none',
                      borderColor: 'divider',
                      color: themeMode === 'light' ? '#16223E' : '#FFFFFF',
                      '&:hover': {
                        borderColor: 'text.primary',
                        bgcolor: 'transparent'
                      }
                    }}
                  >
                    Skip
                  </Button>

                  <Button
                    variant="contained"
                    disabled={!selectedOption}
                    onClick={handleSubmitNext}
                    sx={{
                      bgcolor: '#C8963E',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      px: 3.5,
                      py: 1.2,
                      borderRadius: 2.5,
                      textTransform: 'none',
                      fontSize: '13.5px',
                      '&:hover': { bgcolor: '#B0832F' },
                      '&.Mui-disabled': {
                        bgcolor: themeMode === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)',
                        color: themeMode === 'light' ? 'rgba(0,0,0,0.26)' : 'rgba(255,255,255,0.3)'
                      }
                    }}
                  >
                    {currentIdx + 1 === quizQuestions.length ? 'Finish Test &rarr;' : 'Submit & next &rarr;'}
                  </Button>
                </Box>
              </Box>

              {/* Shortcut keys line */}
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  textAlign: 'right',
                  color: 'text.secondary',
                  mt: 1.5,
                  fontSize: '11px',
                  fontWeight: 500
                }}
              >
                Keys: 1–4 / a–d choose · Enter submit · S skip
              </Typography>
            </Paper>
          </Box>
        )}

        {/* Score Summary Page */}
        {mode === 'score_summary' && (() => {
          const percentageScore = quizQuestions.length > 0
            ? Math.round((quizScore / quizQuestions.length) * 100)
            : 0;
          const skippedCount = quizQuestions.filter(q => q.attemptStatus === 'skipped').length;

          return (
            <Box>
              {/* Score card */}
              <Paper
                elevation={0}
                sx={{
                  p: 5,
                  border: '1.5px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  bgcolor: 'background.paper',
                  textAlign: 'center',
                  mb: 4
                }}
              >
                <Typography
                  variant="h2"
                  sx={{
                    fontWeight: 900,
                    fontSize: '56px',
                    color: themeMode === 'light' ? '#16223E' : '#FFFFFF',
                    mb: 1
                  }}
                >
                  {percentageScore}%
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4, fontWeight: 600 }}>
                  {quizScore} / {quizQuestions.length} correct · {skippedCount} skipped · {formatTime(seconds)} taken
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setMode('prelims_setup');
                    }}
                    sx={{
                      borderRadius: 2.5,
                      px: 3.5,
                      py: 1.2,
                      fontWeight: 800,
                      fontSize: '13.5px',
                      textTransform: 'none',
                      borderColor: 'divider',
                      color: themeMode === 'light' ? '#16223E' : '#FFFFFF',
                      '&:hover': {
                        borderColor: 'text.primary',
                        bgcolor: 'transparent'
                      }
                    }}
                  >
                    New set
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleBookmarkWrong}
                    disabled={quizQuestions.filter(q => q.attemptStatus === 'incorrect').length === 0}
                    sx={{
                      borderRadius: 2.5,
                      px: 3.5,
                      py: 1.2,
                      fontWeight: 800,
                      fontSize: '13.5px',
                      textTransform: 'none',
                      borderColor: 'divider',
                      color: themeMode === 'light' ? '#16223E' : '#FFFFFF',
                      '&:hover': {
                        borderColor: 'text.primary',
                        bgcolor: 'transparent'
                      }
                    }}
                  >
                    ★ Bookmark wrong
                  </Button>
                  <Button
                    variant="outlined"
                    component={Link}
                    href="/dashboard"
                    sx={{
                      borderRadius: 2.5,
                      px: 3.5,
                      py: 1.2,
                      fontWeight: 800,
                      fontSize: '13.5px',
                      textTransform: 'none',
                      borderColor: 'divider',
                      color: themeMode === 'light' ? '#16223E' : '#FFFFFF',
                      '&:hover': {
                        borderColor: 'text.primary',
                        bgcolor: 'transparent'
                      }
                    }}
                  >
                    Dashboard
                  </Button>
                </Box>
              </Paper>

              {/* Review & Reflect header */}
              <Box sx={{ mb: 4 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 800,
                    fontSize: '12px',
                    letterSpacing: '0.8px',
                    color: themeMode === 'light' ? '#1E293B' : '#94A3B8',
                    textTransform: 'uppercase',
                    mb: 2,
                    textAlign: 'left'
                  }}
                >
                  REVIEW & REFLECT — TAP A QUESTION FOR ITS ANALYSIS
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {quizQuestions.map((q, idx) => {
                    const isExpanded = expandedCardIdx === idx;
                    const isCorrect = q.attemptStatus === 'correct';
                    const isSkipped = q.attemptStatus === 'skipped';
                    const isIncorrect = q.attemptStatus === 'incorrect';

                    let statusText = 'Skipped';
                    let borderLeftColor = '#94A3B8';
                    if (isCorrect) {
                      statusText = 'Correct';
                      borderLeftColor = '#10B981';
                    } else if (isIncorrect) {
                      statusText = `Skipped`;
                      if (q.userAnswer) {
                        statusText = `Incorrect (Selected: (${q.userAnswer.toUpperCase()}))`;
                      }
                      borderLeftColor = '#EF4444';
                    }

                    return (
                      <Card
                        key={q.id}
                        elevation={0}
                        onClick={() => setExpandedCardIdx(isExpanded ? null : idx)}
                        sx={{
                          p: 3,
                          border: '1.5px solid',
                          borderColor: isExpanded ? '#C8963E' : 'divider',
                          borderLeft: `4px solid ${borderLeftColor}`,
                          borderRadius: 2,
                          bgcolor: 'background.paper',
                          cursor: 'pointer',
                          transition: 'border-color 0.2s',
                          textAlign: 'left'
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', mb: 0.8 }}>
                              <Typography sx={{ fontWeight: 800, color: 'text.primary', fontSize: '14.5px' }}>•</Typography>
                              <MathContent content={q.stem_html} />
                            </Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '11.5px' }}>
                              {statusText} · Correct: ({q.correct_answer.toUpperCase()}) · {q.subject} {q.year}
                            </Typography>
                          </Box>
                          <Typography sx={{ ml: 2, color: 'text.secondary', fontWeight: 800, fontSize: '18px', transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', alignSelf: 'center' }}>
                            ▾
                          </Typography>
                        </Box>

                        {isExpanded && (
                          <Box sx={{ mt: 2.5, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5, color: 'text.primary', fontSize: '13px' }}>
                              Correct Answer
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#10B981', mb: 2, fontSize: '14px' }}>
                              ({q.correct_answer.toUpperCase()})
                            </Typography>

                            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: 'text.primary', fontSize: '13px' }}>
                              Explanation
                            </Typography>
                            <Box sx={{ p: 2, bgcolor: themeMode === 'light' ? '#FAF7F0' : '#1C2541', borderRadius: 2 }}>
                              <MathContent content={q.analysis_html} />
                            </Box>
                          </Box>
                        )}
                      </Card>
                    );
                  })}
                </Box>
              </Box>
            </Box>
          );
        })()}

        {/* Mains Timed Writing Quiz */}
        {mode === 'mains_quiz' && mainsQuestions.length > 0 && (() => {
          const currentQ = mainsQuestions[currentMainsIdx];
          const hasWordLimit = currentQ.word_limit;

          return (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography sx={{ fontWeight: 800, color: 'text.primary' }}>
                  Question {currentMainsIdx + 1} of {mainsQuestions.length} ({currentQ.paper})
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: 'rgba(0,0,0,0.02)', px: 1.5, py: 0.5, borderRadius: 2 }}>
                  <TimerIcon sx={{ fontSize: 16 }} />
                  <Typography sx={{ fontSize: '13px', fontWeight: 800 }}>{formatTime(seconds)}</Typography>
                </Box>
              </Box>

              <Paper elevation={0} sx={{ p: 4, border: '1.5px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'background.paper', mb: 3 }}>
                <MathContent content={mdToHtml(splitBody(currentQ).stem)} />

                {hasWordLimit && (
                  <Box sx={{ mt: 1.5, mb: 3 }}>
                    <Chip label={`${hasWordLimit} Words`} size="small" sx={{ fontWeight: 700 }} />
                  </Box>
                )}

                <Box sx={{ mt: 3 }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={12}
                    placeholder="Draft your model response here..."
                    value={userDraft}
                    onChange={(e) => setUserDraft(e.target.value)}
                    sx={{
                      mb: 3.5,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        bgcolor: themeMode === 'light' ? 'rgba(0,0,0,0.01)' : 'rgba(255,255,255,0.01)'
                      }
                    }}
                  />

                  {/* Editor action buttons */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button
                      variant="outlined"
                      onClick={handleMainsEndScore}
                      sx={{
                        borderRadius: 2.5,
                        px: 3,
                        py: 1,
                        fontWeight: 800,
                        fontSize: '13.5px',
                        textTransform: 'none',
                        borderColor: 'divider',
                        color: themeMode === 'light' ? '#16223E' : '#FFFFFF',
                        '&:hover': {
                          borderColor: 'text.primary',
                          bgcolor: 'transparent'
                        }
                      }}
                    >
                      End & score
                    </Button>

                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Button
                        variant="outlined"
                        onClick={handleMainsSkip}
                        sx={{
                          borderRadius: 2.5,
                          px: 3.5,
                          py: 1,
                          fontWeight: 800,
                          fontSize: '13.5px',
                          textTransform: 'none',
                          borderColor: 'divider',
                          color: themeMode === 'light' ? '#16223E' : '#FFFFFF',
                          '&:hover': {
                            borderColor: 'text.primary',
                            bgcolor: 'transparent'
                          }
                        }}
                      >
                        Skip
                      </Button>

                      <Button
                        variant="contained"
                        disabled={!userDraft.trim()}
                        onClick={handleSubmitMainsNext}
                        sx={{
                          bgcolor: '#C8963E',
                          color: '#FFFFFF',
                          fontWeight: 800,
                          px: 3.5,
                          py: 1.2,
                          borderRadius: 2.5,
                          textTransform: 'none',
                          fontSize: '13.5px',
                          '&:hover': { bgcolor: '#B0832F' },
                          '&.Mui-disabled': {
                            bgcolor: themeMode === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)',
                            color: themeMode === 'light' ? 'rgba(0,0,0,0.26)' : 'rgba(255,255,255,0.3)'
                          }
                        }}
                      >
                        {currentMainsIdx + 1 === mainsQuestions.length ? 'Finish Test &rarr;' : 'Submit & next &rarr;'}
                      </Button>
                    </Box>
                  </Box>
                </Box>
              </Paper>
            </Box>
          );
        })()}

        {/* Mains Score Summary Page */}
        {mode === 'mains_score_summary' && (() => {
          const answersPracticed = Object.keys(mainsDrafts).filter(k => mainsSkipped[Number(k)] === false).length;

          const totalCoverages = Object.values(mainsCoverages);
          const totalPointsChecked = totalCoverages.reduce((acc, list) => acc + list.length, 0);
          const totalPointsHit = totalCoverages.reduce((acc, list) => acc + list.filter((r: any) => r.hit).length, 0);
          const averageCoverage = totalPointsChecked > 0
            ? Math.round((totalPointsHit / totalPointsChecked) * 100)
            : 0;

          return (
            <Box>
              {/* Scorecard */}
              <Paper
                elevation={0}
                sx={{
                  p: 5,
                  border: '1.5px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  bgcolor: 'background.paper',
                  textAlign: 'center',
                  mb: 4
                }}
              >
                <Typography
                  variant="h2"
                  sx={{
                    fontWeight: 900,
                    fontSize: '56px',
                    color: themeMode === 'light' ? '#16223E' : '#FFFFFF',
                    mb: 1
                  }}
                >
                  {answersPracticed}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4, fontWeight: 600 }}>
                  answers practiced · ~{averageCoverage}% key-point coverage · {formatTime(seconds)} this session
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setMode('mains_setup');
                    }}
                    sx={{
                      borderRadius: 2.5,
                      px: 3.5,
                      py: 1.2,
                      fontWeight: 800,
                      fontSize: '13.5px',
                      textTransform: 'none',
                      borderColor: 'divider',
                      color: themeMode === 'light' ? '#16223E' : '#FFFFFF',
                      '&:hover': {
                        borderColor: 'text.primary',
                        bgcolor: 'transparent'
                      }
                    }}
                  >
                    New set
                  </Button>

                  <Typography
                    onClick={() => setMode('menu')}
                    sx={{
                      cursor: 'pointer',
                      color: '#C8963E',
                      fontWeight: 700,
                      fontSize: '13px',
                      mx: 1,
                      '&:hover': { textDecoration: 'underline' }
                    }}
                  >
                    &larr; all modes
                  </Typography>

                  <Button
                    variant="outlined"
                    component={Link}
                    href="/dashboard"
                    sx={{
                      borderRadius: 2.5,
                      px: 3.5,
                      py: 1.2,
                      fontWeight: 800,
                      fontSize: '13.5px',
                      textTransform: 'none',
                      borderColor: 'divider',
                      color: themeMode === 'light' ? '#16223E' : '#FFFFFF',
                      '&:hover': {
                        borderColor: 'text.primary',
                        bgcolor: 'transparent'
                      }
                    }}
                  >
                    Dashboard
                  </Button>
                </Box>
              </Paper>

              {/* Review block */}
              <Box sx={{ mb: 4 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 800,
                    fontSize: '12px',
                    letterSpacing: '0.8px',
                    color: themeMode === 'light' ? '#1E293B' : '#94A3B8',
                    textTransform: 'uppercase',
                    mb: 2,
                    textAlign: 'left'
                  }}
                >
                  REVIEW — TAP A QUESTION FOR YOUR ANSWER + THE MODEL
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {mainsQuestions.map((q, idx) => {
                    const isExpanded = mainsExpandedCardIdx === idx;
                    const isSkipped = mainsSkipped[idx];

                    const qCoverage = mainsCoverages[idx] || [];
                    const coveredCount = qCoverage.filter(r => r.hit).length;
                    const totalPoints = qCoverage.length;

                    let statusText = `Skipped`;
                    let bulletChar = '•';
                    let borderLeftColor = '#94A3B8';
                    if (!isSkipped) {
                      statusText = `covered ${coveredCount}/${totalPoints}`;
                      bulletChar = '✓';
                      borderLeftColor = '#10B981';
                    }

                    const questionStemText = splitBody(q).stem;
                    const truncatedStem = questionStemText.length > 100
                      ? questionStemText.substring(0, 100) + '...'
                      : questionStemText;

                    return (
                      <Card
                        key={q.id}
                        elevation={0}
                        onClick={() => setMainsExpandedCardIdx(isExpanded ? null : idx)}
                        sx={{
                          p: 3,
                          border: '1.5px solid',
                          borderColor: isExpanded ? '#C8963E' : 'divider',
                          borderLeft: `4px solid ${borderLeftColor}`,
                          borderRadius: 2,
                          bgcolor: 'background.paper',
                          cursor: 'pointer',
                          transition: 'border-color 0.2s',
                          textAlign: 'left'
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', mb: 0.8 }}>
                              <Typography sx={{ fontWeight: 800, color: 'text.primary', fontSize: '14.5px' }}>
                                {bulletChar}
                              </Typography>
                              <MathContent content={mdToHtml(truncatedStem)} />
                            </Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '11.5px' }}>
                              {q.paper} · {statusText}
                            </Typography>
                          </Box>
                          <Typography sx={{ ml: 2, color: 'text.secondary', fontWeight: 800, fontSize: '18px', transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', alignSelf: 'center' }}>
                            ▾
                          </Typography>
                        </Box>

                        {isExpanded && (
                          <Box sx={{ mt: 3, pt: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
                            {/* Full Question Text */}
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: 'text.secondary', fontSize: '12px', textTransform: 'uppercase' }}>
                              Full Question
                            </Typography>
                            <Box sx={{ mb: 3 }}>
                              <MathContent content={mdToHtml(questionStemText)} />
                            </Box>

                            {/* Your Answer */}
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: 'text.secondary', fontSize: '12px', textTransform: 'uppercase' }}>
                              Your Answer
                            </Typography>
                            <Box sx={{ p: 2, bgcolor: themeMode === 'light' ? '#FAF7F0' : '#1C2541', borderRadius: 2, mb: 3 }}>
                              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                                {mainsDrafts[idx] || '[Skipped]'}
                              </Typography>
                            </Box>

                            {/* Model Answer */}
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: 'text.secondary', fontSize: '12px', textTransform: 'uppercase' }}>
                              Model Answer
                            </Typography>
                            <Box
                              sx={{
                                p: 2.5,
                                border: '1.5px solid',
                                borderColor: themeMode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.15)',
                                borderRadius: 2,
                                bgcolor: themeMode === 'light' ? '#FAF7F0' : '#1C2541'
                              }}
                            >
                              <MathContent content={mdToHtml(splitBody(q).ans)} />
                            </Box>
                          </Box>
                        )}
                      </Card>
                    );
                  })}
                </Box>
              </Box>
            </Box>
          );
        })()}
      </Container>
    </Box>
  );
}
