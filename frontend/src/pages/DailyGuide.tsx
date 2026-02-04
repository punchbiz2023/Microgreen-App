import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cropsApi, type Crop } from '../services/api';
import { ArrowLeft, CheckCircle2, Circle, Droplet, Moon, Sun, Scissors, Zap } from 'lucide-react';
import { differenceInDays } from 'date-fns';

export default function DailyGuide() {
    const { t } = useTranslation();
    const { cropId } = useParams<{ cropId: string }>();
    const navigate = useNavigate();

    const [crop, setCrop] = useState<Crop | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (cropId) {
            loadCrop();
        }
    }, [cropId]);

    const loadCrop = async () => {
        try {
            const response = await cropsApi.getById(parseInt(cropId!));
            setCrop(response.data);
        } catch (error) {
            console.error('Failed to load crop:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !crop) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500"></div>
            </div>
        );
    }

    const totalDays = crop.seed.growth_days || 10;
    const blackoutDays = crop.seed.blackout_time_days || 3;
    const start = new Date(crop.start_datetime);
    const now = new Date();
    let currentDay = 0;
    if (now >= start) {
        currentDay = differenceInDays(now, start) + 1;
    }
    currentDay = Math.min(currentDay, totalDays);

    const schedule = [];

    // Preparation
    schedule.push({
        day: 0,
        title: t('daily_guide.prep_sowing'),
        description: crop.seed.soaking_duration_hours && crop.seed.soaking_duration_hours > 0
            ? t('daily_guide.descriptions.prep_soak', { hours: crop.seed.soaking_duration_hours, size: crop.tray_size })
            : t('daily_guide.descriptions.prep_no_soak', { size: crop.tray_size }),
        tasks: [
            t('daily_guide.tasks.measure_seeds'),
            crop.seed.soaking_duration_hours ? t('daily_guide.tasks.soak_seeds') : t('daily_guide.tasks.moisten_medium'),
            t('daily_guide.tasks.spread_seeds'),
            t('daily_guide.tasks.mist_after_sowing')
        ],
        icon: <Droplet className="text-blue-500" />,
        phase: 'prep'
    });

    // Lifecycle
    for (let i = 1; i <= totalDays; i++) {
        const isBlackout = i <= blackoutDays;
        const isHarvest = i === totalDays;

        schedule.push({
            day: i,
            title: isHarvest ? t('daily_guide.harvest_day_exclamation') : (isBlackout ? t('daily_guide.blackout_phase_day', { day: i }) : t('daily_guide.light_phase_day', { day: i })),
            description: isHarvest
                ? t('daily_guide.descriptions.harvest')
                : (isBlackout ? t('daily_guide.descriptions.blackout') : t('daily_guide.descriptions.light')),
            tasks: isHarvest ? [
                t('daily_guide.tasks.verify_height'),
                t('daily_guide.tasks.cut_base'),
                t('daily_guide.tasks.rinse_lightly'),
                t('daily_guide.tasks.store_ventilated')
            ] : [
                t('daily_guide.tasks.check_moisture'),
                t('daily_guide.tasks.morning_mist'),
                t('daily_guide.tasks.evening_mist'),
                !isBlackout ? t('daily_guide.tasks.check_light') : t('daily_guide.tasks.ensure_no_leaks')
            ],
            icon: isHarvest ? <Scissors className="text-purple-500" /> : (isBlackout ? <Moon className="text-gray-600" /> : <Sun className="text-yellow-500" />),
            phase: isHarvest ? 'harvest' : (isBlackout ? 'blackout' : 'light')
        });
    }

    return (
        <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-gray-50">
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => navigate(`/dashboard/${cropId}`)}
                    className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-8 group"
                >
                    <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                    {t('daily_guide.back_to_dashboard')}
                </button>

                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
                    <div>
                        <span className="text-xs font-bold text-green-600 uppercase tracking-widest mb-1 block">{t('daily_guide.step_by_step')}</span>
                        <h1 className="text-4xl font-black text-gray-900 leading-tight">
                            {t('daily_guide.lifecycle', { name: t(`seeds.${crop.seed.seed_type}.name`, { defaultValue: crop.seed.name }) })}
                        </h1>
                    </div>
                    <div className="bg-white px-6 py-3 rounded-2xl border border-gray-100 shadow-sm">
                        <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">{t('daily_guide.current_progress')}</span>
                        <div className="flex items-center gap-3">
                            <span className="text-2xl font-black text-gray-900">{t('common.day')} {currentDay}</span>
                            <span className="text-gray-300">/</span>
                            <span className="text-xl font-bold text-gray-500">{totalDays}</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-8 relative">
                    {/* Vertical Line */}
                    <div className="absolute left-8 md:left-10 top-10 bottom-10 w-1 bg-gray-200 rounded-full hidden sm:block"></div>

                    {schedule.map((day) => {
                        const isToday = day.day === currentDay;
                        const isPast = day.day < currentDay;
                        const isFuture = day.day > currentDay;

                        return (
                            <div
                                key={day.day}
                                className={`relative flex gap-6 md:gap-10 items-start ${isFuture ? 'opacity-50' : ''}`}
                                id={`day-${day.day}`}
                            >
                                {/* Marker */}
                                <div className={`z-10 w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-3xl flex items-center justify-center border-4 transition-all duration-500 shadow-lg ${isToday ? 'bg-green-500 border-green-100 scale-110 rotate-3' :
                                    isPast ? 'bg-white border-green-400 text-green-500' :
                                        'bg-white border-gray-100 text-gray-300'
                                    }`}>
                                    <div className={`flex flex-col items-center leading-none ${isToday ? 'text-white' : ''}`}>
                                        <span className="text-[10px] font-black uppercase tracking-tighter mb-1 opacity-70">{t('common.day')}</span>
                                        <span className="text-2xl font-black">{day.day}</span>
                                    </div>
                                </div>

                                {/* Content Card */}
                                <div className={`flex-1 bg-white rounded-[2rem] p-6 md:p-8 border shadow-sm transition-all duration-500 ${isToday ? 'border-green-500 shadow-xl shadow-green-100 ring-4 ring-green-50' :
                                    'border-gray-100'
                                    }`}>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-gray-50 rounded-lg">
                                            {day.icon}
                                        </div>
                                        <h3 className="text-xl font-extrabold text-gray-900">{day.title}</h3>
                                        {isToday && (
                                            <span className="ml-auto bg-green-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                                                {t('daily_guide.active_now')}
                                            </span>
                                        )}
                                    </div>

                                    <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                                        {day.description}
                                    </p>

                                    <div className="space-y-3">
                                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('daily_guide.checklist')}</h4>
                                        {day.tasks.map((task, idx) => (
                                            <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group">
                                                {isPast ? (
                                                    <CheckCircle2 size={18} className="text-green-500 shrink-0" />
                                                ) : (
                                                    <Circle size={18} className="text-gray-300 shrink-0 group-hover:text-green-400" />
                                                )}
                                                <span className={`text-sm ${isPast ? 'text-gray-400 line-through' : 'font-medium text-gray-700'}`}>
                                                    {task}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    {day.day === 0 && (crop.seed.soaking_duration_hours || 0) > 0 && (
                                        <div className="mt-6 p-4 bg-blue-50 rounded-2xl flex items-center gap-4">
                                            <Zap size={20} className="text-blue-500" />
                                            <p className="text-xs font-bold text-blue-700">
                                                {t('daily_guide.pro_tip')}: {t('daily_guide.soak_tip', { name: t(`seeds.${crop.seed.seed_type}.name`, { defaultValue: crop.seed.name }) })}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Growth Tips */}
                {crop.seed.growth_tips && (
                    <div className="mt-16 p-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-[2.5rem] text-white shadow-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <Zap className="fill-white" />
                            <h3 className="text-xl font-black">{t('daily_guide.expert_notes')}</h3>
                        </div>
                        <p className="text-green-50 font-medium leading-relaxed italic">
                            "{crop.seed.growth_tips}"
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
