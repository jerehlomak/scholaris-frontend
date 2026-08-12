import React from 'react';

interface ScoreItem {
  subject: string;
  ca: number;
  exam: number;
  total: number;
  grade: string;
  position: string;
  remark: string;
  classAvg: number;
  prevTerm?: number;
}

interface TraitItem {
  name: string;
  rating: number; // 1 to 5
}

interface Template2Props {
  data?: {
    school?: {
      name: string;
      crest?: string;
      address?: string;
      contact?: string;
    };
    student?: {
      name: string;
      photo?: string;
      class: string;
      session: string;
      admissionNo: string;
      dob: string;
      age: number;
      gender: string;
      house: string;
      club: string;
      rollNo: string;
    };
    result?: {
      termEnds: string;
      nextTermBegins: string;
      nextTermFees: string;
      scores: ScoreItem[];
      attendance: {
        opened: number;
        present: number;
        absent: number;
      };
      affectiveTraits: TraitItem[];
      psychomotorTraits: TraitItem[];
      summary: {
        totalObtained: number;
        totalObtainable: number;
        totalSubjects: number;
        percentage: number;
        grade: string;
        position: string;
      };
      gradeAnalysis: Record<string, number>;
    };
  };
}

const Template2: React.FC<Template2Props> = ({ data }) => {
  // Fallback dummy data
  const school = data?.school || {
    name: "ST. AUGUSTINE'S COLLEGE",
    crest: "",
    address: "P.M.B. 1045, New Karu, Nasarawa State",
    contact: "Email: info@staugustines.edu.ng | Tel: +234 901 234 5678"
  };

  const student = data?.student || {
    name: "CHIDI OKAFOR",
    photo: "",
    class: "SSS 2 Science",
    session: "2023/2024",
    admissionNo: "SA/2022/345",
    dob: "2008-05-14",
    age: 16,
    gender: "Male",
    house: "Red House",
    club: "Jets Club",
    rollNo: "12"
  };

  const result = data?.result || {
    termEnds: "2024-04-10",
    nextTermBegins: "2024-05-02",
    nextTermFees: "₦185,000",
    scores: [
      { subject: "Mathematics", ca: 35, exam: 55, total: 90, grade: "A1", position: "1st", remark: "Excellent", classAvg: 70, prevTerm: 85 },
      { subject: "English Language", ca: 30, exam: 50, total: 80, grade: "B2", position: "3rd", remark: "Very Good", classAvg: 65, prevTerm: 78 },
      { subject: "Physics", ca: 32, exam: 48, total: 80, grade: "B2", position: "2nd", remark: "Very Good", classAvg: 60, prevTerm: 75 },
      { subject: "Chemistry", ca: 28, exam: 42, total: 70, grade: "B3", position: "5th", remark: "Good", classAvg: 55, prevTerm: 68 },
      { subject: "Biology", ca: 38, exam: 52, total: 90, grade: "A1", position: "1st", remark: "Excellent", classAvg: 62, prevTerm: 88 },
    ],
    attendance: {
      opened: 120,
      present: 118,
      absent: 2
    },
    affectiveTraits: [
      { name: "Honesty", rating: 5 },
      { name: "Self Control", rating: 4 },
      { name: "Reliability", rating: 5 },
      { name: "Co-operation", rating: 4 },
    ],
    psychomotorTraits: [
      { name: "Handwriting", rating: 4 },
      { name: "Fluency", rating: 5 },
      { name: "Games", rating: 3 },
      { name: "Crafts", rating: 4 },
    ],
    summary: {
      totalObtained: 410,
      totalObtainable: 500,
      totalSubjects: 5,
      percentage: 82.0,
      grade: "A",
      position: "2nd"
    },
    gradeAnalysis: { "A1": 2, "B2": 2, "B3": 1, "C4": 0, "C5": 0, "C6": 0, "D7": 0, "E8": 0, "F9": 0 }
  };

  const renderRatingScale = (rating: number) => {
    return [5, 4, 3, 2, 1].map(val => (
      <td key={val} className="border border-gray-300 text-center p-1">
        {rating === val ? '✓' : ''}
      </td>
    ));
  };

  return (
    <div className="bg-white p-6 max-w-5xl mx-auto border border-gray-400 font-sans text-xs">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 border-b-2 border-gray-800 pb-2">
        <div className="w-24 h-24 bg-gray-200 flex items-center justify-center text-xs text-gray-500">Crest</div>
        <div className="text-center flex-1 mx-4">
          <h1 className="text-2xl font-bold text-gray-900">{school.name}</h1>
          <p className="text-sm">{school.address}</p>
          <p className="text-xs text-gray-600">{school.contact}</p>
        </div>
        <div className="w-20 h-24 bg-gray-200 flex items-center justify-center text-xs text-gray-500">Photo</div>
      </div>

      {/* Student Info Bar */}
      <div className="grid grid-cols-4 gap-2 bg-gray-50 p-3 border border-gray-300 mb-4">
        <div><span className="font-bold">Name:</span> {student.name}</div>
        <div><span className="font-bold">Class:</span> {student.class}</div>
        <div><span className="font-bold">Session:</span> {student.session}</div>
        <div><span className="font-bold">Adm. No:</span> {student.admissionNo}</div>
        
        <div><span className="font-bold">D.O.B:</span> {student.dob}</div>
        <div><span className="font-bold">Age:</span> {student.age}</div>
        <div><span className="font-bold">Gender:</span> {student.gender}</div>
        <div><span className="font-bold">House:</span> {student.house}</div>
        
        <div><span className="font-bold">Club/Society:</span> {student.club}</div>
        <div><span className="font-bold">Roll No:</span> {student.rollNo}</div>
        <div><span className="font-bold">Term Ends:</span> {result.termEnds}</div>
        <div><span className="font-bold">Next Term:</span> {result.nextTermBegins}</div>
        
        <div className="col-span-4"><span className="font-bold">Next Term Fees:</span> {result.nextTermFees}</div>
      </div>

      <div className="flex gap-4 mb-4">
        {/* Main Score Table */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300 text-xs">
            <thead>
              <tr className="bg-gray-800 text-white">
                <th className="border border-gray-300 p-2 text-left">COGNITIVE DOMAIN / SUBJECT</th>
                <th className="border border-gray-300 p-2">C.A. (40)</th>
                <th className="border border-gray-300 p-2">EXAM (60)</th>
                <th className="border border-gray-300 p-2">TOTAL (100)</th>
                <th className="border border-gray-300 p-2">GRADE</th>
                <th className="border border-gray-300 p-2">POSN</th>
                <th className="border border-gray-300 p-2">REMARKS</th>
                <th className="border border-gray-300 p-2">CLASS AVG</th>
                <th className="border border-gray-300 p-2">PREV TERM</th>
              </tr>
            </thead>
            <tbody>
              {result.scores.map((s, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="border border-gray-300 p-2 font-bold">{s.subject}</td>
                  <td className="border border-gray-300 p-2 text-center">{s.ca}</td>
                  <td className="border border-gray-300 p-2 text-center">{s.exam}</td>
                  <td className="border border-gray-300 p-2 text-center font-bold">{s.total}</td>
                  <td className="border border-gray-300 p-2 text-center font-bold">{s.grade}</td>
                  <td className="border border-gray-300 p-2 text-center">{s.position}</td>
                  <td className="border border-gray-300 p-2 text-center">{s.remark}</td>
                  <td className="border border-gray-300 p-2 text-center">{s.classAvg}</td>
                  <td className="border border-gray-300 p-2 text-center">{s.prevTerm ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right Panel */}
        <div className="w-72 text-xs">
          {/* Attendance */}
          <div className="border border-gray-300 mb-4">
            <div className="bg-gray-800 text-white p-2 font-bold text-center">ATTENDANCE SUMMARY</div>
            <table className="w-full">
              <tbody>
                <tr className="border-t border-gray-200">
                  <td className="p-2">Times School Opened</td>
                  <td className="p-2 text-right font-bold">{result.attendance.opened}</td>
                </tr>
                <tr className="border-t border-gray-200">
                  <td className="p-2">No of Times Present</td>
                  <td className="p-2 text-right font-bold">{result.attendance.present}</td>
                </tr>
                <tr className="border-t border-gray-200">
                  <td className="p-2">No of Times Absent</td>
                  <td className="p-2 text-right font-bold">{result.attendance.absent}</td>
                </tr>
                <tr className="border-t border-gray-200">
                  <td className="p-2">Attendance Percentage</td>
                  <td className="p-2 text-right font-bold">
                    {((result.attendance.present / result.attendance.opened) * 100).toFixed(1)}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Affective Domain */}
          <div className="border border-gray-300 mb-4">
            <div className="bg-gray-800 text-white p-2 font-bold text-center">AFFECTIVE DOMAIN</div>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-1 text-left">Trait</th>
                  <th className="border border-gray-300 p-1 w-6">5</th>
                  <th className="border border-gray-300 p-1 w-6">4</th>
                  <th className="border border-gray-300 p-1 w-6">3</th>
                  <th className="border border-gray-300 p-1 w-6">2</th>
                  <th className="border border-gray-300 p-1 w-6">1</th>
                </tr>
              </thead>
              <tbody>
                {result.affectiveTraits.map((t, i) => (
                  <tr key={i}>
                    <td className="border border-gray-300 p-1">{t.name}</td>
                    {renderRatingScale(t.rating)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Psychomotor Skills */}
          <div className="border border-gray-300">
            <div className="bg-gray-800 text-white p-2 font-bold text-center">PSYCHOMOTOR SKILLS</div>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-1 text-left">Trait</th>
                  <th className="border border-gray-300 p-1 w-6">5</th>
                  <th className="border border-gray-300 p-1 w-6">4</th>
                  <th className="border border-gray-300 p-1 w-6">3</th>
                  <th className="border border-gray-300 p-1 w-6">2</th>
                  <th className="border border-gray-300 p-1 w-6">1</th>
                </tr>
              </thead>
              <tbody>
                {result.psychomotorTraits.map((t, i) => (
                  <tr key={i}>
                    <td className="border border-gray-300 p-1">{t.name}</td>
                    {renderRatingScale(t.rating)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-3 gap-4 border-t border-gray-300 pt-4 text-xs">
        {/* Performance Summary */}
        <div className="border border-gray-300">
          <div className="bg-gray-100 p-2 font-bold text-center">PERFORMANCE SUMMARY</div>
          <table className="w-full">
            <tbody>
              <tr className="border-t border-gray-200"><td className="p-1">Total Obtained</td><td className="p-1 text-right font-bold">{result.summary.totalObtained}</td></tr>
              <tr className="border-t border-gray-200"><td className="p-1">Total Obtainable</td><td className="p-1 text-right">{result.summary.totalObtainable}</td></tr>
              <tr className="border-t border-gray-200"><td className="p-1">Total Subjects</td><td className="p-1 text-right">{result.summary.totalSubjects}</td></tr>
              <tr className="border-t border-gray-200"><td className="p-1">Percentage</td><td className="p-1 text-right font-bold">{result.summary.percentage}%</td></tr>
              <tr className="border-t border-gray-200"><td className="p-1">Grade</td><td className="p-1 text-right font-bold">{result.summary.grade}</td></tr>
              <tr className="border-t border-gray-200"><td className="p-1">Position</td><td className="p-1 text-right font-bold">{result.summary.position}</td></tr>
            </tbody>
          </table>
        </div>

        {/* Grade Analysis */}
        <div className="border border-gray-300">
          <div className="bg-gray-100 p-2 font-bold text-center">GRADE ANALYSIS</div>
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 p-1">Grade</th>
                <th className="border border-gray-300 p-1">Count</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(result.gradeAnalysis).map(([grade, count]) => (
                <tr key={grade} className="border-t border-gray-200">
                  <td className="p-1 text-center font-bold">{grade}</td>
                  <td className="p-1 text-center">{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Rating Indices */}
        <div className="border border-gray-300">
          <div className="bg-gray-100 p-2 font-bold text-center">RATING INDICES</div>
          <div className="p-2 space-y-1">
            <p>5 - Excellent</p>
            <p>4 - Very Good</p>
            <p>3 - Good</p>
            <p>2 - Fair</p>
            <p>1 - Poor</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-300 text-xs">
        <div className="mb-4">
          <p><span className="font-bold">Class Teacher's Remark:</span> Very hard-working and well-behaved student. Keep it up.</p>
          <p className="mt-2"><span className="font-bold">Principal's Remark:</span> An excellent performance. Keep aiming high.</p>
        </div>

        {/* Signatures */}
        <div className="flex justify-between items-center mt-6">
          <div className="text-center w-48">
            <div className="border-b border-gray-400 h-10 mb-1"></div>
            <p className="font-bold">Class Teacher's Signature</p>
            <p className="text-gray-500">Date: 2024-04-15</p>
          </div>
          <div className="text-center w-48">
            <div className="border-b border-gray-400 h-10 mb-1"></div>
            <p className="font-bold">Principal's Signature</p>
            <p className="text-gray-500">Date: 2024-04-15</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Template2;
