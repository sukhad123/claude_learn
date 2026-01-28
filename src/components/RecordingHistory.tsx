'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MicOffIcon from '@mui/icons-material/MicOff';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { Recording } from '@/types';

export default function RecordingHistory() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | false>(false);

  useEffect(() => {
    fetch('/api/recordings')
      .then((res) => res.json())
      .then((data) => {
        setRecordings(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleChange = (panel: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--';
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={6}>
        <CircularProgress />
      </Box>
    );
  }

  if (recordings.length === 0) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <MicOffIcon sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No recordings yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Start practicing to see your recordings here.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      {recordings.map((recording) => (
        <Accordion
          key={recording.id}
          expanded={expanded === recording.id}
          onChange={handleChange(recording.id)}
          sx={{ mb: 1 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ width: '100%', pr: 2 }}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Chip
                  label={recording.question.category}
                  size="small"
                  sx={{
                    bgcolor: getCategoryColor(recording.question.category),
                    color: 'white',
                    textTransform: 'capitalize',
                    height: 24,
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  {formatDate(recording.createdAt)}
                </Typography>
                <Box display="flex" alignItems="center" gap={0.5} ml="auto">
                  <AccessTimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                    {formatDuration(recording.duration)}
                  </Typography>
                </Box>
              </Box>
              <Typography
                variant="body2"
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {recording.question.text}
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Transcript
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
                {recording.transcript || 'No transcript available.'}
              </Typography>

              {recording.audioUrl && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Audio Recording
                  </Typography>
                  <audio controls style={{ width: '100%' }} src={recording.audioUrl}>
                    Your browser does not support the audio element.
                  </audio>
                </>
              )}
            </Box>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}
