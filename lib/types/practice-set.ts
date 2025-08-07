// lib/types/practice-set.ts
export interface FilterCounts {
  systems: Record<string, number>;
  disciplines: Record<string, number>;
  usedQuestions: number;
  unusedQuestions: number;
  correctQuestions: number;
  incorrectQuestions: number;
  markedQuestions: number;
  easyQuestions: number;
  mediumQuestions: number;
  hardQuestions: number;
  total: number;
}

export interface CreatePracticeSetFilters {
  systems: string[];
  disciplines: string[];
  includeUsed: boolean;
  includeUnused: boolean;
  includeCorrect: boolean;
  includeIncorrect: boolean;
  includeMarked: boolean;
  difficulties: ('EASY' | 'MEDIUM' | 'HARD')[];
}

export interface PracticeSetForm {
  name: string;
  description: string;
  maxQuestions: number;
  filters: CreatePracticeSetFilters;
}

export interface AvailableFilters {
  systems: string[];
  disciplines: string[];
}

export interface FilterDataResponse {
  counts: FilterCounts;
  availableFilters: AvailableFilters;
}

export interface CreatePracticeSetResponse {
  id: string;
  practiceSetId: string;
  name: string;
  description: string | null;
  totalQuestions: number;
  status: string;
  message: string;
}

export const INITIAL_FILTERS: CreatePracticeSetFilters = {
  systems: [],
  disciplines: [],
  includeUsed: true,
  includeUnused: true,
  includeCorrect: false,
  includeIncorrect: false,
  includeMarked: false,
  difficulties: ['EASY', 'MEDIUM', 'HARD'],
};

export const INITIAL_FORM: PracticeSetForm = {
  name: '',
  description: '',
  maxQuestions: 20,
  filters: INITIAL_FILTERS,
};

export const DIFFICULTY_LABELS = {
  EASY: 'Easy',
  MEDIUM: 'Medium', 
  HARD: 'Hard'
} as const;

export const STATUS_LABELS = {
  includeUsed: '✅ Used Questions',
  includeUnused: '❌ Unused Questions',
  includeCorrect: '🟢 Correct',
  includeIncorrect: '🔴 Incorrect',
  includeMarked: '⭐ Marked'
} as const;