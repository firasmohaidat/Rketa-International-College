import React, { useState, useEffect, createContext, useContext, ReactNode, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { 
  User, 
  UserRole, 
  Course,
  Exam, 
  ExamResult, 
  Question, 
  QuestionType, 
  GradedAnswer, 
  StudentAnswer,
  ExamLog
} from './types';
import { gradeEssayAnswer } from './services/geminiService';
import { 
  LayoutDashboard, 
  BookOpen, 
  GraduationCap, 
  LogOut, 
  Plus, 
  Save, 
  CheckCircle, 
  Clock, 
  FileText,
  BrainCircuit,
  BarChart3,
  User as UserIcon,
  Share2,
  Library,
  Download,
  Link as LinkIcon,
  ArrowUpDown,
  Shield,
  Users,
  Trash2,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  History,
  X,
  ToggleLeft,
  ToggleRight,
  Upload,
  Maximize,
  AlertTriangle,
  Timer,
  Infinity as InfinityIcon,
  Edit,
  Image as ImageIcon,
  Settings
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// --- MOCK DATA ---
const MOCK_ADMIN: User = { 
  id: 'admin1', 
  name: 'د. فراس', 
  email: 'firasmohaidat@gmail.com', 
  role: UserRole.ADMIN,
  password: 'firasmohaidat@gmail.com'
};

const INITIAL_TEACHERS: User[] = [
  { id: 't1', name: 'أ. أحمد', email: 'teacher@school.com', role: UserRole.TEACHER, password: '123' },
  { id: 't2', name: 'أ. سارة', email: 'sara@school.com', role: UserRole.TEACHER, password: '123' }
];

const INITIAL_COURSES: Course[] = [
  {
    id: 'c1',
    title: 'علوم الحاسب 101',
    description: 'مقدمة في الخوارزميات والبرمجة',
    teacherId: 't1',
    createdAt: new Date().toISOString()
  },
  {
    id: 'c2',
    title: 'الرياضيات المتقدمة',
    description: 'التفاضل والتكامل',
    teacherId: 't2',
    createdAt: new Date().toISOString()
  }
];

const INITIAL_EXAMS: Exam[] = [
  {
    id: 'ex1',
    courseId: 'c1',
    title: 'أساسيات البرمجة',
    description: 'اختبار قصير حول مفاهيم البرمجة الأساسية ولغة الجافاسكريبت',
    durationMinutes: 15,
    isActive: true,
    randomizeQuestions: true,
    randomizeOptions: true,
    requireFullscreen: false,
    enableTimer: true,
    createdAt: new Date().toISOString(),
    createdBy: 't1',
    createdByName: 'أ. أحمد',
    logs: [
      {
        id: 'l1',
        action: 'CREATED',
        description: 'تم إنشاء الاختبار',
        performedBy: 'أ. أحمد',
        timestamp: new Date().toISOString()
      }
    ],
    questions: [
      {
        id: 'q1',
        type: QuestionType.MULTIPLE_CHOICE,
        text: 'ما هي نتيجة typeof null في JavaScript؟',
        points: 5,
        options: ['"null"', '"undefined"', '"object"', '"number"'],
        correctOptionIndex: 2
      },
      {
        id: 'q2',
        type: QuestionType.ESSAY,
        text: 'اشرح الفرق بين var و let في JavaScript.',
        points: 10,
        modelAnswer: 'var لها نطاق دالة (function scope) ويمكن إعادة تعريفها، بينما let لها نطاق كتلة (block scope) ولا يمكن إعادة تعريفها في نفس النطاق.'
      }
    ]
  }
];

// --- CONTEXT ---
interface AppContextType {
  user: User | null;
  teachers: User[];
  addTeacher: (teacher: User) => void;
  removeTeacher: (id: string) => void;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  registerGuestStudent: (name: string) => void;
  courses: Course[];
  addCourse: (course: Course) => void;
  removeCourse: (id: string) => void;
  exams: Exam[];
  addExam: (exam: Exam) => void;
  removeExam: (id: string) => void;
  toggleExamStatus: (id: string) => void;
  results: ExamResult[];
  submitExam: (examId: string, answers: StudentAnswer[], violationCount: number) => Promise<void>;
  updateExamResult: (resultId: string, updatedAnswers: GradedAnswer[]) => void;
  siteLogo: string | null;
  updateSiteLogo: (logo: string | null) => void;
  resetSystem: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('NIZAM_USER');
    return saved ? JSON.parse(saved) : null;
  });

  const [teachers, setTeachers] = useState<User[]>(() => {
    const saved = localStorage.getItem('NIZAM_TEACHERS');
    return saved ? JSON.parse(saved) : INITIAL_TEACHERS;
  });

  const [courses, setCourses] = useState<Course[]>(() => {
    const saved = localStorage.getItem('NIZAM_COURSES');
    return saved ? JSON.parse(saved) : INITIAL_COURSES;
  });

  const [exams, setExams] = useState<Exam[]>(() => {
    const saved = localStorage.getItem('NIZAM_EXAMS');
    return saved ? JSON.parse(saved) : INITIAL_EXAMS;
  });

  const [results, setResults] = useState<ExamResult[]>(() => {
    const saved = localStorage.getItem('NIZAM_RESULTS');
    return saved ? JSON.parse(saved) : [];
  });

  const [siteLogo, setSiteLogo] = useState<string | null>(() => {
    return localStorage.getItem('NIZAM_LOGO');
  });

  useEffect(() => {
    localStorage.setItem('NIZAM_USER', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('NIZAM_TEACHERS', JSON.stringify(teachers));
  }, [teachers]);

  useEffect(() => {
    localStorage.setItem('NIZAM_COURSES', JSON.stringify(courses));
  }, [courses]);

  useEffect(() => {
    localStorage.setItem('NIZAM_EXAMS', JSON.stringify(exams));
  }, [exams]);

  useEffect(() => {
    localStorage.setItem('NIZAM_RESULTS', JSON.stringify(results));
  }, [results]);

  const updateSiteLogo = (logo: string | null) => {
    setSiteLogo(logo);
    if (logo) {
      localStorage.setItem('NIZAM_LOGO', logo);
    } else {
      localStorage.removeItem('NIZAM_LOGO');
    }
  };

  const resetSystem = () => {
    if (window.confirm('هل أنت متأكد من حذف جميع البيانات؟\n\nسيتم حذف:\n- جميع المعلمين\n- جميع المساقات\n- جميع الاختبارات\n- جميع نتائج الطلاب\n\nهذا الإجراء لا يمكن التراجع عنه.')) {
      setTeachers([]);
      setCourses([]);
      setExams([]);
      setResults([]);
      setSiteLogo(null);
      alert('تمت إعادة ضبط النظام بنجاح.');
    }
  };

  const login = async (email: string, pass: string) => {
    if (email === MOCK_ADMIN.email && pass === MOCK_ADMIN.password) {
      setUser(MOCK_ADMIN);
      return true;
    }
    
    const teacher = teachers.find(t => t.email === email && t.password === pass);
    if (teacher) {
      setUser(teacher);
      return true;
    }

    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('NIZAM_USER');
  };

  const registerGuestStudent = (name: string) => {
    setUser({
      id: `guest-${Date.now()}`,
      name: name,
      email: '',
      role: UserRole.STUDENT
    });
  };

  const addTeacher = (teacher: User) => setTeachers([...teachers, teacher]);
  const removeTeacher = (id: string) => setTeachers(teachers.filter(t => t.id !== id));

  const addCourse = (course: Course) => setCourses([...courses, course]);
  const removeCourse = (id: string) => setCourses(courses.filter(c => c.id !== id));

  const addExam = (exam: Exam) => setExams([...exams, exam]);
  const removeExam = (id: string) => setExams(exams.filter(e => e.id !== id));

  const toggleExamStatus = (id: string) => {
    setExams(prevExams => prevExams.map(exam => {
      if (exam.id === id) {
        const newStatus = !exam.isActive;
        const log: ExamLog = {
          id: Date.now().toString(),
          action: 'STATUS_CHANGE',
          description: `تم تغيير حالة الاختبار إلى ${newStatus ? 'نشط' : 'غير نشط'}`,
          performedBy: user?.name || 'غير معروف',
          timestamp: new Date().toISOString()
        };
        return { ...exam, isActive: newStatus, logs: [...(exam.logs || []), log] };
      }
      return exam;
    }));
  };

  const submitExam = async (examId: string, answers: StudentAnswer[], violationCount: number) => {
    if (!user) return;
    
    const exam = exams.find(e => e.id === examId);
    if (!exam) return;

    let totalScore = 0;
    const maxScore = exam.questions.reduce((acc, q) => acc + q.points, 0);
    
    const gradedAnswers: GradedAnswer[] = await Promise.all(exam.questions.map(async (q) => {
      const studentAns = answers.find(a => a.questionId === q.id);
      const ansValue = studentAns ? studentAns.answer : '';
      
      if (q.type === QuestionType.MULTIPLE_CHOICE) {
        const isCorrect = ansValue === q.correctOptionIndex;
        const score = isCorrect ? q.points : 0;
        totalScore += score;
        return {
          questionId: q.id,
          answer: ansValue,
          score,
          isAutoGraded: true,
          feedback: isCorrect ? 'إجابة صحيحة' : 'إجابة خاطئة'
        };
      } else {
        if (q.modelAnswer && typeof ansValue === 'string') {
          const grading = await gradeEssayAnswer(q.text, q.modelAnswer, ansValue, q.points);
          totalScore += grading.score;
          return {
            questionId: q.id,
            answer: ansValue,
            score: grading.score,
            feedback: grading.feedback,
            isAutoGraded: true
          };
        }
        return {
          questionId: q.id,
          answer: ansValue,
          score: 0,
          feedback: 'بانتظار التصحيح',
          isAutoGraded: false
        };
      }
    }));

    const newResult: ExamResult = {
      id: Math.random().toString(36).substr(2, 9),
      examId,
      studentId: user.id,
      studentName: user.name,
      answers: gradedAnswers,
      totalScore,
      maxScore,
      submittedAt: new Date().toISOString(),
      violationCount
    };

    setResults(prev => [...prev, newResult]);
  };

  const updateExamResult = (resultId: string, updatedAnswers: GradedAnswer[]) => {
    setResults(prevResults => prevResults.map(r => {
      if (r.id === resultId) {
        const newTotalScore = updatedAnswers.reduce((acc, curr) => acc + curr.score, 0);
        return {
          ...r,
          answers: updatedAnswers,
          totalScore: newTotalScore
        };
      }
      return r;
    }));
  };

  return (
    <AppContext.Provider value={{ 
      user, login, logout, registerGuestStudent, 
      teachers, addTeacher, removeTeacher,
      courses, addCourse, removeCourse,
      exams, addExam, removeExam, toggleExamStatus,
      results, submitExam, updateExamResult,
      siteLogo, updateSiteLogo, resetSystem
    }}>
      {children}
    </AppContext.Provider>
  );
};

const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within AppProvider");
  return context;
};

// --- SHARED UTILS ---
const shareContent = async (title: string, text: string, url?: string) => {
  if (navigator.share && url) {
    try {
      await navigator.share({
        title,
        text,
        url
      });
    } catch (err) {
      console.log('Share cancelled or failed', err);
    }
  } else {
    try {
      const contentToCopy = url ? `${text}\n${url}` : text;
      await navigator.clipboard.writeText(contentToCopy);
      alert(url ? 'تم نسخ الرابط إلى الحافظة!' : 'تم نسخ النص إلى الحافظة!');
    } catch (err) {
      console.error('Clipboard write failed', err);
      alert('عذراً، المتصفح لا يدعم المشاركة.');
    }
  }
};

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// --- COMPONENTS ---

const Sidebar = () => {
  const { user, logout, siteLogo } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const activeClass = "bg-indigo-700 text-white";
  const inactiveClass = "text-indigo-100 hover:bg-indigo-600";

  return (
    <div className="w-64 bg-indigo-800 text-white min-h-screen flex flex-col fixed right-0 top-0 z-20 transition-all duration-300">
      <div className="p-6 border-b border-indigo-700 flex items-center gap-3">
        {siteLogo ? (
          <img src={siteLogo} alt="Logo" className="w-10 h-10 object-contain bg-white rounded-full p-1" />
        ) : (
          <BrainCircuit className="w-8 h-8 text-yellow-400" />
        )}
        <h1 className="text-lg font-bold leading-tight">نظام اختبارات كلية ركيتا</h1>
      </div>
      
      <div className="p-4 flex items-center gap-3 bg-indigo-900/50">
        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-900">
          {user.role === UserRole.ADMIN ? <Shield className="w-6 h-6" /> : <UserIcon className="w-6 h-6" />}
        </div>
        <div>
          <p className="font-semibold text-sm">{user.name}</p>
          <p className="text-xs text-indigo-300">
            {user.role === UserRole.TEACHER ? 'معلم' : user.role === UserRole.ADMIN ? 'مدير النظام' : 'طالب'}
          </p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {user.role === UserRole.ADMIN && (
          <>
             <button onClick={() => navigate('/admin/dashboard')} className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive('/admin/dashboard') ? activeClass : inactiveClass}`}>
              <LayoutDashboard className="w-5 h-5" /> لوحة التحكم
            </button>
            <button onClick={() => navigate('/admin/teachers')} className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive('/admin/teachers') ? activeClass : inactiveClass}`}>
              <Users className="w-5 h-5" /> إدارة المعلمين
            </button>
            <div className="border-t border-indigo-700 my-2 pt-2 text-xs text-indigo-300 font-bold px-3">إدارة النظام</div>
            <button onClick={() => navigate('/teacher/courses')} className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive('/teacher/courses') ? activeClass : inactiveClass}`}>
              <Library className="w-5 h-5" /> المساقات الدراسية
            </button>
            <button onClick={() => navigate('/teacher/exams')} className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive('/teacher/exams') ? activeClass : inactiveClass}`}>
              <BookOpen className="w-5 h-5" /> الاختبارات
            </button>
            <button onClick={() => navigate('/teacher/reports')} className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive('/teacher/reports') ? activeClass : inactiveClass}`}>
              <BarChart3 className="w-5 h-5" /> النتائج والتقارير
            </button>
          </>
        )}

        {user.role === UserRole.TEACHER && (
          <>
            <button onClick={() => navigate('/teacher/dashboard')} className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive('/teacher/dashboard') ? activeClass : inactiveClass}`}>
              <LayoutDashboard className="w-5 h-5" /> لوحة التحكم
            </button>
            <button onClick={() => navigate('/teacher/courses')} className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive('/teacher/courses') ? activeClass : inactiveClass}`}>
              <Library className="w-5 h-5" /> إدارة المساقات
            </button>
            <button onClick={() => navigate('/teacher/exams')} className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive('/teacher/exams') ? activeClass : inactiveClass}`}>
              <BookOpen className="w-5 h-5" /> إدارة الاختبارات
            </button>
            <button onClick={() => navigate('/teacher/reports')} className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive('/teacher/reports') ? activeClass : inactiveClass}`}>
              <BarChart3 className="w-5 h-5" /> النتائج والتقارير
            </button>
          </>
        )}

        {user.role === UserRole.STUDENT && (
          <>
            <button onClick={() => navigate('/student/dashboard')} className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive('/student/dashboard') ? activeClass : inactiveClass}`}>
              <LayoutDashboard className="w-5 h-5" /> اختباراتي
            </button>
            <button onClick={() => navigate('/student/results')} className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive('/student/results') ? activeClass : inactiveClass}`}>
              <GraduationCap className="w-5 h-5" /> نتائجي
            </button>
          </>
        )}
      </nav>

      <div className="p-4 border-t border-indigo-700">
        <button onClick={() => { logout(); navigate('/'); }} className="w-full flex items-center gap-3 p-3 rounded-lg text-red-200 hover:bg-red-900/30 hover:text-red-100 transition-colors">
          <LogOut className="w-5 h-5" /> تسجيل الخروج
        </button>
      </div>
    </div>
  );
};

// --- LOGIN COMPONENT ---
const Login = () => {
  const { login, user, siteLogo } = useAppContext();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
       if (user.role === UserRole.ADMIN) navigate('/admin/dashboard');
       else if (user.role === UserRole.TEACHER) navigate('/teacher/dashboard');
       else navigate('/student/dashboard');
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const success = await login(email, password);
    if (!success) {
      setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-purple-500"></div>
        <div className="flex justify-center mb-6">
          <div className="bg-indigo-50 p-4 rounded-full shadow-inner">
            {siteLogo ? (
               <img src={siteLogo} alt="Logo" className="w-24 h-24 object-contain" />
            ) : (
               <BrainCircuit className="w-12 h-12 text-indigo-600" />
            )}
          </div>
        </div>
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">تسجيل الدخول</h2>
        <p className="text-center text-gray-500 mb-8">نظام اختبارات كلية ركيتا</p>
        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2 border border-red-100">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <UserIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input type="email" required className="block w-full pr-10 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور</label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input type={showPassword ? "text" : "password"} required className="block w-full pr-10 pl-10 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer">
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed">
            {isLoading ? 'جاري التحقق...' : 'دخول'}
          </button>
        </form>
        <div className="mt-8 pt-6 border-t border-gray-100 text-center text-xs text-gray-400">
           للطلاب: يرجى استخدام رابط الاختبار المرسل إليك للدخول المباشر.
        </div>
      </div>
    </div>
  );
};

// --- STUDENT EXAM PAGE ---

interface ExtendedQuestion extends Question {
  originalIndices?: number[];
}

const StudentExamPage = () => {
  const { exams, submitExam, user, registerGuestStudent, siteLogo } = useAppContext();
  const { examId } = useParams();
  const navigate = useNavigate();
  
  const [exam, setExam] = useState<Exam | undefined>(undefined);
  const [questions, setQuestions] = useState<ExtendedQuestion[]>([]);
  const [answers, setAnswers] = useState<StudentAnswer[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  
  // Guest State
  const [guestName, setGuestName] = useState('');

  // Proctoring State
  const [violationCount, setViolationCount] = useState(0);
  const [showViolationWarning, setShowViolationWarning] = useState(false);
  
  // Fullscreen State
  const [hasStarted, setHasStarted] = useState(false);

  const handleSubmitRef = useRef<(auto?: boolean) => void>(() => {});

  useEffect(() => {
    const foundExam = exams.find(e => e.id === examId);
    if (foundExam) {
      setExam(foundExam);
      setTimeLeft(foundExam.durationMinutes * 60);

      let qList: ExtendedQuestion[] = [...foundExam.questions];
      if (foundExam.randomizeQuestions) {
         qList = shuffleArray(qList);
      }
      if (foundExam.randomizeOptions) {
         qList = qList.map(q => {
            if (q.type === QuestionType.MULTIPLE_CHOICE && q.options) {
               const indices = q.options.map((_, i) => i);
               const shuffledIndices = shuffleArray(indices);
               const newOptions = shuffledIndices.map(i => q.options![i]);
               return { ...q, options: newOptions, originalIndices: shuffledIndices };
            }
            return q;
         });
      }
      setQuestions(qList);
    }
  }, [examId, exams]);

  useEffect(() => {
    if (!hasStarted || !exam || !exam.enableTimer) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitRef.current(true); 
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [hasStarted, exam?.enableTimer]);

  useEffect(() => {
    if (!hasStarted || !exam) return;
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setViolationCount(prev => prev + 1);
        setShowViolationWarning(true);
        setTimeout(() => setShowViolationWarning(false), 4000);
      }
    };
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && exam.requireFullscreen) {
          setViolationCount(prev => prev + 1);
          setShowViolationWarning(true);
          alert("تحذير: الخروج من وضع ملء الشاشة يعتبر مخالفة!");
          setTimeout(() => setShowViolationWarning(false), 4000);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
       document.removeEventListener("visibilitychange", handleVisibilityChange);
       document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [hasStarted, exam]);

  if (!exam) return <div className="text-center py-10">جارِ تحميل الاختبار...</div>;

  // Guest Access
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
         <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
               {siteLogo ? <img src={siteLogo} className="w-12 h-12 object-contain" /> : <UserIcon className="w-8 h-8 text-indigo-600" />}
            </div>
            <h2 className="text-2xl font-bold mb-2">{exam.title}</h2>
            <p className="text-gray-500 mb-6">يرجى إدخال اسمك الثلاثي لبدء الاختبار</p>
            <input 
              type="text" 
              className="w-full p-4 border border-gray-300 rounded-xl mb-4 focus:ring-2 focus:ring-indigo-500 outline-none text-center text-lg"
              placeholder="الاسم الثلاثي"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
            />
            <button 
              onClick={() => {
                 if(guestName.trim().length < 3) { alert("يرجى إدخال اسم صحيح"); return; }
                 registerGuestStudent(guestName);
              }}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors"
            >
               دخول للاختبار
            </button>
         </div>
      </div>
    );
  }

  const enterFullscreen = async () => {
      try {
          await document.documentElement.requestFullscreen();
          setHasStarted(true);
      } catch (err) {
          console.error("Fullscreen denied", err);
          alert("يجب الموافقة على وضع ملء الشاشة لبدء الاختبار.");
      }
  };

  if (exam.requireFullscreen && !hasStarted) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4 text-center">
              <Maximize className="w-16 h-16 text-indigo-500 mb-4 animate-pulse" />
              <h2 className="text-3xl font-bold mb-2">مطلوب وضع ملء الشاشة</h2>
              <p className="text-gray-400 mb-8 max-w-md">هذا الاختبار يتطلب وضع ملء الشاشة لضمان النزاهة.</p>
              <button onClick={enterFullscreen} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-full font-bold text-lg transition-all shadow-lg">دخول وضع ملء الشاشة وبدء الاختبار</button>
          </div>
      );
  }

  if (!hasStarted && !exam.requireFullscreen) setHasStarted(true);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleAnswerChange = (qId: string, val: string | number) => {
    setAnswers(prev => {
      const existing = prev.findIndex(a => a.questionId === qId);
      if (existing >= 0) {
        const newArr = [...prev];
        newArr[existing] = { questionId: qId, answer: val };
        return newArr;
      }
      return [...prev, { questionId: qId, answer: val }];
    });
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (!autoSubmit && !confirm('هل أنت متأكد من تسليم الإجابات؟ لا يمكن التراجع بعد ذلك.')) return;
    setIsSubmitting(true);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});

    const finalAnswers = answers.map(ans => {
        const question = questions.find(q => q.id === ans.questionId);
        if (question && question.type === QuestionType.MULTIPLE_CHOICE && question.originalIndices && typeof ans.answer === 'number') {
            const originalIndex = question.originalIndices[ans.answer];
            return { ...ans, answer: originalIndex };
        }
        return ans;
    });

    await submitExam(exam.id, finalAnswers, violationCount);
    navigate('/student/results');
  };
  
  handleSubmitRef.current = handleSubmit;

  const progressPercentage = questions.length > 0 ? (answers.length / questions.length) * 100 : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6 relative pb-20">
       <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-indigo-100 shadow-sm rounded-b-xl p-4 -mx-4 mb-6">
          <div className="max-w-3xl mx-auto flex items-center justify-between mb-2">
              <div className="font-bold text-gray-700 text-sm md:text-base truncate max-w-[200px]">{exam.title}</div>
              {exam.enableTimer ? (
                <div className={`flex items-center gap-2 font-mono font-bold text-lg px-3 py-1 rounded-lg ${timeLeft < 60 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-indigo-50 text-indigo-600'}`}>
                    <Timer className="w-5 h-5" /> {formatTime(timeLeft)}
                </div>
              ) : (
                <div className="flex items-center gap-2 font-bold text-gray-500 text-sm"><InfinityIcon className="w-4 h-4" /> وقت مفتوح</div>
              )}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
          </div>
       </div>

       {showViolationWarning && (
         <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-3 animate-bounce">
            <AlertTriangle className="w-6 h-6 text-yellow-300" />
            <div><p className="font-bold">تحذير!</p><p className="text-sm">تم رصد سلوك مشبوه. سيتم تسجيل ذلك.</p></div>
         </div>
       )}

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold mb-2">{exam.title}</h2>
        <p className="text-gray-500">{exam.description}</p>
      </div>

      <div className="space-y-6">
        {questions.map((q, idx) => (
          <div key={q.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between mb-4">
               <h3 className="font-bold text-lg">سؤال {idx + 1}</h3>
               <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 h-fit">{q.points} درجات</span>
            </div>
            <p className="mb-4 text-gray-800 font-medium">{q.text}</p>
            
            {q.type === QuestionType.MULTIPLE_CHOICE ? (
              <div className="space-y-3">
                {q.options?.map((opt, optIdx) => (
                  <label key={optIdx} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                    <input type="radio" name={`q-${q.id}`} className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                      onChange={() => handleAnswerChange(q.id, optIdx)}
                      checked={answers.find(a => a.questionId === q.id)?.answer === optIdx}
                    />
                    <span className="text-gray-700">{opt}</span>
                  </label>
                ))}
              </div>
            ) : (
              <textarea className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none min-h-[150px]"
                placeholder="اكتب إجابتك هنا..."
                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                value={(answers.find(a => a.questionId === q.id)?.answer as string) || ''}
              />
            )}
          </div>
        ))}
      </div>
      <div className="sticky bottom-6">
        <button onClick={() => handleSubmit(false)} disabled={isSubmitting} className="w-full bg-indigo-600 text-white py-4 rounded-xl shadow-lg hover:bg-indigo-700 font-bold text-lg transition-all flex items-center justify-center gap-2">
          {isSubmitting ? 'جاري التسليم...' : 'تسليم الاختبار'} <CheckCircle className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

// --- EXAM MANAGER (Fixed with Upload/Template) ---

const ExamManager = () => {
  const { exams, courses, addExam, removeExam, toggleExamStatus, user } = useAppContext();
  const [isCreating, setIsCreating] = useState(false);
  const [newExam, setNewExam] = useState<Partial<Exam>>({
    title: '', description: '', durationMinutes: 30, courseId: '', questions: [], 
    randomizeQuestions: false, randomizeOptions: false, requireFullscreen: false, enableTimer: false
  });
  const [currentQuestion, setCurrentQuestion] = useState<Partial<Question>>({ type: QuestionType.MULTIPLE_CHOICE, options: ['', '', '', ''], correctOptionIndex: 0, points: 1, text: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const myExams = user?.role === UserRole.ADMIN ? exams : exams.filter(e => e.createdBy === user?.id);

  const handleAddQuestion = () => {
    if (!newExam.questions) return;
    setNewExam({
      ...newExam,
      questions: [...newExam.questions, { ...currentQuestion, id: Date.now().toString() } as Question]
    });
    setCurrentQuestion({ type: QuestionType.MULTIPLE_CHOICE, options: ['', '', '', ''], correctOptionIndex: 0, points: 1, text: '' });
  };

  const handleSaveExam = () => {
    if (!user || !newExam.title || !newExam.courseId) return;
    addExam({
      id: Date.now().toString(),
      ...newExam as Exam,
      isActive: true,
      createdAt: new Date().toISOString(),
      createdBy: user.id,
      createdByName: user.name,
      logs: []
    });
    setIsCreating(false);
    setNewExam({ title: '', description: '', durationMinutes: 30, courseId: '', questions: [], randomizeQuestions: false, randomizeOptions: false, requireFullscreen: false, enableTimer: false });
  };

  const handleDownloadTemplate = () => {
    const data = [{ 'نص السؤال': 'سؤال مثال', 'النوع': 'اختياري', 'الدرجة': 5, 'الخيار 1': 'أ', 'الخيار 2': 'ب', 'الإجابة': 'أ' }];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "template.xlsx");
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
       const bstr = evt.target?.result;
       const wb = XLSX.read(bstr, { type: 'binary' });
       const ws = wb.Sheets[wb.SheetNames[0]];
       const data = XLSX.utils.sheet_to_json(ws);
       const imported: Question[] = data.map((row: any) => ({
          id: Date.now().toString() + Math.random(),
          text: row['نص السؤال'] || row['Question'],
          type: (row['النوع']?.includes('مقال')) ? QuestionType.ESSAY : QuestionType.MULTIPLE_CHOICE,
          points: row['الدرجة'] || 5,
          options: [row['الخيار 1'], row['الخيار 2'], row['الخيار 3'], row['الخيار 4']].filter(Boolean),
          correctOptionIndex: 0 // Default, simplified
       }));
       setNewExam(prev => ({ ...prev, questions: [...(prev.questions || []), ...imported] }));
    };
    reader.readAsBinaryString(file);
  };

  if (isCreating) {
    return (
      <div className="space-y-6">
         <div className="flex items-center justify-between">
           <h2 className="text-2xl font-bold">إنشاء اختبار جديد</h2>
           <button onClick={() => setIsCreating(false)} className="text-gray-500 hover:text-gray-700">إلغاء</button>
         </div>
         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input placeholder="عنوان الاختبار" className="p-3 border rounded-lg" value={newExam.title} onChange={e => setNewExam({...newExam, title: e.target.value})} />
              <select className="p-3 border rounded-lg" value={newExam.courseId} onChange={e => setNewExam({...newExam, courseId: e.target.value})}>
                 <option value="">اختر المساق</option>
                 {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <textarea placeholder="وصف الاختبار" className="w-full p-3 border rounded-lg" value={newExam.description} onChange={e => setNewExam({...newExam, description: e.target.value})} />
            
            <div className="flex flex-wrap gap-4">
               <div className="w-32"><label className="text-xs font-bold block mb-1">المدة (د)</label><input type="number" className="w-full p-2 border rounded" value={newExam.durationMinutes} onChange={e => setNewExam({...newExam, durationMinutes: parseInt(e.target.value)})} /></div>
               <div className="flex items-center gap-2 pt-5"><input type="checkbox" checked={newExam.randomizeQuestions} onChange={e => setNewExam({...newExam, randomizeQuestions: e.target.checked})} /><label>خلط الأسئلة</label></div>
               <div className="flex items-center gap-2 pt-5"><input type="checkbox" checked={newExam.randomizeOptions} onChange={e => setNewExam({...newExam, randomizeOptions: e.target.checked})} /><label>خلط الخيارات</label></div>
               <div className="flex items-center gap-2 pt-5"><input type="checkbox" checked={newExam.requireFullscreen} onChange={e => setNewExam({...newExam, requireFullscreen: e.target.checked})} /><label>فرض ملء الشاشة</label></div>
               <div className="flex items-center gap-2 pt-5"><input type="checkbox" checked={newExam.enableTimer} onChange={e => setNewExam({...newExam, enableTimer: e.target.checked})} /><label>تفعيل المؤقت</label></div>
            </div>

            <div className="border-t pt-4 mt-4">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold">الأسئلة</h3>
                  <div className="flex gap-2">
                     <button onClick={handleDownloadTemplate} className="text-xs bg-gray-100 px-3 py-1 rounded border flex items-center gap-1"><Download className="w-3 h-3"/> قالب</button>
                     <div className="relative">
                        <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls" onChange={handleExcelUpload} />
                        <button onClick={() => fileInputRef.current?.click()} className="text-xs bg-green-600 text-white px-3 py-1 rounded flex items-center gap-1"><Upload className="w-3 h-3"/> استيراد</button>
                     </div>
                  </div>
               </div>
               
               <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div className="flex gap-2 mb-2">
                     <button onClick={() => setCurrentQuestion({...currentQuestion, type: QuestionType.MULTIPLE_CHOICE})} className={`px-3 py-1 rounded ${currentQuestion.type === QuestionType.MULTIPLE_CHOICE ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>اختيار من متعدد</button>
                     <button onClick={() => setCurrentQuestion({...currentQuestion, type: QuestionType.ESSAY})} className={`px-3 py-1 rounded ${currentQuestion.type === QuestionType.ESSAY ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>مقالي</button>
                  </div>
                  <input placeholder="نص السؤال" className="w-full p-2 border rounded" value={currentQuestion.text || ''} onChange={e => setCurrentQuestion({...currentQuestion, text: e.target.value})} />
                  <input type="number" placeholder="الدرجات" className="w-24 p-2 border rounded" value={currentQuestion.points} onChange={e => setCurrentQuestion({...currentQuestion, points: parseInt(e.target.value)})} />
                  
                  {currentQuestion.type === QuestionType.MULTIPLE_CHOICE && (
                    <div className="space-y-2">
                       {currentQuestion.options?.map((opt, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                             <input type="radio" name="correctOption" checked={currentQuestion.correctOptionIndex === idx} onChange={() => setCurrentQuestion({...currentQuestion, correctOptionIndex: idx})} />
                             <input className="flex-1 p-2 border rounded" placeholder={`خيار ${idx+1}`} value={opt} onChange={(e) => {
                                const newOpts = [...(currentQuestion.options || [])];
                                newOpts[idx] = e.target.value;
                                setCurrentQuestion({...currentQuestion, options: newOpts});
                             }} />
                          </div>
                       ))}
                    </div>
                  )}
                  {currentQuestion.type === QuestionType.ESSAY && (
                     <textarea placeholder="الإجابة النموذجية" className="w-full p-2 border rounded" value={currentQuestion.modelAnswer || ''} onChange={e => setCurrentQuestion({...currentQuestion, modelAnswer: e.target.value})} />
                  )}
                  <button onClick={handleAddQuestion} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">إضافة السؤال</button>
               </div>
               <div className="mt-4 space-y-2">
                  {newExam.questions?.map((q, i) => (
                     <div key={i} className="p-3 border rounded flex justify-between bg-gray-50">
                        <span>{i+1}. {q.text}</span>
                        <span className="text-sm bg-gray-200 px-2 rounded">{q.type}</span>
                     </div>
                  ))}
               </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
               <button onClick={handleSaveExam} className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700">حفظ الاختبار</button>
            </div>
         </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <h2 className="text-2xl font-bold text-gray-800">إدارة الاختبارات</h2>
         <button onClick={() => setIsCreating(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700"><Plus className="w-5 h-5" /> اختبار جديد</button>
      </div>
      <div className="grid gap-4">
         {myExams.map(exam => (
            <div key={exam.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
               <div>
                  <div className="flex items-center gap-3 mb-1">
                     <h3 className="font-bold text-lg">{exam.title}</h3>
                     <span className={`px-2 py-0.5 rounded text-xs ${exam.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{exam.isActive ? 'نشط' : 'مغلق'}</span>
                  </div>
                  <p className="text-sm text-gray-500">{courses.find(c => c.id === exam.courseId)?.title} • {exam.questions.length} أسئلة</p>
               </div>
               <div className="flex items-center gap-2">
                  <button onClick={() => { shareContent(exam.title, `اختبار: ${exam.title}`, `${window.location.origin}/#/student/exam/${exam.id}`); }} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"><Share2 className="w-5 h-5" /></button>
                  <button onClick={() => toggleExamStatus(exam.id)} className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg">{exam.isActive ? <ToggleRight className="w-6 h-6 text-green-600" /> : <ToggleLeft className="w-6 h-6 text-gray-400" />}</button>
                  <button onClick={() => removeExam(exam.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-5 h-5" /></button>
               </div>
            </div>
         ))}
      </div>
    </div>
  );
};

// --- TEACHER REPORTS (Fixed with Grading Modal) ---

const GradingModal = ({ result, exam, onClose, onSave }: { result: ExamResult, exam: Exam, onClose: () => void, onSave: (rId: string, answers: GradedAnswer[]) => void }) => {
  const [editedAnswers, setEditedAnswers] = useState<GradedAnswer[]>(result.answers);

  const handleScoreChange = (qId: string, newScore: number) => {
    setEditedAnswers(prev => prev.map(a => a.questionId === qId ? { ...a, score: newScore } : a));
  };

  const handleFeedbackChange = (qId: string, newFeedback: string) => {
    setEditedAnswers(prev => prev.map(a => a.questionId === qId ? { ...a, feedback: newFeedback } : a));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="font-bold">تعديل درجات الطالب: {result.studentName}</h3>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {exam.questions.map((q, i) => {
            const ans = editedAnswers.find(a => a.questionId === q.id);
            return (
              <div key={q.id} className="border rounded-lg p-4">
                <p className="font-bold mb-2">س{i+1}: {q.text} <span className="text-xs bg-gray-200 px-2 rounded">MAX: {q.points}</span></p>
                <div className="bg-gray-50 p-2 rounded mb-2"><span className="font-bold text-xs text-gray-500">إجابة الطالب:</span> <p>{ans?.answer}</p></div>
                {q.modelAnswer && <div className="bg-blue-50 p-2 rounded mb-2"><span className="font-bold text-xs text-blue-500">النموذج:</span> <p className="text-xs text-gray-600">{q.modelAnswer}</p></div>}
                <div className="flex gap-4 mt-2">
                   <div className="flex-1">
                      <label className="text-xs font-bold">الدرجة</label>
                      <input type="number" max={q.points} className="w-full p-1 border rounded" value={ans?.score} onChange={e => handleScoreChange(q.id, Number(e.target.value))} />
                   </div>
                   <div className="flex-[3]">
                      <label className="text-xs font-bold">ملاحظات</label>
                      <input type="text" className="w-full p-1 border rounded" value={ans?.feedback || ''} onChange={e => handleFeedbackChange(q.id, e.target.value)} />
                   </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="p-4 border-t flex justify-end gap-2">
           <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">إلغاء</button>
           <button onClick={() => onSave(result.id, editedAnswers)} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">حفظ التعديلات</button>
        </div>
      </div>
    </div>
  );
};

const TeacherReports = () => {
  const { results, exams, updateExamResult } = useAppContext();
  const [editingResult, setEditingResult] = useState<{ result: ExamResult, exam: Exam } | null>(null);

  const exportToExcel = () => {
    const data = results.map(r => ({
       student: r.studentName,
       exam: exams.find(e => e.id === r.examId)?.title,
       score: r.totalScore,
       max: r.maxScore,
       date: new Date(r.submittedAt).toLocaleDateString(),
       violations: r.violationCount
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Results");
    XLSX.writeFile(wb, "exam_results.xlsx");
  };

  return (
     <div className="space-y-6">
        {editingResult && (
          <GradingModal 
            result={editingResult.result} 
            exam={editingResult.exam} 
            onClose={() => setEditingResult(null)} 
            onSave={(id, ans) => { updateExamResult(id, ans); setEditingResult(null); }} 
          />
        )}
        <div className="flex justify-between items-center">
           <h2 className="text-2xl font-bold text-gray-800">التقارير والنتائج</h2>
           <button onClick={exportToExcel} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
              <Download className="w-4 h-4" /> تصدير Excel
           </button>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
           <table className="w-full text-right">
              <thead className="bg-gray-50 text-gray-600 text-sm font-semibold uppercase">
                 <tr>
                    <th className="p-4">الطالب</th>
                    <th className="p-4">الاختبار</th>
                    <th className="p-4">الدرجة</th>
                    <th className="p-4">مخالفات</th>
                    <th className="p-4">إجراءات</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                 {results.map(r => {
                    const exam = exams.find(e => e.id === r.examId);
                    return (
                    <tr key={r.id} className="hover:bg-gray-50">
                       <td className="p-4 font-medium">{r.studentName}</td>
                       <td className="p-4 text-gray-600">{exam?.title}</td>
                       <td className="p-4 font-bold text-indigo-600">{r.totalScore} / {r.maxScore}</td>
                       <td className="p-4 text-red-500 font-bold">{r.violationCount > 0 ? r.violationCount : '-'}</td>
                       <td className="p-4">
                          <button onClick={() => exam && setEditingResult({ result: r, exam })} className="text-indigo-600 hover:bg-indigo-50 p-2 rounded" title="تصحيح يدوي">
                             <Edit className="w-4 h-4" />
                          </button>
                       </td>
                    </tr>
                 )})}
              </tbody>
           </table>
        </div>
     </div>
  );
};

// --- ADMIN & DASHBOARDS ---

const AdminDashboard = () => {
  const { teachers, courses, exams, updateSiteLogo, siteLogo, resetSystem } = useAppContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
       const reader = new FileReader();
       reader.onload = (ev) => updateSiteLogo(ev.target?.result as string);
       reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-800">لوحة تحكم المدير</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border flex items-center gap-4"><div className="p-4 rounded-xl text-white bg-blue-500"><Users className="w-6 h-6" /></div><div><p className="text-gray-500 text-sm">المعلمين</p><p className="text-2xl font-bold">{teachers.length}</p></div></div>
        <div className="bg-white p-6 rounded-xl shadow-sm border flex items-center gap-4"><div className="p-4 rounded-xl text-white bg-purple-500"><Library className="w-6 h-6" /></div><div><p className="text-gray-500 text-sm">المساقات</p><p className="text-2xl font-bold">{courses.length}</p></div></div>
        <div className="bg-white p-6 rounded-xl shadow-sm border flex items-center gap-4"><div className="p-4 rounded-xl text-white bg-indigo-500"><FileText className="w-6 h-6" /></div><div><p className="text-gray-500 text-sm">الاختبارات</p><p className="text-2xl font-bold">{exams.length}</p></div></div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex gap-6">
         <div className="flex-1">
            <h3 className="font-bold mb-2">إعدادات النظام</h3>
            <div className="flex items-center gap-4">
               {siteLogo && <img src={siteLogo} className="w-16 h-16 object-contain border rounded" />}
               <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
               <button onClick={() => fileInputRef.current?.click()} className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded text-sm font-bold flex gap-2"><Upload className="w-4 h-4"/> تغيير الشعار</button>
            </div>
         </div>
         <div className="border-r pr-6 flex-1">
             <h3 className="font-bold mb-2 text-red-600">منطقة الخطر</h3>
             <button onClick={resetSystem} className="bg-red-50 text-red-600 px-4 py-2 rounded text-sm font-bold flex gap-2"><Trash2 className="w-4 h-4"/> إعادة ضبط المصنع (حذف الكل)</button>
         </div>
      </div>
    </div>
  );
};

const TeacherManager = () => {
  const { teachers, addTeacher, removeTeacher } = useAppContext();
  const [newTeacher, setNewTeacher] = useState({ name: '', email: '', password: '' });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    addTeacher({ id: Date.now().toString(), ...newTeacher, role: UserRole.TEACHER });
    setNewTeacher({ name: '', email: '', password: '' });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">إدارة المعلمين</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-white p-6 rounded-xl shadow-sm border">
           <h3 className="font-bold mb-4">إضافة معلم</h3>
           <form onSubmit={handleAdd} className="space-y-4">
             <input required className="w-full p-2 border rounded" placeholder="الاسم" value={newTeacher.name} onChange={e => setNewTeacher({...newTeacher, name: e.target.value})} />
             <input type="email" required className="w-full p-2 border rounded" placeholder="البريد" value={newTeacher.email} onChange={e => setNewTeacher({...newTeacher, email: e.target.value})} />
             <input type="password" required className="w-full p-2 border rounded" placeholder="كلمة المرور" value={newTeacher.password} onChange={e => setNewTeacher({...newTeacher, password: e.target.value})} />
             <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700">إضافة</button>
           </form>
        </div>
        <div className="md:col-span-2 space-y-4">
           {teachers.map(t => (
             <div key={t.id} className="bg-white p-4 rounded-xl shadow-sm border flex justify-between items-center">
               <div><p className="font-bold">{t.name}</p><p className="text-sm text-gray-500">{t.email}</p></div>
               <button onClick={() => removeTeacher(t.id)} className="text-red-500 bg-red-50 p-2 rounded"><Trash2 className="w-5 h-5" /></button>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};

const TeacherDashboard = () => {
   const { courses, exams, user, results } = useAppContext();
   const myCourses = courses.filter(c => c.teacherId === user?.id);
   const myExams = exams.filter(e => e.createdBy === user?.id);
   return (
      <div className="space-y-8">
         <h2 className="text-2xl font-bold text-gray-800">لوحة المعلم</h2>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border"><p className="text-gray-500">مساقاتي</p><h3 className="text-3xl font-bold text-indigo-600">{myCourses.length}</h3></div>
            <div className="bg-white p-6 rounded-xl shadow-sm border"><p className="text-gray-500">اختباراتي</p><h3 className="text-3xl font-bold text-purple-600">{myExams.length}</h3></div>
            <div className="bg-white p-6 rounded-xl shadow-sm border"><p className="text-gray-500">النتائج</p><h3 className="text-3xl font-bold text-green-600">{results.filter(r => myExams.some(e => e.id === r.examId)).length}</h3></div>
         </div>
      </div>
   );
};

const StudentDashboard = () => {
  const { exams, user } = useAppContext();
  const navigate = useNavigate();
  const activeExams = exams.filter(e => e.isActive);
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-8"><div className="bg-indigo-100 p-3 rounded-full"><LayoutDashboard className="w-8 h-8 text-indigo-600" /></div><div><h2 className="text-2xl font-bold text-gray-800">مرحباً، {user?.name}</h2></div></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {activeExams.map(exam => (
            <div key={exam.id} className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
               <h4 className="font-bold text-lg mb-2">{exam.title}</h4>
               <p className="text-gray-500 text-sm mb-4">{exam.description}</p>
               <div className="flex gap-4 text-sm text-gray-500 mb-6"><span className="flex gap-1"><Clock className="w-4 h-4" /> {exam.durationMinutes}د</span><span className="flex gap-1"><FileText className="w-4 h-4" /> {exam.questions.length}س</span></div>
               <button onClick={() => navigate(`/student/exam/${exam.id}`)} className="w-full bg-indigo-600 text-white py-2 rounded-lg font-bold hover:bg-indigo-700">ابدأ الاختبار</button>
            </div>
         ))}
      </div>
    </div>
  );
};

const CourseManager = () => {
  const { courses, addCourse, removeCourse, user } = useAppContext();
  const [newCourse, setNewCourse] = useState<{ title: string, description: string }>({ title: '', description: '' });

  const myCourses = user?.role === UserRole.ADMIN ? courses : courses.filter(c => c.teacherId === user?.id);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newCourse.title) return;
    addCourse({
      id: Date.now().toString(),
      title: newCourse.title,
      description: newCourse.description,
      teacherId: user.id,
      createdAt: new Date().toISOString()
    });
    setNewCourse({ title: '', description: '' });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">إدارة المساقات</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
           <h3 className="font-bold mb-4">إضافة مساق جديد</h3>
           <form onSubmit={handleAdd} className="space-y-4">
             <input required className="w-full p-2 border rounded" placeholder="اسم المساق" value={newCourse.title} onChange={e => setNewCourse({...newCourse, title: e.target.value})} />
             <textarea className="w-full p-2 border rounded" placeholder="وصف المساق" value={newCourse.description} onChange={e => setNewCourse({...newCourse, description: e.target.value})} />
             <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700">إضافة</button>
           </form>
        </div>
        <div className="md:col-span-2 space-y-4">
           {myCourses.length === 0 ? <p className="text-gray-500">لا توجد مساقات حالياً</p> : myCourses.map(c => (
             <div key={c.id} className="bg-white p-4 rounded-xl shadow-sm border flex justify-between items-center">
               <div><p className="font-bold">{c.title}</p><p className="text-sm text-gray-500">{c.description}</p></div>
               <button onClick={() => removeCourse(c.id)} className="text-red-500 bg-red-50 p-2 rounded hover:bg-red-100"><Trash2 className="w-5 h-5" /></button>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};

const StudentResults = () => {
  const { results, exams, user } = useAppContext();
  
  if (!user) return null;

  const myResults = results.filter(r => r.studentId === user.id);

  return (
    <div className="space-y-6">
       <h2 className="text-2xl font-bold text-gray-800">نتائجي</h2>
       {myResults.length === 0 ? (
         <div className="bg-white p-8 rounded-xl text-center text-gray-500 shadow-sm">لم تقم بأداء أي اختبارات بعد.</div>
       ) : (
         <div className="grid gap-4">
            {myResults.map(r => {
               const exam = exams.find(e => e.id === r.examId);
               return (
                 <div key={r.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                       <div>
                          <h3 className="font-bold text-lg">{exam?.title || 'اختبار محذوف'}</h3>
                          <p className="text-sm text-gray-500">{new Date(r.submittedAt).toLocaleDateString('ar-EG')}</p>
                       </div>
                       <div className="text-left">
                          <div className="text-2xl font-bold text-indigo-600">{r.totalScore} / {r.maxScore}</div>
                          {r.violationCount > 0 && <div className="text-xs text-red-500 font-bold mt-1">{r.violationCount} مخالفات</div>}
                       </div>
                    </div>
                    
                    <div className="space-y-2 mt-4 border-t pt-4">
                       <p className="font-bold text-sm text-gray-700 mb-2">تفاصيل الإجابات:</p>
                       {r.answers.map((ans, idx) => {
                          const question = exam?.questions.find(q => q.id === ans.questionId);
                          return (
                            <div key={idx} className={`p-3 rounded-lg text-sm ${ans.score > 0 ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'}`}>
                               <div className="flex justify-between mb-1">
                                  <span className="font-bold text-gray-800">س{idx+1}</span>
                                  <span className="font-bold">{ans.score} درجة</span>
                               </div>
                               {question && <p className="mb-1 text-gray-600">{question.text}</p>}
                               <p className="text-gray-800">إجابتك: {ans.answer}</p>
                               {ans.feedback && <p className="text-xs mt-1 font-medium text-gray-500">ملاحظات: {ans.feedback}</p>}
                            </div>
                          );
                       })}
                    </div>
                 </div>
               );
            })}
         </div>
       )}
    </div>
  );
};

const AppRoot = () => (
  <AppProvider>
    <Router>
      <AppContent />
    </Router>
  </AppProvider>
);

const AppContent = () => {
  const { user } = useAppContext();
  return (
      <div className="bg-gray-50 min-h-screen font-sans" dir="rtl">
        <Sidebar />
        <div className={`transition-all duration-300 ${user ? 'mr-64' : ''}`}>
          <div className="p-8">
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/admin/dashboard" element={user?.role === UserRole.ADMIN ? <AdminDashboard /> : <Navigate to="/" />} />
              <Route path="/admin/teachers" element={user?.role === UserRole.ADMIN ? <TeacherManager /> : <Navigate to="/" />} />
              <Route path="/teacher/dashboard" element={user?.role === UserRole.TEACHER || user?.role === UserRole.ADMIN ? <TeacherDashboard /> : <Navigate to="/" />} />
              <Route path="/teacher/courses" element={user?.role === UserRole.TEACHER || user?.role === UserRole.ADMIN ? <CourseManager /> : <Navigate to="/" />} />
              <Route path="/teacher/exams" element={user?.role === UserRole.TEACHER || user?.role === UserRole.ADMIN ? <ExamManager /> : <Navigate to="/" />} />
              <Route path="/teacher/reports" element={user?.role === UserRole.TEACHER || user?.role === UserRole.ADMIN ? <TeacherReports /> : <Navigate to="/" />} />
              <Route path="/student/dashboard" element={user?.role === UserRole.STUDENT ? <StudentDashboard /> : <Navigate to="/" />} />
              <Route path="/student/exam/:examId" element={<StudentExamPage />} />
              <Route path="/student/results" element={user?.role === UserRole.STUDENT ? <StudentResults /> : <Navigate to="/" />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </div>
      </div>
  );
}

export default AppRoot;