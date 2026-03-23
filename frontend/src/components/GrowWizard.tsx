import React, { useState } from 'react';
import { Seed, cropsApi } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import TimelinePreview from './TimelinePreview';
import GrowthSchedule from './GrowthSchedule';

interface GrowWizardProps {
    seed: Seed;
    initialTraySize?: string;
    onClose: () => void;
}

const GrowWizard: React.FC<GrowWizardProps> = ({ seed, initialTraySize = "10x20 inch", onClose }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // State
    const [startNow, setStartNow] = useState(true);
    const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 16));
    const [useRecommended, setUseRecommended] = useState(true);

    // Custom Settings
    const [soakHours, setSoakHours] = useState(seed.soaking_duration_hours || 10);
    const [blackoutDays, setBlackoutDays] = useState(seed.blackout_time_days || 3);
    const [wateringFreq, setWateringFreq] = useState(2);
    const [traySize, setTraySize] = useState(initialTraySize);
    const [numberOfTrays, setNumberOfTrays] = useState(1);

    // Notification Settings
    const [notifyEnabled] = useState(true);

    // INITIAL LOG STATE (Dream Workflow)
    const [logInitial, setLogInitial] = useState(false);
    const [initTemp, setInitTemp] = useState(seed.ideal_temp || 22);
    const [initHum, setInitHum] = useState(seed.ideal_humidity || 50);
    const [initWatered, setInitWatered] = useState(true);


    // Checklist State
    const [checklist, setChecklist] = useState({
        weigh: false,
        soak: false,
        tray: false,
        sow: false,
        mist: false,
        blackout: false
    });

    const isSoakRequired = (seed.soaking_duration_hours || 0) > 0;
    const isBlackoutRequired = (seed.blackout_time_days || 0) > 0;

    const canMoveFromChecklist =
        checklist.weigh &&
        (!isSoakRequired || checklist.soak) &&
        checklist.tray &&
        checklist.sow &&
        checklist.mist &&
        (!isBlackoutRequired || checklist.blackout);

    const handleStart = async () => {
        setLoading(true);
        try {
            const startDateTime = startNow ? new Date().toISOString() : new Date(startDate).toISOString();

            const customSettings = useRecommended ? {} : {
                soak_duration_hours: soakHours,
                blackout_time_days: blackoutDays,
                watering_frequency: wateringFreq
            };

            const notificationSettings = {
                enabled: notifyEnabled,
                times: notifyEnabled ? ["08:00", "18:00"] : []
            };

            // Prepare Payload
            const payload: any = {
                seed_id: seed.id,
                start_datetime: startDateTime,
                tray_size: traySize,
                number_of_trays: numberOfTrays,
                custom_settings: customSettings,
                notification_settings: notificationSettings
            };

            // Add Initial Log if selected
            if (logInitial) {
                payload.initial_log = {
                    day_number: 1,
                    watered: initWatered,
                    temperature: initTemp,
                    humidity: initHum,
                    notes: "Day 1 Initial Log via Wizard",
                    actions_recorded: ["start_soak", "water_morning"]
                };
            }

            // Default costing/lighting for regular users
            payload.light_hours_per_day = 16.0;
            payload.seed_cost = 0.0;
            payload.soil_cost = 0.0;
            payload.energy_cost_per_kwh = 0.12;
            payload.other_costs = 0.0;

            await cropsApi.create(payload);

            onClose();
            navigate('/'); // Go to Dashboard/Home
        } catch (err) {
            console.error("Failed to start crop", err);
            alert("Failed to start crop");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-[#1A1D27] border border-gray-100 dark:border-white/5 rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="bg-white dark:bg-[#1A1D27] border-b border-gray-100 dark:border-white/5 p-8 text-gray-900 dark:text-white flex justify-between items-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                    <div className="relative z-10">
                        <h2 className="text-2xl font-black tracking-tight">{t('wizard.title', { name: seed.name })}</h2>
                        <p className="text-emerald-600 dark:text-emerald-500/70 text-sm font-bold tracking-widest uppercase mt-1">{t('wizard.step', { current: step, total: 4 })}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 dark:text-white/80 hover:text-gray-700 dark:hover:text-white bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 rounded-full p-2 transition-colors relative z-10">&times;</button>
                </div>

                {/* Body */}
                <div className="p-8 overflow-y-auto flex-1 scrollbar-hide">

                    {step === 1 && (
                        <div className="space-y-6">
                            <h3 className="font-bold text-xl text-gray-800">{t('wizard.when_to_start')}</h3>

                            <div className="space-y-3">
                                <label
                                    onClick={() => setStartNow(true)}
                                    className={`flex items-center p-5 border-2 rounded-2xl cursor-pointer transition-all ${startNow ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-[#0E1015] hover:border-gray-200 dark:hover:border-white/20'}`}
                                >
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${startNow ? 'border-emerald-500' : 'border-gray-200 dark:border-white/20'}`}>
                                        {startNow && <div className="w-3 h-3 bg-emerald-500 rounded-full" />}
                                    </div>
                                    <div className="ml-4">
                                        <span className={`font-bold block ${startNow ? 'text-emerald-700 dark:text-white' : 'text-gray-700 dark:text-gray-400'}`}>{t('wizard.start_now')}</span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">{t('wizard.start_now_desc')}</span>
                                    </div>
                                </label>

                                <label
                                    onClick={() => setStartNow(false)}
                                    className={`flex flex-col p-5 border-2 rounded-2xl cursor-pointer transition-all ${!startNow ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-[#0E1015] hover:border-gray-200 dark:hover:border-white/20'}`}
                                >
                                    <div className="flex items-center">
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${!startNow ? 'border-emerald-500' : 'border-gray-200 dark:border-white/20'}`}>
                                            {!startNow && <div className="w-3 h-3 bg-emerald-500 rounded-full" />}
                                        </div>
                                        <div className="ml-4">
                                            <span className={`font-bold block ${!startNow ? 'text-emerald-700 dark:text-white' : 'text-gray-700 dark:text-gray-400'}`}>{t('wizard.schedule')}</span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">{t('wizard.schedule_desc')}</span>
                                        </div>
                                    </div>
                                    <div className={`overflow-hidden transition-all duration-300 ${!startNow ? 'max-h-20 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                                        <input
                                            type="datetime-local"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="w-full p-3 border border-gray-200 dark:border-white/5 rounded-xl bg-white dark:bg-[#0E1015] text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                        />
                                    </div>
                                </label>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-xl text-gray-900 dark:text-white">{t('wizard.settings')}</h3>
                                <div className="flex items-center space-x-2">
                                    <span className="text-xs font-bold uppercase text-gray-500 tracking-wider">{t('wizard.auto_pilot')}</span>
                                    <button
                                        onClick={() => setUseRecommended(!useRecommended)}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${useRecommended ? 'bg-green-500' : 'bg-gray-300'}`}
                                    >
                                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${useRecommended ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>
                            </div>

                            <div className={`space-y-5 transition-all duration-300 ${useRecommended ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                                <div>
                                    <label className="text-sm font-bold text-gray-600 dark:text-gray-300 block mb-2">{t('wizard.soak_duration')}</label>
                                    <div className="flex items-center bg-gray-50 dark:bg-[#0E1015] rounded-xl p-1 border border-gray-100 dark:border-white/5">
                                        <input
                                            type="number"
                                            value={soakHours}
                                            onChange={(e) => setSoakHours(Number(e.target.value))}
                                            className="w-full bg-transparent p-2 text-center font-bold text-gray-900 dark:text-white outline-none"
                                        />
                                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase pr-4">{t('wizard.hours')}</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-bold text-gray-600 dark:text-gray-300 block mb-2">{t('wizard.blackout_phase')}</label>
                                    <div className="flex items-center bg-gray-50 dark:bg-[#0E1015] rounded-xl p-1 border border-gray-100 dark:border-white/5">
                                        <input
                                            type="number"
                                            step="0.5"
                                            value={blackoutDays}
                                            onChange={(e) => setBlackoutDays(Number(e.target.value))}
                                            className="w-full bg-transparent p-2 text-center font-bold text-gray-900 dark:text-white outline-none"
                                        />
                                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase pr-4">{t('wizard.days')}</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-bold text-gray-600 dark:text-gray-300 block mb-2">{t('wizard.watering_frequency')} <span className="font-normal text-gray-500">{t('wizard.per_day')}</span></label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[1, 2, 3].map(freq => (
                                            <button
                                                key={freq}
                                                onClick={() => setWateringFreq(freq)}
                                                className={`py-3 rounded-xl text-sm font-bold border-2 transition-all ${wateringFreq === freq
                                                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                    : 'border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-[#0E1015] text-gray-500 dark:text-gray-400 hover:border-gray-200 dark:hover:border-white/20'}`}
                                            >
                                                {freq}x
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* TRAY SIZE SELECTION */}
                            <div className="pt-4 border-t border-gray-100">
                                <label className="text-sm font-bold text-gray-700 block mb-2">{t('wizard.tray_size')}</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {["10x20 inch", "10x10 inch", "5x5 inch"].map(size => (
                                        <button
                                            key={size}
                                            onClick={() => setTraySize(size)}
                                            className={`py-3 rounded-xl text-xs font-bold border-2 transition-all ${traySize === size
                                                ? 'border-green-500 bg-green-50 text-green-700'
                                                : 'border-gray-100 text-gray-600 hover:border-gray-200'}`}
                                        >
                                            {size.split(' ')[0]}
                                        </button>
                                    ))}
                                </div>
                            </div>



                            {/* BATCH SIZE (Always Visible) */}
                            <div className="pt-4 border-t border-gray-100 dark:border-white/5">
                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">{t('wizard.number_of_trays')}</label>
                                <div className="flex items-center bg-white dark:bg-[#0E1015] border-2 border-gray-100 dark:border-white/5 rounded-xl p-1 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                                    <button onClick={() => setNumberOfTrays(Math.max(1, numberOfTrays - 1))} className="p-3 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg text-gray-400 dark:text-gray-500 font-bold">-</button>
                                    <input
                                        type="number"
                                        min="1"
                                        value={numberOfTrays}
                                        onChange={(e) => setNumberOfTrays(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="w-full text-center font-bold text-lg text-gray-900 dark:text-white bg-transparent outline-none"
                                    />
                                    <button onClick={() => setNumberOfTrays(numberOfTrays + 1)} className="p-3 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg text-emerald-600 dark:text-emerald-400 font-bold">+</button>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">{t('wizard.tray_scale_desc', { size: traySize })}</p>
                            </div>

                            {/* MUCILAGINOUS WARNING */}
                            {seed.is_mucilaginous && (
                                <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-xl animate-pulse">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <svg className="h-5 w-5 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="ml-3">
                                            <h3 className="text-sm font-bold text-amber-800">{t('wizard.mucilaginous_warning')}</h3>
                                            <p className="text-xs text-amber-700 mt-1">{t('wizard.mucilaginous_desc')}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* COMMERCIAL DENSITY TIP */}
                            <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                                <p className="text-[10px] font-extrabold uppercase tracking-widest text-blue-500 mb-1">{t('wizard.commercial_tip')}</p>
                                <p className="text-sm text-blue-700 font-medium">
                                    {t('wizard.seeding_density_tip', { weight: ((seed.suggested_seed_weight || 20) * (traySize.includes("10x10") ? 0.5 : traySize.includes("5x5") ? 0.125 : 1.0) * numberOfTrays).toFixed(1) })}
                                </p>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="font-bold text-xl text-gray-900 dark:text-white">{t('wizard.prep_checklist')}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('wizard.checklist_desc')}</p>
                            </div>

                            <div className="space-y-3">
                                <label className={`flex items-center p-4 border-2 rounded-2xl cursor-pointer transition-all ${checklist.weigh ? 'border-emerald-500 bg-emerald-500/10' : 'border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-[#0E1015] hover:border-gray-200 dark:hover:border-white/20'}`}>
                                    <input type="checkbox" checked={checklist.weigh} onChange={(e) => setChecklist({ ...checklist, weigh: e.target.checked })} className="w-5 h-5 rounded text-emerald-500 mr-4" />
                                    <span className={`font-semibold ${checklist.weigh ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                        {t('wizard.weigh_seeds', { weight: ((seed.suggested_seed_weight || 20) * (traySize.includes("10x10") ? 0.5 : traySize.includes("5x5") ? 0.125 : 1.0) * numberOfTrays).toFixed(1) })}
                                    </span>
                                </label>

                                {isSoakRequired && !seed.is_mucilaginous && (
                                    <label className={`flex items-center p-4 border-2 rounded-2xl cursor-pointer transition-all ${checklist.soak ? 'border-emerald-500 bg-emerald-500/10' : 'border-gray-100 dark:border-white/5 bg-white dark:bg-[#0E1015] hover:border-gray-200 dark:hover:border-white/20'}`}>
                                        <input type="checkbox" checked={checklist.soak} onChange={(e) => setChecklist({ ...checklist, soak: e.target.checked })} className="w-5 h-5 rounded text-emerald-500 mr-4" />
                                        <span className={`font-semibold ${checklist.soak ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                            {t('wizard.soak_seeds', { hours: seed.soaking_duration_hours })}
                                        </span>
                                    </label>
                                )}

                                {seed.is_mucilaginous && (
                                    <div className="flex items-center p-4 bg-amber-50 border-2 border-amber-100 rounded-2xl">
                                        <div className="w-5 h-5 rounded bg-amber-500 flex items-center justify-center text-white mr-4">!</div>
                                        <span className="font-bold text-amber-800 text-sm">
                                            {t('wizard.mucilaginous_desc')}
                                        </span>
                                    </div>
                                )}

                                <label className={`flex items-center p-4 border-2 rounded-2xl cursor-pointer transition-all ${checklist.tray ? 'border-emerald-500 bg-emerald-500/10' : 'border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-[#0E1015] hover:border-gray-200 dark:hover:border-white/20'}`}>
                                    <input type="checkbox" checked={checklist.tray} onChange={(e) => setChecklist({ ...checklist, tray: e.target.checked })} className="w-5 h-5 rounded text-emerald-500 mr-4" />
                                    <span className={`font-semibold ${checklist.tray ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                        {t('wizard.prepare_tray')}
                                    </span>
                                </label>

                                <label className={`flex items-center p-4 border-2 rounded-2xl cursor-pointer transition-all ${checklist.sow ? 'border-emerald-500 bg-emerald-500/10' : 'border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-[#0E1015] hover:border-gray-200 dark:hover:border-white/20'}`}>
                                    <input type="checkbox" checked={checklist.sow} onChange={(e) => setChecklist({ ...checklist, sow: e.target.checked })} className="w-5 h-5 rounded text-emerald-500 mr-4" />
                                    <span className={`font-semibold ${checklist.sow ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                        {t('wizard.sow_evenly')}
                                    </span>
                                </label>

                                <label className={`flex items-center p-4 border-2 rounded-2xl cursor-pointer transition-all ${checklist.mist ? 'border-emerald-500 bg-emerald-500/10' : 'border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-[#0E1015] hover:border-gray-200 dark:hover:border-white/20'}`}>
                                    <input type="checkbox" checked={checklist.mist} onChange={(e) => setChecklist({ ...checklist, mist: e.target.checked })} className="w-5 h-5 rounded text-emerald-500 mr-4" />
                                    <span className={`font-semibold ${checklist.mist ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                        {t('wizard.mist_seeds')}
                                    </span>
                                </label>

                                {isBlackoutRequired && (
                                    <label className={`flex items-center p-4 border-2 rounded-2xl cursor-pointer transition-all ${checklist.blackout ? 'border-emerald-500 bg-emerald-500/10' : 'border-gray-100 dark:border-white/5 bg-white dark:bg-[#0E1015] hover:border-gray-200 dark:hover:border-white/20'}`}>
                                        <input type="checkbox" checked={checklist.blackout} onChange={(e) => setChecklist({ ...checklist, blackout: e.target.checked })} className="w-5 h-5 rounded text-emerald-500 mr-4" />
                                        <span className={`font-semibold ${checklist.blackout ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                            {t('wizard.apply_blackout')}
                                        </span>
                                    </label>
                                )}
                            </div>

                            {canMoveFromChecklist && (
                                <div className="bg-emerald-500/10 p-4 rounded-xl text-emerald-400 border border-emerald-500/20 text-sm font-bold flex items-center justify-center animate-in fade-in zoom-in duration-300">
                                    ✅ {t('wizard.tasks_completed')}
                                </div>
                            )}
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-8">
                            <div>
                                <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-4">{t('wizard.review_plan')}</h3>
                                <GrowthSchedule
                                    seed={seed}
                                    blackoutDaysOverride={useRecommended ? (seed.blackout_time_days || 3) : blackoutDays}
                                />
                                <div className="mt-6">
                                    <TimelinePreview
                                        seed={seed}
                                        blackoutDays={useRecommended ? (seed.blackout_time_days || 3) : blackoutDays}
                                        harvestDays={seed.harvest_days || 10}
                                    />
                                </div>
                            </div>

                            <div className="bg-gray-50 dark:bg-[#0E1015] rounded-2xl p-5 border border-gray-100 dark:border-white/5">
                                <label className="flex items-center justify-between cursor-pointer mb-4">
                                    <div>
                                        <span className="font-bold text-gray-900 dark:text-white block">{t('wizard.log_day_1')}</span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">{t('wizard.log_day_1_desc')}</span>
                                    </div>
                                    <div className={`w-12 h-6 rounded-full transition-colors relative ${logInitial ? 'bg-green-500' : 'bg-gray-300'}`}>
                                        <input type="checkbox" className="hidden" checked={logInitial} onChange={(e) => setLogInitial(e.target.checked)} />
                                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${logInitial ? 'left-7' : 'left-1'}`} />
                                    </div>
                                </label>

                                {logInitial && (
                                    <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">{t('wizard.temp_label')}</label>
                                                <input
                                                    type="number"
                                                    className="w-full bg-white dark:bg-[#1A1D27] border border-gray-100 dark:border-white/10 rounded-lg p-2 text-sm font-bold text-gray-900 dark:text-white"
                                                    value={initTemp}
                                                    onChange={(e) => setInitTemp(parseFloat(e.target.value))}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">{t('wizard.humidity_label')}</label>
                                                <input
                                                    type="number"
                                                    className="w-full bg-white dark:bg-[#1A1D27] border border-gray-100 dark:border-white/10 rounded-lg p-2 text-sm font-bold text-gray-900 dark:text-white"
                                                    value={initHum}
                                                    onChange={(e) => setInitHum(parseFloat(e.target.value))}
                                                />
                                            </div>
                                        </div>
                                        <label className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-300">
                                            <input
                                                type="checkbox"
                                                checked={initWatered}
                                                onChange={(e) => setInitWatered(e.target.checked)}
                                                className="w-4 h-4 rounded text-green-600 mr-2"
                                            />
                                            {t('wizard.watered_soaked_confirm')}
                                        </label>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="p-8 pt-0 flex justify-between items-center">
                    {step > 1 ? (
                        <button
                            onClick={() => setStep(step - 1)}
                            className="px-6 py-3 text-gray-500 font-bold hover:bg-white/5 hover:text-white rounded-xl transition-colors"
                        >
                            {t('wizard.back')}
                        </button>
                    ) : (
                        <div />
                    )}

                    {step < 4 ? (
                        <button
                            onClick={() => setStep(step + 1)}
                            disabled={step === 3 && !canMoveFromChecklist}
                            className={`px-8 py-3 font-bold rounded-xl transition-all shadow-lg hover:scale-105 active:scale-95 ${step === 3 && !canMoveFromChecklist ? 'bg-gray-100 dark:bg-[#1A1D27] text-gray-400 dark:text-gray-600 border border-gray-200 dark:border-white/5 cursor-not-allowed' : 'bg-white dark:bg-emerald-500 text-[#0E1015] dark:text-white hover:bg-gray-100 dark:hover:bg-emerald-600'}`}
                        >
                            {t('wizard.next_step')}
                        </button>
                    ) : (
                        <button
                            onClick={handleStart}
                            disabled={loading}
                            className="px-10 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all transform hover:-translate-y-0.5"
                        >
                            {loading ? t('wizard.starting') : t('wizard.start_growing')}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GrowWizard;

