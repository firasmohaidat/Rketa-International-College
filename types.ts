
export enum UserRole {
  TEACHER = 'teacher',
  STUDENT = 'student',
  ADMIN = 'admin'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string; // Added for authentication
}

export interface Course {
  id: string;
  title: string;
  description: string;
  teacherId: string;
  createdAt: string;
}

export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',
  ESSAY = 'essay'
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  points: number;
  options?: string[]; // For multiple choice
  correctOptionIndex?: number; // For multiple choice
  modelAnswer?: string; // For essay AI grading
}

export interface ExamLog {
  id: string;
  action: string; // 'CREATED', 'UPDATED', 'STATUS_CHANGE'
  description: string;
  performedBy: string; // User Name
  timestamp: string;
}

export interface Exam {
  id: string;
  courseId: string; // Linked to Course
  title: string;
  description: string;
  durationMinutes: number;
  questions: Question[];
  isActive: boolean;
  createdAt: string;
  createdBy: string; // User ID
  createdByName: string; // User Name for display
  logs: ExamLog[]; // History of changes
  randomizeQuestions?: boolean; // Shuffle questions order
  randomizeOptions?: boolean;   // Shuffle MCQ options order
  requireFullscreen?: boolean;  // Force fullscreen mode
  enableTimer?: boolean; // Control if timer is enforced
}

export interface StudentAnswer {
  questionId: string;
  answer: string | number; // Index for MCQ, Text for Essay
}

export interface GradedAnswer extends StudentAnswer {
  score: number;
  feedback?: string; // AI Feedback
  isAutoGraded: boolean;
}

export interface ExamResult {
  id: string;
  examId: string;
  studentId: string;
  studentName: string;
  answers: GradedAnswer[];
  totalScore: number;
  maxScore: number;
  submittedAt: string;
  violationCount: number;
}

// AI Grading Response Schema
export interface AIGradingResult {
  score: number;
  feedback: string;
}