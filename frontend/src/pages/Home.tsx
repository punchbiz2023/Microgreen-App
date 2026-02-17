import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cropsApi, type Crop } from '../services/api';
import {
    CheckCircle, Plus, Droplet, Clock,
    ChevronRight, Zap, CalendarDays
} from 'lucide-react';
import { differenceInDays, format, addHours, isAfter, formatDistanceToNow } from 'date-fns';
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

        const growthDays = crop.seed.growth_days || 10;
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
            const start = new Date(crop.start_datetime);
            const hoursSinceStart = (now.getTime() - start.getTime()) / (1000 * 60 * 60);
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

            if (hoursSinceStart < 48 && !isActionLogged('sow', currentDay)) {
                const soakDuration = crop.seed.soaking_duration_hours || 10;
                if (!isActionLogged('start_soak', currentDay)) {
                    actions.push({ id: `${crop.id}-start-soak`, crop, title: t('home.initial_soak'), time: start, type: 'start_soak', completed: false, priority: 'high', day_number: currentDay });
                }
                if (!isActionLogged('sow', currentDay)) {
                    const soakEndTime = addHours(start, soakDuration);
                    actions.push({ id: `${crop.id}-sow`, crop, title: t('home.sow_to_tray'), time: soakEndTime, type: 'sow', completed: false, priority: 'high', day_number: currentDay });
                }
            } else {
                // Only show today's actions on the Home page feed
                const morningTime = new Date(); morningTime.setHours(8, 0, 0, 0);
                const eveningTime = new Date(); eveningTime.setHours(18, 0, 0, 0);

                if (!isActionLogged('water_morning', currentDay)) {
                    actions.push({
                        id: `${crop.id}-today-water-am`,
                        crop,
                        title: t('home.morning_mist'),
                        time: morningTime,
                        type: 'water_morning',
                        completed: false,
                        priority: 'medium',
                        day_number: currentDay
                    });
                }
                if (!isActionLogged('water_evening', currentDay) && now.getHours() >= 14) {
                    actions.push({
                        id: `${crop.id}-today-water-pm`,
                        crop,
                        title: t('home.evening_mist'),
                        time: eveningTime,
                        type: 'water_evening',
                        completed: false,
                        priority: 'medium',
                        day_number: currentDay
                    });
                }
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
        <div className="min-h-screen bg-gray-50 flex flex-col font-poppins pb-20">
            <main className="flex-1 p-6 lg:p-10">
                <div className="max-w-3xl mx-auto">
                    {/* Header: Professional & Integrated */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 pb-6 border-b border-gray-200 gap-4">
                        <div>
                            <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest block mb-1">{t('home.activity_command')}</span>
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center flex-wrap">
                                {t('home.todays_actions')}
                                <span className="ml-0 sm:ml-3 mt-2 sm:mt-0 bg-gray-100 text-gray-400 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-tighter">
                                    {timelineActions.length} {t('home.pending')}
                                </span>
                            </h1>
                        </div>
                        <div className="flex flex-col items-end">
                            <p className="text-sm font-medium text-gray-500 mb-3">{format(new Date(), 'EEEE, MMMM do', { locale: currentLocale })}</p>
                            <button
                                onClick={() => navigate('/atlas')}
                                className="bg-green-500 hover:bg-green-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all hover:shadow-lg flex items-center group"
                            >
                                <Plus size={14} className="mr-2 group-hover:rotate-90 transition-transform" />
                                {t('common.new_crop')}
                            </button>
                        </div>
                    </div>

                    {/* Pending Actions Section */}
                    <div className="mb-12">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 px-1">{t('home.attention_required')}</h3>
                        <div className="space-y-4">
                            {timelineActions.length > 0 ? (
                                timelineActions.map((action) => {
                                    const relTime = formatDistanceToNow(action.time, { addSuffix: true, locale: currentLocale });

                                    return (
                                        <div
                                            key={action.id}
                                            className={`group relative bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all border-l-4 ${action.day_number < getCropStatus(action.crop).currentDay ? 'border-l-red-500' : 'border-l-green-400'}`}
                                        >
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                                <div className="flex items-center space-x-5">
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${action.day_number < getCropStatus(action.crop).currentDay ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                                                        {action.type.includes('water') ? <Droplet size={20} /> : <Zap size={20} />}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center space-x-2 mb-1">
                                                            <h4 className="text-base sm:text-lg font-bold text-gray-900 leading-none">{action.title}</h4>
                                                            {action.day_number < getCropStatus(action.crop).currentDay && (
                                                                <span className="bg-red-100 text-red-600 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase animate-pulse">
                                                                    {t('common.overdue')}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-wrap items-center text-[11px] font-medium text-gray-400 gap-y-1">
                                                            <span className="text-green-500 font-bold uppercase tracking-wide mr-2">{action.crop.seed.name}</span>
                                                            <span className="flex items-center">
                                                                <Clock size={12} className="mr-1" />
                                                                {format(action.time, 'hh:mm a')} • {relTime}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => navigate(`/daily-log/${action.crop.id}/${action.day_number}`)}
                                                    className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center justify-center border ${action.day_number < getCropStatus(action.crop).currentDay
                                                        ? 'bg-gray-900 text-white border-gray-900 hover:bg-black'
                                                        : 'bg-white border-gray-200 text-gray-600 hover:border-green-400 hover:text-green-500'
                                                        }`}
                                                >
                                                    {t('common.complete_action')}
                                                    <ChevronRight size={14} className="ml-1.5" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="bg-white border-2 border-dashed border-gray-100 rounded-3xl p-16 text-center">
                                    <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
                                        <CheckCircle size={28} className="text-green-500" />
                                    </div>
                                    <h4 className="text-xl font-bold text-gray-900 mb-2">{t('home.max_efficiency')}</h4>
                                    <p className="text-gray-500 text-sm max-w-xs mx-auto leading-relaxed">
                                        {t('home.all_logged')}
                                    </p>
                                    <button
                                        onClick={() => navigate('/atlas')}
                                        className="mt-8 inline-flex items-center text-green-500 font-bold text-xs uppercase tracking-widest hover:text-green-600 transition-colors"
                                    >
                                        {t('home.browse_atlas')}
                                        <ChevronRight size={14} className="ml-1" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* All Crops Section */}
                    <div className="mt-16 mb-12">
                        <div className="flex justify-between items-center mb-6 px-1">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('home.your_active_crops')}</h3>
                            <span className="text-[10px] font-bold text-gray-300 uppercase">{activeCrops.length} {t('home.total')}</span>
                        </div>

                        {activeCrops.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {activeCrops.map(crop => {
                                    const { currentDay, progress } = getCropStatus(crop);
                                    const isFuture = currentDay <= 0;

                                    return (
                                        <div
                                            key={crop.id}
                                            onClick={() => navigate(`/dashboard/${crop.id}`)}
                                            className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                                        >
                                            <div className="flex items-center space-x-4">
                                                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                                    🪴
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-gray-900 truncate">{crop.seed.name}</h4>
                                                    <div className="flex items-center text-[10px] font-bold mt-0.5">
                                                        <span className={isFuture ? 'text-blue-500' : 'text-green-500'}>
                                                            {isFuture ? t('home.scheduled') : t('home.day_n', { day: currentDay })}
                                                        </span>
                                                        <span className="mx-2 text-gray-200">|</span>
                                                        <span className="text-gray-400">{crop.tray_size}</span>
                                                    </div>
                                                </div>
                                                <ChevronRight size={16} className="text-gray-300 group-hover:translate-x-1 transition-transform" />
                                            </div>

                                            {!isFuture && (
                                                <div className="mt-4">
                                                    <div className="w-full bg-gray-50 h-1 rounded-full overflow-hidden">
                                                        <div
                                                            className="bg-green-500 h-full transition-all duration-1000"
                                                            style={{ width: `${progress}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="bg-white border border-gray-100 rounded-3xl p-10 text-center">
                                <p className="text-sm text-gray-400 font-medium">{t('home.no_active_crops')}</p>
                            </div>
                        )}
                    </div>

                    {/* Quick Access Grid Footer */}
                    <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div
                            onClick={() => navigate('/my-plants')}
                            className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md cursor-pointer transition-all flex items-center justify-between group"
                        >
                            <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <CalendarDays size={18} />
                                </div>
                                <div className="min-w-0">
                                    <h5 className="text-sm font-bold text-gray-900 truncate">{t('home.plant_manager')}</h5>
                                    <p className="text-[10px] text-gray-400 font-medium">{t('home.view_all')}</p>
                                </div>
                            </div>
                            <ChevronRight size={16} className="text-gray-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
