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
