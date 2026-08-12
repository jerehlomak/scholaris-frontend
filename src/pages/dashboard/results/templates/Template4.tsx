import React from 'react';

interface ScoreItem {
  subject: string;
  q1?: string; // E.g. "Excellent", "Good" or grades
  q2?: string;
  q3?: string;
}

interface Template4Props {
  data?: {
    school?: {
      name: string;
      logo?: string;
      url?: string;
      address?: string;
      phone?: string;
      color?: string; // Primary color
    };
    student?: {
      name: string;
      teacher: string;
      class: string;
      year: string;
    };
    result?: {
      scores: ScoreItem[];
      gradingScale: Array<{ grade: string; description: string }>;
      attendance: {
        absences: number;
        tardies: number;
        earlyDismissals: number;
      };
      comment: string;
    };
  };
}

const Template4: React.FC<Template4Props> = ({ data }) => {
  // Fallback dummy data
  const school = data?.school || {
    name: "LITTLE ANGELS ACADEMY",
    logo: "",
    url: "www.littleangels.edu",
    address: "7 Nursery Road, Lekki, Lagos",
    phone: "+234 802 345 6789",
    color: "#ec4899" // Pink for nursery
  };

  const student = data?.student || {
    name: "Sophie Adams",
    teacher: "Ms. Evelyn",
    class: "Kindergarten 1",
    year: "2023/2024"
  };

  const result = data?.result || {
    scores: [
      { subject: "Numeracy", q1: "Developing", q2: "Proficient", q3: "Advanced" },
      { subject: "Literacy", q1: "Proficient", q2: "Proficient", q3: "Advanced" },
      { subject: "Creative Arts", q1: "Advanced", q2: "Advanced", q3: "Advanced" },
      { subject: "Social Skills", q1: "Developing", q2: "Proficient", q3: "Proficient" },
      { subject: "Physical Development", q1: "Proficient", q2: "Advanced", q3: "Advanced" },
    ],
    gradingScale: [
      { grade: "Advanced", description: "Exceeds expectations" },
      { grade: "Proficient", description: "Meets expectations" },
      { grade: "Developing", description: "Working towards expectations" },
      { grade: "Beginning", description: "Needs support" },
    ],
    attendance: {
      absences: 2,
      tardies: 1,
      earlyDismissals: 0
    },
    comment: "Sophie is a joy to have in class! She is very creative and loves painting. Her social skills are developing well, and she is learning to share with her peers."
  };

  return (
    <div className="bg-white max-w-4xl mx-auto font-sans shadow-lg border border-gray-100">
      {/* Bold Header Bar */}
      <div 
        className="text-white p-6 flex justify-between items-center"
        style={{ backgroundColor: school.color }}
      >
        <div>
          <h1 className="text-3xl font-extrabold uppercase tracking-wide">{school.name}</h1>
          <p className="text-sm opacity-90">Progress Report</p>
        </div>
        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-xs backdrop-blur-sm">
          Logo
        </div>
      </div>

      <div className="p-8">
        {/* Student Info */}
        <div className="grid grid-cols-2 gap-8 mb-8 bg-gray-50 p-4 rounded-xl">
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">Student Name</p>
            <p className="text-xl font-bold text-gray-900">{student.name}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">Teacher</p>
              <p className="font-medium text-gray-800">{student.teacher}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">Grade/Class</p>
              <p className="font-medium text-gray-800">{student.class}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">School Year</p>
              <p className="font-medium text-gray-800">{student.year}</p>
            </div>
          </div>
        </div>

        {/* Main Content: Scores + Scale */}
        <div className="flex gap-8 mb-8">
          {/* Subject Table */}
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-800 mb-3">Learning Areas</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-2 text-gray-600">SUBJECT</th>
                  <th className="text-center py-2 text-gray-600">TERM 1</th>
                  <th className="text-center py-2 text-gray-600">TERM 2</th>
                  <th className="text-center py-2 text-gray-600">TERM 3</th>
                </tr>
              </thead>
              <tbody>
                {result.scores.map((s, i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 font-medium text-gray-800">{s.subject}</td>
                    <td className="text-center py-3 text-gray-600">{s.q1 ?? '—'}</td>
                    <td className="text-center py-3 text-gray-600">{s.q2 ?? '—'}</td>
                    <td className="text-center py-3 text-gray-600">{s.q3 ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Grading Scale Card */}
          <div className="w-64">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <h2 className="text-sm font-bold text-gray-800 mb-3">Grading Scale</h2>
              <div className="space-y-3 text-xs">
                {result.gradingScale.map((g, i) => (
                  <div key={i} className="flex flex-col">
                    <span className="font-bold text-gray-900">{g.grade}</span>
                    <span className="text-gray-500">{g.description}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Attendance + Comments */}
        <div className="grid grid-cols-3 gap-8">
          {/* Attendance */}
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-3">Attendance</h2>
            <div className="bg-gray-50 p-4 rounded-xl space-y-2 text-sm border border-gray-100">
              <div className="flex justify-between">
                <span className="text-gray-600">Absences</span>
                <span className="font-bold text-gray-900">{result.attendance.absences}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tardies</span>
                <span className="font-bold text-gray-900">{result.attendance.tardies}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Early Dismissals</span>
                <span className="font-bold text-gray-900">{result.attendance.earlyDismissals}</span>
              </div>
            </div>
          </div>

          {/* Comments */}
          <div className="col-span-2">
            <h2 className="text-lg font-bold text-gray-800 mb-3">Teacher's Comments</h2>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 h-32 text-sm text-gray-700 italic">
              "{result.comment}"
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-100 p-4 text-center text-xs text-gray-500 border-t border-gray-200">
        <p>{school.address} | Phone: {school.phone}</p>
        <p className="mt-1 font-medium">{school.url}</p>
      </div>
    </div>
  );
};

export default Template4;
