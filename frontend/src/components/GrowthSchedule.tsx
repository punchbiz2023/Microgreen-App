import React from 'react';
import { Seed } from '../services/api';
import { Droplet, Moon, Sun, Scissors, Info } from 'lucide-react';

interface GrowthScheduleProps {
    seed: Seed;
    currentDay?: number;
    blackoutDaysOverride?: number;
}

const GrowthSchedule: React.FC<GrowthScheduleProps> = ({ seed, currentDay = -1, blackoutDaysOverride }) => {
    const totalDays = seed.growth_days || 10;
    const blackoutDays = blackoutDaysOverride !== undefined ? blackoutDaysOverride : (seed.blackout_time_days || 3);

    const schedule = [];

    // Day 0: Prep/Soak
    if (seed.soaking_duration_hours && seed.soaking_duration_hours > 0) {
        schedule.push({
            day: 0,
            title: "Preparation & Soaking",
            instruction: `Soak seeds for ${seed.soaking_duration_hours} hours in clean water before sowing.`,
            icon: <Droplet className="text-blue-500" size={18} />,
            phase: 'prep'
        });
    } else {
        schedule.push({
            day: 0,
            title: "Preparation",
            instruction: "Sow seeds directly onto moist growing medium.",
            icon: <Info className="text-blue-400" size={18} />,
            phase: 'prep'
        });
    }

    // Blackout Days
    for (let i = 1; i <= blackoutDays; i++) {
        schedule.push({
            day: i,
            title: `Blackout Phase - Day ${i}`,
            instruction: "Keep in complete darkness. Mist twice daily with water.",
            icon: <Moon className="text-gray-600" size={18} />,
            phase: 'blackout'
        });
    }

    // Light Days
    for (let i = Math.floor(blackoutDays) + 1; i < totalDays; i++) {
        schedule.push({
            day: i,
            title: `Light Phase - Day ${i}`,
            instruction: "Expose to bright light. Continue misting 2x daily.",
            icon: <Sun className="text-yellow-500" size={18} />,
            phase: 'light'
        });
    }

    // Harvest Day
    schedule.push({
        day: totalDays,
        title: `Harvest Day!`,
        instruction: "Your microgreens are ready! Cut at the base and enjoy.",
        icon: <Scissors className="text-purple-500" size={18} />,
        phase: 'harvest'
    });

    return (
        <div className="space-y-3">
            <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 flex items-center">
                <Info size={16} className="mr-2 text-green-500" />
                Daily Growth Guide
            </h4>

            <div className="relative border-l-2 border-gray-100 ml-3 pl-6 space-y-6">
                {schedule.map((item) => {
                    const isCurrent = currentDay === item.day;
                    const isPast = currentDay > item.day;

                    return (
                        <div key={item.day} className={`relative transition-all duration-300 ${isCurrent ? 'scale-[1.02]' : ''}`}>
                            {/* Connector Dot */}
                            <div className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 bg-white transition-colors duration-500 ${isCurrent ? 'border-green-500 scale-125 shadow-lg shadow-green-100' :
                                    isPast ? 'border-green-200 bg-green-50' : 'border-gray-200'
                                }`} />

                            <div className={`p-4 rounded-2xl border transition-all duration-300 ${isCurrent ? 'bg-green-50 border-green-200 shadow-md' :
                                    isPast ? 'bg-white border-gray-100 opacity-60' : 'bg-white border-gray-100'
                                }`}>
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center space-x-2">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isCurrent ? 'bg-white shadow-sm' : 'bg-gray-50'
                                            }`}>
                                            {item.icon}
                                        </div>
                                        <span className={`text-sm font-bold ${isCurrent ? 'text-green-900' : 'text-gray-800'}`}>
                                            {item.title}
                                        </span>
                                    </div>
                                    {isCurrent && (
                                        <span className="bg-green-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter animate-pulse">
                                            Current
                                        </span>
                                    )}
                                </div>
                                <p className={`text-xs ml-10 leading-relaxed ${isCurrent ? 'text-green-700 font-medium' : 'text-gray-500'}`}>
                                    {item.instruction}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default GrowthSchedule;
