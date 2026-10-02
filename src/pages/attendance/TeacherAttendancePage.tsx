import { useState } from 'react';
import { cn } from '../../lib/utils';
import { MyStaffAttendance } from './MyAttendance';
import { StudentRegister } from './StudentRegister';

/** The teacher's attendance page: their own record, and the registers of the classes they teach. */
export default function TeacherAttendancePage() {
    const [tab, setTab] = useState<'mine' | 'register'>('mine');
    return (
        <div className="mx-auto max-w-5xl space-y-5 p-4 md:p-6">
            <div className="flex gap-1 border-b border-slate-200">{([['mine', 'My attendance'], ['register', 'Class register']] as const).map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={cn('-mb-px border-b-2 px-4 py-2 text-sm font-bold', tab === k ? 'border-[#1E4DA6] text-[#173F8C]' : 'border-transparent text-slate-500 hover:text-slate-700')}>{l}</button>)}</div>
            {tab === 'mine' ? <><div><h1 className="text-2xl font-bold text-slate-800">My attendance</h1><p className="text-sm text-slate-500">Your sign-ins and sign-outs, lateness and settings.</p></div><MyStaffAttendance /></> : <StudentRegister title="Class register" />}
        </div>
    );
}
