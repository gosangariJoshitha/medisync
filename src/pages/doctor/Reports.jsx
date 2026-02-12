import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Download, FileText, Share2 } from "lucide-react";
import { motion } from "framer-motion";

const weeklyData = [
    { name: 'Mon', Adherence: 90, Missed: 10 },
    { name: 'Tue', Adherence: 85, Missed: 15 },
    { name: 'Wed', Adherence: 95, Missed: 5 },
    { name: 'Thu', Adherence: 80, Missed: 20 },
    { name: 'Fri', Adherence: 88, Missed: 12 },
    { name: 'Sat', Adherence: 92, Missed: 8 },
    { name: 'Sun', Adherence: 96, Missed: 4 },
];

const trendData = [
    { name: 'Week 1', avg: 82 },
    { name: 'Week 2', avg: 85 },
    { name: 'Week 3', avg: 80 },
    { name: 'Week 4', avg: 90 },
];

export default function Reports() {

    const handleExport = () => {
        alert("Downloading PDF Report...");
    };

    return (
        <div className="fade-in">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold">Reports & Analytics</h1>
                <button onClick={handleExport} className="btn btn-primary">
                    <Download size={18} /> Export PDF
                </button>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
                {/* Adherence Chart */}
                <div className="card h-96">
                    <h3 className="font-semibold mb-4 text-center">Weekly Adherence Overview</h3>
                    <ResponsiveContainer width="100%" height="90%">
                        <BarChart data={weeklyData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="Adherence" fill="#2563EB" name="Taken (%)" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Missed" fill="#EF4444" name="Missed (%)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Trend Chart */}
                <div className="card h-96">
                    <h3 className="font-semibold mb-4 text-center">Monthly Improvement Trend</h3>
                    <ResponsiveContainer width="100%" height="90%">
                        <LineChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="avg" stroke="#10B981" strokeWidth={3} name="Avg Adherence" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Smart Summary */}
            <h2 className="text-lg font-semibold mb-4">Smart Analysis</h2>

            <motion.div whileHover={{ y: -2 }} className="card border-l-4 border-l-blue-500 mb-6">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                        <FileText size={24} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg">Weekly Summary</h3>
                        <p className="text-muted mt-1">
                            Overall clinic adherence has improved by <strong>5%</strong> compared to last week.
                            However, <strong>Tuesday evenings</strong> show the highest rate of missed doses across all patients.
                            Consider sending a targeted reminder on Tuesday afternoons.
                        </p>
                        <div className="flex gap-4 mt-4">
                            <button className="text-primary text-sm font-semibold hover:underline">View Detailed Breakdown</button>
                            <button className="text-primary text-sm font-semibold hover:underline flex items-center gap-1"><Share2 size={14} /> Share with Admin</button>
                        </div>
                    </div>
                </div>
            </motion.div>

        </div>
    );
}
