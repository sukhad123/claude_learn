'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Chip,
  Alert,
  Paper,
  CircularProgress,
  Divider,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DeleteIcon from '@mui/icons-material/Delete';
import DescriptionIcon from '@mui/icons-material/Description';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { Question, AIFeedback, PronunciationIssue, AnalysisResponse } from '@/types';
import FeedbackModal from './FeedbackModal';

interface VoiceRecorderProps {
  question: Question;
  onComplete: () => void;
  onBack: () => void;
}

export default function VoiceRecorder({ question, onComplete, onBack }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [duration, setDuration] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<AIFeedback | null>(null);
  const [aiTranscript, setAiTranscript] = useState('');
  const [pronunciationIssues, setPronunciationIssues] = useState<PronunciationIssue[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const initializeSpeechRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript + ' ';
        } else {
          interim += result[0].transcript;
        }
      }

      if (final) {
        setTranscript((prev) => prev + final);
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error !== 'no-speech') {
        setError(`Speech recognition error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      if (isRecording && !isPaused) {
        recognition.start();
      }
    };

    return recognition;
  }, [isRecording, isPaused]);

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(100);

      const recognition = initializeSpeechRecognition();
      if (recognition) {
        recognitionRef.current = recognition;
        recognition.start();
      }

      setIsRecording(true);
      setIsPaused(false);
      startTimer();
    } catch (err) {
      setError('Could not access microphone. Please grant permission and try again.');
      console.error('Error starting recording:', err);
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsPaused(true);
    stopTimer();
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
    }
    if (recognitionRef.current) {
      recognitionRef.current.start();
    }
    setIsPaused(false);
    startTimer();
  };

  const stopRecording = async () => {
    stopTimer();

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current) {
      return new Promise<Blob>((resolve) => {
        mediaRecorderRef.current!.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          mediaRecorderRef.current!.stream.getTracks().forEach((track) => track.stop());
          resolve(audioBlob);
        };
        mediaRecorderRef.current!.stop();
      });
    }
    return null;
  };

  const saveRecording = async () => {
    setIsSaving(true);
    setIsAnalyzing(true);
    const audioBlob = await stopRecording();
    setIsRecording(false);

    if (!audioBlob) {
      setError('No audio recorded. Please try again.');
      setIsSaving(false);
      setIsAnalyzing(false);
      return;
    }

    // Create audio URL for playback
    const recordedAudioUrl = URL.createObjectURL(audioBlob);
    setAudioUrl(recordedAudioUrl);

    try {
      // Step 1: Analyze with AI (Whisper + GPT-4)
      const analyzeFormData = new FormData();
      analyzeFormData.append('audio', audioBlob, 'recording.webm');
      analyzeFormData.append('question', question.text);
      analyzeFormData.append('category', question.category);

      const analyzeResponse = await fetch('/api/analyze-answer', {
        method: 'POST',
        body: analyzeFormData,
      });

      if (!analyzeResponse.ok) {
        throw new Error('Failed to analyze answer');
      }

      const analysisData: AnalysisResponse = await analyzeResponse.json();

      setAiFeedback(analysisData.analysis);
      setAiTranscript(analysisData.transcript);
      setPronunciationIssues(analysisData.analysis.pronunciationIssues || []);
      setIsAnalyzing(false);
      setShowFeedback(true);

      // Step 2: Save recording to database
      const saveFormData = new FormData();
      saveFormData.append('questionId', question.id);
      saveFormData.append('transcript', analysisData.transcript);
      saveFormData.append('duration', duration.toString());
      saveFormData.append('audio', audioBlob, 'recording.webm');

      const saveResponse = await fetch('/api/recordings', {
        method: 'POST',
        body: saveFormData,
      });

      if (!saveResponse.ok) {
        console.error('Failed to save recording to database');
      }
    } catch (err) {
      setError('Failed to analyze recording. Please try again.');
      console.error('Error analyzing recording:', err);
      setIsAnalyzing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseFeedback = () => {
    setShowFeedback(false);
    // Clean up audio URL to free memory
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    onComplete();
  };

  const discardRecording = async () => {
    await stopRecording();
    setIsRecording(false);
    setTranscript('');
    setInterimTranscript('');
    setDuration(0);
  };

  useEffect(() => {
    return () => {
      stopTimer();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stopTimer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'behavioral':
        return '#2196f3';
      case 'technical':
        return '#4caf50';
      case 'general':
        return '#9c27b0';
      default:
        return '#757575';
    }
  };

  return (
    <Box maxWidth="md" mx="auto">
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={onBack}
        sx={{ mb: 3 }}
        color="inherit"
      >
        Back to Questions
      </Button>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box mb={2}>
            <Chip
              label={question.category}
              size="small"
              sx={{
                bgcolor: getCategoryColor(question.category),
                color: 'white',
                textTransform: 'capitalize',
              }}
            />
          </Box>
          <Typography variant="h6">{question.text}</Typography>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
            <Box display="flex" alignItems="center" gap={2}>
              {isRecording && (
                <>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      bgcolor: isPaused ? 'warning.main' : 'error.main',
                      animation: isPaused ? 'none' : 'pulse 1.5s infinite',
                      '@keyframes pulse': {
                        '0%': { opacity: 1 },
                        '50%': { opacity: 0.5 },
                        '100%': { opacity: 1 },
                      },
                    }}
                  />
                  <Typography variant="h5" fontFamily="monospace">
                    {formatTime(duration)}
                  </Typography>
                </>
              )}
            </Box>

            <Box display="flex" gap={1}>
              {!isRecording ? (
                <Button
                  variant="contained"
                  startIcon={<FiberManualRecordIcon />}
                  onClick={startRecording}
                  size="large"
                >
                  Start Recording
                </Button>
              ) : (
                <>
                  {isPaused ? (
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<PlayArrowIcon />}
                      onClick={resumeRecording}
                    >
                      Resume
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      color="warning"
                      startIcon={<PauseIcon />}
                      onClick={pauseRecording}
                    >
                      Pause
                    </Button>
                  )}
                  <Button
                    variant="outlined"
                    color="inherit"
                    startIcon={<DeleteIcon />}
                    onClick={discardRecording}
                  >
                    Discard
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={
                      isSaving ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        <AutoAwesomeIcon />
                      )
                    }
                    onClick={saveRecording}
                    disabled={isSaving}
                  >
                    {isAnalyzing ? 'Analyzing with AI...' : isSaving ? 'Saving...' : 'Save & Get Feedback'}
                  </Button>
                </>
              )}
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <DescriptionIcon color="action" />
              <Typography variant="h6">Live Transcript</Typography>
            </Box>

            <Paper
              variant="outlined"
              sx={{
                p: 2,
                minHeight: 200,
                maxHeight: 400,
                overflow: 'auto',
                bgcolor: 'black',
              }}
            >
              {transcript || interimTranscript ? (
                <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
                  {transcript}
                  <Typography component="span" color="text.secondary" fontStyle="italic">
                    {interimTranscript}
                  </Typography>
                </Typography>
              ) : (
                <Typography variant="body1" color="text.secondary" fontStyle="italic">
                  {isRecording
                    ? 'Start speaking... Your words will appear here in real-time.'
                    : 'Click "Start Recording" to begin. Your speech will be transcribed live.'}
                </Typography>
              )}
            </Paper>
          </Box>
        </CardContent>
      </Card>

      {isRecording && (
        <Paper
          sx={{
            p: 2,
            bgcolor: 'grey.900',
            color: 'white',
          }}
        >
          <Typography variant="caption" color="grey.400" gutterBottom display="block">
            Live Captions
          </Typography>
          <Typography variant="h6">
            {interimTranscript || transcript.split(' ').slice(-20).join(' ') || 'Listening...'}
          </Typography>
        </Paper>
      )}

      {/* AI Analyzing Overlay */}
      {isAnalyzing && (
        <Paper
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <CircularProgress size={60} sx={{ mb: 3 }} />
          <Typography variant="h5" gutterBottom>
            Analyzing Your Answer
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Using Whisper for transcription and GPT-4 for feedback...
          </Typography>
        </Paper>
      )}

      {/* Feedback Modal */}
      <FeedbackModal
        open={showFeedback}
        onClose={handleCloseFeedback}
        feedback={aiFeedback}
        transcript={aiTranscript}
        pronunciationIssues={pronunciationIssues}
        audioUrl={audioUrl}
      />
    </Box>
  );
}
