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
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import {
  Download,
  FileText,
  Share2,
  X,
  AlertOctagon,
  Filter,
  Calendar,
  Stethoscope,
  Plus,
  Save,
  Users,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Bell,
} from "lucide-react";
import { motion as Motion } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { db } from "../../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  Timestamp,
  getDocs,
} from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const COLORS = ["#10B981", "#F59E0B", "#EF4444"]; // Green, Yellow, Red

export default function Reports() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);

  // Filters
  const [selectedPatient, setSelectedPatient] = useState("all");
  const [fromDate, setFromDate] = useState(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  ); // 7 days ago
  const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]); // Today

  // Analytics Data
  const [riskData, setRiskData] = useState([]);
  const [adherenceData, setAdherenceData] = useState([]);
  const [trendData, setTrendData] = useState([]); // Mocked timeline for now
  const [missedValues, setMissedValues] = useState([]); // Mocked missed doses

  const [summary, setSummary] = useState({
    total: 0,
    critical: 0,
    avgAdherence: 0,
    adherenceChange: 0,
    totalAlerts: 0,
    complianceRate: 0,
    missedDosesTotal: 0,
  });

  // Doctor Notes State
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const [showBreakdown, setShowBreakdown] = useState(false);
  const reportRef = useRef(null);
  const [dailyStatsMap, setDailyStatsMap] = useState({}); // Map of patientId -> dailyStats array

  // Fetch Data + Real-time Daily Stats
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "patients"),
      where("doctorUid", "==", currentUser.uid),
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const patientList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPatients(patientList);

      // Fetch daily_stats for last 7 days for each patient (for trend analysis)
      const statsMap = {};
      for (const patient of patientList) {
        try {
          const statsRef = collection(
            db,
            "patients",
            patient.id,
            "daily_stats",
          );
          const snapshot2 = await getDocs(statsRef);
          statsMap[patient.id] = snapshot2.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }));
        } catch (err) {
          console.error(`Error fetching daily_stats for ${patient.id}:`, err);
          statsMap[patient.id] = [];
        }
      }
      setDailyStatsMap(statsMap);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Apply Filters & Calculate Metrics
  useEffect(() => {
    let filtered = patients;

    // 1. Filter by Patient
    if (selectedPatient !== "all") {
      filtered = filtered.filter((p) => p.id === selectedPatient);
    }

    // 2. Filter by Date (Logic would typically filter *historical* logs, here we just filter the list contextually or mock it)
    // For this demo, we assume the 'current state' reflects the date range or we stick to current snapshot.

    setFilteredPatients(filtered);

    // --- Recalculate Charts based on Filtered Data ---

    // 1. Risk Distribution
    const stable = filtered.filter(
      (p) => !p.riskStatus || p.riskStatus === "stable",
    ).length;
    const attention = filtered.filter(
      (p) => p.riskStatus === "attention",
    ).length;
    const critical = filtered.filter((p) => p.riskStatus === "critical").length;

    setRiskData([
      { name: "Stable", value: stable, color: "#10B981" },
      { name: "Attention", value: attention, color: "#F59E0B" },
      { name: "Critical", value: critical, color: "#EF4444" },
    ]);

    // 2. Adherence Buckets
    const high = filtered.filter((p) => (p.adherenceScore || 100) >= 90).length;
    const medium = filtered.filter(
      (p) => (p.adherenceScore || 100) >= 70 && (p.adherenceScore || 100) < 90,
    ).length;
    const low = filtered.filter((p) => (p.adherenceScore || 100) < 70).length;

    setAdherenceData([
      { name: "High (90%+)", count: high, fill: "#10B981" },
      { name: "Medium (70-89%)", count: medium, fill: "#F59E0B" },
      { name: "Low (<70%)", count: low, fill: "#EF4444" },
    ]);

    // 3. Trend Data (Real from daily_stats) - filtered by date range
    const from = new Date(fromDate);
    const to = new Date(toDate);
    to.setHours(23, 59, 59, 999); // Include all of the to-date

    // Generate date range based on fromDate and toDate
    const dateRange = [];
    let current = new Date(from);
    while (current <= to) {
      dateRange.push(current.toISOString().split("T")[0]);
      current.setDate(current.getDate() + 1);
    }

    const trendByDate = {};
    filtered.forEach((patient) => {
      const stats = dailyStatsMap[patient.id] || [];
      stats.forEach((s) => {
        // Only include stats within selected date range
        if (s.date >= fromDate && s.date <= toDate) {
          if (!trendByDate[s.date]) {
            trendByDate[s.date] = { adherences: [], missedCounts: [] };
          }
          trendByDate[s.date].adherences.push(s.adherence || 0);
          trendByDate[s.date].missedCounts.push(s.total - s.taken || 0);
        }
      });
    });

    const realTrend = dateRange.map((dateStr) => {
      const d = new Date(dateStr);
      const data = trendByDate[dateStr];
      const adherence =
        data && data.adherences.length > 0
          ? Math.round(
              data.adherences.reduce((a, b) => a + b, 0) /
                data.adherences.length,
            )
          : 0;
      const missed =
        data && data.missedCounts.length > 0
          ? Math.round(
              data.missedCounts.reduce((a, b) => a + b, 0) /
                data.missedCounts.length,
            )
          : 0;
      return {
        date: d.toLocaleDateString("en-US", { weekday: "short" }),
        dateStr,
        adherence,
        missed,
        amt: 100,
      };
    });
    setTrendData(realTrend);

    // 4. Missed Doses Data (Real from daily_stats)
    const missedByDate = {};
    filtered.forEach((patient) => {
      const stats = dailyStatsMap[patient.id] || [];
      stats.forEach((s) => {
        if (!missedByDate[s.date]) {
          missedByDate[s.date] = [];
        }
        missedByDate[s.date].push(s.total - s.taken || 0);
      });
    });

    const realMissed = dateRange.map((dateStr) => {
      const d = new Date(dateStr);
      const missed = missedByDate[dateStr] || [];
      return {
        date: d.toLocaleDateString("en-US", { weekday: "short" }),
        missed: missed.reduce((a, b) => a + b, 0),
      };
    });
    setMissedValues(realMissed);

    // 5. Summary Stats
    const totalAdherence = filtered.length
      ? Math.round(
          filtered.reduce((acc, p) => acc + (p.adherenceScore || 100), 0) /
            filtered.length,
        )
      : 0;

    // Calculate adherence change based on date range
    let adherenceChangeVal = 0;
    if (realTrend.length >= 2) {
      const lastDay = realTrend[realTrend.length - 1];
      const firstDay = realTrend[0];
      adherenceChangeVal =
        (lastDay?.adherence || 0) - (firstDay?.adherence || 0);
    }

    let totalMissedDoses = realMissed.reduce((acc, m) => acc + m.missed, 0);
    const complianceRate = totalAdherence;
    const totalAlerts = critical;

    setSummary({
      total: filtered.length,
      critical,
      avgAdherence: totalAdherence,
      adherenceChange: adherenceChangeVal,
      totalAlerts,
      complianceRate,
      missedDosesTotal: totalMissedDoses,
    });
  }, [patients, selectedPatient, fromDate, toDate, dailyStatsMap]);

  const handleSaveNote = async () => {
    if (!noteText.trim()) return;
    if (selectedPatient === "all") {
      alert("Please select a specific patient to add a note.");
      return;
    }

    try {
      setSavingNote(true);
      await addDoc(
        collection(db, "patients", selectedPatient, "doctor_notes"),
        {
          text: noteText,
          doctorName: currentUser.displayName || "Doctor",
          timestamp: Timestamp.now(),
        },
      );
      alert("Note saved successfully.");
      setNoteText("");
    } catch (err) {
      console.error("Error saving note:", err);
      alert("Failed to save note.");
    } finally {
      setSavingNote(false);
    }
  };

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
    <div className="fade-in space-y-6 overflow-auto" ref={reportRef}>
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Reports & Analytics
            <span className="ml-3 px-3 py-1 bg-red-100 text-red-600 text-xs font-bold uppercase rounded-full animate-pulse">
              Live Monitoring
            </span>
          </h1>
          <p className="text-sm text-gray-500">
            Real-time insights on your patient cohort.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="btn btn-primary flex items-center gap-2"
          >
            <Download size={18} /> Export PDF
          </button>
        </div>
      </div>

      {/* Filters Bar - Enhanced with Calendar */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl shadow-md border border-blue-200 space-y-4">
        {/* Top Row: Total Patients */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users size={28} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Cohort Analytics
              </h2>
              <p className="text-sm text-gray-600 font-medium">
                Real-time monitoring dashboard
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-600 uppercase tracking-widest">
              Total Patients
            </p>
            <p className="text-4xl font-bold text-blue-600">{summary.total}</p>
          </div>
        </div>

        {/* Bottom Row: Date Range & Patient Drill-down */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-blue-200">
          {/* From Date */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2 uppercase">
              📅 From Date
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="input input-bordered w-full bg-white border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg"
            />
          </div>

          {/* To Date */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2 uppercase">
              📅 To Date
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="input input-bordered w-full bg-white border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg"
            />
          </div>

          {/* Patient Drill-down */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2 uppercase">
              👤 Patient Details
            </label>
            <select
              value={selectedPatient}
              onChange={(e) => setSelectedPatient(e.target.value)}
              className="select select-bordered w-full bg-white border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg"
            >
              <option value="all">📊 All Patients Summary</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  📋 {p.fullName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Range Summary */}
        <div className="text-xs text-gray-600 pt-2 border-t border-blue-200">
          📊 Analyzing data from{" "}
          <span className="font-bold text-gray-800">{fromDate}</span> to{" "}
          <span className="font-bold text-gray-800">{toDate}</span>
        </div>
      </div>

      {/* KPI Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Patients Card */}
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-default">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-bold text-blue-700 uppercase tracking-widest mb-1">
                Total Patients
              </p>
              <p className="text-4xl font-bold text-blue-700">
                {summary.total}
              </p>
            </div>
            <div className="p-3 bg-blue-300 rounded-lg shadow-md">
              <Users size={28} className="text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-blue-600 font-medium">
            ✓ Under active monitoring
          </p>
        </div>

        {/* Compliance Rate Card */}
        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-default">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-bold text-green-700 uppercase tracking-widest mb-1">
                Compliance Rate
              </p>
              <p className="text-4xl font-bold text-green-700">
                {summary.complianceRate}%
              </p>
            </div>
            <div className="p-3 bg-green-300 rounded-lg shadow-md">
              <CheckCircle2 size={28} className="text-green-600" />
            </div>
          </div>
          <p className="text-xs text-green-600 font-medium">
            ✓ Average adherence rate
          </p>
        </div>

        {/* Critical Cases Card */}
        <div className="card bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-300 p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-default">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-bold text-red-700 uppercase tracking-widest mb-1">
                Critical Cases
              </p>
              <p className="text-4xl font-bold text-red-700">
                {summary.critical}
              </p>
            </div>
            <div className="p-3 bg-red-300 rounded-lg shadow-md">
              <AlertCircle size={28} className="text-red-600" />
            </div>
          </div>
          <p className="text-xs text-red-600 font-medium">
            ⚠ Requires attention
          </p>
        </div>

        {/* Adherence Change Card */}
        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-default">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-bold text-purple-700 uppercase tracking-widest mb-1">
                Period Trend
              </p>
              <p className="text-4xl font-bold text-purple-700">
                {summary.adherenceChange > 0 ? "+" : ""}
                {summary.adherenceChange.toFixed(1)}%
              </p>
            </div>
            <div
              className={`p-3 rounded-lg shadow-md ${
                summary.adherenceChange > 0
                  ? "bg-green-300"
                  : summary.adherenceChange < 0
                    ? "bg-red-300"
                    : "bg-gray-300"
              }`}
            >
              {summary.adherenceChange > 0 ? (
                <TrendingUp size={28} className="text-green-600" />
              ) : summary.adherenceChange < 0 ? (
                <TrendingDown size={28} className="text-red-600" />
              ) : (
                <Minus size={28} className="text-gray-600" />
              )}
            </div>
          </div>
          <p className="text-xs text-purple-600 font-medium">
            📈 vs. start of period
          </p>
        </div>

        {/* Missed Doses Card */}
        <div className="card bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-300 p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-default">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-bold text-orange-700 uppercase tracking-widest mb-1">
                Missed Doses
              </p>
              <p className="text-4xl font-bold text-orange-700">
                {summary.missedDosesTotal}
              </p>
            </div>
            <div className="p-3 bg-orange-300 rounded-lg shadow-md">
              <AlertOctagon size={28} className="text-orange-600" />
            </div>
          </div>
          <p className="text-xs text-orange-600 font-medium">📅 Period total</p>
        </div>

        {/* Total Alerts Card */}
        <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-300 p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-default">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-bold text-yellow-700 uppercase tracking-widest mb-1">
                Critical Alerts
              </p>
              <p className="text-4xl font-bold text-yellow-700">
                {summary.totalAlerts}
              </p>
            </div>
            <div className="p-3 bg-yellow-300 rounded-lg shadow-md">
              <Bell size={28} className="text-yellow-600" />
            </div>
          </div>
          <p className="text-xs text-yellow-600 font-medium">
            🚨 Active & pending
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Adherence Trend */}
        {/* Adherence Trend */}
        <div className="card min-h-[350px] flex flex-col p-6 bg-gradient-to-br from-white to-blue-50 border-2 border-blue-200 shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
          <div className="mb-4">
            <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2 mb-2">
              <Calendar size={20} className="text-blue-500" />
              Period Adherence Trend
            </h3>
            <p className="text-xs text-gray-600">
              Daily medication adherence trend showing{" "}
              {...Math.max(
                ...(trendData.map((d) => d.adherence) || [0]),
              ).toFixed(0)}
              % peak adherence
            </p>
          </div>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient
                    id="colorAdherence"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E5E7EB"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: "#6B7280" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#6B7280" }}
                  domain={[0, 100]}
                  label={{
                    value: "Adherence %",
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    borderRadius: "8px",
                    border: "1px solid #3B82F6",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                  formatter={(value) => [`${value.toFixed(1)}%`, "Adherence"]}
                  labelStyle={{ color: "#374151" }}
                />
                <Area
                  type="monotone"
                  dataKey="adherence"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorAdherence)"
                  animationDuration={2000}
                  isAnimationActive={true}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-700">
              <span className="font-bold">📈 Insight:</span> Average adherence
              is{" "}
              <span className="font-bold text-blue-600">
                {summary.complianceRate}%
              </span>{" "}
              over the selected period.{" "}
              {summary.adherenceChange >= 0 ? (
                <span className="text-green-600">Trend is improving ✓</span>
              ) : (
                <span className="text-red-600">Attention required ⚠</span>
              )}
            </p>
          </div>
        </div>

        {/* Missed Doses Bar Chart */}
        {/* Missed Doses Bar Chart */}
        <div className="card min-h-[350px] flex flex-col p-6 bg-gradient-to-br from-white to-red-50 border-2 border-red-200 shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
          <div className="mb-4">
            <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2 mb-2">
              <AlertOctagon size={20} className="text-red-500" />
              Period Missed Dose Trends
            </h3>
            <p className="text-xs text-gray-600">
              Daily missed doses showing total incomplete medications across all
              patients
            </p>
          </div>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={missedValues}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E5E7EB"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: "#6B7280" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: "#6B7280" }}
                  label={{
                    value: "Missed Doses",
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
                <Tooltip
                  cursor={{ fill: "#FEF2F2" }}
                  contentStyle={{
                    backgroundColor: "#fff",
                    borderRadius: "8px",
                    border: "1px solid #EF4444",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                  formatter={(value) => [`${value} doses`, "Missed"]}
                  labelStyle={{ color: "#374151" }}
                />
                <Bar
                  dataKey="missed"
                  fill="#EF4444"
                  name="Missed Doses"
                  radius={[4, 4, 0, 0]}
                  barSize={20}
                  animationDuration={1500}
                  isAnimationActive={true}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-700">
              <span className="font-bold">⚠️ Alert:</span> Total missed doses in
              period:{" "}
              <span className="font-bold text-red-600">
                {summary.missedDosesTotal}
              </span>
              {summary.missedDosesTotal > 5 ? (
                <span className="text-red-600">
                  {" "}
                  | High miss rate - Intervene now ✗
                </span>
              ) : summary.missedDosesTotal > 2 ? (
                <span className="text-orange-600">
                  {" "}
                  | Moderate - Monitor closely
                </span>
              ) : (
                <span className="text-green-600"> | Good - Keep it up ✓</span>
              )}
            </p>
          </div>
        </div>

        {/* Risk Distribution - Custom Styled Bar */}
        {/* Risk Distribution - Custom Styled Bar */}
        <div className="card min-h-[350px] flex flex-col p-6 bg-gradient-to-br from-white to-orange-50 border-2 border-orange-200 shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
          <div className="mb-6">
            <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2 mb-2">
              <AlertCircle size={20} className="text-orange-500" />
              Patient Risk Distribution
            </h3>
            <p className="text-xs text-gray-600">
              Classification of patients by health risk level
            </p>
          </div>

          {/* Custom Risk Distribution Visualization */}
          <div className="flex-1 space-y-6 flex flex-col justify-center">
            {riskData && riskData.length > 0 ? (
              <div className="space-y-4">
                {riskData.map((item, idx) => {
                  const percentage =
                    summary.total > 0 ? (item.value / summary.total) * 100 : 0;
                  const riskEmoji =
                    item.name === "Stable"
                      ? "🟢"
                      : item.name === "Attention"
                        ? "🟡"
                        : "🔴";
                  const riskColor =
                    item.name === "Stable"
                      ? "bg-green-500"
                      : item.name === "Attention"
                        ? "bg-yellow-500"
                        : "bg-red-500";
                  const riskBgLight =
                    item.name === "Stable"
                      ? "bg-green-100"
                      : item.name === "Attention"
                        ? "bg-yellow-100"
                        : "bg-red-100";

                  return (
                    <div key={idx}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-gray-800 flex items-center gap-2">
                          {riskEmoji} {item.name}
                        </span>
                        <span className="text-lg font-bold text-gray-900">
                          {item.value}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-sm">
                        <Motion.div
                          className={`h-full ${riskColor} rounded-full transition-all duration-1000 ease-out`}
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-600 text-right mt-1">
                        {percentage.toFixed(1)}% of cohort
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No risk distribution data
              </div>
            )}
          </div>

          {/* Risk Assessment Summary */}
          <div className="mt-6 pt-6 border-t border-orange-200 bg-orange-50 -mx-6 -mb-6 px-6 py-4 rounded-b-xl">
            <p className="text-xs text-gray-700">
              <span className="font-bold">📊 Risk Assessment:</span>
              <br />
              <span className="text-green-700">
                ✓ {riskData.find((r) => r.name === "Stable")?.value || 0} stable
                patients
              </span>{" "}
              |
              <span className="text-yellow-700">
                {" "}
                ⚠ {riskData.find((r) => r.name === "Attention")?.value ||
                  0}{" "}
                need attention
              </span>{" "}
              |
              <span className="text-red-700">
                {" "}
                ✗ {riskData.find((r) => r.name === "Critical")?.value || 0}{" "}
                critical
              </span>
            </p>
          </div>
        </div>

        {/* Adherence Buckets (Real Data with Color Coding) */}
        {/* Adherence Buckets (Real Data with Color Coding) */}
        <div className="card min-h-[420px] flex flex-col p-6 bg-gradient-to-br from-white to-green-50 border-2 border-green-200 shadow-lg hover:shadow-xl transition-shadow">
          <div className="mb-4">
            <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2 mb-2">
              <CheckCircle2 size={20} className="text-green-500" />
              Adherence Performance Buckets
            </h3>
            <p className="text-xs text-gray-600">
              Patient distribution by medication adherence performance levels
            </p>
          </div>
          <div className="flex-1 w-full min-h-0">
            {adherenceData && adherenceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={adherenceData}
                  layout="vertical"
                  margin={{ left: 120 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={true}
                    vertical={false}
                    stroke="#E5E7EB"
                  />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 12, fill: "#6B7280" }}
                    label={{
                      value: "Patients",
                      position: "insideBottomRight",
                      offset: -5,
                    }}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={110}
                    tick={{ fontSize: 11, fill: "#374151" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      borderRadius: "8px",
                      border: "1px solid #10B981",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                    formatter={(value) => [`${value} patients`, "Count"]}
                    labelStyle={{ color: "#374151" }}
                  />
                  <Bar
                    dataKey="count"
                    name="Patients"
                    radius={[0, 6, 6, 0]}
                    animationDuration={1000}
                  >
                    {adherenceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No adherence data available
              </div>
            )}
          </div>
          {/* Insights & Legend */}
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
            <div className="grid grid-cols-3 gap-2 text-xs mb-3">
              {adherenceData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: item.fill }}
                  />
                  <span className="text-gray-700 font-medium">
                    {item.count} {item.name}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-700">
              <span className="font-bold">📊 Distribution:</span>{" "}
              {adherenceData.find((a) => a.name.includes("High"))?.count || 0}{" "}
              high-achievers,{" "}
              {adherenceData.find((a) => a.name.includes("Medium"))?.count || 0}{" "}
              moderate performers. Focus on{" "}
              <span className="font-bold text-red-600">
                {adherenceData.find((a) => a.name.includes("Low"))?.count || 0}
              </span>{" "}
              low-performers.
            </p>
          </div>
        </div>
      </div>

      {/* AI Summary & Doctor Actions */}
      <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">
        AI Insights & Actions
      </h2>
      <div className="overflow-x-auto -mx-2 px-2 py-2">
        <div className="flex gap-6 w-max">
          {/* AI Summary Card */}
          <div className="card flex-none min-w-[360px] lg:min-w-[420px] bg-gradient-to-br from-indigo-50 to-white border-indigo-100 flex flex-col gap-4 h-full p-6 overflow-hidden">
            <div className="p-3 bg-white rounded-lg shadow-sm h-fit text-indigo-600 flex-shrink-0">
              <Stethoscope size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-indigo-900 mb-3">
                Cohort Analysis
              </h3>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white/60 p-2 rounded border border-indigo-100">
                  <p className="text-xs text-indigo-600 font-semibold uppercase">
                    Total Patients
                  </p>
                  <p className="text-2xl font-bold text-indigo-900">
                    {summary.total}
                  </p>
                </div>
                <div className="bg-white/60 p-2 rounded border border-indigo-100">
                  <p className="text-xs text-indigo-600 font-semibold uppercase">
                    Critical
                  </p>
                  <p
                    className={`text-2xl font-bold ${summary.critical > 0 ? "text-red-600" : "text-green-600"}`}
                  >
                    {summary.critical}
                  </p>
                </div>
                <div className="bg-white/60 p-2 rounded border border-indigo-100">
                  <p className="text-xs text-indigo-600 font-semibold uppercase">
                    Avg Adherence
                  </p>
                  <p className="text-2xl font-bold text-indigo-900">
                    {summary.avgAdherence}%
                  </p>
                </div>
                <div className="bg-white/60 p-2 rounded border border-indigo-100">
                  <p className="text-xs text-indigo-600 font-semibold uppercase">
                    Change (1 week)
                  </p>
                  <p
                    className={`text-2xl font-bold ${summary.adherenceChange >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {summary.adherenceChange > 0 ? "+" : ""}
                    {summary.adherenceChange}%
                  </p>
                </div>
              </div>

              <p className="text-sm text-gray-700 leading-relaxed mb-4">
                {summary.critical > 0
                  ? `⚠️ You have ${summary.critical} critical patient(s) requiring immediate intervention. Focus on medication adherence and follow-up.`
                  : `✓ No critical patients detected. Continue current monitoring and maintain adherence support.`}
              </p>
              <div className="bg-white/60 p-3 rounded-lg border border-indigo-50 text-sm italic text-gray-600">
                "Suggestion:{" "}
                {summary.avgAdherence < 75
                  ? "Consider sending a broadcast voice reminder to improving adherence."
                  : "Maintenance therapy is effective. Continue current monitoring protocols."}
                "
              </div>

              <div className="flex gap-4 mt-4">
                <button
                  onClick={() => setShowBreakdown(true)}
                  className="btn btn-sm btn-outline text-indigo-600 border-indigo-200"
                >
                  View Detailed Breakdown
                </button>
                <button
                  onClick={handleShare}
                  className="btn btn-sm btn-ghost text-gray-600 hover:text-indigo-700 flex items-center gap-2"
                >
                  <Share2 size={16} /> Share Summary
                </button>
              </div>
            </div>
          </div>

          {/* Removed: Chronic Condition Insight Engine - replaced by expanded Cohort stats below */}

          {/* Doctor Notes Action */}
          <div className="card flex-none min-w-[360px] lg:min-w-[420px] border-gray-200 flex flex-col h-full p-6 overflow-hidden">
            <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
              <FileText size={18} className="text-gray-500" />
              Doctor's Notes
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              {selectedPatient === "all"
                ? "Select a patient above to add a specific note."
                : `Adding note for selected patient.`}
            </p>
            <textarea
              className="input h-32 resize-none mb-3 text-sm"
              placeholder="Enter follow-up plan or clinical observation..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              disabled={selectedPatient === "all"}
            ></textarea>
            <button
              onClick={handleSaveNote}
              disabled={
                selectedPatient === "all" || savingNote || !noteText.trim()
              }
              className="btn btn-sm btn-primary mt-auto w-full flex items-center justify-center gap-2"
            >
              <Save size={16} />
              {savingNote ? "Saving..." : "Save to Patient Record"}
            </button>
          </div>
        </div>
      </div>

      {/* Detailed Table Modal (Same as before, just kept for completeness) */}
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
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredPatients
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
