'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  LinearProgress,
  Chip,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import SpeedIcon from '@mui/icons-material/Speed';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import { AIFeedback, PronunciationIssue } from '@/types';

interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
  feedback: AIFeedback | null;
  transcript: string;
  pronunciationIssues: PronunciationIssue[];
  audioUrl: string | null;
}

function RatingBar({ label, value, max = 10 }: { label: string; value: number; max?: number }) {
  const percentage = (value / max) * 100;
  const getColor = () => {
    if (percentage >= 70) return 'success';
    if (percentage >= 40) return 'warning';
    return 'error';
  };

  return (
    <Box sx={{ mb: 1.5 }}>
      <Box display="flex" justifyContent="space-between" mb={0.5}>
        <Typography variant="body2">{label}</Typography>
        <Typography variant="body2" fontWeight="bold">
          {value}/{max}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={percentage}
        color={getColor()}
        sx={{ height: 8, borderRadius: 4 }}
      />
    </Box>
  );
}

function HighlightedTranscript({
  transcript,
  pronunciationIssues,
}: {
  transcript: string;
  pronunciationIssues: PronunciationIssue[];
}) {
  if (!pronunciationIssues.length) {
    return <Typography variant="body1">{transcript}</Typography>;
  }

  const issueWords = new Set(pronunciationIssues.map((p) => p.word.toLowerCase()));
  const words = transcript.split(/(\s+)/);

  return (
    <Typography variant="body1" component="div" sx={{ lineHeight: 2 }}>
      {words.map((word, index) => {
        const cleanWord = word.replace(/[.,!?;:'"]/g, '').toLowerCase();
        const isIssue = issueWords.has(cleanWord);

        if (isIssue) {
          const issue = pronunciationIssues.find(
            (p) => p.word.toLowerCase() === cleanWord
          );
          return (
            <Box
              key={index}
              component="span"
              sx={{
                color: 'error.main',
                fontWeight: 'bold',
                borderBottom: '2px wavy',
                borderColor: 'error.main',
                cursor: 'help',
                position: 'relative',
                '&:hover': {
                  bgcolor: 'error.dark',
                  borderRadius: 1,
                },
              }}
              title={issue ? `${issue.issue} - ${issue.suggestion}` : ''}
            >
              {word}
            </Box>
          );
        }
        return <span key={index}>{word}</span>;
      })}
    </Typography>
  );
}

export default function FeedbackModal({
  open,
  onClose,
  feedback,
  transcript,
  pronunciationIssues,
  audioUrl,
}: FeedbackModalProps) {
  if (!feedback) return null;

  const getOverallRatingColor = () => {
    if (feedback.overallRating >= 7) return 'success.main';
    if (feedback.overallRating >= 4) return 'warning.main';
    return 'error.main';
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: { sx: { maxHeight: '90vh' } },
      }}
      className = "bg-dark bordered-2xl"
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" fontWeight="bold">
            AI Feedback Report
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* Overall Rating */}
        <Box textAlign="center" mb={4}>
          <Typography variant="h1" fontWeight="bold" sx={{ color: getOverallRatingColor() }}>
            {feedback.overallRating}
            <Typography component="span" variant="h4" color="text.secondary">
              /10
            </Typography>
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Overall Performance
          </Typography>
        </Box>

        {/* Summary */}
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'primary.dark' }}>
          <Typography variant="body1">{feedback.summary}</Typography>
        </Paper>

        {/* Audio Player */}
        {audioUrl && (
          <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.900' }}>
            <Box display="flex" alignItems="center" gap={2} mb={1}>
              <PlayCircleIcon color="primary" />
              <Typography variant="subtitle1" >
                Replay Your Recording
              </Typography>
            </Box>
            <Box
              component="audio"
              controls
              src={audioUrl}
              className ="w-full bordered-2xl bg-grey"
             
            />
          </Paper>
        )}

        {/* Rating Breakdown */}
        <Typography variant="h6" gutterBottom fontWeight="bold">
          Performance Breakdown
        </Typography>
        <Paper sx={{ p: 2, mb: 3 }}>
          <RatingBar label="Relevance" value={feedback.ratingBreakdown.relevance} />
          <RatingBar label="Clarity" value={feedback.ratingBreakdown.clarity} />
          <RatingBar label="Structure" value={feedback.ratingBreakdown.structure} />
          <RatingBar label="Confidence" value={feedback.ratingBreakdown.confidence} />
          <RatingBar label="Completeness" value={feedback.ratingBreakdown.completeness} />
        </Paper>

        {/* STAR Method Analysis */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold">
              STAR Method Analysis
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={2}>
              {(['situation', 'task', 'action', 'result'] as const).map((key) => {
                const item = feedback.starMethodAnalysis[key];
                return (
                  <Paper key={key} sx={{ p: 2 }}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      {item.present ? (
                        <CheckCircleIcon color="success" />
                      ) : (
                        <CancelIcon color="error" />
                      )}
                      <Typography variant="subtitle1" fontWeight="bold" textTransform="capitalize">
                        {key}
                      </Typography>
                      <Chip
                        label={`${item.score}/10`}
                        size="small"
                        color={item.score >= 7 ? 'success' : item.score >= 4 ? 'warning' : 'error'}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {item.feedback}
                    </Typography>
                  </Paper>
                );
              })}
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Transcript with Pronunciation Issues */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="h6" fontWeight="bold">
                Your Answer
              </Typography>
              {pronunciationIssues.length > 0 && (
                <Chip
                  label={`${pronunciationIssues.length} pronunciation issue${pronunciationIssues.length > 1 ? 's' : ''}`}
                  size="small"
                  color="error"
                />
              )}
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Paper sx={{ p: 2, bgcolor: 'grey.900' }}>
              <HighlightedTranscript transcript={transcript} pronunciationIssues={pronunciationIssues} />
            </Paper>

            {pronunciationIssues.length > 0 && (
              <Box mt={2}>
                <Typography variant="subtitle2" color="error" gutterBottom>
                  Pronunciation Issues (hover over highlighted words above for details):
                </Typography>
                {pronunciationIssues.map((issue, index) => (
                  <Box key={index} sx={{ mb: 1, pl: 2 }}>
                    <Typography variant="body2">
                      <Box component="span" sx={{ color: 'error.main', fontWeight: 'bold' }}>
                        &quot;{issue.word}&quot;
                      </Box>
                      {' - '}{issue.issue}
                    </Typography>
                    <Typography variant="body2" color="success.main" sx={{ pl: 2 }}>
                      Suggestion: {issue.suggestion}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </AccordionDetails>
        </Accordion>

        {/* Filler Words & Speaking Pace */}
        {(feedback.fillerWords.length > 0 || feedback.speakingPace) && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box display="flex" alignItems="center" gap={1}>
                <SpeedIcon />
                <Typography variant="h6" fontWeight="bold">
                  Speaking Analysis
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box display="flex" gap={2} flexWrap="wrap" mb={2}>
                <Chip
                  label={`Pace: ${feedback.speakingPace}`}
                  color={feedback.speakingPace === 'good' ? 'success' : 'warning'}
                />
              </Box>
              {feedback.fillerWords.length > 0 && (
                <>
                  <Typography variant="subtitle2" gutterBottom>
                    Filler Words Detected:
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    {feedback.fillerWords.map((filler, index) => (
                      <Chip
                        key={index}
                        label={`"${filler.word}" × ${filler.count}`}
                        variant="outlined"
                        color="warning"
                        size="small"
                      />
                    ))}
                  </Box>
                </>
              )}
            </AccordionDetails>
          </Accordion>
        )}

        {/* Strengths */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold" color="success.main">
              Strengths
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box component="ul" sx={{ m: 0, pl: 2 }}>
              {feedback.strengths.map((strength, index) => (
                <li key={index}>
                  <Typography variant="body1">{strength}</Typography>
                </li>
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Areas for Improvement */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold" color="warning.main">
              Areas for Improvement
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box component="ul" sx={{ m: 0, pl: 2 }}>
              {feedback.areasForImprovement.map((area, index) => (
                <li key={index}>
                  <Typography variant="body1">{area}</Typography>
                </li>
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Better Answer */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center" gap={1}>
              <TipsAndUpdatesIcon color="primary" />
              <Typography variant="h6" fontWeight="bold">
                Suggested Better Answer
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Paper sx={{ p: 2, bgcolor: 'success.dark', border: '1px solid', borderColor: 'success.main' }}>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {feedback.betterAnswer}
              </Typography>
            </Paper>
          </AccordionDetails>
        </Accordion>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="contained" size="large">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
