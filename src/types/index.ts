export interface Question {
  id: string;
  text: string;
  category: 'behavioral' | 'technical' | 'general';
  createdAt: string;
}

export interface Recording {
  id: string;
  questionId: string;
  question: Question;
  transcript: string;
  audioUrl: string | null;
  duration: number | null;
  createdAt: string;
}

export interface StarMethodItem {
  present: boolean;
  score: number;
  feedback: string;
}

export interface PronunciationIssue {
  word: string;
  issue: string;
  suggestion: string;
}

export interface FillerWord {
  word: string;
  count: number;
}

export interface AIFeedback {
  overallRating: number;
  ratingBreakdown: {
    relevance: number;
    clarity: number;
    structure: number;
    confidence: number;
    completeness: number;
  };
  starMethodAnalysis: {
    situation: StarMethodItem;
    task: StarMethodItem;
    action: StarMethodItem;
    result: StarMethodItem;
  };
  strengths: string[];
  areasForImprovement: string[];
  betterAnswer: string;
  pronunciationIssues: PronunciationIssue[];
  fillerWords: FillerWord[];
  speakingPace: string;
  summary: string;
}

export interface AnalysisResponse {
  transcript: string;
  words: Array<{ word: string; start: number; end: number }>;
  analysis: AIFeedback;
}
