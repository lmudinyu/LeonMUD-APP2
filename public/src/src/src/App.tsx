import React, { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";
import { jsPDF } from "jspdf";
import { FaHome, FaUsers, FaChartLine, FaFileAlt, FaUser, FaSignOutAlt } from "react-icons/fa";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

type Learner = {
  name: string;
  grade: string;
  marks: Record<string, number>;
  rank?: number;
};

const subjects = [
  "Mathematics", "English", "Kiswahili", "Integrated Science",
  "Agriculture", "Social Studies", "Pre-Technical Studies",
  "Religious Studies", "Creative Arts"
];

export default function App() {
  const [page, setPage] = useState("welcome");
  const [learners, setLearners] = useState<Learner[]>([]);
  const [learnerName, setLearnerName] = useState("");
  const [filterGrade, setFilterGrade] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [teacherGrade, setTeacherGrade] = useState("");
  const [teacherPhone, setTeacherPhone] = useState("");
  const [teacher, setTeacher] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedLearner, setSelectedLearner] = useState<string>("");

  // Load data from localStorage
  useEffect(() => {
    const savedLearners = JSON.parse(localStorage.getItem("learners") || "[]");
    const savedTeacher = JSON.parse(localStorage.getItem("teacherProfile") || "null");
    setLearners(savedLearners);
    if (savedTeacher) {
      setTeacherName(savedTeacher.name || "");
      setTeacherGrade(savedTeacher.grade || "");
      setTeacherPhone(savedTeacher.phone || "");
    }
  }, []);

  // Save data
  useEffect(() => {
    localStorage.setItem("learners", JSON.stringify(learners));
  }, [learners]);

  const getCBEBand = (mark: number) => {
    if (mark >= 81) return "EE";
    if (mark >= 61) return "ME";
    if (mark >= 41) return "AE";
    return "BE";
  };

  const total = (l: Learner) => subjects.reduce((sum, s) => sum + (l.marks?.[s] || 0), 0);
  const average = (l: Learner) => Math.round(total(l) / subjects.length);

  const ranked = (filtered: Learner[]) => {
    let arr = filtered.map(l => ({ ...l, avg: average(l) }));
    arr.sort((a, b) => b.avg - a.avg);
    return arr.map((l, i) => ({ ...l, rank: i + 1 }));
  };

  const addLearner = () => {
    if (!learnerName) return;
    setLearners([...learners, { name: learnerName, grade: filterGrade, marks: {} }]);
    setLearnerName("");
  };

  const reportCard = (l: Learner) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("CBE REPORT CARD", 80, 20);
    doc.text(`Name: ${l.name}`, 20, 30);
    doc.text(`Grade: ${l.grade}`, 20, 40);
    subjects.forEach((s, i) => {
      doc.text(`${s}: ${l.marks?.[s] || 0} (${getCBEBand(l.marks?.[s] || 0)})`, 20, 50 + i * 10);
    });
    doc.text(`Total: ${total(l)}`, 20, 150);
    doc.text(`Average: ${average(l)}`, 70, 150);
    doc.text(`Rank: ${l.rank}`, 120, 150);
    doc.save(`${l.name}_report.pdf`);
  };

  const logout = () => {
    setTeacher(null);
    setPage("welcome");
  };

  const filteredLearners = learners.filter(l => l.grade === filterGrade);
  const rankedLearners = ranked(filteredLearners);

  const subjectData = {
    labels: subjects,
    datasets: [
      {
        label: "Average per subject",
        data: subjects.map(s => {
          const totalMarks = filteredLearners.reduce((sum, l) => sum + (l.marks?.[s] || 0), 0);
          return filteredLearners.length ? totalMarks / filteredLearners.length : 0;
        }),
        borderColor: "pink",
        backgroundColor: "rgba(255,192,203,0.5)"
      }
    ]
  };

  let learnerChartData = null;
  if (selectedLearner) {
    const learner = rankedLearners.find(l => l.name === selectedLearner);
    if (learner) {
      learnerChartData = {
        labels: subjects,
        datasets: [
          {
            label: learner.name,
            data: subjects.map(s => learner.marks?.[s] || 0),
            borderColor: "pink",
            backgroundColor: "rgba(255,192,203,0.5)"
          }
        ]
      };
    }
  }

  return (
    <div className="container">
      {teacher && (
        <div className="sidebar">
          <h2>LEONMUD</h2>
          <button onClick={() => setPage("dashboard")}><FaHome /> Dashboard</button>
          <button onClick={() => setPage("learners")}><FaUsers /> Learners</button>
          <button onClick={() => setPage("analytics")}><FaChartLine /> Analytics</button>
          <button onClick={() => setPage("reports")}><FaFileAlt /> Reports</button>
          <button onClick={() => setPage("profile")}><FaUser /> Profile</button>
          <button onClick={logout}><FaSignOutAlt /> Logout</button>
        </div>
      )}
      <div className="main">
        {page === "welcome" && (
          <>
            <h1 style={{ animation: "fadeIn 2s" }}>Welcome to Leon’s School Tracker</h1>
            <h3>Enter your teacher account or create one</h3>
            <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
            <button onClick={() => setTeacher(email)}>Login / Create Account</button>
          </>
        )}

        {/* Learners Page */}
        {page === "learners" && (
          <>
            <h2>Learners</h2>
            <input placeholder="Learner Name" value={learnerName} onChange={e => setLearnerName(e.target.value)} />
            <input placeholder="Grade" value={filterGrade} onChange={e => setFilterGrade(e.target.value)} />
            <button onClick={addLearner}>Add Learner</button>

            <table border={1} style={{ marginTop: 20, width: "100%", background: "white" }}>
              <thead style={{ background: "pink" }}>
                <tr>
                  <th>Name</th>
                  {subjects.map(s => <th key={s}>{s}</th>)}
                  <th>Total</th>
                  <th>Average</th>
                  <th>Rank</th>
                </tr>
              </thead>
              <tbody>
                {rankedLearners.map((l, i) => (
                  <tr key={i}>
                    <td>{l.name}</td>
                    {subjects.map(s => (
                      <td key={s}>
                        <input
                          type="number"
                          value={l.marks[s] || ""}
                          onChange={e => {
                            const value = parseInt(e.target.value);
                            setLearners(prev => {
                              const updated = [...prev];
                              const idx = updated.findIndex(x => x.name === l.name && x.grade === l.grade);
                              if (!updated[idx].marks) updated[idx].marks = {};
                              updated[idx].marks[s] = value;
                              return updated;
                            });
                          }}
                        />
                      </td>
                    ))}
                    <td>{total(l)}</td>
                    <td>{average(l)}</td>
                    <td>{l.rank}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* Analytics */}
        {page === "analytics" && (
          <>
            <h2>Analytics</h2>
            <Line data={subjectData} />
            <br />
            <select value={selectedLearner} onChange={e => setSelectedLearner(e.target.value)}>
              <option value="">--Choose Learner--</option>
              {rankedLearners.map(l => <option key={l.name} value={l.name}>{l.name}</option>)}
            </select>
            {selectedLearner && learnerChartData && <Line data={learnerChartData} />}
          </>
        )}

        {/* Reports */}
        {page === "reports" && (
          <>
            <h2>Reports</h2>
            <button onClick={() => rankedLearners.forEach(l => reportCard(l))}>
              Generate Report Cards
            </button>
          </>
        )}

        {/* Profile */}
        {page === "profile" && (
          <>
            <h2>Teacher Profile</h2>
            <input placeholder="Name" value={teacherName} onChange={e => setTeacherName(e.target.value)} />
            <input placeholder="Grade" value={teacherGrade} onChange={e => setTeacherGrade(e.target.value)} />
            <input placeholder="Phone" value={teacherPhone} onChange={e => setTeacherPhone(e.target.value)} />
            <button onClick={() => {
              localStorage.setItem("teacherProfile", JSON.stringify({
                name: teacherName,
                grade: teacherGrade,
                phone: teacherPhone
              }));
              alert("Profile saved!");
            }}>Save Profile</button>
          </>
        )}
      </div>
    </div>
  );
}
