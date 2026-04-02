import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cropsApi, type Crop } from '../services/api';
import {
    CheckCircle, Plus, Droplet, Clock,
    ChevronRight, Zap
} from 'lucide-react';
import { differenceInDays, format, isAfter, formatDistanceToNow } from 'date-fns';
import { ta as taLocale, enUS as enLocale } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';
import GrowingLoader from '../components/GrowingLoader';

export default function Home() {
    const { t, i18n } = useTranslation();
    const currentLocale = i18n.language === 'ta' ? taLocale : enLocale;
    const [activeCrops, setActiveCrops] = useState<Crop[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { } = useAuth();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const cropsRes = await cropsApi.getAll('active');
            setActiveCrops(cropsRes.data);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };



    const getCropStatus = (crop: Crop) => {
        const start = new Date(crop.start_datetime);
        const now = new Date();

        let currentDay = 0;
        if (now >= start) {
            currentDay = differenceInDays(now, start) + 1;
        }

        const growthDays = crop.seed?.growth_days || 10;
        currentDay = Math.min(currentDay, growthDays);
        const progress = Math.round((Math.max(0, currentDay) / growthDays) * 100);
        return { currentDay, progress };
    };

    const getTimelineActions = () => {
        /*
        - [ ] Refine Home Page Action Feed (only show today's tasks) [/]
        - [ ] Implement Back-logging in Dashboard:
            - [ ] Allow clicking past days in the timeline to add/edit logs [/]
            - [ ] Add warnings for back-dated entries [/]
        - [ ] Audit Backend `log_action` for specific day support [/]
        - [ ] Final verification and walkthrough
        */
        const actions: any[] = [];
        const now = new Date();

        for (const crop of activeCrops) {
            const { currentDay } = getCropStatus(crop);
            const dailyLogs = crop.daily_logs || [];

            const isActionLogged = (type: string, dayNum: number) => {
                const log = dailyLogs.find(l => l.day_number === dayNum);
                if (!log) return false;

                // If it's a specific action type (like 'water_morning'), it MUST be in actions_recorded
                if (log.actions_recorded?.includes(type)) return true;

                // Fallback for older logs or general 'watered' status
                if (type === 'sow') return true;

                return false;
            };

            if (currentDay <= 0) continue; // Skip future crops for actions

            // Always show today's misting actions
            const morningTime = new Date(); morningTime.setHours(8, 0, 0, 0);
            const eveningTime = new Date(); eveningTime.setHours(18, 0, 0, 0);

            const mist1Done = isActionLogged('water_morning', currentDay);

            if (!mist1Done) {
                actions.push({
                    id: `${crop.id}-today-water-am`,
                    crop,
                    title: t('home.mist_1', { defaultValue: 'Mist 1 (Morning)' }),
                    time: morningTime,
                    type: 'water_morning',
                    completed: false,
                    priority: 'medium',
                    day_number: currentDay
                });
            }

            // Mist 2 is locked until Mist 1 is done
            if (mist1Done && !isActionLogged('water_evening', currentDay)) {
                actions.push({
                    id: `${crop.id}-today-water-pm`,
                    crop,
                    title: t('home.mist_2', { defaultValue: 'Mist 2 (Evening)' }),
                    time: eveningTime,
                    type: 'water_evening',
                    completed: false,
                    priority: 'medium',
                    day_number: currentDay
                });
            }
        }

        // Filter actions to only show those that are actually due/overdue
        return actions.filter(action => {
            const isToday = action.day_number === getCropStatus(action.crop).currentDay;
            if (!isToday) return true; // Past days are always overdue
            return isAfter(now, action.time); // Today's actions only show if time has passed
        }).sort((a, b) => a.time.getTime() - b.time.getTime());
    };

    if (loading) return <GrowingLoader />;

    const timelineActions = getTimelineActions();

    return (
        <div className="flex flex-col font-poppins pb-20 bg-transparent">
            <main className="flex-1 p-6 lg:p-10">
                <div className="max-w-3xl mx-auto">
                    {/* Header: Professional & Integrated */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 pb-6 border-b border-gray-200 dark:border-white/10 gap-4">
                        <div>
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] block mb-2">{t('home.activity_command')}</span>
                            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight flex items-center flex-wrap">
                                {t('home.todays_actions')}
                                <span className="ml-0 sm:ml-4 mt-2 sm:mt-0 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-black px-3 py-1.5 rounded-xl uppercase tracking-tighter shadow-sm">
                                    {timelineActions.length} {t('home.pending')}
                                </span>
                            </h1>
                        </div>
                        <div className="flex flex-col items-end">
                            <p className="text-sm font-bold text-gray-400 dark:text-gray-500 mb-4">{format(new Date(), 'EEEE, MMMM do', { locale: currentLocale })}</p>
                            <button
                                onClick={() => navigate('/atlas')}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 transition-all hover:-translate-y-1 flex items-center group border-b-4 border-emerald-700 active:border-b-0 active:translate-y-0"
                            >
                                <Plus size={16} className="mr-2 group-hover:rotate-90 transition-transform" />
                                {t('common.new_crop')}
                            </button>
                        </div>
                    </div>

                    {/* Pending Actions Section */}
                    <div className="mb-16">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 px-1 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                            {t('home.attention_required')}
                        </h3>
                        <div className="space-y-4">
                            {timelineActions.length > 0 ? (
                                timelineActions.map((action) => {
                                    const relTime = formatDistanceToNow(action.time, { addSuffix: true, locale: currentLocale });

                                    return (
                                        <div
                                            key={action.id}
                                            className={`group relative bg-white dark:bg-[#1A1D27] border border-gray-100 dark:border-white/5 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 border-l-[6px] ${action.day_number < getCropStatus(action.crop).currentDay ? 'border-l-red-500/80 shadow-red-500/5' : 'border-l-emerald-400 shadow-emerald-500/5'}`}
                                        >
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                                                <div className="flex items-center space-x-5">
                                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${action.day_number < getCropStatus(action.crop).currentDay ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                                        {action.type.includes('water') ? <Droplet size={24} /> : <Zap size={24} />}
                                                    </div>
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                                            <h4 className="text-lg font-black text-gray-900 dark:text-white leading-none">{action.title}</h4>
                                                            {action.day_number < getCropStatus(action.crop).currentDay && (
                                                                <span className="bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] font-black px-2 py-0.5 rounded-lg uppercase tracking-tight">
                                                                    {t('common.overdue')}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-wrap items-center text-[12px] font-bold text-gray-500 dark:text-gray-400 space-x-3">
                                                            <span className="text-emerald-500 dark:text-emerald-400 font-extrabold uppercase tracking-wide">{action.crop.seed?.name || 'Unknown Seed'}</span>
                                                            <span className="bg-gray-100 dark:bg-white/5 px-2.5 py-1 rounded-lg">
                                                                Day {action.day_number} of {action.crop.seed?.growth_days || 10}
                                                            </span>
                                                            <span className="flex items-center opacity-70">
                                                                <Clock size={14} className="mr-1" />
                                                                {format(action.time, 'hh:mm a')} • {relTime}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => navigate(`/daily-log/${action.crop.id}/${action.day_number}?actionType=${action.type}`)}
                                                    className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg transition-all flex items-center justify-center border-b-4 active:border-b-0 active:translate-y-1 ${action.day_number < getCropStatus(action.crop).currentDay
                                                        ? 'bg-red-500 text-white border-red-700 shadow-red-500/20'
                                                        : 'bg-emerald-500 text-white border-emerald-700 shadow-emerald-500/20'
                                                        }`}
                                                >
                                                    {t('common.complete_action')}
                                                    <ChevronRight size={16} className="ml-2" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="bg-white dark:bg-[#1A1D27] border-2 border-dashed border-emerald-500/30 rounded-[3rem] p-20 text-center hover:border-emerald-500/50 transition-colors">
                                    <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 transform rotate-6 shadow-inner">
                                        <CheckCircle size={36} className="text-emerald-400" />
                                    </div>
                                    <h4 className="text-2xl font-black text-gray-900 dark:text-white mb-3">{t('home.max_efficiency', { defaultValue: 'Maximum Efficiency Reached' })}</h4>
                                    <p className="text-gray-500 dark:text-gray-400 text-base max-w-xs mx-auto leading-relaxed font-medium">
                                        {t('home.all_logged', { defaultValue: 'All tasks are complete. Your microgreens are flourishing!' })}
                                    </p>
                                    <button
                                        onClick={() => navigate('/atlas')}
                                        className="mt-10 inline-flex items-center text-emerald-500 dark:text-emerald-400 font-black text-xs uppercase tracking-[0.2em] hover:opacity-80 transition-opacity"
                                    >
                                        {t('home.browse_atlas', { defaultValue: 'Explore Seed Atlas' })}
                                        <Plus size={16} className="ml-2" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* New Smart Cultivation Insights Section */}
                    <div className="mt-12">
                        <h3 className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] mb-8 px-1">Cultivation Insights</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Card 1: Expert Strategy */}
                            <div className="bg-white dark:bg-[#1A1D27] border border-gray-100 dark:border-white/5 rounded-[2.5rem] p-8 shadow-sm group hover:-translate-y-2 transition-all duration-500">
                                <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform">
                                    <Zap size={24} />
                                </div>
                                <h4 className="text-lg font-black text-gray-900 dark:text-white mb-3 tracking-tight">Expert Strategy</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                                    Keep humidity below 50% for mature crops to prevent damping off. Ensure strong airflow tonight.
                                </p>
                            </div>

                            {/* Card 2: Yield Forecast */}
                            <div className="bg-white dark:bg-[#1A1D27] border border-gray-100 dark:border-white/5 rounded-[2.5rem] p-8 shadow-sm group hover:-translate-y-2 transition-all duration-500">
                                <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                                    <Clock size={24} />
                                </div>
                                <h4 className="text-lg font-black text-gray-900 dark:text-white mb-3 tracking-tight">Yield Forecast</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                                    You have 2 trays approaching harvest in 48 hours. Estimated total yield: <span className="text-emerald-500 font-black">450g</span>.
                                </p>
                            </div>

                            {/* Card 3: New Varieties */}
                            <div className="bg-white dark:bg-[#1A1D27] border border-gray-100 dark:border-white/5 rounded-[2.5rem] p-8 shadow-sm group hover:-translate-y-2 transition-all duration-500">
                                <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
                                    <Plus size={24} />
                                </div>
                                <h4 className="text-lg font-black text-gray-900 dark:text-white mb-3 tracking-tight">Featured Seed</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                                    Red Amaranth is trending! High in iron and Vitamin C. Ready in just 12 days.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
