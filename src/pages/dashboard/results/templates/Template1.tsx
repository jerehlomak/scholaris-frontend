import React from 'react';

interface ScoreItem {
  subject: string;
  ca1?: number;
  ca2?: number;
  exam?: number;
  total: number;
  grade: string;
  position?: string;
  remark: string;
}

interface TraitItem {
  name: string;
  score: number;
}

interface Template1Props {
  data?: {
    school?: {
      name: string;
      logo?: string;
      motto?: string;
      address?: string;
      phone?: string;
    };
    student?: {
      name: string;
      admissionNo: string;
      class: string;
      noInClass?: number;
    };
    result?: {
      term: string;
      academicYear: string;
      termEndDate?: string;
      daysOpened?: number;
      present?: number;
      absent?: number;
      nextTermBegins?: string;
      finalAverage?: number;
      highestAverage?: number;
      lowestAverage?: number;
      classAverage?: number;
      finalGrade?: string;
      nextTermFees?: string;
      position?: string;
      showClassPosition?: boolean;
      showSubjectPosition?: boolean;
      scores: ScoreItem[];
      affectiveTraits: TraitItem[];
      psychomotorTraits: TraitItem[];
    };
  };
}

const Template1: React.FC<Template1Props> = ({ data }) => {
  // Fallback dummy data if none provided
  const school = data?.school || {
    name: "EXEMPLAR INTERNATIONAL SCHOOL",
    logo: "",
    motto: "Knowledge and Integrity",
    address: "123 Education Lane, Lagos, Nigeria",
    phone: "+234 800 000 0000"
  };

  const student = data?.student || {
    name: "JOHN DOE",
    admissionNo: "ADM/2025/001",
    class: "JSS 1 Gold",
    noInClass: 30
  };

  const result = data?.result || {
    term: "2ND TERM",
    academicYear: "2023/2024",
    termEndDate: "2024-04-12",
    daysOpened: 60,
    present: 58,
    absent: 2,
    nextTermBegins: "2024-05-05",
    finalAverage: 75.4,
    highestAverage: 92.1,
    lowestAverage: 45.0,
    classAverage: 68.5,
    finalGrade: "B",
    nextTermFees: "₦150,000",
    position: "1st",
    scores: [
      { subject: "Mathematics", ca1: 15, ca2: 18, exam: 50, total: 83, grade: "A", remark: "Excellent" },
      { subject: "English Language", ca1: 12, ca2: 15, exam: 45, total: 72, grade: "B", remark: "V. Good" },
      { subject: "Basic Science", ca1: 10, ca2: 12, exam: 40, total: 62, grade: "C", remark: "Good" },
    ],
    affectiveTraits: [
      { name: "Punctuality", score: 5 },
      { name: "Neatness", score: 4 },
      { name: "Politeness", score: 5 },
    ],
    psychomotorTraits: [
      { name: "Handwriting", score: 4 },
      { name: "Sports", score: 5 },
      { name: "Crafts", score: 3 },
    ]
  };

  const getRemarkColor = (remark: string) => {
    switch (remark.toLowerCase()) {
      case 'excellent': return 'bg-green-800 text-white';
      case 'v. good': return 'bg-blue-600 text-white';
      case 'good': return 'bg-green-500 text-white';
      case 'fair': return 'bg-yellow-500 text-black';
      case 'weak': return 'bg-pink-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="bg-white p-8 max-w-4xl mx-auto border border-gray-300 font-serif text-sm">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="w-20 h-20 bg-gray-200 flex items-center justify-center text-xs text-gray-500">Logo</div>
        <div className="text-center flex-1 mx-4">
          <h1 className="text-2xl font-bold text-gray-900">{school.name}</h1>
          <p className="text-sm italic text-gray-600">{school.motto}</p>
          <p className="text-xs text-gray-600">{school.address}</p>
          <p className="text-xs text-gray-600">Phone: {school.phone}</p>
        </div>
        <div className="w-20 h-20"></div> {/* Spacer to center */}
      </div>

      {/* Colored Title Bar */}
      <div className="bg-navy-900 bg-[#0a192f] text-white text-center py-2 font-bold mb-4">
        {result.term} EXAM REPORT SHEET {result.academicYear} SESSION
      </div>

      {/* Student Name Block */}
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold text-gray-900">{student.name}</h2>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-4 gap-y-2 text-xs border border-gray-300 p-4 mb-4">
        <div><span className="font-bold">Admission No:</span> {student.admissionNo}</div>
        <div><span className="font-bold">Class:</span> {student.class}</div>
        <div><span className="font-bold">No. in Class:</span> {student.noInClass}</div>
        <div><span className="font-bold">Term End Date:</span> {result.termEndDate}</div>
        
        <div><span className="font-bold">Days Opened:</span> {result.daysOpened}</div>
        <div><span className="font-bold">Present:</span> {result.present}</div>
        <div><span className="font-bold">Absent:</span> {result.absent}</div>
        <div><span className="font-bold">Next Term Begins:</span> {result.nextTermBegins}</div>
        
        <div><span className="font-bold">Final Average:</span> {result.finalAverage}</div>
        <div><span className="font-bold">Highest Average:</span> {result.highestAverage}</div>
        <div><span className="font-bold">Lowest Average:</span> {result.lowestAverage}</div>
        <div className="bg-yellow-100 p-1"><span className="font-bold">Class Average:</span> {result.classAverage}</div>
        
        <div><span className="font-bold">Final Grade:</span> {result.finalGrade}</div>
        <div><span className="font-bold">Next Term Fees:</span> {result.nextTermFees}</div>
      </div>

      {/* Position Row */}
      {result.showClassPosition !== false && (
        <div className="bg-gray-100 p-2 font-bold mb-4 text-center">
          Position: {result.position}
        </div>
      )}

      <div className="flex gap-4 mb-4">
        {/* Main Score Table */}
        <div className="flex-1">
          <table className="w-full border-collapse border border-gray-300 text-xs">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2 text-left">SUBJECTS</th>
                <th className="border border-gray-300 p-2">1st CA 20%</th>
                <th className="border border-gray-300 p-2">2nd CA 20%</th>
                <th className="border border-gray-300 p-2">Exam 60%</th>
                <th className="border border-gray-300 p-2">Total 100%</th>
                <th className="border border-gray-300 p-2">Grade</th>
                {result.showSubjectPosition !== false && <th className="border border-gray-300 p-2">Pos</th>}
                <th className="border border-gray-300 p-2">Remark</th>
              </tr>
            </thead>
            <tbody>
              {result.scores.map((s, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="border border-gray-300 p-2 font-bold">{s.subject}</td>
                  <td className="border border-gray-300 p-2 text-center">{s.ca1 ?? '—'}</td>
                  <td className="border border-gray-300 p-2 text-center">{s.ca2 ?? '—'}</td>
                  <td className="border border-gray-300 p-2 text-center">{s.exam ?? '—'}</td>
                  <td className="border border-gray-300 p-2 text-center font-bold">{s.total}</td>
                  <td className="border border-gray-300 p-2 text-center font-bold">{s.grade}</td>
                  {result.showSubjectPosition !== false && <td className="border border-gray-300 p-2 text-center">{s.position}</td>}
                  <td className={`border border-gray-300 p-2 text-center text-xs font-bold ${getRemarkColor(s.remark)}`}>
                    {s.remark}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right Side Panel */}
        <div className="w-64 text-xs">
          {/* Affective Traits */}
          <div className="border border-gray-300 mb-4">
            <div className="bg-gray-100 p-2 font-bold text-center">AFFECTIVE TRAITS RATING</div>
            <table className="w-full">
              <tbody>
                {result.affectiveTraits.map((t, i) => (
                  <tr key={i} className="border-t border-gray-200">
                    <td className="p-2">{t.name}</td>
                    <td className="p-2 text-right font-bold">{t.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Psychomotor Traits */}
          <div className="border border-gray-300 mb-4">
            <div className="bg-gray-100 p-2 font-bold text-center">PSYCHOMOTOR TRAITS RATING</div>
            <table className="w-full">
              <tbody>
                {result.psychomotorTraits.map((t, i) => (
                  <tr key={i} className="border-t border-gray-200">
                    <td className="p-2">{t.name}</td>
                    <td className="p-2 text-right font-bold">{t.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Keys to Grading */}
          <div className="border border-gray-300">
            <div className="bg-gray-100 p-2 font-bold text-center">KEYS TO GRADING</div>
            <table className="w-full text-xs">
              <tbody>
                <tr><td className="p-1">70 - 100</td><td className="p-1 font-bold">A</td><td className="p-1">Excellent</td></tr>
                <tr><td className="p-1">60 - 69</td><td className="p-1 font-bold">B</td><td className="p-1">Very Good</td></tr>
                <tr><td className="p-1">50 - 59</td><td className="p-1 font-bold">C</td><td className="p-1">Good</td></tr>
                <tr><td className="p-1">40 - 49</td><td className="p-1 font-bold">D</td><td className="p-1">Fair</td></tr>
                <tr><td className="p-1">0 - 39</td><td className="p-1 font-bold">F</td><td className="p-1">Weak</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-300 pt-4 text-xs">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p><span className="font-bold">Class Teacher's Name:</span> Mrs. Smith</p>
            <p className="mt-2"><span className="font-bold">Class Teacher's Comment:</span> A very good result. Keep it up.</p>
          </div>
          <div>
            <p><span className="font-bold">Head Teacher's Comment:</span> Excellent performance. Promoted to next class.</p>
          </div>
        </div>

        {/* Signature Block */}
        <div className="flex justify-between items-center mt-8">
          <div className="text-center w-48">
            <div className="border-b border-gray-400 h-10 mb-2 flex items-center justify-center text-xs text-gray-400">Signature Image</div>
            <p className="font-bold">Head Teacher's Signature</p>
          </div>
          <div className="text-center w-48">
            <div className="border-b border-gray-400 h-10 mb-2 flex items-center justify-center text-xs text-gray-400">Signature Image</div>
            <p className="font-bold">Director's Signature</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Template1;
