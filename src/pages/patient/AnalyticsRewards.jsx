import { useState, useEffect } from "react";
import { Award, Trophy, TrendingUp, Star } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useAuth } from "../../contexts/AuthContext";
import { doc, getDoc, collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../../firebase";

export default function AnalyticsRewards() {
    const { currentUser } = useAuth();
    const [stats, setStats] = useState({ adherence: 100, streak: 0, points: 0 });
    const [leaderboard, setLeaderboard] = useState([]);

    useEffect(() => {
        async function fetchData() {
            if (currentUser) {
                // 1. Fetch User Stats
                const userRef = doc(db, "users", currentUser.uid);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    const data = userSnap.data();
                    setStats({
                        adherence: data.adherenceScore || 100,
                        streak: data.streak || 0,
                        points: data.points || 0
                    });
                }

                // 2. Fetch Leaderboard (Mock logic: Segregated by role, but for now just showing all patients)
                // In real app, filter where("role", "==", "patient") and potentially by group
                const usersRef = collection(db, "users");
                const q = query(usersRef, orderBy("points", "desc"), limit(5));
                const lbSnap = await getDocs(q);
                setLeaderboard(lbSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            }
        }
        fetchData();
    }, [currentUser]);

    const data = [
        { name: 'Taken', value: stats.adherence },
        { name: 'Missed', value: 100 - stats.adherence },
    ];
    const COLORS = ['#10B981', '#EF4444'];

    return (
        <div className="fade-in">
            <h1 className="text-2xl font-semibold mb-6">Analytics & Rewards</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="card text-center">
                    <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 mb-4">
                        <Trophy size={32} />
                    </div>
                    <h3 className="text-3xl font-bold text-yellow-700">{stats.points}</h3>
                    <p className="text-muted">Total Points</p>
                </div>
                <div className="card text-center">
                    <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 mb-4">
                        <TrendingUp size={32} />
                    </div>
                    <h3 className="text-3xl font-bold text-orange-700">{stats.streak} Days</h3>
                    <p className="text-muted">Current Streak</p>
                </div>
                <div className="card text-center">
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
                        <Star size={32} />
                    </div>
                    <h3 className="text-3xl font-bold text-green-700">{stats.adherence}%</h3>
                    <p className="text-muted">Adherence Score</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                    <h3 className="font-semibold mb-4">Adherence Breakdown</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span>Taken</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            <span>Missed</span>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold">Leaderboard</h3>
                        <Award className="text-primary" />
                    </div>
                    <div className="space-y-4">
                        {leaderboard.map((user, index) => (
                            <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                            index === 1 ? 'bg-gray-200 text-gray-700' :
                                                index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-white text-gray-500 border'
                                        }`}>
                                        {index + 1}
                                    </div>
                                    <span className={currentUser?.uid === user.id ? "font-bold text-primary" : ""}>
                                        {user.fullName || "Anonymous"} {currentUser?.uid === user.id && "(You)"}
                                    </span>
                                </div>
                                <span className="font-semibold text-primary">{user.points || 0} pts</span>
                            </div>
                        ))}
                        {leaderboard.length === 0 && <p className="text-muted text-center pt-4">No data yet.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}
