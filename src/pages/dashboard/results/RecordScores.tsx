import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { Button } from '../../../components/ui/button';
import { SettingsShell } from '../settings/shared/SettingsShell';
import { SettingsHero } from '../settings/shared/SettingsHero';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Save, Loader2, ChevronLeft, Users, BookOpen, CheckCircle, Clock, AlertCircle, Send, Lock, Unlock, Brain, Download, FileSpreadsheet, Search, Upload, Filter, X, MessageSquare, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../../lib/utils';
import { Pagination } from '../../../components/shared/Pagination';
import { useSchoolType } from '../../../context/SchoolTypeContext';
import { useAuth } from '../../../context/AuthContext';

interface ClassCard { id: string; name: string; section?: string; category?: string; studentCount?: number; }
interface SubjectCard { id: string; name: string; entryStatus?: string; entryType?: string; }
interface Student { studentProfileId: string; admissionNo: string; name: string; gender: string; totalScore?: number | string; average?: string; position?: number; comments?: any; }
interface AssessmentPart { id: string; name: string; weight: number; }
interface ScoreData { [partName: string]: string; }
interface GradeResult { grade: string; remark: string; }
interface TermData { id: string; name: string; sessionId: string; isActive: boolean; isLocked: boolean; daysOpened?: number; }
interface SessionData { id: string; name: string; isCurrent: boolean; }

type View = 'CLASS_GRID' | 'SUBJECT_LIST' | 'SCORE_SHEET' | 'TRAIT_SHEET' | 'REMARKS_SHEET';


const API = import.meta.env.VITE_API_URL || '/api/v1';

const statusBadge = (status: string) => {
  const map: Record<string, { color: string; label: string; icon: typeof Clock }> = {
    NOT_STARTED: { color: 'bg-gray-100 text-gray-500 border-gray-200', label: 'Not Started', icon: Clock },
    IN_PROGRESS:  { color: 'bg-amber-50 text-amber-700 border-amber-200', label: 'In Progress', icon: AlertCircle },
    SUBMITTED:    { color: 'bg-green-50 text-green-700 border-green-200', label: 'Submitted', icon: CheckCircle },
  };
  const s = map[status] || map.NOT_STARTED;
  const Icon = s.icon;
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-semibold', s.color)}>
      <Icon className="w-3 h-3" />{s.label}
    </span>
  );
};

const getRatingColor = (val: string, opts: string[]) => {
    if (!val) return 'bg-gray-50 text-gray-900 border-gray-200 hover:border-gray-300';
    const index = opts.indexOf(val);
    if (index === 0) return 'bg-green-600 text-white border-green-700 font-bold shadow-md';
    if (index === 1) return 'bg-emerald-500 text-white border-emerald-600 font-bold shadow-md';
    if (index === 2) return 'bg-blue-500 text-white border-blue-600 font-bold shadow-md';
    if (index === 3) return 'bg-yellow-500 text-white border-yellow-600 font-bold shadow-md';
    if (index >= 4) return 'bg-red-500 text-white border-red-600 font-bold shadow-md';
    return 'bg-purple-500 text-white border-purple-600 font-bold shadow-md';
};

const TeacherWrapper = ({ children }: { children: React.ReactNode }) => <>{children}</>;

export default function RecordScores({ isTeacherDashboard }: { isTeacherDashboard?: boolean } = {}) {
  const { user } = useAuth();
  const isTeacher = user?.role === 'TEACHER';
  
  const clearScore = (sid: string) => {
    setScores(prev => {
      const updated = { ...prev };
      if (updated[sid]) {
        updated[sid] = {};
        structure.forEach(p => {
          updated[sid][p.name] = '';
        });
      }
      return updated;
    });
  };

  const [term, setTerm] = useState('First Term');
  const [year, setYear] = useState('2025/2026');
  const [view, setView] = useState<View>('CLASS_GRID');
  const [remarksModalType, setRemarksModalType] = useState<'REMARKS' | 'COMMENT_BASED'>('REMARKS');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;

  const [classes, setClasses] = useState<ClassCard[]>([]);
  const [subjects, setSubjects] = useState<SubjectCard[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [structure, setStructure] = useState<AssessmentPart[]>([]);
  const [scores, setScores] = useState<Record<string, ScoreData>>({});
  const [grades, setGrades] = useState<Record<string, GradeResult>>({});
  const [gradingScaleConfig, setGradingScaleConfig] = useState<any[]>([]);
  const [allGradingScales, setAllGradingScales] = useState<any[]>([]);
  const [entryStatuses, setEntryStatuses] = useState<Record<string, any>>({});
  const [terms, setTerms] = useState<TermData[]>([]);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [globalEntryStatuses, setGlobalEntryStatuses] = useState<any[]>([]);
  const [commentBasedSettings, setCommentBasedSettings] = useState<any>({ skills: ['Neatness', 'Punctuality', 'Participation'], ratingScale: ['A', 'B', 'C', 'D'] });
  const [attendanceConfig, setAttendanceConfig] = useState<{ required: boolean, enabled: boolean }>({ required: false, enabled: true });

  const [selectedClass, setSelectedClass] = useState<ClassCard | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<SubjectCard | null>(null);

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [savedRowIds, setSavedRowIds] = useState<Set<string>>(new Set());
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [remarksModalOpen, setRemarksModalOpen] = useState(false);
  const [remarksStudent, setRemarksStudent] = useState<Student | null>(null);
  const [remarksForm, setRemarksForm] = useState({ teacherComment: '', headComment: '', principalComment: '', present: '', absent: '', total: '', narrativeComments: {} as Record<string, string> });
  const [commentRules, setCommentRules] = useState<any[]>([]);
  const [globalSignatures, setGlobalSignatures] = useState<any>({});
  const [autoCommentsEnabled, setAutoCommentsEnabled] = useState(false);
  const [savingRemarks, setSavingRemarks] = useState(false);
  const [loadingRemarks, setLoadingRemarks] = useState(false);
  
  const [traitConfigs, setTraitConfigs] = useState<any[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [traitRatings, setTraitRatings] = useState<Record<string, Record<string, string>>>({});
  const [savingTraits, setSavingTraits] = useState(false);

  const { activeSchoolType } = useSchoolType();

  const isFormTeacherForThisClass = user?.role === 'ADMIN' || 
                                    user?.role === 'SCHOOL_SUPER_ADMIN' || 
                                    user?.role === 'SCHOOL_ADMIN' || 
                                    (isTeacher && user?.teacherProfile?.formClasses?.some((c: any) => c.id === selectedClass?.id));
  const [customGrades, setCustomGrades] = useState<string[]>(['A', 'B', 'C', 'D', 'E', 'F']);

  useEffect(() => {
    setLoading(true);
    const classesParams: any = {};
    if (activeSchoolType) classesParams.schoolType = activeSchoolType;

    Promise.all([
      axios.get(`${API}/${isTeacher ? 'teachers/me/classes' : 'classes/all'}`, { params: classesParams, withCredentials: true }).then(r => r.data).catch(e => { console.error(e); toast.error('Failed to load classes'); return { classes: [] }; }),
      axios.get(`${API}/terms`, { withCredentials: true }).then(r => r.data).catch(e => { console.error(e); toast.error('Failed to load terms'); return { terms: [] }; }),
      axios.get(`${API}/sessions`, { withCredentials: true }).then(r => r.data).catch(e => { console.error(e); toast.error('Failed to load sessions'); return { sessions: [] }; }),
      axios.get(`${API}/school-settings/result-config/unified`, { withCredentials: true }).then(r => r.data).catch(() => ({}))
    ])
      .then(([classesData, termsData, sessionsData, configData]) => {
        setClasses(classesData.classes || []);
        if (termsData.terms) {
            setTerms(termsData.terms);
            const active = termsData.terms.find((t: TermData) => t.isActive);
            if (active) setTerm(active.name);
            else if (termsData.terms.length > 0) setTerm(termsData.terms[0].name);
        }
        if (sessionsData.sessions) {
            setSessions(sessionsData.sessions);
            const activeSession = sessionsData.sessions.find((s: SessionData) => s.isCurrent);
            if (activeSession) setYear(activeSession.name);
            else if (sessionsData.sessions.length > 0) setYear(sessionsData.sessions[0].name);
        }
        if (configData.gradingScale && configData.gradingScale.length > 0) {
            const examScales = configData.gradingScale.filter((s: any) => s.type === 'EXAM' || s.type === 'NUMERIC' || !s.type);
            const sourceScales = examScales.length > 0 ? examScales : configData.gradingScale;
            setAllGradingScales(sourceScales);
            const scale = sourceScales.find((s: any) => s.category === activeSchoolType) 
                          || sourceScales.find((s: any) => s.category === 'ALL')
                          || sourceScales[0];
            if (scale && scale.grades && Array.isArray(scale.grades)) {
                setGradingScaleConfig(scale.grades);
                const gradeLetters = scale.grades.map((g: any) => g.grade).filter(Boolean);
                if (gradeLetters.length > 0) setCustomGrades(gradeLetters);
            }
        }
        if (configData.schoolSettings?.resultConfig?.commentBasedSettings) {
            setCommentBasedSettings(configData.schoolSettings.resultConfig.commentBasedSettings);
          }
          if (configData.schoolSettings?.resultConfig?.signatures) {
              setGlobalSignatures(configData.schoolSettings.resultConfig.signatures);
          }
        if (configData.schoolSettings?.resultConfig) {
            setAttendanceConfig({
                required: configData.schoolSettings.resultConfig.studentAttendanceRequired ?? false,
                enabled: configData.schoolSettings.resultConfig.useAttendanceModule ?? true
            });
            if (configData.schoolSettings.resultConfig.resultAutomaticComments) {
                setAutoCommentsEnabled(true);
                axios.get(`${API}/results/comment-rules?category=${encodeURIComponent(activeSchoolType || 'ALL')}`, { withCredentials: true })
                     .then(res => setCommentRules(res.data.rules || []))
                     .catch(err => console.error('Failed to load comment rules', err));
            } else {
                setAutoCommentsEnabled(false);
                setCommentRules([]);
            }
        }
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSchoolType]);

  useEffect(() => {
      if (term && year) {
          axios.get(`${API}/results/entry-status?term=${encodeURIComponent(term)}&academicYear=${encodeURIComponent(year)}`, { withCredentials: true })
              .then(r => setGlobalEntryStatuses(r.data.statuses || []))
              .catch(e => console.error(e));
      }
  }, [term, year]);

  useEffect(() => {
      if (sessions.length > 0 && terms.length > 0 && year) {
          const selectedSessionId = sessions.find(s => s.name === year)?.id;
          const yearTerms = terms.filter(t => t.sessionId === selectedSessionId);
          if (yearTerms.length > 0 && !yearTerms.find(t => t.name === term)) {
              setTerm(yearTerms[0].name);
          }
      }
  }, [year, sessions, terms, term]);

  // Refetch the active view when year or term changes
  useEffect(() => {
      if (!term || !year) return;
      if (view === 'SUBJECT_LIST' && selectedClass) {
          loadSubjects(selectedClass);
      } else if (view === 'SCORE_SHEET' && selectedSubject) {
          loadScoreSheet(selectedSubject);
      } else if (view === 'REMARKS_SHEET' && remarksModalType) {
          loadClassStudentsForRemarks(remarksModalType);
      } else if (view === 'TRAIT_SHEET') {
          loadTraitSheet();
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term, year]);

  const loadSubjects = useCallback(async (cls: ClassCard) => {
    setLoading(true);
    setSearchTerm('');
    setSelectedClass(cls);
    setView('SUBJECT_LIST');
    try {
      const [subRes, statusRes] = await Promise.all([
        isTeacher ? Promise.resolve({ subjects: (cls as any).mySubjects || [] }) : axios.get(`${API}/subjects/all?classId=${cls.id}&activeOnly=true`, { withCredentials: true }).then(r => r.data),
        axios.get(`${API}/results/entry-status?classId=${cls.id}&term=${encodeURIComponent(term)}&academicYear=${encodeURIComponent(year)}`, { withCredentials: true }).then(r => r.data),
      ]);
      setSubjects(subRes.subjects || []);
      const map: Record<string, any> = {};
      (statusRes.statuses || []).forEach((s: any) => { map[s.subjectId] = s; });
      setEntryStatuses(map);
    } finally { setLoading(false); }
  }, [term, year, isTeacher]);

  const loadScoreSheet = useCallback(async (sub: SubjectCard) => {
    if (!selectedClass) return;
    setLoading(true);
    setSearchTerm('');
    setSelectedSubject(sub);
    const es = entryStatuses[sub.id];
    setIsSubmitted(es?.status === 'SUBMITTED');
    setView('SCORE_SHEET');
    setCurrentPage(1);
    try {
      const res = await axios.get(`${API}/assessments/scores?classId=${selectedClass?.id}&subjectId=${sub.id}&term=${encodeURIComponent(term)}&academicYear=${encodeURIComponent(year)}`, { withCredentials: true });
      const data = res.data;
      setStructure(data.structure || []);
      setStudents(data.students || []);

      if (allGradingScales && allGradingScales.length > 0) {
          const scale = allGradingScales.find((s: any) => s.category === data.category) 
                        || allGradingScales.find((s: any) => s.category === 'ALL')
                        || allGradingScales[0];
          if (scale && scale.grades && Array.isArray(scale.grades)) {
              setGradingScaleConfig(scale.grades);
          }
      }

      const newScores: Record<string, ScoreData> = {};
      const saved = new Set<string>();
      (data.students || []).forEach((s: Student) => { newScores[s.studentProfileId] = {}; });
      const numKeys = (data.structure || []).map((p: any) => p.name);
      (data.results || []).forEach((r: any) => { 
        if (newScores[r.studentProfileId] && r.scores) {
          let parsedScores = r.scores;
          if (typeof r.scores === 'string') {
            try { parsedScores = JSON.parse(r.scores); } catch (e) { parsedScores = {}; }
          }
          newScores[r.studentProfileId] = { ...parsedScores }; 
          
          const valid = numKeys.some((k: string) => parsedScores[k] != null && String(parsedScores[k]).trim() !== '');
          if (valid) {
            saved.add(r.studentProfileId);
          }
        } 
      });
      setScores(newScores);
      setSavedRowIds(saved);
    } finally { setLoading(false); }
  }, [selectedClass, entryStatuses, term, year, commentBasedSettings, allGradingScales]);

  const calcTotal = (sid: string) => {
    if (!scores[sid]) return 0;
    let t = 0;
    Object.values(scores[sid]).forEach(v => { const n = parseFloat(v); if (!isNaN(n)) t += n; });
    return t;
  };

  const getGradeInfo = (total: number, hasScores: boolean) => {
    if (!hasScores || !gradingScaleConfig || gradingScaleConfig.length === 0) return { grade: '—', remark: '—' };
    const gradeObj = gradingScaleConfig.find(g => total >= Number(g.minScore) && total <= Number(g.maxScore));
    return gradeObj ? { grade: gradeObj.grade, remark: gradeObj.remark } : { grade: '—', remark: '—' };
  };

  const loadClassStudentsForRemarks = async (type: 'REMARKS' | 'COMMENT_BASED') => {
    setRemarksModalType(type);
    setLoading(true);
    try {
        const res = await axios.get(`${API}/results/broadsheet?classId=${selectedClass?.id}&term=${encodeURIComponent(term)}&academicYear=${encodeURIComponent(year)}&subjectId=ALL`, { withCredentials: true }).catch(() => ({ data: { students: [], results: [] } }));
        
        const fetchedStudents = res.data.students || [];
        const fetchedResults = res.data.results || [];
        
        const studentsWithTotals = fetchedStudents.map((s: any) => {
            return {
                ...s,
                studentProfileId: s.studentProfileId || s.id,
                name: s.user?.name || s.name,
                totalScore: s.overallTotal ? s.overallTotal.toFixed(1) : '0.0'
            };
        });
        
        setStudents(studentsWithTotals);
        setView('REMARKS_SHEET');
    } finally { setLoading(false); }
  };

  const loadTraitSheet = async () => {
    if (!selectedClass) return;
    setLoading(true);
    setSearchTerm('');
    setSelectedSubject(null);
    setCurrentPage(1);
    
    try {
        let dummySubject = subjects[0]?.id;
        if (!dummySubject) {
            toast.error("No subjects assigned to this class. Cannot fetch roster.");
            return;
        }
        const rosterRes = await axios.get(`${API}/assessments/scores?classId=${selectedClass.id}&subjectId=${dummySubject}&term=${encodeURIComponent(term)}&academicYear=${encodeURIComponent(year)}`, { withCredentials: true }).catch(() => ({ data: { students: [], category: 'ALL' } }));
        const classCategory = rosterRes.data.category || 'ALL';
        
        const configRes = await axios.get(`${API}/results/traits/config?category=${encodeURIComponent(classCategory)}`, { withCredentials: true }).catch(() => ({ data: { configs: [] } }));
        
        setStudents(rosterRes.data.students || []);
        
        let configs = configRes.data.configs || [];
        if (configs.length === 0 && classCategory !== 'ALL') {
            const fallbackRes = await axios.get(`${API}/results/traits/config?category=ALL`, { withCredentials: true }).catch(() => ({ data: { configs: [] } }));
            configs = fallbackRes.data.configs || [];
        }
        
        setTraitConfigs(configs);
        
        if (configs.length > 0) {
            const domain = configs[0].domain;
            setSelectedDomain(domain);
            await loadTraitRatingsForDomain(domain, rosterRes.data.students || []);
        } else {
            setTraitRatings({});
        }
        
        setView('TRAIT_SHEET');
    } finally {
        setLoading(false);
    }
  };

  const loadTraitRatingsForDomain = async (domain: string, studentList = students) => {
      setLoading(true);
      try {
          const res = await axios.get(`${API}/results/traits?classId=${selectedClass?.id}&term=${encodeURIComponent(term)}&academicYear=${encodeURIComponent(year)}&domain=${encodeURIComponent(domain)}`, { withCredentials: true });
          
          const newRatings: Record<string, Record<string, string>> = {};
          studentList.forEach(s => { newRatings[s.studentProfileId] = {}; });
          
          (res.data.ratings || []).forEach((r: any) => {
              if (newRatings[r.studentProfileId] && r.ratings) {
                  newRatings[r.studentProfileId] = typeof r.ratings === 'string' ? JSON.parse(r.ratings) : r.ratings;
              }
          });
          setTraitRatings(newRatings);
      } catch (e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  };

  const handleDomainChange = async (domain: string) => {
      setSelectedDomain(domain);
      await loadTraitRatingsForDomain(domain);
  };

  const handleTraitChange = (sid: string, trait: string, val: string) => {
      setTraitRatings(prev => ({ ...prev, [sid]: { ...prev[sid], [trait]: val } }));
  };

  const handleSaveTraits = async () => {
      if (!selectedClass || !selectedDomain) return;
      setSavingTraits(true);
      try {
          const payload = Object.keys(traitRatings).map(sid => ({
              studentProfileId: sid,
              ratings: traitRatings[sid]
          }));
          await axios.post(`${API}/results/traits`, {
              classId: selectedClass.id,
              term,
              academicYear: year,
              domain: selectedDomain,
              ratingsList: payload
          }, { withCredentials: true });
          toast.success(`${selectedDomain} ratings saved successfully!`);
      } catch (e: any) {
          toast.error(e.response?.data?.msg || e.message || 'Failed to save trait ratings');
      } finally {
          setSavingTraits(false);
      }
  };

  const openRemarksModal = async (student: Student) => {
    const lookupKey = selectedClass?.id || selectedClass?.category || 'ALL';
    const activeSigs = globalSignatures[lookupKey] || globalSignatures['ALL'] || [
        { roleName: 'Class Teacher' }, { roleName: 'Principal' }
    ];

    setRemarksStudent(student);
    setRemarksForm({ teacherComment: '', headComment: '', principalComment: '', present: '', absent: '', total: '', narrativeComments: {} });
    setRemarksModalOpen(true);
    setLoadingRemarks(true);
    try {
        const rcRes = await axios.get(`${API}/results/report-card?studentProfileId=${student.studentProfileId}&term=${encodeURIComponent(term)}&academicYear=${encodeURIComponent(year)}`, { withCredentials: true }).catch(() => ({ data: {} }));
        let totalStr = rcRes.data?.comments?.total?.toString() || rcRes.data?.attendance?.total?.toString() || '';
        if (!totalStr || totalStr === '0') {
            const activeTerm = terms.find(t => t.name === term);
            if (activeTerm && activeTerm.daysOpened) {
                totalStr = String(activeTerm.daysOpened);
            }
        }

        if (rcRes.data) {
            const dbComments = rcRes.data.comments || {};
            let nComments = dbComments.narrativeComments || {};
            if (typeof nComments === 'string') {
                try { nComments = JSON.parse(nComments); } catch (e) {}
            }

            let studentAvg = student.average || rcRes.data?.summary?.average || rcRes.data?.summary?.cumulativeAverage;
            if (autoCommentsEnabled && studentAvg) {
                const avg = parseFloat(studentAvg as string);
                if (!isNaN(avg)) {
                    activeSigs.forEach((sig: any) => {
                        const rule = commentRules.find(r => r.role === sig.roleName && avg >= r.minScore && avg <= r.maxScore);
                        if (rule && !nComments[sig.roleName]) {
                            if (sig.roleName === 'Class Teacher' && dbComments.teacherComment) {
                                nComments[sig.roleName] = dbComments.teacherComment;
                            } else if (sig.roleName === 'Principal' && dbComments.principalComment) {
                                nComments[sig.roleName] = dbComments.principalComment;
                            } else if (sig.roleName === 'Head Teacher' && dbComments.headComment) {
                                nComments[sig.roleName] = dbComments.headComment;
                            } else {
                                nComments[sig.roleName] = rule.comment;
                            }
                        }
                    });
                }
            }

            // Populate legacy
            if (dbComments.teacherComment && !nComments['Class Teacher']) nComments['Class Teacher'] = dbComments.teacherComment;
            if (dbComments.principalComment && !nComments['Principal']) nComments['Principal'] = dbComments.principalComment;
            if (dbComments.headComment && !nComments['Head Teacher']) nComments['Head Teacher'] = dbComments.headComment;

            setRemarksForm({
                teacherComment: dbComments.teacherComment || '',
                headComment: dbComments.headComment || '',
                principalComment: dbComments.principalComment || '',
                present: dbComments.present != null ? dbComments.present.toString() : (rcRes.data.attendance?.present?.toString() || ''),
                absent: dbComments.absent != null ? dbComments.absent.toString() : (rcRes.data.attendance?.absent?.toString() || ''),
                total: totalStr,
                narrativeComments: nComments
            });
        } else {
            let nComments: any = {};
            let studentAvg = student.average;
            if (autoCommentsEnabled && studentAvg) {
                const avg = parseFloat(studentAvg as string);
                if (!isNaN(avg)) {
                    activeSigs.forEach((sig: any) => {
                        const rule = commentRules.find(r => r.role === sig.roleName && avg >= r.minScore && avg <= r.maxScore);
                        if (rule) nComments[sig.roleName] = rule.comment;
                    });
                }
            }
            setRemarksForm({ teacherComment: '', headComment: '', principalComment: '', present: '', absent: '', total: totalStr, narrativeComments: nComments });
        }
    } catch (e) { console.error(e); }
    finally {
        setLoadingRemarks(false);
    }
  };

  const handleSaveRemarks = async () => {
    if (!remarksStudent) return;
    
    if (attendanceConfig.enabled && attendanceConfig.required) {
        if (!remarksForm.present) {
            toast.error("Please fill out Days Present");
            return;
        }
    }
    
    setSavingRemarks(true);
    try {
        await axios.post(`${API}/results/comment`, {
            studentProfileId: remarksStudent.studentProfileId,
            term,
            academicYear: year,
            comments: { 
                teacherComment: remarksForm.narrativeComments['Class Teacher'] || remarksForm.teacherComment || '', 
                headComment: remarksForm.narrativeComments['Head Teacher'] || remarksForm.headComment || '', 
                principalComment: remarksForm.narrativeComments['Principal'] || remarksForm.principalComment || '' 
            },
            narrativeComments: remarksForm.narrativeComments,
            attendance: { present: Number(remarksForm.present), absent: Number(remarksForm.absent), total: Number(remarksForm.total) }
        }, { withCredentials: true });
        toast.success('Remarks & Attendance saved');
        setRemarksModalOpen(false);
    } catch (e: any) {
        toast.error(e.response?.data?.msg || e.message || 'Failed to save remarks');
    } finally {
        setSavingRemarks(false);
    }
  };

  const handleScoreChange = (sid: string, part: string, val: string) => {
    const part_ = structure.find(p => p.name === part);
    if (part_ && parseFloat(val) > part_.weight) { toast.error(`Max for ${part} is ${part_.weight}`); return; }
    if (parseFloat(val) < 0) { toast.error('Score cannot be negative'); return; }
    setScores(prev => ({ ...prev, [sid]: { ...prev[sid], [part]: val } }));
    setSavedRowIds(prev => { const n = new Set(prev); n.delete(sid); return n; });
  };

  const doSave = async (status: 'DRAFT' | 'SUBMITTED', silent = false) => {
    if (!selectedClass || !selectedSubject) return;
    setSaving(true);
    const payload = Object.keys(scores).map(sid => ({ studentProfileId: sid, scores: scores[sid] }));
    try {
      const r = await fetch(`${API}/assessments/scores`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId: selectedClass.id, subjectId: selectedSubject.id, term, academicYear: year, scoresData: payload }),
      });
      if (!r.ok) throw new Error('Save failed');
      const entryMode = selectedSubject.entryType || 'SCORE_BASED';
      await fetch(`${API}/results/entry-status`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId: selectedClass.id, subjectId: selectedSubject.id, term, academicYear: year, status, entryType: entryMode }),
      });
      setLastSaved(new Date());
      const numKeys = structure.map(p => p.name);
      
      const validIds = Object.keys(scores).filter(sid => {
        const sData = scores[sid] || {};
        return numKeys.some(k => sData[k] != null && String(sData[k]).trim() !== '');
      });
      setSavedRowIds(new Set(validIds));
      
      setEntryStatuses(prev => ({
        ...prev,
        [selectedSubject.id]: {
          ...prev[selectedSubject.id],
          status,
        }
      }));

      if (status === 'SUBMITTED') { setIsSubmitted(true); toast.success('Scores submitted and locked!'); }
      else if (!silent) toast.success('Draft saved!');
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const handleKeyNav = (e: React.KeyboardEvent<HTMLInputElement>, rowIdx: number, colIdx: number) => {
    if (e.key === 'Tab') { e.preventDefault(); const next = document.getElementById(`cell-${rowIdx}-${colIdx + 1}`) || document.getElementById(`cell-${rowIdx + 1}-0`); next?.focus(); }
    if (e.key === 'Enter') { e.preventDefault(); const next = document.getElementById(`cell-${rowIdx + 1}-${colIdx}`); next?.focus(); }
  };

  const filteredStudents = students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.admissionNo.toLowerCase().includes(searchTerm.toLowerCase()));
  const paginatedStudents = filteredStudents.slice((currentPage - 1) * limit, currentPage * limit);

  const entryMode = selectedSubject?.entryType || 'SCORE_BASED';

  const Wrapper: any = isTeacherDashboard ? TeacherWrapper : SettingsShell;
  const wrapperProps = isTeacherDashboard ? {} : {
      breadcrumbParent: "Results",
      breadcrumbCurrent: view === 'CLASS_GRID' ? 'Enter Marks' :
        view === 'SUBJECT_LIST' ? `Enter Marks / ${selectedClass?.name}` :
        view === 'REMARKS_SHEET' ? `Remarks / ${selectedClass?.name}` :
        `Enter Marks / ${selectedClass?.name} / ${selectedSubject?.name}`,
      tabLabel: "Enter Marks",
      tabIcon: <Users className="h-4 w-4" />
  };

  return (
    <Wrapper {...wrapperProps}>
      <div className={cn("flex flex-col gap-6 animate-in fade-in duration-300", !isTeacherDashboard && "font-dash", isTeacherDashboard && "w-full")}>
        {/* Header */}
        {view === 'CLASS_GRID' ? (
          isTeacherDashboard ? (
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Enter Marks</h2>
                <p className="text-sm text-slate-500">Select a class to begin score entry.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Select value={term} onValueChange={setTerm} disabled={isTeacher && !user?.teacherProfile?.canEnterPastScores}>
                  <SelectTrigger className="h-9 w-40 bg-white border-slate-200"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {terms.filter(t => t.sessionId === sessions.find(s => s.name === year)?.id).map(t => <SelectItem key={t.id} value={t.name}>{t.name} {t.isActive ? '(Current)' : ''}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={year} onValueChange={setYear} disabled={isTeacher && !user?.teacherProfile?.canEnterPastScores}>
                  <SelectTrigger className="h-9 w-40 bg-white border-slate-200"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {sessions.map(s => <SelectItem key={s.id} value={s.name}>{s.name} {s.isCurrent ? '(Current)' : ''}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
          <SettingsHero
            icon={<BookOpen className="h-7 w-7" />}
            title="Enter Marks"
            subtitle="Select a class to begin score entry for the current term."
          >
            <div className="flex flex-wrap justify-center gap-3 items-center mt-4">
              <Select value={term} onValueChange={setTerm} disabled={isTeacher && !user?.teacherProfile?.canEnterPastScores}>
                <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {terms.filter(t => t.sessionId === sessions.find(s => s.name === year)?.id).map(t => <SelectItem key={t.id} value={t.name}>{t.name} {t.isActive ? '(Current)' : ''}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={year} onValueChange={setYear} disabled={isTeacher && !user?.teacherProfile?.canEnterPastScores}>
                <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {sessions.map(s => <SelectItem key={s.id} value={s.name}>{s.name} {s.isCurrent ? '(Current)' : ''}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </SettingsHero>
          )
        ) : (
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <button onClick={() => { if (view === 'SCORE_SHEET' || view === 'TRAIT_SHEET' || view === 'REMARKS_SHEET') { setView('SUBJECT_LIST'); setSelectedSubject(null); } else { setView('CLASS_GRID'); setSelectedClass(null); } }} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {view === 'SUBJECT_LIST' && selectedClass?.name}
                  {view === 'REMARKS_SHEET' && 'Remarks & Attendance'}
                  {(view === 'SCORE_SHEET' || view === 'TRAIT_SHEET') && selectedSubject?.name}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {view === 'SUBJECT_LIST' && 'Select a subject to enter scores.'}
                  {view === 'REMARKS_SHEET' && `Enter term remarks for ${selectedClass?.name}`}
                  {view === 'SCORE_SHEET' && `Score sheet for ${selectedClass?.name} — ${term}`}
                </p>
              </div>
            </div>
            {/* Term / Year selectors always visible */}
            <div className="flex flex-wrap gap-3 items-center">
              <Select value={term} onValueChange={setTerm} disabled={isTeacher && !user?.teacherProfile?.canEnterPastScores}>
                <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {terms.filter(t => t.sessionId === sessions.find(s => s.name === year)?.id).map(t => <SelectItem key={t.id} value={t.name}>{t.name} {t.isActive ? '(Current)' : ''}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={year} onValueChange={setYear} disabled={isTeacher && !user?.teacherProfile?.canEnterPastScores}>
                <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {sessions.map(s => <SelectItem key={s.id} value={s.name}>{s.name} {s.isCurrent ? '(Current)' : ''}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <input 
            type="text" 
            placeholder={`Search ${view === 'CLASS_GRID' ? 'classes' : view === 'SUBJECT_LIST' ? 'subjects' : 'students'}...`}
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full sm:w-72 bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-[#0036a1]"
          />
        </div>

        {/* ── CLASS GRID ── */}
        {view === 'CLASS_GRID' && (
          loading ? (
            <div className="py-16 flex items-center justify-center gap-2 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />Loading classes…
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {classes.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map(cls => {
                const classStatuses = globalEntryStatuses.filter(s => s.classId === cls.id);
                // @ts-ignore
                const subjectCount = cls.subjects?.length || 0;
                let cStatus = 'NOT_STARTED';
                if (classStatuses.length > 0) {
                    const submittedCount = classStatuses.filter(s => s.status === 'SUBMITTED').length;
                    if (submittedCount === subjectCount && subjectCount > 0) cStatus = 'SUBMITTED';
                    else cStatus = 'IN_PROGRESS';
                }

                return (
                <button key={cls.id} onClick={() => loadSubjects(cls)} className="group text-left bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-[#0036a1]/30 hover:-translate-y-0.5 transition-all duration-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-[#0036a1]/10 flex items-center justify-center group-hover:bg-[#0036a1]/20 transition-colors">
                      <Users className="w-5 h-5 text-[#0036a1]" />
                    </div>
                    {statusBadge(cStatus)}
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg leading-tight">{cls.name}</h3>
                  {cls.section && <p className="text-xs text-gray-500 mt-0.5">{cls.section}</p>}
                  <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                    <Users className="w-3 h-3" />{cls.studentCount ?? '—'} students • {subjectCount} subjects
                  </p>
                </button>
              )})}
              {classes.length === 0 && (
                <div className="col-span-full py-16 text-center text-gray-400">
                  <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-semibold">No classes found</p>
                </div>
              )}
            </div>
          )
        )}

        {/* ── SUBJECT LIST ── */}
        {view === 'SUBJECT_LIST' && (
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              {loading ? (
                <div className="py-16 flex items-center justify-center gap-2 text-gray-400"><Loader2 className="w-5 h-5 animate-spin" />Loading subjects…</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {subjects.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).map(sub => {
                    const es = entryStatuses[sub.id];
                    return (
                      <button key={sub.id} onClick={() => loadScoreSheet(sub)} className="w-full text-left flex flex-col md:flex-row gap-4 items-start md:items-center justify-between px-6 py-4 hover:bg-blue-50/30 transition-colors group">
                        <div className="flex  items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                            <BookOpen className="w-4 h-4 text-indigo-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{sub.name}</p>
                          </div>
                        </div>
                        {statusBadge(es?.status || 'NOT_STARTED')}
                      </button>
                    );
                  })}
                  {subjects.length === 0 && (
                    <div className="py-16 text-center text-gray-400">
                      <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p>No subjects assigned to this class</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {isFormTeacherForThisClass && (
              <>
                <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-orange-100 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-bold text-orange-900 text-sm">Comment-Based Results</p>
                      <p className="text-xs text-orange-600">Enter skills ratings and narrative comments</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => loadClassStudentsForRemarks('COMMENT_BASED')} className="border-orange-200 text-orange-700 hover:bg-orange-100">
                    Enter Comment Results →
                  </Button>
                </div>

                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-emerald-100 flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-bold text-emerald-900 text-sm">Class Remarks & Attendance</p>
                      <p className="text-xs text-emerald-600">Enter teacher comments and attendance data</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => loadClassStudentsForRemarks('REMARKS')} className="border-emerald-200 text-emerald-700 hover:bg-emerald-100">
                    Enter Remarks →
                  </Button>
                </div>
                
                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-indigo-100 flex items-center justify-center">
                      <Brain className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-bold text-indigo-900 text-sm">Affective & Psychomotor Traits</p>
                      <p className="text-xs text-indigo-600">Rate student behavior and skills for this class</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={loadTraitSheet} className="border-indigo-200 text-indigo-700 hover:bg-indigo-100">
                    Enter Trait Ratings →
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── SCORE SHEET ── */}
        {view === 'SCORE_SHEET' && (
          <div className="flex flex-col gap-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs font-bold text-gray-500 uppercase">Score Entry</span>
                {isSubmitted && <span className="flex items-center gap-1 text-xs text-amber-600 font-semibold"><Lock className="w-3 h-3" />Locked</span>}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {lastSaved && <span className="text-xs text-gray-400">Saved {lastSaved.toLocaleTimeString()}</span>}
                {saving && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                {!isSubmitted && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => doSave('DRAFT')} disabled={saving} className="gap-1.5">
                      <Save className="w-3.5 h-3.5" />Save Draft
                    </Button>
                    <Button size="sm" onClick={() => doSave('SUBMITTED')} disabled={saving} className="gap-1.5 bg-green-600 hover:bg-green-700 text-white">
                      <Send className="w-3.5 h-3.5" />Submit
                    </Button>
                  </>
                )}
                {isSubmitted && (
                  <Button variant="outline" size="sm" className="gap-1.5 text-amber-600 border-amber-200 hover:bg-amber-50"
                    onClick={async () => {
                      await fetch(`${API}/results/entry-status`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ classId: selectedClass?.id, subjectId: selectedSubject?.id, term, academicYear: year, status: 'IN_PROGRESS', entryType: 'NUMERIC' }) });
                      setIsSubmitted(false); toast.success('Sheet unlocked');
                    }}>
                    <Unlock className="w-3.5 h-3.5" />Unlock (Admin)
                  </Button>
                )}
              </div>
            </div>

            {loading ? (
              <div className="bg-white border border-gray-200 rounded-2xl py-20 flex items-center justify-center gap-2 text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin" />Loading roster…
              </div>
            ) : (
              <>
                {/* Desktop View / Grid View */}
                <div className="hidden sm:block bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm ">
                      <thead className="top-0 z-20 bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase w-8 border-r">#</th>
                          <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase sm:left-0 bg-gray-50 sm:z-10 border-r">Student Name</th>
                          {structure.map(p => (
                            <th key={p.id} className="text-center px-3 py-3 border-r border-gray-100 ">
                              <div className="text-xs font-bold text-gray-700 uppercase">{p.name}</div>
                              <div className="text-[10px] text-gray-400 font-normal">Max: {p.weight}</div>
                            </th>
                          ))}
                          <th className="text-center px-4 py-3 text-xs font-bold text-[#0036a1] uppercase bg-blue-50/50 border-r">Total</th>
                          <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase border-r">Grade</th>
                          <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase ">Remark</th>
                          <th className="text-center px-2 py-3 text-xs font-bold text-gray-500 uppercase border-l">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {paginatedStudents.map((s, idx) => {
                          const rowIdx = (currentPage - 1) * limit + idx;
                          const total = calcTotal(s.studentProfileId);
                          const hasError = structure.some(p => {
                            const v = parseFloat(scores[s.studentProfileId]?.[p.name] || '0');
                            return v > p.weight;
                          });
                          const { grade, remark } = getGradeInfo(total, true);
                          return (
                            <tr key={s.studentProfileId} className={cn('hover:bg-blue-50/20 transition-colors group', hasError && 'bg-red-50/30')}>
                              <td className="px-4 py-3 text-xs text-gray-400 font-mono border-r">{rowIdx + 1}</td>
                              <td className="px-4 py-3 sm:left-0 bg-white group-hover:bg-blue-50/20 sm:z-10 border-r transition-colors">
                                <div className="flex items-center gap-2">
                                  <div>
                                    <div className="font-semibold text-gray-900 text-sm leading-tight">{s.name}</div>
                                    <div className="text-[10px] text-gray-400 font-mono">{s.admissionNo}</div>
                                  </div>
                                  {savedRowIds.has(s.studentProfileId) && (
                                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 animate-in zoom-in duration-300" />
                                  )}
                                </div>
                              </td>
                                  {structure.map((p, colIdx) => {
                                    const val = scores[s.studentProfileId]?.[p.name] || '';
                                    const over = val !== '' && parseFloat(val) > p.weight;
                                    return (
                                      <td key={p.id} className="px-2 py-2 border-r border-gray-50 text-center">
                                        <input id={`cell-${rowIdx}-${colIdx}`} type="number" value={val}
                                          onChange={e => handleScoreChange(s.studentProfileId, p.name, e.target.value)}
                                          onKeyDown={e => handleKeyNav(e, rowIdx, colIdx)}
                                          disabled={isSubmitted}
                                          className={cn('w-16 text-center rounded-lg border py-1.5 px-1 text-sm outline-none transition-all', over ? 'border-red-400 bg-red-50 focus:ring-red-200' : 'border-gray-200 focus:border-[#0036a1] focus:ring-1 focus:ring-blue-200', isSubmitted && 'bg-gray-50 cursor-not-allowed')}
                                          min="0" max={p.weight} placeholder="–" onWheel={e => e.currentTarget.blur()} />
                                      </td>
                                    );
                                  })}
                                  <td className="px-4 py-2 text-center font-bold text-gray-900 bg-blue-50/20 border-r">{total || '—'}</td>
                                  <td className="px-4 py-2 text-center text-sm font-bold text-[#0036a1] border-r">{grade}</td>
                                  <td className="px-4 py-2 text-center text-xs text-gray-500 border-r">{remark}</td>
                                  <td className="px-2 py-3 border-l border-gray-50 text-center">
                                    <button type="button" onClick={() => clearScore(s.studentProfileId)} disabled={isSubmitted} className={cn("p-1.5 rounded-lg transition-colors", isSubmitted ? "text-gray-300 cursor-not-allowed" : "text-gray-400 hover:text-red-500 hover:bg-red-50")} title="Clear scores">
                                      <Trash2 className="w-4 h-4 mx-auto" />
                                    </button>
                                  </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile View */}
                <div className="block sm:hidden space-y-4">
                  {paginatedStudents.map((s, idx) => {
                    const rowIdx = (currentPage - 1) * limit + idx;
                    const total = calcTotal(s.studentProfileId);
                    const hasError = structure.some(p => {
                      const v = parseFloat(scores[s.studentProfileId]?.[p.name] || '0');
                      return v > p.weight;
                    });
                    const gradeInfo = getGradeInfo(total, true);
                    
                    return (
                      <div key={s.studentProfileId} className={cn("bg-white border rounded-2xl p-4 shadow-sm relative", hasError && entryMode === 'NUMERIC' ? "border-red-300" : "border-gray-200")}>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                              {s.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-gray-900 text-sm">{s.name}</div>
                              <div className="text-xs text-gray-400">{s.admissionNo}</div>
                            </div>
                          </div>
                          {savedRowIds.has(s.studentProfileId) && (
                            <CheckCircle className="absolute top-2 right-2 w-4 h-4 text-emerald-500" />
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                          {structure.map(p => {
                            const val = scores[s.studentProfileId]?.[p.name] || '';
                            const over = val !== '' && parseFloat(val) > p.weight;
                            return (
                              <div key={p.id}>
                                <label className="text-[10px] font-bold text-gray-500 uppercase flex justify-between mb-1">
                                  {p.name} <span className="text-gray-400 font-normal">Max: {p.weight}</span>
                                </label>
                                <input type="number" value={val}
                                  onChange={e => handleScoreChange(s.studentProfileId, p.name, e.target.value)} disabled={isSubmitted}
                                  className={cn('w-full rounded-lg border px-3 py-2 text-sm outline-none transition-all', over ? 'border-red-400 bg-red-50 focus:ring-red-200' : 'border-gray-200 focus:border-[#0036a1]', isSubmitted && 'bg-gray-50 cursor-not-allowed')}
                                  placeholder="–" />
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex gap-2">
                          <div className="flex-1 bg-white border border-gray-100 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                            <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">Total</div>
                            <div className="font-bold text-gray-900 text-lg">{total}</div>
                          </div>
                          <div className="flex-1 bg-white border border-gray-100 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                            <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">Grade</div>
                            <div className={cn("font-bold text-lg", gradeInfo.grade === 'F' ? 'text-red-500' : 'text-emerald-500')}>{gradeInfo.grade}</div>
                          </div>
                          <div className="flex-1 bg-white border border-gray-100 rounded-xl p-3 flex items-center justify-center">
                            <button type="button" onClick={() => clearScore(s.studentProfileId)} disabled={isSubmitted} className={cn("w-full h-full p-2 rounded-lg transition-colors flex items-center justify-center", isSubmitted ? "text-gray-300 cursor-not-allowed" : "text-gray-400 hover:text-red-500 hover:bg-red-50")} title="Clear scores">
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {filteredStudents.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <Pagination currentPage={currentPage} totalPages={Math.ceil(filteredStudents.length / limit)} totalRecords={filteredStudents.length} onPageChange={setCurrentPage} />
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── TRAIT SHEET ── */}
        {view === 'TRAIT_SHEET' && (
              <div className="bg-white border border-gray-200 rounded-2xl p-3 sm:p-6 shadow-sm overflow-hidden">
                <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">Affective & Psychomotor Entry</h3>
                    <p className="text-sm text-gray-500">Rate students based on configured domains.</p>
                  </div>
                  {traitConfigs.length > 0 && (
                      <div className="flex overflow-x-auto bg-gray-100 p-1 rounded-lg max-w-full">
                          {traitConfigs.map(c => (
                              <button key={c.domain} onClick={() => handleDomainChange(c.domain)}
                                  className={cn('px-4 py-1.5 text-sm font-bold rounded-md transition-all whitespace-nowrap shrink-0', selectedDomain === c.domain ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700')}
                              >
                                  {c.domain}
                              </button>
                          ))}
                      </div>
                  )}
                </div>
    
                {traitConfigs.length === 0 ? (
                    <div className="py-12 text-center text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-xl">
                        <Brain className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <h4 className="font-bold text-gray-700">No Traits Configured</h4>
                        <p className="text-sm mt-1">Please configure Affective & Psychomotor traits in the General Result Settings first.</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table View */}
                        <div className="hidden sm:block overflow-x-auto border border-gray-200 rounded-xl">
                        <table className="w-full text-sm ">
                            <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="p-3 text-left font-bold text-gray-500 text-xs uppercase ">Student Name</th>
                                {(traitConfigs.find(c => c.domain === selectedDomain)?.traits || []).map((trait: string) => (
                                    <th key={trait} className="p-3 text-center font-bold text-gray-500 text-xs uppercase">{trait}</th>
                                ))}
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={10} className="p-10 text-center text-gray-500">
                                        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" /> Loading ratings...
                                    </td>
                                </tr>
                            ) : paginatedStudents.map((st: any) => {
                                const activeConfig = traitConfigs.find(c => c.domain === selectedDomain);
                                const scaleRaw = activeConfig?.ratingScale;
                                const opts = Array.isArray(scaleRaw) 
                                    ? scaleRaw.map(s => typeof s === 'object' ? s.rating : s) 
                                    : ['5', '4', '3', '2', '1'];
                                
                                return (
                                <tr key={st.studentProfileId} className="hover:bg-gray-50/50">
                                <td className="p-3 font-semibold text-gray-800">{st.name}</td>
                                {(activeConfig?.traits || []).map((trait: string) => (
                                    <td key={trait} className="p-3 text-center">
                                    <select 
                                        value={traitRatings[st.studentProfileId]?.[trait] || ''}
                                        onChange={e => handleTraitChange(st.studentProfileId, trait, e.target.value)}
                                        className={cn(
                                            "rounded-lg p-1.5 text-sm outline-none focus:ring-2 focus:ring-[#0036a1] mx-auto min-w-[4rem] transition-colors appearance-none text-center cursor-pointer",
                                            getRatingColor(traitRatings[st.studentProfileId]?.[trait], opts)
                                        )}>
                                        <option value="">-</option>
                                        {opts.map(o => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                    </td>
                                ))}
                                </tr>
                            )})}
                            </tbody>
                        </table>
                        </div>

                         {/* Mobile Grid View */}
                         <div className="block sm:hidden space-y-4 mt-2">
                             {paginatedStudents.map((st: any) => {
                                 const activeConfig = traitConfigs.find(c => c.domain === selectedDomain);
                                 const scaleRaw = activeConfig?.ratingScale;
                                 const opts = Array.isArray(scaleRaw) 
                                     ? scaleRaw.map((s: any) => typeof s === 'object' ? s.rating : s) 
                                     : ['5', '4', '3', '2', '1'];
                                 
                                 return (
                                     <div key={st.studentProfileId} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                                         <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                                              {st.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                                            </div>
                                            <div className="font-bold text-gray-900 text-sm leading-tight">{st.name}</div>
                                         </div>
                                         <div className="grid grid-cols-2 gap-3">
                                             {(activeConfig?.traits || []).map((trait: string) => (
                                                 <div key={trait}>
                                                     <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">{trait}</label>
                                                     <select 
                                                         value={traitRatings[st.studentProfileId]?.[trait] || ''}
                                                         onChange={e => handleTraitChange(st.studentProfileId, trait, e.target.value)}
                                                         className={cn(
                                                             "w-full rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-[#0036a1] transition-colors appearance-none cursor-pointer",
                                                             getRatingColor(traitRatings[st.studentProfileId]?.[trait], opts)
                                                         )}>
                                                         <option value="">-</option>
                                                         {opts.map((o: string) => <option key={o} value={o}>{o}</option>)}
                                                     </select>
                                                 </div>
                                             ))}
                                         </div>
                                     </div>
                                 );
                             })}
                         </div>
        
                        {students.length > 0 && (
                        <div className="mt-4 border-t border-gray-100 pt-4">
                            <Pagination currentPage={currentPage} totalPages={Math.ceil(filteredStudents.length / limit)} totalRecords={filteredStudents.length} onPageChange={setCurrentPage} />
                            <div className="p-4 bg-gray-50 flex items-center justify-end border border-gray-200 rounded-xl mt-4">
                            <Button onClick={handleSaveTraits} disabled={savingTraits} className="w-full sm:w-auto bg-[#0036a1] hover:bg-[#001761] text-white gap-2">
                                {savingTraits ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save {selectedDomain} Ratings
                            </Button>
                            </div>
                        </div>
                        )}
                    </>
                )}
              </div>
          )}

        {/* Remarks Sheet */}
        {view === 'REMARKS_SHEET' && (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mt-4">
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto overflow-hidden rounded-2xl">
                    <table className="w-full text-left text-sm ">
                        <thead className="bg-gray-50 border-y border-gray-100">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">S/N</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Student Name</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Admission No</th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Total Score</th>
                                <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {paginatedStudents.map((s, idx) => (
                                <tr key={s.studentProfileId} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 text-gray-500">{(currentPage - 1) * limit + idx + 1}</td>
                                    <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                                    <td className="px-4 py-3 text-sm text-gray-500">{s.admissionNo}</td>
                                    <td className="px-4 py-3 text-center text-sm font-bold text-gray-900">{s.totalScore || '0.0'}</td>
                                    <td className="px-4 py-3 text-right">
                                        <Button size="sm" variant="outline" onClick={() => openRemarksModal(s)} className="rounded-xl border-gray-200 text-gray-600 hover:text-blue-600 hover:bg-blue-50">
                                            {remarksModalType === 'REMARKS' ? 'Edit Remarks' : 'Edit Results'}
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Grid View */}
                <div className="block md:hidden p-4 space-y-3">
                    {paginatedStudents.map((s, idx) => (
                        <div key={s.studentProfileId} className="border border-gray-100 rounded-2xl p-4 shadow-sm bg-white flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="text-xs text-gray-400 font-medium mb-1">#{(currentPage - 1) * limit + idx + 1} • {s.admissionNo}</div>
                                    <div className="font-bold text-gray-900 text-sm">{s.name}</div>
                                </div>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => openRemarksModal(s)} className="w-full rounded-xl border-gray-200 text-gray-600 hover:text-blue-600 hover:bg-blue-50">
                                {remarksModalType === 'REMARKS' ? 'Edit Remarks' : 'Edit Results'}
                            </Button>
                        </div>
                    ))}
                    {paginatedStudents.length === 0 && (
                        <div className="text-center text-gray-500 py-6 text-sm">No students found.</div>
                    )}
                </div>

                {filteredStudents.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100 bg-white rounded-b-2xl p-4">
                        <Pagination 
                            currentPage={currentPage} 
                            totalPages={Math.ceil(filteredStudents.length / limit)} 
                            totalRecords={filteredStudents.length} 
                            onPageChange={setCurrentPage} 
                        />
                    </div>
                )}
            </div>
        )}

        {/* Remarks Modal */}
        {remarksModalOpen && remarksStudent && createPortal(
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
                    <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-3xl">
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg">{remarksModalType === 'REMARKS' ? 'Remarks & Attendance' : 'Comment-Based Results'}</h3>
                            <p className="text-xs text-gray-500 mt-0.5">{remarksStudent?.name}</p>
                        </div>
                        <button onClick={() => setRemarksModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-500 transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="p-5 overflow-y-auto space-y-4">
                        {loadingRemarks ? (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                <Loader2 className="w-8 h-8 animate-spin mb-3 text-blue-600" />
                                <p className="text-sm">Loading data...</p>
                            </div>
                        ) : (
                            <>
                                {remarksModalType === 'REMARKS' && (
                                    <>

                                        
                                        
{(() => {
    const lookupKey = selectedClass?.id || selectedClass?.category || 'ALL';
    const activeSigs = globalSignatures[lookupKey] || globalSignatures['ALL'] || [
        { roleName: 'Class Teacher' }, { roleName: 'Principal' }
    ];
    return activeSigs.map((sig: any, index: number) => {
        // If the user is a teacher, verify they are allowed to edit this field
        const roleName = sig.roleName || '';
        let canEdit = true;
        if (isTeacher) {
            if (sig.editableByTeachers !== undefined) {
                canEdit = sig.editableByTeachers;
            } else {
                // Fallback for older signatures without the toggle
                canEdit = roleName.toLowerCase().includes('teacher');
            }
        }
        
        if (!canEdit) return null; // Hide the field entirely from teachers

        return (
            <div key={index}>
                <label className="text-xs font-bold text-gray-500 uppercase">{roleName} Comment</label>
                <textarea 
                    className="w-full text-sm border border-gray-200 bg-gray-50/50 p-3 rounded-xl mt-1 outline-none focus:border-blue-500 focus:bg-white transition-colors min-h-[80px]" 
                    placeholder={`Enter ${roleName.toLowerCase()} remark here...`}
                    value={remarksForm.narrativeComments[roleName] || ''} 
                    onChange={e => setRemarksForm({...remarksForm, narrativeComments: {...remarksForm.narrativeComments, [roleName]: e.target.value}})} 
                />
            </div>
        );
    });
})()}

                                        {attendanceConfig.enabled && (
                                            <div className="mt-4 grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs font-bold text-gray-500 uppercase">Days Present 
                                                    {attendanceConfig.required && <span className="text-red-500 ml-1">*</span>}</label>
                                                    <input type="number" className="w-full text-sm border border-gray-200 p-2.5 rounded-xl mt-1 outline-none focus:border-blue-500" value={remarksForm.present} 
                                                        onChange={e => {
                                                            const present = e.target.value;
                                                            let absent = remarksForm.absent;
                                                            if (present !== '' && remarksForm.total) {
                                                                const p = parseInt(present) || 0;
                                                                const t = parseInt(remarksForm.total) || 0;
                                                                absent = Math.max(0, t - p).toString();
                                                            }
                                                            setRemarksForm({...remarksForm, present, absent});
                                                        }} />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-gray-500 uppercase">Days Absent</label>
                                                    <input type="number" className="w-full text-sm border border-gray-200 p-2.5 rounded-xl mt-1 outline-none focus:border-blue-500 bg-gray-100 cursor-not-allowed" value={remarksForm.absent} 
                                                        readOnly />
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}

                                {remarksModalType === 'COMMENT_BASED' && (
                                    <>
                                        {commentBasedSettings?.categories?.length > 0 && (
                                            <div className="mb-4">
                                                <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 text-blue-600">Skills Rating</h4>
                                                <div className="space-y-4">
                                                    {commentBasedSettings.categories.map((cat: any) => (
                                                        <div key={cat.id} className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                                            <h5 className="text-xs font-bold text-gray-700 uppercase mb-2">{cat.name}</h5>
                                                            <div className="grid grid-cols-2 gap-3">
                                                                {cat.skills.map((skill: any) => (
                                                                    <div key={skill.id}>
                                                                        <label className="text-[10px] font-bold text-gray-400 uppercase">{skill.name}</label>
                                                                        <Select value={remarksForm.narrativeComments[skill.id] || ''} onValueChange={val => setRemarksForm({...remarksForm, narrativeComments: {...remarksForm.narrativeComments, [skill.id]: val}})}>
                                                                            <SelectTrigger className="w-full text-sm border-gray-200 mt-1 h-10 bg-white"><SelectValue placeholder="-" /></SelectTrigger>
                                                                            <SelectContent>
                                                                                {(commentBasedSettings?.ratingScale || []).map((g: any) => <SelectItem key={g.id} value={g.label}>{g.label}</SelectItem>)}
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {commentBasedSettings?.narrativeTopics?.length > 0 && (
                                            <div className="mt-4 pt-4 border-t border-gray-100">
                                                <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 text-blue-600">Narrative Comments</h4>
                                                <div className="space-y-3">
                                                    {commentBasedSettings.narrativeTopics.map((topic: any) => (
                                                        <div key={topic.id}>
                                                            <label className="text-[10px] font-bold text-gray-400 uppercase">{topic.name}</label>
                                                            <textarea 
                                                                className="w-full text-sm border border-gray-200 bg-gray-50/50 p-3 rounded-xl mt-1 outline-none focus:border-blue-500 focus:bg-white transition-colors min-h-[60px]" 
                                                                placeholder={`Enter ${topic.name} comment...`} 
                                                                value={remarksForm.narrativeComments[topic.name] || ''} 
                                                                onChange={e => setRemarksForm({...remarksForm, narrativeComments: {...remarksForm.narrativeComments, [topic.name]: e.target.value}})} 
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </div>
                    <div className="p-5 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-3xl">
                        <Button variant="outline" className="border-gray-200 rounded-xl" onClick={() => setRemarksModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveRemarks} disabled={savingRemarks || loadingRemarks} className="bg-blue-700 hover:bg-blue-800 text-white rounded-xl gap-2 shadow-sm">
                            {savingRemarks ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                        </Button>
                    </div>
                </div>
            </div>,
            document.body
        )}
      </div>
    </Wrapper>
  );
}
