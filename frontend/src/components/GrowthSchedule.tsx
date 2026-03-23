import React from 'react';
import { useTranslation } from 'react-i18next';
import { Seed } from '../services/api';
import { Droplet, Moon, Sun, Scissors, Info } from 'lucide-react';

interface GrowthScheduleProps {
    seed: Seed;
    currentDay?: number;
    blackoutDaysOverride?: number;
}

const GrowthSchedule: React.FC<GrowthScheduleProps> = ({ seed, currentDay = -1, blackoutDaysOverride }) => {
    const { t } = useTranslation();
    const totalDays = seed.growth_days || 10;
    const blackoutDays = blackoutDaysOverride !== undefined ? blackoutDaysOverride : (seed.blackout_time_days || 3);

    const schedule = [];

    // Day 0: Prep/Soak
    if (seed.soaking_duration_hours && seed.soaking_duration_hours > 0) {
        schedule.push({
            day: 0,
            title: t('seeds.labels.prep_soak_title'),
            instruction: t('seeds.labels.soak_desc', { hours: seed.soaking_duration_hours }),
            icon: <Droplet className="text-blue-500" size={18} />,
            phase: 'prep'
        });
    } else {
        schedule.push({
            day: 0,
            title: t('seeds.labels.prep_title'),
            instruction: t('seeds.labels.prep_desc'),
            icon: <Info className="text-blue-400" size={18} />,
            phase: 'prep'
        });
    }

    // Blackout Days
    for (let i = 1; i <= blackoutDays; i++) {
        schedule.push({
            day: i,
            title: t('seeds.labels.blackout_phase', { day: i }),
            instruction: t('seeds.labels.blackout_desc'),
            icon: <Moon className="text-gray-600" size={18} />,
            phase: 'blackout'
        });
    }

    // Light Days
    for (let i = Math.floor(blackoutDays) + 1; i < totalDays; i++) {
        schedule.push({
            day: i,
            title: t('seeds.labels.light_phase', { day: i }),
            instruction: t('seeds.labels.light_desc'),
            icon: <Sun className="text-yellow-500" size={18} />,
            phase: 'light'
        });
    }

    // Harvest Day
    schedule.push({
        day: totalDays,
        title: t('seeds.labels.harvest_day'),
        instruction: t('seeds.labels.harvest_desc'),
        icon: <Scissors className="text-purple-500" size={18} />,
        phase: 'harvest'
    });

    const currentTask = schedule.find(item => item.day === currentDay) || (currentDay === -1 ? schedule[0] : null);

    return (
        <div className="space-y-6">


            {/* Today's Focus */}
            {currentTask && (
                <div className="bg-white dark:bg-[#1A1D27] rounded-3xl border border-emerald-500/30 p-6 shadow-lg shadow-emerald-500/10 relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-black px-4 py-1.5 rounded-bl-2xl uppercase tracking-widest shadow-sm">
                        {t('seeds.labels.todays_action')}
                    </div>

                    <div className="flex items-start space-x-4">
                        <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-inner border border-emerald-500/20">
                            {React.cloneElement(currentTask.icon as React.ReactElement, { size: 28 })}
                        </div>
                        <div className="flex-1 mt-1">
                            <h4 className="text-lg font-extrabold text-gray-900 dark:text-white mb-1 tracking-tight">{currentTask.title}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
                                {currentTask.instruction}
                            </p>
                        </div>
                    </div>
                </div>
            )}


        </div>
    );
};

export default GrowthSchedule;
