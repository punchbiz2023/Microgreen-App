import React, { useState } from 'react';
import { Seed, cropsApi } from '../services/api';
import { useNavigate } from 'react-router-dom';
import TimelinePreview from './TimelinePreview';
import GrowthSchedule from './GrowthSchedule';

interface GrowWizardProps {
    seed: Seed;
    initialTraySize?: string;
    onClose: () => void;
}

const GrowWizard: React.FC<GrowWizardProps> = ({ seed, initialTraySize = "10x20 inch", onClose }) => {
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
    const [notifyEnabled, setNotifyEnabled] = useState(true);

    // INITIAL LOG STATE (Dream Workflow)
    const [logInitial, setLogInitial] = useState(false);
    const [initTemp, setInitTemp] = useState(seed.ideal_temp || 22);
    const [initHum, setInitHum] = useState(seed.ideal_humidity || 50);
    const [initWatered, setInitWatered] = useState(true);

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
            <div className="bg-white rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 text-white flex justify-between items-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                    <div className="relative z-10">
                        <h2 className="text-2xl font-bold tracking-tight">Grow {seed.name}</h2>
                        <p className="text-green-100 text-sm opacity-90 font-medium">Step {step} of 3</p>
                    </div>
                    <button onClick={onClose} className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors relative z-10">&times;</button>
                </div>

                {/* Body */}
                <div className="p-8 overflow-y-auto flex-1 scrollbar-hide">

                    {step === 1 && (
                        <div className="space-y-6">
                            <h3 className="font-bold text-xl text-gray-800">When to start?</h3>

                            <div className="space-y-3">
                                <label
                                    onClick={() => setStartNow(true)}
                                    className={`flex items-center p-5 border-2 rounded-2xl cursor-pointer transition-all ${startNow ? 'border-green-500 bg-green-50 shadow-green-100 shadow-lg' : 'border-gray-100 hover:border-green-200'}`}
                                >
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${startNow ? 'border-green-600' : 'border-gray-300'}`}>
                                        {startNow && <div className="w-3 h-3 bg-green-500 rounded-full" />}
                                    </div>
                                    <div className="ml-4">
                                        <span className="font-bold text-gray-900 block">Start Now</span>
                                        <span className="text-xs text-gray-500">I'm sowing the seeds right now.</span>
                                    </div>
                                </label>

                                <label
                                    onClick={() => setStartNow(false)}
                                    className={`flex flex-col p-5 border-2 rounded-2xl cursor-pointer transition-all ${!startNow ? 'border-green-400 bg-green-50 shadow-green-100 shadow-lg' : 'border-gray-100 hover:border-green-200'}`}
                                >
                                    <div className="flex items-center">
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${!startNow ? 'border-green-500' : 'border-gray-300'}`}>
                                            {!startNow && <div className="w-3 h-3 bg-green-500 rounded-full" />}
                                        </div>
                                        <div className="ml-4">
                                            <span className="font-bold text-gray-900 block">Schedule</span>
                                            <span className="text-xs text-gray-500">Plan for a future date.</span>
                                        </div>
                                    </div>

                                    <div className={`overflow-hidden transition-all duration-300 ${!startNow ? 'max-h-20 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                                        <input
                                            type="datetime-local"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="w-full p-3 border border-gray-200 rounded-xl bg-white text-gray-800 focus:ring-2 focus:ring-green-500 outline-none"
                                        />
                                    </div>
                                </label>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-xl text-gray-800">Settings</h3>
                                <div className="flex items-center space-x-2">
                                    <span className="text-xs font-bold uppercase text-gray-500 tracking-wider">Auto-Pilot</span>
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
                                    <label className="text-sm font-bold text-gray-700 block mb-2">Soak Duration</label>
                                    <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-100">
                                        <input
                                            type="number"
                                            value={soakHours}
                                            onChange={(e) => setSoakHours(Number(e.target.value))}
                                            className="w-full bg-transparent p-2 text-center font-bold text-gray-900 outline-none"
                                        />
                                        <span className="text-xs font-bold text-gray-400 uppercase pr-4">Hours</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-bold text-gray-700 block mb-2">Blackout Phase</label>
                                    <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-100">
                                        <input
                                            type="number"
                                            step="0.5"
                                            value={blackoutDays}
                                            onChange={(e) => setBlackoutDays(Number(e.target.value))}
                                            className="w-full bg-transparent p-2 text-center font-bold text-gray-900 outline-none"
                                        />
                                        <span className="text-xs font-bold text-gray-400 uppercase pr-4">Days</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-bold text-gray-700 block mb-2">Watering Frequency <span className="font-normal text-gray-400">(per day)</span></label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[1, 2, 3].map(freq => (
                                            <button
                                                key={freq}
                                                onClick={() => setWateringFreq(freq)}
                                                className={`py-3 rounded-xl text-sm font-bold border-2 transition-all ${wateringFreq === freq
                                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                    : 'border-gray-100 text-gray-600 hover:border-gray-200'}`}
                                            >
                                                {freq}x
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* TRAY SIZE SELECTION */}
                            <div className="pt-4 border-t border-gray-100">
                                <label className="text-sm font-bold text-gray-700 block mb-2">Tray Size</label>
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
                            <div className="pt-4 border-t border-gray-100">
                                <label className="text-sm font-bold text-gray-700 block mb-2">Number of Trays</label>
                                <div className="flex items-center bg-white border-2 border-gray-100 rounded-xl p-1 focus-within:border-green-500 focus-within:ring-4 focus-within:ring-green-50 transition-all">
                                    <button onClick={() => setNumberOfTrays(Math.max(1, numberOfTrays - 1))} className="p-3 hover:bg-gray-100 rounded-lg text-gray-500 font-bold">-</button>
                                    <input
                                        type="number"
                                        min="1"
                                        value={numberOfTrays}
                                        onChange={(e) => setNumberOfTrays(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="w-full text-center font-bold text-lg text-gray-900 outline-none"
                                    />
                                    <button onClick={() => setNumberOfTrays(numberOfTrays + 1)} className="p-3 hover:bg-gray-100 rounded-lg text-green-600 font-bold">+</button>
                                </div>
                                <p className="text-xs text-gray-400 mt-2 text-center">Standard {traySize} trays. Yield prediction will scale automatically.</p>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-8">
                            <div>
                                <h3 className="font-bold text-xl text-gray-800 mb-4">Review Plan</h3>
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

                            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                                <label className="flex items-center justify-between cursor-pointer mb-4">
                                    <div>
                                        <span className="font-bold text-gray-900 block">Log Day 1 Now?</span>
                                        <span className="text-xs text-gray-500">Record initial watering & temp</span>
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
                                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Temp (°C)</label>
                                                <input
                                                    type="number"
                                                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-sm font-bold"
                                                    value={initTemp}
                                                    onChange={(e) => setInitTemp(parseFloat(e.target.value))}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Humidity (%)</label>
                                                <input
                                                    type="number"
                                                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-sm font-bold"
                                                    value={initHum}
                                                    onChange={(e) => setInitHum(parseFloat(e.target.value))}
                                                />
                                            </div>
                                        </div>
                                        <label className="flex items-center text-sm font-medium text-gray-700">
                                            <input
                                                type="checkbox"
                                                checked={initWatered}
                                                onChange={(e) => setInitWatered(e.target.checked)}
                                                className="w-4 h-4 rounded text-green-600 mr-2"
                                            />
                                            I have watered/soaked the seeds
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
                            className="px-6 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl transition-colors"
                        >
                            Back
                        </button>
                    ) : (
                        <div />
                    )}

                    {step < 3 ? (
                        <button
                            onClick={() => setStep(step + 1)}
                            className="px-8 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-all shadow-lg hover:scale-105 active:scale-95"
                        >
                            Next Step
                        </button>
                    ) : (
                        <button
                            onClick={handleStart}
                            disabled={loading}
                            className="px-10 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl hover:shadow-green-100 hover:shadow-xl transition-all shadow-lg transform hover:-translate-y-0.5"
                        >
                            {loading ? 'Starting...' : 'Start Growing 🚀'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GrowWizard;

