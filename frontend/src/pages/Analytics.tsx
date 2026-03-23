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
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        </div>
    );

    return (
        <div className="py-8">
            <div>
                {/* Header */}
                <div className="mb-10 flex items-center justify-between">
                    <div>
                        <button onClick={() => navigate('/')} className="flex items-center text-gray-400 hover:text-emerald-400 mb-4 transition-colors font-bold text-sm tracking-widest uppercase">
                            <ArrowLeft size={16} className="mr-2" />
                            {t('common.back')}
                        </button>
                        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">{t('analytics.title')}</h1>
                        <p className="text-gray-500 dark:text-gray-400 font-medium mt-2">{t('analytics.subtitle')}</p>
                    </div>
                    {isPro && (
                        <div className="bg-emerald-500/10 px-4 py-2 rounded-full flex items-center gap-2 border border-emerald-500/30 shadow-[0_0_15px_rgba(52,211,153,0.1)]">
                            <Zap className="w-4 h-4 text-emerald-400 fill-emerald-400 animate-pulse" />
                            <span className="text-emerald-400 font-bold text-sm uppercase tracking-widest">{t('analytics.pro_mode')}</span>
                        </div>
                    )}
                </div>

                {/* Top Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                    <StatCard
                        icon={<Scale className="text-blue-400" />}
                        label={t('analytics.total_yield', { defaultValue: 'Total Yield' })}
                        value={`${totalGrams.toLocaleString()}g`}
                        sub={t('analytics.across_all_cycles', { defaultValue: 'Across all cycles' })}
                        color="blue"
                    />
                    <StatCard
                        icon={<TrendingUp className="text-emerald-400" />}
                        label={t('analytics.avg_efficiency', { defaultValue: 'Avg. Efficiency' })}
                        value={`${avgEfficiency.toFixed(1)}%`}
                        sub={t('analytics.precision_score', { defaultValue: 'Precision score' })}
                        color="emerald"
                    />
                    <StatCard
                        icon={<DollarSign className="text-purple-400" />}
                        label={t('analytics.total_profit', { defaultValue: 'Total Profit' })}
                        value={`$${totalProfit.toFixed(2)}`}
                        sub={t('analytics.estimated_profits', { defaultValue: 'Estimated Profits' })}
                        color="purple"
                    />
                    <StatCard
                        icon={<Sprout className="text-teal-400" />}
                        label={t('analytics.active_crops', { defaultValue: 'Active Crops' })}
                        value={crops.length.toString()}
                        sub={t('analytics.completed_batches', { defaultValue: 'Completed batches' })}
                        color="teal"
                    />
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                    {/* Yield Chart */}
                    <div className="bg-white dark:bg-[#1A1D27] p-8 rounded-3xl border border-gray-100 dark:border-white/5 shadow-xl lg:col-span-2">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{t('analytics.yield_performance')}</h3>
                        <div className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={performanceData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--chart-tick)' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--chart-tick)' }} />
                                    <Tooltip
                                        cursor={{ fill: 'var(--chart-grid)' }}
                                        contentStyle={{
                                            backgroundColor: 'var(--chart-tooltip-bg)',
                                            borderRadius: '16px',
                                            border: '1px solid var(--chart-tooltip-border)',
                                            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)',
                                            color: 'inherit'
                                        }}
                                        itemStyle={{ color: 'inherit' }}
                                    />
                                    <Bar dataKey="yield" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Profit Trend Chart */}
                    <div className="bg-white dark:bg-[#1A1D27] p-8 rounded-3xl border border-gray-100 dark:border-white/5 shadow-xl">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{t('analytics.profitability_trend')}</h3>
                        <div className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={performanceData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--chart-tick)' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--chart-tick)' }} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'var(--chart-tooltip-bg)',
                                            borderRadius: '16px',
                                            border: '1px solid var(--chart-tooltip-border)',
                                            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)',
                                            color: 'inherit'
                                        }}
                                        itemStyle={{ color: 'inherit' }}
                                    />
                                    <Line type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={4} dot={{ r: 6, fill: '#10B981', strokeWidth: 0 }} activeDot={{ r: 8, fill: '#34D399', strokeWidth: 0 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Detailed Table */}
                <div className="bg-white dark:bg-[#1A1D27] rounded-3xl shadow-xl border border-gray-100 dark:border-white/5 overflow-hidden">
                    <div className="p-8 border-b border-gray-100 dark:border-white/5 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('analytics.batch_deep_dive')}</h3>
                        <button className="text-xs font-bold text-emerald-400 uppercase tracking-widest hover:text-emerald-300 transition-colors">{t('analytics.export_csv')}</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-[#0E1015]">
                                <tr>
                                    <th className="px-8 py-4 text-xs font-black text-gray-500 uppercase tracking-widest">{t('analytics.table.seed_variety', { defaultValue: 'Seed Variety' })}</th>
                                    <th className="px-8 py-4 text-xs font-black text-gray-500 uppercase tracking-widest">{t('analytics.table.yield', { defaultValue: 'Yield' })}</th>
                                    <th className="px-8 py-4 text-xs font-black text-gray-500 uppercase tracking-widest">{t('analytics.table.accuracy', { defaultValue: 'Accuracy' })}</th>
                                    <th className="px-8 py-4 text-xs font-black text-gray-500 uppercase tracking-widest">{t('analytics.table.roi', { defaultValue: 'ROI %' })}</th>
                                    <th className="px-8 py-4 text-xs font-black text-gray-500 uppercase tracking-widest">{t('analytics.table.net_profit', { defaultValue: 'Net Profit' })}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {crops.map((c, i) => {
                                    const roi = calculateROI(c);
                                    return (
                                        <tr key={i} className="hover:bg-emerald-500/[0.02] transition-colors">
                                            <td className="px-8 py-5 font-bold text-gray-900 dark:text-white">{c.seed.name}</td>
                                            <td className="px-8 py-5 font-medium text-gray-400">{c.harvest?.actual_weight}g</td>
                                            <td className="px-8 py-5">
                                                <span className={`font-bold ${c.harvest?.accuracy_percent! > 90 ? 'text-emerald-500' : 'text-amber-400'}`}>
                                                    {c.harvest?.accuracy_percent?.toFixed(1) || '0.0'}%
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 font-bold text-gray-900 dark:text-white">{roi.roi.toFixed(1)}%</td>
                                            <td className="px-8 py-5">
                                                <span className={`px-3 py-1 rounded-lg text-xs font-black border ${roi.profit > 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
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
        blue: 'bg-blue-500/10 border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.05)] text-blue-600 dark:text-blue-400',
        emerald: 'bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)] text-emerald-600 dark:text-emerald-400',
        purple: 'bg-purple-500/10 border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.05)] text-purple-600 dark:text-purple-400',
        teal: 'bg-teal-500/10 border-teal-500/20 shadow-[0_0_15px_rgba(20,184,166,0.05)] text-teal-600 dark:text-teal-400'
    };

    return (
        <div className={`p-8 rounded-[2rem] border ${colorMap[color]} transition-transform hover:-translate-y-1 duration-300 relative overflow-hidden group`}>
            {/* Subtle glow effect behind icon */}
            <div className={`absolute -top-10 -right-10 w-32 h-32 blur-3xl rounded-full opacity-20 group-hover:opacity-40 transition-opacity ${color === 'blue' ? 'bg-blue-500' : color === 'emerald' ? 'bg-emerald-500' : color === 'purple' ? 'bg-purple-500' : 'bg-teal-500'}`}></div>

            <div className={`bg-gray-50 dark:bg-[#0E1015] w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg border border-gray-100 dark:border-white/5 mb-4 relative z-10 group-hover:scale-110 transition-transform`}>
                {icon}
            </div>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">{label}</p>
            <h4 className="text-3xl font-black text-gray-900 dark:text-white mb-1 tracking-tight">{value}</h4>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{sub}</p>
        </div>
    );
}
