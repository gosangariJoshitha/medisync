import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Download, FileText, Share2, X, AlertOctagon } from "lucide-react";
import { motion as Motion } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { db } from "../../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const COLORS = ["#10B981", "#F59E0B", "#EF4444"]; // Green, Yellow, Red

export default function Reports() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [riskData, setRiskData] = useState([]);
  const [adherenceData, setAdherenceData] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    critical: 0,
    avgAdherence: 0,
  });

  const [showBreakdown, setShowBreakdown] = useState(false);
  const reportRef = useRef(null);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "patients"),
      where("doctorUid", "==", currentUser.uid),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const patientList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPatients(patientList);

      // 1. Risk Distribution
      const stable = patientList.filter(
        (p) => !p.riskStatus || p.riskStatus === "stable",
      ).length;
      const attention = patientList.filter(
        (p) => p.riskStatus === "attention",
      ).length;
      const critical = patientList.filter(
        (p) => p.riskStatus === "critical",
      ).length;

      setRiskData([
        { name: "Stable", value: stable, color: "#10B981" },
        { name: "Attention", value: attention, color: "#F59E0B" },
        { name: "Critical", value: critical, color: "#EF4444" },
      ]);

      // 2. Adherence Distribution (Buckets)
      const high = patientList.filter(
        (p) => (p.adherenceScore || 100) >= 90,
      ).length;
      const medium = patientList.filter(
        (p) =>
          (p.adherenceScore || 100) >= 70 && (p.adherenceScore || 100) < 90,
      ).length;
      const low = patientList.filter(
        (p) => (p.adherenceScore || 100) < 70,
      ).length;

      setAdherenceData([
        { name: "High (90%+)", count: high },
        { name: "Medium (70-89%)", count: medium },
        { name: "Low (<70%)", count: low },
      ]);

      // 3. Summary Stats
      const totalAdherence = patientList.reduce(
        (acc, p) => acc + (p.adherenceScore || 100),
        0,
      );
      setSummary({
        total: patientList.length,
        critical,
        avgAdherence: patientList.length
          ? Math.round(totalAdherence / patientList.length)
          : 0,
      });

      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleExport = async () => {
    if (!reportRef.current) return;
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("Clinic_Adherence_Report.pdf");
      alert("Report Downloaded Successfully!");
    } catch (error) {
      console.error("PDF Error", error);
      alert("Failed to generate PDF.");
    }
  };

  const handleShare = async () => {
    const shareText = `Clinic Status Update:\nMonitoring ${summary.total} patients.\nAvg Adherence: ${summary.avgAdherence}%.\nCritical Cases: ${summary.critical}.`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "MediSync Clinic Report",
          text: shareText,
        });
      } catch (err) {
        console.error("Share failed", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        alert("Summary copied to clipboard!");
      } catch (err) {
        alert("Wait, failed to copy.");
      }
    }
  };

  if (loading) {
    return <div className="p-10 text-center">Loading analytics...</div>;
  }

  return (
    <div className="fade-in" ref={reportRef}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Reports & Analytics</h1>
        <button onClick={handleExport} className="btn btn-primary">
          <Download size={18} /> Export PDF
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Risk Distribution Chart */}
        <div className="card h-96 flex flex-col">
          <h3 className="font-semibold mb-4 text-center">
            Patient Risk Distribution
          </h3>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label
                >
                  {riskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Adherence Distribution Chart */}
        <div className="card h-96 flex flex-col">
          <h3 className="font-semibold mb-4 text-center">
            Adherence Levels (Patient Count)
          </h3>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={adherenceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar
                  dataKey="count"
                  fill="#3B82F6"
                  name="Patients"
                  radius={[4, 4, 0, 0]}
                  barSize={50}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Smart Analysis */}
      <h2 className="text-lg font-semibold mb-4">Smart Analysis</h2>

      <Motion.div
        whileHover={{ y: -2 }}
        className="card border-0 bg-gradient-to-br from-white to-blue-50 border-l-4 border-l-blue-600 mb-6 shadow-lg relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100/50 rounded-full -mr-16 -mt-16 blur-2xl"></div>

        <div className="flex items-start gap-5 relative z-10">
          <div className="p-4 bg-white text-blue-600 rounded-xl shadow-md ring-1 ring-blue-100">
            <FileText size={28} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-xl text-gray-900 mb-2 flex items-center gap-2">
              Clinical Insights
              <span className="text-xs font-normal px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                AI Analysis
              </span>
            </h3>
            <p className="text-gray-600 leading-relaxed text-base">
              You are currently monitoring{" "}
              <strong className="text-gray-900">{summary.total}</strong>{" "}
              patients with an average adherence of{" "}
              <strong
                className={
                  summary.avgAdherence >= 80
                    ? "text-green-600"
                    : "text-orange-600"
                }
              >
                {summary.avgAdherence}%
              </strong>
              . There are{" "}
              <strong className="text-red-600">
                {summary.critical} critical
              </strong>{" "}
              cases requiring immediate attention.
              {summary.avgAdherence < 70 &&
                " Consider scheduling follow-ups for low adherence patients."}
            </p>
            <div className="flex gap-4 mt-5">
              <button
                onClick={() => setShowBreakdown(true)}
                className="btn btn-sm btn-outline text-blue-700 border-blue-200 hover:bg-blue-50"
              >
                View Detailed Breakdown
              </button>
              <button
                onClick={handleShare}
                className="btn btn-sm btn-ghost text-gray-600 hover:text-blue-700 flex items-center gap-2"
              >
                <Share2 size={16} /> Share Report
              </button>
            </div>
          </div>
        </div>
      </Motion.div>

      {/* Breakdown Modal */}
      {showBreakdown && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-bold">Detailed Patient Breakdown</h2>
              <button
                onClick={() => setShowBreakdown(false)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500">
                    <th className="p-2 font-medium">Patient</th>
                    <th className="p-2 font-medium">Adherence</th>
                    <th className="p-2 font-medium">Risk Status</th>
                    <th className="p-2 font-medium">Last Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {patients
                    .sort(
                      (a, b) =>
                        (a.adherenceScore || 100) - (b.adherenceScore || 100),
                    )
                    .map((patient) => (
                      <tr key={patient.id} className="hover:bg-gray-50">
                        <td className="p-3 font-medium text-gray-900">
                          {patient.fullName}{" "}
                          <span className="text-xs text-gray-500 block">
                            {patient.patientId}
                          </span>
                        </td>
                        <td className="p-3 font-bold">
                          <span
                            className={
                              (patient.adherenceScore || 100) < 70
                                ? "text-red-600"
                                : "text-green-600"
                            }
                          >
                            {patient.adherenceScore || 100}%
                          </span>
                        </td>
                        <td className="p-3">
                          {patient.riskStatus === "critical" ? (
                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold flex items-center w-fit gap-1">
                              <AlertOctagon size={12} /> Critical
                            </span>
                          ) : (
                            <span className="capitalize text-gray-600">
                              {patient.riskStatus || "Stable"}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-gray-500">
                          {patient.dailyProgress?.date || "N/A"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
