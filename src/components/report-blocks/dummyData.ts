export const DUMMY_REPORT_DATA = {
    school: {
        name: "EXCELLENCE INTERNATIONAL ACADEMY",
        motto: "Knowledge is Light",
        address: "123 Education Way, Lagos, Nigeria",
        logo: "https://via.placeholder.com/150",
    },
    student: {
        name: "DOE, JOHN EMMANUEL",
        admissionNo: "EIA/2023/001",
        gender: "Male",
        dob: "14-Feb-2012",
        class: "JSS 2 A",
        session: "2023/2024",
        term: "First Term",
        age: "12 Yrs",
        admissionDate: "05-Sep-2023",
        photo: "https://via.placeholder.com/150"
    },
    summary: {
        totalScore: "785",
        average: "78.5",
        gpa: "3.8",
        position: "3rd out of 45",
        grade: "B",
        remark: "Very Good Result"
    },
    columns: ["CA1", "CA2", "Exam", "Total", "Grade", "Remark"],
    subjects: [
        { name: "Mathematics", scores: [15, 18, 55, 88, "A", "Excellent"] },
        { name: "English Language", scores: [14, 16, 45, 75, "B", "Very Good"] },
        { name: "Basic Science", scores: [10, 12, 40, 62, "C", "Good"] },
        { name: "Social Studies", scores: [18, 19, 60, 97, "A+", "Outstanding"] },
        { name: "Agricultural Science", scores: [12, 14, 50, 76, "B", "Very Good"] }
    ],
    attendance: {
        present: 110,
        absent: 4,
        late: 2
    },
    traits: [
        { group: "AFFECTIVE DOMAIN", items: [
            { label: "Punctuality", score: "A" },
            { label: "Neatness", score: "B" },
            { label: "Politeness", score: "A" }
        ]},
        { group: "PSYCHOMOTOR SKILLS", items: [
            { label: "Handwriting", score: "B" },
            { label: "Sports", score: "A" }
        ]}
    ],
    comments: {
        teacher: "John has shown remarkable improvement this term. He is very attentive in class.",
        teacherName: "Mr. Adams Smith",
        principal: "An excellent performance. Keep it up!",
        principalTitle: "Principal",
        principalName: "Dr. Jereh Lomak",
        principalSignature: "https://via.placeholder.com/150x50"
    },
    nextTerm: "15th January, 2024"
};
