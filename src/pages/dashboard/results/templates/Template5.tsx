import React from 'react';

interface ScoreItem {
  subject: string;
  test1?: number;
  test2?: number;
  assignment?: number;
  project?: number;
  exam?: number;
  total: number;
  grade: string;
  remark: string;
  lowest?: number;
  highest?: number;
}

interface Template5Props {
  data?: {
    school?: {
      name: string;
      logo?: string;
      crest?: string;
      address?: string;
      contact?: string;
    };
    student?: {
      name: string;
      photo?: string;
      class: string;
      rollNo: string;
      regNo: string;
      gender: string;
      age: number;
      email: string;
    };
    result?: {
      term: string;
      session: string;
      position: string;
      grandTotal: number;
      average: number;
      gradePoint: number;
      summary: string; // Excellent/Good/etc.
      scores: ScoreItem[];
      pin?: string;
      verificationUrl?: string;
    };
  };
}

const Template5: React.FC<Template5Props> = ({ data }) => {
  // Fallback dummy data
  const school = data?.school || {
    name: "SUPREME ACADEMY",
    logo: "",
    crest: "",
    address: "Plot 5, Education District, Abuja",
    contact: "Tel: +234 803 123 4567 | info@supreme.edu.ng"
  };

  const student = data?.student || {
    name: "David Adeleke",
    photo: "",
    class: "JSS 2 Diamond",
    rollNo: "05",
    regNo: "SA/JSS2/005",
    gender: "Male",
    age: 13,
    email: "david@example.com"
  };

  const result = data?.result || {
    term: "FIRST TERM",
    session: "2023/2024",
    position: "2nd",
    grandTotal: 435,
    average: 87.0,
    gradePoint: 4.5,
    summary: "Excellent",
    scores: [
      { subject: "Mathematics", test1: 15, test2: 15, assignment: 10, project: 10, exam: 40, total: 90, grade: "A", remark: "Excellent", lowest: 45, highest: 95 },
      { subject: "English", test1: 12, test2: 14, assignment: 8, project: 9, exam: 37, total: 80, grade: "B", remark: "Very Good", lowest: 50, highest: 88 },
      { subject: "Basic Science", test1: 14, test2: 15, assignment: 9, project: 10, exam: 32, total: 80, grade: "B", remark: "Very Good", lowest: 40, highest: 92 },
      { subject: "Social Studies", test1: 15, test2: 13, assignment: 10, project: 8, exam: 39, total: 85, grade: "A", remark: "Excellent", lowest: 55, highest: 85 },
      { subject: "French", test1: 10, test2: 12, assignment: 7, project: 8, exam: 28, total: 65, grade: "C", remark: "Good", lowest: 30, highest: 75 },
    ],
    pin: "1234-5678-9012",
    verificationUrl: "www.skooly.plus/verify"
  };

  return (
    <div className="bg-white p-6 max-w-5xl mx-auto border border-gray-200 font-sans text-xs shadow-sm">
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <div className="w-16 h-16 bg-gray-100 flex items-center justify-center text-xs text-gray-500">Logo</div>
        <div className="text-center flex-1 mx-4">
          <h1 className="text-2xl font-bold text-gray-900">{school.name}</h1>
          <p className="text-sm">{school.address}</p>
          <p className="text-xs text-gray-600">{school.contact}</p>
        </div>
        <div className="w-16 h-16 bg-gray-100 flex items-center justify-center text-xs text-gray-500">Crest</div>
      </div>

      <div className="text-center mb-4">
        <h2 className="text-sm font-bold uppercase border-y border-gray-300 py-1">
          {result.term} (TERMLY EXAMINATION) RESULT - {result.session}
        </h2>
      </div>

      {/* Student Bio Table */}
      <div className="flex gap-4 mb-4">
        <div className="flex-1 grid grid-cols-4 gap-x-4 gap-y-2 border border-gray-300 p-3 bg-gray-50">
          <div><span className="font-bold">Name:</span> {student.name}</div>
          <div><span className="font-bold">Position:</span> {result.position}</div>
          <div><span className="font-bold">Gender:</span> {student.gender}</div>
          <div><span className="font-bold">Grand Total:</span> {result.grandTotal}</div>
          
          <div><span className="font-bold">Age:</span> {student.age}</div>
          <div><span className="font-bold">Average:</span> {result.average}%</div>
          <div><span className="font-bold">Class:</span> {student.class}</div>
          <div><span className="font-bold">Roll No:</span> {student.rollNo}</div>
          
          <div><span className="font-bold">Grade Point:</span> {result.gradePoint}</div>
          <div><span className="font-bold">Reg No:</span> {student.regNo}</div>
          <div className="col-span-2"><span className="font-bold">Email:</span> {student.email}</div>
          
          <div className="col-span-4"><span className="font-bold">Result Summary:</span> <span className="font-bold text-green-700">{result.summary}</span></div>
        </div>
        <div className="w-24 h-24 bg-gray-100 flex items-center justify-center text-xs text-gray-500 border border-gray-300">
          Photo
        </div>
      </div>

      {/* Score Table */}
      <div className="overflow-x-auto mb-4">
        <table className="w-full border-collapse border border-gray-300 text-xs text-center">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-1">#</th>
              <th className="border border-gray-300 p-1 text-left">Subject</th>
              <th className="border border-gray-300 p-1">1st Test</th>
              <th className="border border-gray-300 p-1">2nd Test</th>
              <th className="border border-gray-300 p-1">Assign.</th>
              <th className="border border-gray-300 p-1">Project</th>
              <th className="border border-gray-300 p-1">Exam</th>
              <th className="border border-gray-300 p-1">Total</th>
              <th className="border border-gray-300 p-1">Grade</th>
              <th className="border border-gray-300 p-1">Remark</th>
              <th className="border border-gray-300 p-1">Lowest</th>
              <th className="border border-gray-300 p-1">Highest</th>
            </tr>
          </thead>
          <tbody>
            {result.scores.map((s, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="border border-gray-300 p-1">{i + 1}</td>
                <td className="border border-gray-300 p-1 text-left font-bold">{s.subject}</td>
                <td className="border border-gray-300 p-1">{s.test1 ?? '—'}</td>
                <td className="border border-gray-300 p-1">{s.test2 ?? '—'}</td>
                <td className="border border-gray-300 p-1">{s.assignment ?? '—'}</td>
                <td className="border border-gray-300 p-1">{s.project ?? '—'}</td>
                <td className="border border-gray-300 p-1">{s.exam ?? '—'}</td>
                <td className="border border-gray-300 p-1 font-bold">{s.total}</td>
                <td className="border border-gray-300 p-1 font-bold">{s.grade}</td>
                <td className="border border-gray-300 p-1">{s.remark}</td>
                <td className="border border-gray-300 p-1 text-gray-500">{s.lowest ?? '—'}</td>
                <td className="border border-gray-300 p-1 text-gray-500">{s.highest ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Chart Area + Key */}
      <div className="flex gap-4 mb-4">
        {/* Simple CSS Bar Chart */}
        <div className="flex-1 border border-gray-300 p-4 bg-gray-50">
          <h3 className="font-bold mb-2 text-center text-xs">Cognitive Assessment Summary</h3>
          <div className="flex items-end justify-around h-32 pt-2 border-b border-gray-400">
            {result.scores.map((s, i) => (
              <div key={i} className="flex flex-col items-center w-12">
                <div 
                  className="bg-blue-600 w-6 hover:bg-blue-700 transition-all"
                  style={{ height: `${(s.total / 100) * 100}px` }}
                  title={`${s.subject}: ${s.total}`}
                ></div>
                <span className="text-xs truncate w-full text-center mt-1" style={{ fontSize: '8px' }}>{s.subject}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Key to Grades */}
        <div className="w-48 border border-gray-300 p-2">
          <h3 className="font-bold mb-1 text-center text-xs">Key to Grades</h3>
          <table className="w-full text-xs">
            <tbody>
              <tr><td>70-100</td><td className="font-bold">A</td><td>Excellent</td></tr>
              <tr><td>60-69</td><td className="font-bold">B</td><td>V. Good</td></tr>
              <tr><td>50-59</td><td className="font-bold">C</td><td>Good</td></tr>
              <tr><td>40-49</td><td className="font-bold">D</td><td>Fair</td></tr>
              <tr><td>0-39</td><td className="font-bold">F</td><td>Fail</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-300 pt-3 text-xs">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p><span className="font-bold">Form Teacher's Comment:</span> Regular and punctual. Good academic performance.</p>
            <p className="text-gray-600 mt-1">Form Teacher: Mrs. Okonkwo</p>
            <div className="border-b border-gray-300 w-32 h-6 mt-1"></div>
          </div>
          <div>
            <p><span className="font-bold">Principal's Comment:</span> Keep it up. You have the potential to do better.</p>
            <p className="text-gray-600 mt-1">Principal: Mr. Adebayo</p>
            <div className="border-b border-gray-300 w-32 h-6 mt-1"></div>
          </div>
        </div>

        {/* Verification Info */}
        <div className="border-t border-gray-200 pt-2 flex justify-between text-gray-500 text-xs">
          <div>Printed: {new Date().toLocaleString()}</div>
          <div>Powered by Skooly Plus</div>
          <div>Card PIN: {result.pin}</div>
          <div>Verify: {result.verificationUrl}</div>
        </div>
      </div>
    </div>
  );
};

export default Template5;
