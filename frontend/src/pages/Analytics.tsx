import { useState, useEffect } from 'react';
import { cropsApi, type Crop } from '../services/api';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, Cell
} from 'recharts';
import { TrendingUp, DollarSign, Scale, Sprout, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Analytics() {
    const navigate = useNavigate();
    const [crops, setCrops] = useState<Crop[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const response = await cropsApi.getAll('harvested');
            setCrops(response.data);
        } catch (err) {
            console.error("Failed to load analytics data", err);
        } finally {
            setLoading(false);
        }
    };

    // Helper for ROI Calculation
    const calculateROI = (crop: Crop) => {
        const yield_g = crop.harvest?.actual_weight || 0;
        const revenue = yield_g * 0.05; // Mock: $0.05 per gram

        // Costs
        const seed = crop.seed_cost || 0;
        const soil = crop.soil_cost || 0;
        const days = 10; // Approx
        const energy = (crop.energy_cost_per_kwh || 0.12) * (crop.light_hours_per_day || 16) * days * (100 / 1000); // 100W light

        const totalCost = (seed + soil + energy) * (crop.number_of_trays || 1);
        return {
            revenue,
            totalCost,
            profit: revenue - totalCost,
            roi: totalCost > 0 ? ((revenue - totalCost) / totalCost) * 100 : 0
        };
    };

    const performanceData = crops.map(c => ({
        name: c.seed.name,
        yield: c.harvest?.actual_weight || 0,
        profit: calculateROI(c).profit,
        date: new Date(c.harvested_at!).toLocaleDateString()
    })).slice(-10);

    const totalGrams = crops.reduce((sum, c) => sum + (c.harvest?.actual_weight || 0), 0);
    const totalProfit = crops.reduce((sum, c) => sum + calculateROI(c).profit, 0);
    const avgEfficiency = crops.length > 0 ? (crops.reduce((sum, c) => sum + (c.harvest?.accuracy_percent || 0), 0) / crops.length) : 0;

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8F9FE] py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-10 flex items-center justify-between">
                    <div>
                        <button onClick={() => navigate('/')} className="flex items-center text-gray-500 hover:text-gray-900 mb-4 transition-colors">
                            <ArrowLeft size={18} className="mr-2" />
                            Back to Dashboard
                        </button>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Farm <span className="text-purple-600">Analytics</span></h1>
                        <p className="text-gray-500 font-medium mt-1">Commercial production performance & profitability</p>
                    </div>
                    <div className="bg-purple-100 px-4 py-2 rounded-2xl border border-purple-200">
                        <span className="text-purple-700 font-bold text-sm uppercase tracking-widest">Pro Mode Active</span>
                    </div>
                </div>

                {/* Top Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                    <StatCard
                        icon={<Scale className="text-blue-600" />}
                        label="Total Yield"
                        value={`${totalGrams.toLocaleString()}g`}
                        sub="Across all cycles"
                        color="blue"
                    />
                    <StatCard
                        icon={<TrendingUp className="text-green-600" />}
                        label="Avg. Efficiency"
                        value={`${avgEfficiency.toFixed(1)}%`}
                        sub="Precision score"
                        color="green"
                    />
                    <StatCard
                        icon={<DollarSign className="text-purple-600" />}
                        label="Total Profit"
                        value={`$${totalProfit.toFixed(2)}`}
                        sub="Estimated ROI"
                        color="purple"
                    />
                    <StatCard
                        icon={<Sprout className="text-emerald-600" />}
                        label="Active Crops"
                        value={crops.length.toString()}
                        sub="Completed batches"
                        color="emerald"
                    />
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Yield Chart */}
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                        <h3 className="text-xl font-bold text-gray-800 mb-6">Yield Performance (Grams)</h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={performanceData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#94a3b8' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#94a3b8' }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        cursor={{ fill: '#f8fafc' }}
                                    />
                                    <Bar dataKey="yield" radius={[6, 6, 0, 0]} barSize={40}>
                                        {performanceData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#8b5cf6' : '#c084fc'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Profitability Trend */}
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                        <h3 className="text-xl font-bold text-gray-800 mb-6">Profitability Trend ($)</h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={performanceData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#94a3b8' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#94a3b8' }} />
                                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                    <Line
                                        type="monotone"
                                        dataKey="profit"
                                        stroke="#10b981"
                                        strokeWidth={4}
                                        dot={{ r: 6, fill: '#10b981', stroke: '#fff' }}
                                        activeDot={{ r: 8 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Detailed Table */}
                <div className="mt-10 bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-gray-800">Batch Deep-Dive</h3>
                        <button className="text-xs font-bold text-purple-600 uppercase tracking-widest hover:underline">Export CSV</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Seed Variety</th>
                                    <th className="px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Yield</th>
                                    <th className="px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Accuracy</th>
                                    <th className="px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">ROI %</th>
                                    <th className="px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Net Profit</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {crops.map((c, i) => {
                                    const roi = calculateROI(c);
                                    return (
                                        <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-8 py-5 font-bold text-gray-900">{c.seed.name}</td>
                                            <td className="px-8 py-5 font-medium text-gray-600">{c.harvest?.actual_weight}g</td>
                                            <td className="px-8 py-5">
                                                <span className={`font-bold ${c.harvest?.accuracy_percent! > 90 ? 'text-green-600' : 'text-amber-600'}`}>
                                                    {c.harvest?.accuracy_percent.toFixed(1)}%
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 font-bold text-gray-900">{roi.roi.toFixed(1)}%</td>
                                            <td className="px-8 py-5">
                                                <span className={`px-3 py-1 rounded-lg text-xs font-black ${roi.profit > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    ${roi.profit.toFixed(2)}
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, sub, color }: any) {
    const colorMap: any = {
        blue: 'bg-blue-50 border-blue-100',
        green: 'bg-green-50 border-green-100',
        purple: 'bg-purple-50 border-purple-100',
        emerald: 'bg-emerald-50 border-emerald-100'
    };

    return (
        <div className={`p-8 rounded-[2.5rem] border ${colorMap[color]} transition-transform hover:scale-[1.02] duration-200`}>
            <div className="bg-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm mb-4">
                {icon}
            </div>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">{label}</p>
            <h4 className="text-2xl font-black text-gray-900 mb-1">{value}</h4>
            <p className="text-[10px] font-medium text-gray-400">{sub}</p>
        </div>
    );
}
