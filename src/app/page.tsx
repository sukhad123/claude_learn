'use client';

import { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  IconButton,
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import HistoryIcon from '@mui/icons-material/History';
import HomeIcon from '@mui/icons-material/Home';
import QuestionSelector from '@/components/QuestionSelector';
import VoiceRecorder from '@/components/VoiceRecorder';
import RecordingHistory from '@/components/RecordingHistory';
import { Question } from '@/types';

type View = 'home' | 'practice' | 'history';

export default function Home() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

  const handleSelectQuestion = (question: Question) => {
    setSelectedQuestion(question);
    setCurrentView('practice');
  };

  const handleComplete = () => {
    setSelectedQuestion(null);
    setCurrentView('home');
  };

  const handleBack = () => {
    setSelectedQuestion(null);
    setCurrentView('home');
  };

  return (
    <Box sx={{ minHeight: '100vh',   }}>

      {/**Navbar */}
     <AppBar
  position="fixed"
  elevation={0}
  className="
    !top-4
    !left-1/2
    !-translate-x-1/2
    !w-[92%]
    md:!w-[85%]
    max-w-6xl
    !rounded-2xl
    backdrop-blur-md
    shadow-lg
    border border-white/20
  "
>

        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => {
              setCurrentView('home');
              setSelectedQuestion(null);
            }}
            sx={{ mr: 1 }}
          >
            <MicIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Voice Interview
          </Typography>
          <div className='flex flex-row gap-4'>
             <Button
            color="success"
            startIcon={<HomeIcon />}
            variant='contained'
            onClick={() => {
              setCurrentView('home');
              setSelectedQuestion(null);
            }}
          
          >
            Practice
          </Button>
          {/**No history for now */}
          {/* <Button
            color="inherit"
            startIcon={<HistoryIcon />}
            onClick={() => setCurrentView('history')}
            sx={{
              bgcolor: currentView === 'history' ? 'rgba(255,255,255,0.1)' : 'transparent',
            }}
          >
            History
          </Button> */}
          </div>
         
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {currentView === 'home' && !selectedQuestion && (
          <Box>
            <Box textAlign="center" mb={4}>
              <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
                Interview Practice
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Select a question category and practice your responses with real-time transcription.
              </Typography>
            </Box>
            <QuestionSelector onSelectQuestion={handleSelectQuestion} />
          </Box>
        )}

        {currentView === 'practice' && selectedQuestion && (
          <VoiceRecorder question={selectedQuestion} onComplete={handleComplete} onBack={handleBack} />
        )}

        {currentView === 'history' && (
          <Box>
            <Box textAlign="center" mb={4}>
              <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
                Recording History
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Review your past practice sessions and transcripts.
              </Typography>
            </Box>
            <Box maxWidth="md" mx="auto">
              <RecordingHistory />
            </Box>
          </Box>
        )}
      </Container>
    </Box>
  );
}
