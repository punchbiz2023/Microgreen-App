import { useState, useEffect } from 'react';
import { cropsApi, type Crop } from '../services/api';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TrendingUp, DollarSign, Scale, Sprout, ArrowLeft, Zap } from 'lucide-react';

export default function Analytics() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [crops, setCrops] = useState<Crop[]>([]);
    const [loading, setLoading] = useState(true);
    const isPro = true; // Analytics is a pro feature

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
                            {t('common.back')}
                        </button>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">{t('analytics.title')}</h1>
                        <p className="text-gray-500 font-medium mt-1">{t('analytics.subtitle')}</p>
                    </div>
                    {isPro && (
                        <div className="bg-purple-100 px-4 py-2 rounded-full flex items-center gap-2 border border-purple-200 shadow-sm animate-pulse-slow">
                            <Zap className="w-4 h-4 text-purple-600 fill-purple-600" />
                            <span className="text-purple-700 font-bold text-sm uppercase tracking-widest">{t('analytics.pro_mode')}</span>
                        </div>
                    )}
                </div>

                {/* Top Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                    <StatCard
                        icon={<Scale className="text-blue-600" />}
                        label={t('analytics.total_yield', { defaultValue: 'Total Yield' })}
                        value={`${totalGrams.toLocaleString()}g`}
                        sub={t('analytics.across_all_cycles', { defaultValue: 'Across all cycles' })}
                        color="blue"
                    />
                    <StatCard
                        icon={<TrendingUp className="text-green-600" />}
                        label={t('analytics.avg_efficiency', { defaultValue: 'Avg. Efficiency' })}
                        value={`${avgEfficiency.toFixed(1)}%`}
                        sub={t('analytics.precision_score', { defaultValue: 'Precision score' })}
                        color="green"
                    />
                    <StatCard
                        icon={<DollarSign className="text-purple-600" />}
                        label={t('analytics.total_profit', { defaultValue: 'Total Profit' })}
                        value={`$${totalProfit.toFixed(2)}`}
                        sub={t('analytics.estimated_profits', { defaultValue: 'Estimated Profits' })}
                        color="purple"
                    />
                    <StatCard
                        icon={<Sprout className="text-emerald-600" />}
                        label={t('analytics.active_crops', { defaultValue: 'Active Crops' })}
                        value={crops.length.toString()}
                        sub={t('analytics.completed_batches', { defaultValue: 'Completed batches' })}
                        color="emerald"
                    />
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Yield Chart */}
                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl lg:col-span-2">
                        <h3 className="text-xl font-bold text-gray-800 mb-6">{t('analytics.yield_performance')}</h3>
                        <div className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={performanceData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="yield" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Profit Trend Chart */}
                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl">
                        <h3 className="text-xl font-bold text-gray-800 mb-6">{t('analytics.profitability_trend')}</h3>
                        <div className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={performanceData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Line type="monotone" dataKey="profit" stroke="#8b5cf6" strokeWidth={4} dot={{ r: 6, fill: '#8b5cf6' }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Detailed Table */}
                <div className="mt-10 bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-gray-800">{t('analytics.batch_deep_dive')}</h3>
                        <button className="text-xs font-bold text-purple-600 uppercase tracking-widest hover:underline">{t('analytics.export_csv')}</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">{t('analytics.table.seed_variety', { defaultValue: 'Seed Variety' })}</th>
                                    <th className="px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">{t('analytics.table.yield', { defaultValue: 'Yield' })}</th>
                                    <th className="px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">{t('analytics.table.accuracy', { defaultValue: 'Accuracy' })}</th>
                                    <th className="px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">{t('analytics.table.roi', { defaultValue: 'ROI %' })}</th>
                                    <th className="px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">{t('analytics.table.net_profit', { defaultValue: 'Net Profit' })}</th>
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
