export type PostType = 'Urgencia' | 'Promoción' | 'Slot del día' | 'Comunidad' | 'Torneo' | 'Bono' | 'Otro';

export interface CalendarPost {
  id: string;
  time: string;
  type: string;
  visualConcept: string;
  copyText: string;
}

export interface CalendarDay {
  dayName: string;
  posts: CalendarPost[];
}

export interface WeeklyCalendar {
  days: CalendarDay[];
}

export interface SavedCalendar {
  id: string;
  createdAt: number;
  data: WeeklyCalendar;
  promptText?: string;
}

export interface AnalysisReport {
  summary: string;
  mostUsedGames: string[];
  suggestedGamesNotUsed: string[];
  strategicTips: string[];
  creativePostIdeas: {
    title: string;
    game: string;
    visualConcept: string;
    suggestedCopyText: string;
  }[];
}

export interface InstagramComment {
  id: string;
  username: string;
  text: string;
  timestamp: string;
  likesCount: number;
}

export interface InstagramExtractorResult {
  postUrl: string;
  postCaption: string;
  likesCount: number;
  commentsCount: number;
  comments: InstagramComment[];
}

export interface InstagramImprovementReport {
  originalAnalyzedConcept: string;
  originalFeedback: string;
  improvedTitle: string;
  improvedGameName: string;
  improvedVisualConcept: string;
  improvedCopyText: string;
  hygieneRecommendation: string;
}


