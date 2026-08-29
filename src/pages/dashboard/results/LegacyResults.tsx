import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload, Trash2, FileText, Download, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { SettingsShell } from '../settings/shared/SettingsShell';
import { SettingsHero } from '../settings/shared/SettingsHero';
import { toast } from 'sonner';

const API = import.meta.env.VITE_API_URL || '/api/v1';

const inputCls = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm outline-none focus:border-[#1E4DA6]/60 focus:ring-2 focus:ring-[#1E4DA6]/10 transition-all';

interface LegacyResult {
  id: string;
  classId: string;
  academicYear: string;
  term: string;
  sessionName: string | null;
  fileUrl: string;
  uploadedBy: string;
  createdAt: string;
  class: { name: string; level: string };
}

export function LegacyResults() {
  const [results, setResults] = useState<LegacyResult[]>([]);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);

  const [classId, setClassId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [academicYear, setAcademicYear] = useState('');
  const [term, setTerm] = useState('');
  const [sessionName, setSessionName] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchClasses();
    fetchTermsAndSessions();
    fetchResults();
  }, []);

  const fetchStudents = async (cid: string) => {
    if (!cid) {
      setStudents([]);
      return;
    }
    try {
      const res = await axios.get(`${API}/classes/${cid}/students`, { withCredentials: true });
      setStudents(res.data.students || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTermsAndSessions = async () => {
    try {
      const [tRes, sRes] = await Promise.all([
        axios.get(`${API}/terms`, { withCredentials: true }),
        axios.get(`${API}/sessions`, { withCredentials: true })
      ]);
      if (tRes.data.terms) setTerms(tRes.data.terms);
      if (sRes.data.sessions) setSessions(sRes.data.sessions);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await axios.get(`${API}/classes/all`, { withCredentials: true });
      setClasses(res.data.classes || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchResults = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/legacy-results`, { withCredentials: true });
      setResults(res.data.legacyResults || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classId || !academicYear || !term || !file) {
      toast.error('Please fill all required fields and select a PDF.');
      return;
    }

    const formData = new FormData();
    formData.append('classId', classId);
    if (studentId && studentId !== 'all') formData.append('studentId', studentId);
    formData.append('academicYear', academicYear);
    formData.append('term', term);
    if (sessionName) formData.append('sessionName', sessionName);
    formData.append('file', file);

    setUploading(true);
    try {
      await axios.post(`${API}/legacy-results`, formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Legacy result uploaded successfully.');
      setClassId('');
      setAcademicYear('');
      setTerm('');
      setSessionName('');
      setFile(null);
      fetchResults();
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to upload legacy result.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this legacy result?')) return;
    try {
      await axios.delete(`${API}/legacy-results/${id}`, { withCredentials: true });
      toast.success('Legacy result deleted.');
      fetchResults();
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to delete.');
    }
  };

  return (
    <SettingsShell
      breadcrumbParent="Results"
      breadcrumbCurrent="Legacy Results"
      tabLabel="Previous App Results"
      tabIcon={<Clock className="h-3.5 w-3.5" />}
    >
      <SettingsHero
        icon={<Clock className="h-7 w-7" />}
        title="Previous App Results"
        subtitle="Upload and manage historical result PDFs from your previous platform."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Upload Form */}
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden h-fit">
          <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-4">
            <h2 className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <Upload className="w-3.5 h-3.5" /> Upload Legacy PDF
            </h2>
          </div>
          <form onSubmit={handleUpload} className="p-6 space-y-4">

            <div className="space-y-1.5">
              <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Class <span className="text-[#1E4DA6]">*</span></label>
              <Select value={classId} onValueChange={(val) => { setClassId(val); fetchStudents(val); setStudentId(''); }}>
                <SelectTrigger className={inputCls}>
                  <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {students.length > 0 && (
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Target Student <span className="text-slate-400">(Optional)</span></label>
                <Select value={studentId} onValueChange={setStudentId}>
                  <SelectTrigger className={inputCls}>
                    <SelectValue placeholder="Entire Class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Entire Class</SelectItem>
                    {students.map(s => <SelectItem key={s.id} value={s.id}>{s.name} ({s.admissionNo})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Academic Year <span className="text-[#1E4DA6]">*</span></label>
              {sessions.length > 0 ? (
                <Select value={academicYear} onValueChange={setAcademicYear}>
                  <SelectTrigger className={inputCls}>
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {sessions.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <input
                  type="text" placeholder="e.g. 2021/2022"
                  value={academicYear} onChange={e => setAcademicYear(e.target.value)}
                  className={inputCls} required
                />
              )}
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Term <span className="text-[#1E4DA6]">*</span></label>
              <Select value={term} onValueChange={setTerm}>
                <SelectTrigger className={inputCls}>
                  <SelectValue placeholder="Select Term" />
                </SelectTrigger>
                <SelectContent>
                  {terms.map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}
                  {terms.length === 0 && (
                    <>
                      <SelectItem value="First Term">First Term</SelectItem>
                      <SelectItem value="Second Term">Second Term</SelectItem>
                      <SelectItem value="Third Term">Third Term</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Session Name <span className="text-slate-300">(Optional)</span></label>
              <input
                type="text" placeholder="e.g. 2021/2022 Session"
                value={sessionName} onChange={e => setSessionName(e.target.value)}
                className={inputCls}
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">PDF Document <span className="text-[#1E4DA6]">*</span></label>
              <label className="mt-1 border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center bg-slate-50 text-center hover:bg-[#1E4DA6]/8 hover:border-[#1E4DA6]/20 transition-colors cursor-pointer group">
                <FileText className="w-8 h-8 text-slate-300 group-hover:text-[#1E4DA6]/60 mb-2 transition-colors" />
                {file ? (
                  <p className="text-sm font-bold text-[#1E4DA6]">{file.name}</p>
                ) : (
                  <>
                    <p className="text-sm text-slate-600 mb-1 font-medium">Click to select a PDF</p>
                    <p className="text-xs text-slate-400">Max size: 10MB</p>
                  </>
                )}
                <input
                  type="file" accept="application/pdf" className="hidden"
                  onChange={e => setFile(e.target.files ? e.target.files[0] : null)}
                />
              </label>
            </div>

            <div className="pt-2">
              <Button
                type="submit" disabled={uploading || !file}
                className="w-full rounded-xl bg-[#173F8C] hover:bg-[#122F69] text-white font-bold h-11 flex items-center gap-2 justify-center"
              >
                {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</> : <><Upload className="w-4 h-4" /> Upload Legacy Result</>}
              </Button>
            </div>
          </form>
        </div>

        {/* Results List */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-4 flex items-center justify-between">
            <h2 className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" /> Historical Records
            </h2>
            <span className="text-xs font-bold bg-[#1E4DA6]/10 text-[#173F8C] px-2.5 py-1 rounded-full">{results.length} Files</span>
          </div>

          <div className="flex-1 overflow-y-auto min-h-[400px]">
            {loading ? (
              <div className="flex items-center justify-center h-48 gap-2 text-slate-400 text-sm">
                <Loader2 className="w-5 h-5 animate-spin" /> Loading historical records...
              </div>
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400 text-center px-4">
                <AlertCircle className="w-12 h-12 mb-3 text-slate-200" />
                <p className="font-semibold text-slate-600">No legacy results found.</p>
                <p className="text-sm mt-1 text-slate-400">Upload your first historical PDF using the form.</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-white sticky top-0 border-b border-slate-100">
                  <tr>
                    {['Class', 'Year & Term', 'Uploaded By', 'Date', 'Actions'].map((h, i) => (
                      <th key={h} className={`px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400 ${i === 4 ? 'text-right' : ''}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {results.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-4 font-bold text-slate-800">{r.class?.name || 'Unknown Class'}</td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-800">{r.academicYear}</div>
                        <div className="text-xs text-slate-400">{r.term}</div>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500">{r.uploadedBy || 'Admin'}</td>
                      <td className="px-5 py-4 text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={r.fileUrl} target="_blank" rel="noopener noreferrer"
                            className="p-2 rounded-lg bg-[#1E4DA6]/5 text-[#1E4DA6] hover:bg-[#1E4DA6]/10 transition-colors" title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => handleDelete(r.id)}
                            className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors" title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </SettingsShell>
  );
}
