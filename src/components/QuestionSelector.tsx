'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Chip,
} from '@mui/material';
import PsychologyIcon from '@mui/icons-material/Psychology';
import CodeIcon from '@mui/icons-material/Code';
import PersonIcon from '@mui/icons-material/Person';
import { Question } from '@/types';

interface QuestionSelectorProps {
  onSelectQuestion: (question: Question) => void;
}

const categories = [
  { id: 'behavioral', label: 'Behavioral', icon: PsychologyIcon, color: '#576b7cff' },
  { id: 'technical', label: 'Technical', icon: CodeIcon, color: '#4caf50' },
  { id: 'general', label: 'General', icon: PersonIcon, color: '#9c27b0' },
];

export default function QuestionSelector({ onSelectQuestion }: QuestionSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedCategory) {
      setLoading(true);
      fetch(`/api/questions?category=${selectedCategory}`)
        .then((res) => res.json())
        .then((data) => {
          setQuestions(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [selectedCategory]);

  const selectedCategoryData = categories.find((c) => c.id === selectedCategory);

  return (
    <Box maxWidth="md" mx="auto">
      <Typography variant="h5" align="center" gutterBottom fontWeight="medium" mb={3}>
        Select Question Category
      </Typography>

      <Grid container spacing={2} mb={4}>
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <Grid size={4} key={cat.id}>
              <Card
                sx={{
                  bgcolor: cat.color,
                  color: 'white',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  transform: selectedCategory === cat.id ? 'scale(1.02)' : 'scale(1)',
                  boxShadow: selectedCategory === cat.id ? 8 : 2,
                  border: selectedCategory === cat.id ? '3px solid white' : 'none',
                  '&:hover': {
                    transform: 'scale(1.02)',
                    boxShadow: 6,
                  },
                }}
              >
                <CardActionArea onClick={() => setSelectedCategory(cat.id)}>
                  <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <Icon sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h6" >
                      {cat.label}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {selectedCategory && (
        <Box mt={4}>
          <Box display="flex" alignItems="center" gap={1} mb={3}>
            <Typography variant="h6" fontWeight="medium">
              {selectedCategoryData?.label} Questions
            </Typography>
            <Chip
              label={`${questions.length} questions`}
              size="small"
              sx={{ bgcolor: selectedCategoryData?.color, color: 'white' }}
            />
          </Box>

          {loading ? (
            <Box display="flex" justifyContent="center" py={6}>
              <CircularProgress />
            </Box>
          ) : (
            <Box display="flex" flexDirection="column" gap={2}>
              {questions.map((question, index) => (
                <Card
                  key={question.id}
                  variant="outlined"
                  sx={{
                    '&:hover': {
                      borderColor: selectedCategoryData?.color,
                      boxShadow: 2,
                    },
                  }}
                >
                  <CardActionArea onClick={() => onSelectQuestion(question)}>
                    <CardContent>
                      <Box display="flex" alignItems="flex-start" gap={2}>
                        <Chip
                          label={index + 1}
                          size="small"
                          sx={{
                            bgcolor: selectedCategoryData?.color,
                            color: 'white',
                            fontWeight: 'bold',
                            minWidth: 32,
                          }}
                        />
                        <Typography variant="body1">{question.text}</Typography>
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              ))}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
