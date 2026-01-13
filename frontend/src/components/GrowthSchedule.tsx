import React, { useState } from 'react';
import { Seed } from '../services/api';
import { Droplet, Moon, Sun, Scissors, Info, Zap, ChevronDown, ChevronUp, Star } from 'lucide-react';

interface GrowthScheduleProps {
    seed: Seed;
    currentDay?: number;
    blackoutDaysOverride?: number;
}

const GrowthSchedule: React.FC<GrowthScheduleProps> = ({ seed, currentDay = -1, blackoutDaysOverride }) => {
    const [showFullSchedule, setShowFullSchedule] = useState(false);
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

    const currentTask = schedule.find(item => item.day === currentDay) || (currentDay === -1 ? schedule[0] : null);

    return (
        <div className="space-y-6">
            {/* Expert Tips & Fertilizer - NOW AT TOP */}
            {(seed.fertilizer_info || seed.growth_tips) && (
                <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl border border-amber-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-amber-200/20 rounded-full blur-2xl"></div>

                    <h5 className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-3 flex items-center">
                        <Zap size={12} className="mr-2 fill-amber-500 text-amber-500" />
                        Expert Care & Advice
                    </h5>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {seed.fertilizer_info && (
                            <div className="space-y-1">
                                <h6 className="text-[9px] font-bold text-amber-900/60 uppercase">Fertilizer Guide</h6>
                                <p className="text-xs text-amber-900 leading-relaxed font-semibold">
                                    {seed.fertilizer_info}
                                </p>
                            </div>
                        )}
                        {seed.growth_tips && (
                            <div className="space-y-1">
                                <h6 className="text-[9px] font-bold text-amber-900/60 uppercase">Pro Growth Tip</h6>
                                <p className="text-xs text-amber-900 leading-relaxed font-semibold italic">
                                    "{seed.growth_tips}"
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Today's Focus */}
            {currentTask && (
                <div className="bg-white rounded-3xl border-2 border-green-500 p-6 shadow-xl shadow-green-50 relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-black px-4 py-1.5 rounded-bl-2xl uppercase tracking-widest">
                        Today's Action
                    </div>

                    <div className="flex items-start space-x-4">
                        <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 shadow-inner">
                            {React.cloneElement(currentTask.icon as React.ReactElement, { size: 28 })}
                        </div>
                        <div className="flex-1">
                            <h4 className="text-lg font-extrabold text-gray-900 mb-1">{currentTask.title}</h4>
                            <p className="text-sm text-green-700 font-medium leading-relaxed">
                                {currentTask.instruction}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Collapsible Full Timeline */}
            <div className="border border-gray-100 rounded-3xl bg-gray-50/30 overflow-hidden">
                <button
                    onClick={() => setShowFullSchedule(!showFullSchedule)}
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-gray-100 shadow-sm text-gray-400">
                            <Star size={16} />
                        </div>
                        <span className="text-sm font-bold text-gray-700">Full Growth Timeline</span>
                    </div>
                    {showFullSchedule ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                </button>

                {showFullSchedule && (
                    <div className="p-4 pt-0 animate-in slide-in-from-top-2 duration-300">
                        <div className="relative border-l-2 border-gray-100 ml-4 pl-6 space-y-6 my-4">
                            {schedule.map((item) => {
                                const isCurrent = currentDay === item.day;
                                const isPast = currentDay > item.day;

                                return (
                                    <div key={item.day} className={`relative ${isCurrent ? 'scale-[1.02]' : ''}`}>
                                        <div className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 bg-white transition-all ${isCurrent ? 'border-green-500 scale-125 shadow-lg shadow-green-100' :
                                                isPast ? 'border-green-200 bg-green-50' : 'border-gray-200'
                                            }`} />

                                        <div className={`p-4 rounded-2xl border transition-all ${isCurrent ? 'bg-green-50 border-green-200 shadow-md' :
                                                isPast ? 'bg-white border-gray-100 opacity-60' : 'bg-white border-gray-100'
                                            }`}>
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-gray-50 text-gray-500">
                                                        {React.cloneElement(item.icon as React.ReactElement, { size: 14 })}
                                                    </div>
                                                    <span className={`text-xs font-bold ${isCurrent ? 'text-green-900' : 'text-gray-800'}`}>
                                                        {item.title}
                                                    </span>
                                                </div>
                                            </div>
                                            <p className={`text-[11px] ml-9 leading-relaxed ${isCurrent ? 'text-green-700 font-medium' : 'text-gray-500'}`}>
                                                {item.instruction}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GrowthSchedule;
