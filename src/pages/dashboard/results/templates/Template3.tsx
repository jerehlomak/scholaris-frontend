import React from 'react';

interface ScoreItem {
  subject: string;
  // Current Term
  ca1?: number;
  ca2?: number;
  ca3?: number;
  exam?: number;
  total: number;
  grade: string;
  position: string;
  remark: string;
  // Cumulative
  t1?: number;
  t2?: number;
  t3?: number;
  cumTotal: number;
  cumAvg: number;
  cumGrade: string;
  cumPosition: string;
}

interface TraitItem {
  name: string;
  rating: number; // 1 to 5
}

interface Template3Props {
  data?: {
    school?: {
      name: string;
      logo?: string;
      crest?: string;
    };
    student?: {
      name: string;
      admissionNo: string;
      class: string;
      noInClass: number;
      status: 'PASSED' | 'FAILED';
    };
    result?: {
      term: string; // e.g. "Third Term / CUMULATIVE"
      session: string;
      summary: {
        obtainable: number;
        obtained: number;
        average: number;
        position: string;
      };
      scores: ScoreItem[];
      vacationDate: string;
      resumptionDate: string;
      affectiveTraits: TraitItem[];
      psychomotorTraits: TraitItem[];
    };
  };
}

const Template3: React.FC<Template3Props> = ({ data }) => {
  // Fallback dummy data
  const school = data?.school || {
    name: "FEDERAL GOVERNMENT COLLEGE",
    logo: "",
    crest: "" // Coat of arms placeholder
  };

  const student = data?.student || {
    name: "AMAKA OBI",
    admissionNo: "FGC/2021/890",
    class: "SS 3 Alpha",
    noInClass: 45,
    status: "PASSED"
  };

  const result = data?.result || {
    term: "Third Term / CUMULATIVE",
    session: "2023/2024",
    summary: {
      obtainable: 1000,
      obtained: 850,
      average: 85.0,
      position: "3rd"
    },
    scores: [
      { 
        subject: "Mathematics", 
        ca1: 15, ca2: 15, ca3: 10, exam: 50, total: 90, grade: "A", position: "1st", remark: "Excellent",
        t1: 85, t2: 88, t3: 90, cumTotal: 263, cumAvg: 87.6, cumGrade: "A", cumPosition: "1st"
      },
      { 
        subject: "English Language", 
        ca1: 12, ca2: 12, ca3: 8, exam: 45, total: 77, grade: "B", position: "5th", remark: "Very Good",
        t1: 75, t2: 80, t3: 77, cumTotal: 232, cumAvg: 77.3, cumGrade: "B", cumPosition: "4th"
      },
    ],
    vacationDate: "2024-07-20",
    resumptionDate: "2024-09-10",
    affectiveTraits: [
      { name: "Neatness", rating: 5 },
      { name: "Punctuality", rating: 4 },
    ],
    psychomotorTraits: [
      { name: "Sports", rating: 5 },
      { name: "Music", rating: 3 },
    ]
  };

  const renderRatingScale = (rating: number) => {
    return [5, 4, 3, 2, 1].map(val => (
      <td key={val} className="border border-gray-300 text-center p-1">
        {rating === val ? '✓' : ''}
      </td>
    ));
  };

  return (
    <div className="bg-white p-6 max-w-5xl mx-auto border-2 border-gray-800 font-sans text-xs">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 text-center border-b-2 border-gray-800 pb-2">
        <div className="w-20 h-20 bg-gray-200 flex items-center justify-center text-xs text-gray-500">Logo</div>
        <div className="flex-1">
          <div className="w-16 h-16 bg-gray-200 mx-auto mb-1 flex items-center justify-center text-xs text-gray-500">Coat of Arms</div>
          <h1 className="text-2xl font-extrabold text-gray-900">{school.name}</h1>
          <p className="text-sm font-bold uppercase">Continuous Assessment and Cumulative Report</p>
        </div>
        <div className="w-20 h-20 bg-gray-200 flex items-center justify-center text-xs text-gray-500">Logo</div>
      </div>

      {/* Student Info Bar */}
      <div className="grid grid-cols-4 gap-2 bg-gray-100 p-3 border border-gray-300 mb-4 font-bold">
        <div>Name: <span className="font-normal">{student.name}</span></div>
        <div>Adm. No: <span className="font-normal">{student.admissionNo}</span></div>
        <div>Class: <span className="font-normal">{student.class}</span></div>
        <div>No. in Class: <span className="font-normal">{student.noInClass}</span></div>
        
        <div>Term: <span className="font-normal">{result.term}</span></div>
        <div>Session: <span className="font-normal">{result.session}</span></div>
        <div className="col-span-2">Status: <span className={`font-bold ${student.status === 'PASSED' ? 'text-green-700' : 'text-red-700'}`}>{student.status}</span></div>
      </div>

      {/* Summary Bar */}
      <div className="grid grid-cols-4 gap-2 bg-gray-800 text-white p-2 text-center font-bold mb-4">
        <div>Total Obtainable: {result.summary.obtainable}</div>
        <div>Total Obtained: {result.summary.obtained}</div>
        <div>Average: {result.summary.average}%</div>
        <div>Position: {result.summary.position}</div>
      </div>

      {/* Score Table */}
      <div className="overflow-x-auto mb-4">
        <table className="w-full border-collapse border border-gray-400 text-xs">
          <thead>
            <tr className="bg-gray-200">
              <th className="border border-gray-400 p-2 text-left" rowSpan={2}>SUBJECT</th>
              <th className="border border-gray-400 p-1 text-center bg-blue-50" colSpan={8}>CURRENT TERM</th>
              <th className="border border-gray-400 p-1 text-center bg-green-50" colSpan={8}>CUMULATIVE SUMMARY</th>
            </tr>
            <tr className="bg-gray-100">
              {/* Current */}
              <th className="border border-gray-400 p-1 bg-blue-50">1st CA</th>
              <th className="border border-gray-400 p-1 bg-blue-50">2nd CA</th>
              <th className="border border-gray-400 p-1 bg-blue-50">3rd CA</th>
              <th className="border border-gray-400 p-1 bg-blue-50">EXAM</th>
              <th className="border border-gray-400 p-1 bg-blue-50">Total</th>
              <th className="border border-gray-400 p-1 bg-blue-50">Grade</th>
              <th className="border border-gray-400 p-1 bg-blue-50">Posn</th>
              <th className="border border-gray-400 p-1 bg-blue-50">Remarks</th>
              {/* Cumulative */}
              <th className="border border-gray-400 p-1 bg-green-50">1st T</th>
              <th className="border border-gray-400 p-1 bg-green-50">2nd T</th>
              <th className="border border-gray-400 p-1 bg-green-50">3rd T</th>
              <th className="border border-gray-400 p-1 bg-green-50">Cum. Total</th>
              <th className="border border-gray-400 p-1 bg-green-50">Cum. Avg</th>
              <th className="border border-gray-400 p-1 bg-green-50">Cum. Grade</th>
              <th className="border border-gray-400 p-1 bg-green-50">Cum. Posn</th>
              <th className="border border-gray-400 p-1 bg-green-50">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {result.scores.map((s, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="border border-gray-400 p-2 font-bold">{s.subject}</td>
                {/* Current */}
                <td className="border border-gray-400 p-1 text-center bg-blue-50">{s.ca1 ?? '—'}</td>
                <td className="border border-gray-400 p-1 text-center bg-blue-50">{s.ca2 ?? '—'}</td>
                <td className="border border-gray-400 p-1 text-center bg-blue-50">{s.ca3 ?? '—'}</td>
                <td className="border border-gray-400 p-1 text-center bg-blue-50">{s.exam ?? '—'}</td>
                <td className="border border-gray-400 p-1 text-center font-bold bg-blue-50">{s.total}</td>
                <td className="border border-gray-400 p-1 text-center font-bold bg-blue-50">{s.grade}</td>
                <td className="border border-gray-400 p-1 text-center bg-blue-50">{s.position}</td>
                <td className="border border-gray-400 p-1 text-center bg-blue-50">{s.remark}</td>
                {/* Cumulative */}
                <td className="border border-gray-400 p-1 text-center bg-green-50">{s.t1 ?? '—'}</td>
                <td className="border border-gray-400 p-1 text-center bg-green-50">{s.t2 ?? '—'}</td>
                <td className="border border-gray-400 p-1 text-center bg-green-50">{s.t3 ?? '—'}</td>
                <td className="border border-gray-400 p-1 text-center font-bold bg-green-50">{s.cumTotal}</td>
                <td className="border border-gray-400 p-1 text-center bg-green-50">{s.cumAvg.toFixed(1)}</td>
                <td className="border border-gray-400 p-1 text-center font-bold bg-green-50">{s.cumGrade}</td>
                <td className="border border-gray-400 p-1 text-center bg-green-50">{s.cumPosition}</td>
                <td className="border border-gray-400 p-1 text-center bg-green-50">{s.remark}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-2 gap-4 text-xs">
        {/* Left Side */}
        <div>
          <div className="border border-gray-300 p-2 mb-2">
            <p><span className="font-bold">Class Teacher's Remark:</span> Very good performance. She is regular and punctual.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs border border-gray-300 p-2">
            <div><span className="font-bold">Vacation Date:</span> {result.vacationDate}</div>
            <div><span className="font-bold">Resumption Date:</span> {result.resumptionDate}</div>
          </div>
          <div className="border border-gray-300 p-2 mt-2">
            <p className="font-bold mb-1">Grading Key:</p>
            <p>75-100: A (Excellent) | 65-74: B (V. Good) | 50-64: C (Good) | 40-49: D (Fair) | 0-39: F (Fail)</p>
          </div>
        </div>

        {/* Right Side - Traits */}
        <div className="grid grid-cols-2 gap-2">
          {/* Affective */}
          <div className="border border-gray-300">
            <div className="bg-gray-100 p-1 font-bold text-center border-b border-gray-300">AFFECTIVE DOMAIN</div>
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 p-1 text-left">Trait</th>
                  <th className="border border-gray-300 p-1 w-5">5</th>
                  <th className="border border-gray-300 p-1 w-5">4</th>
                  <th className="border border-gray-300 p-1 w-5">3</th>
                  <th className="border border-gray-300 p-1 w-5">2</th>
                  <th className="border border-gray-300 p-1 w-5">1</th>
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

          {/* Psychomotor */}
          <div className="border border-gray-300">
            <div className="bg-gray-100 p-1 font-bold text-center border-b border-gray-300">PSYCHOMOTOR</div>
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 p-1 text-left">Trait</th>
                  <th className="border border-gray-300 p-1 w-5">5</th>
                  <th className="border border-gray-300 p-1 w-5">4</th>
                  <th className="border border-gray-300 p-1 w-5">3</th>
                  <th className="border border-gray-300 p-1 w-5">2</th>
                  <th className="border border-gray-300 p-1 w-5">1</th>
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

      {/* Footer Signatures */}
      <div className="flex justify-between items-center mt-6 border-t border-gray-300 pt-4">
        <div className="text-center w-48">
          <div className="border-b border-gray-400 h-10 mb-1"></div>
          <p className="font-bold">Class Teacher</p>
        </div>
        <div className="text-center w-48">
          <div className="border-b border-gray-400 h-10 mb-1"></div>
          <p className="font-bold">Principal / Head Teacher</p>
        </div>
      </div>
    </div>
  );
};

export default Template3;
