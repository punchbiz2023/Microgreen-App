import React, { useState } from 'react';
import { Seed, cropsApi } from '../services/api';
import { useNavigate } from 'react-router-dom';

interface GrowWizardProps {
    seed: Seed;
    onClose: () => void;
}

const GrowWizard: React.FC<GrowWizardProps> = ({ seed, onClose }) => {
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

    // Notification Settings
    const [notifyEnabled, setNotifyEnabled] = useState(true);

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

            await cropsApi.create({
                seed_id: seed.id,
                start_datetime: startDateTime,
                tray_size: "10x20 inch",
                custom_settings: customSettings,
                notification_settings: notificationSettings
            });

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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="bg-green-600 p-6 text-white flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold">Grow {seed.name}</h2>
                        <p className="text-green-100 text-sm">Step {step} of 3</p>
                    </div>
                    <button onClick={onClose} className="text-white/80 hover:text-white">&times;</button>
                </div>

                {/* Body */}
                <div className="p-6">

                    {step === 1 && (
                        <div className="space-y-6">
                            <h3 className="font-semibold text-lg text-gray-800">When to start?</h3>

                            <div className="space-y-3">
                                <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-colors ${startNow ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                                    <input type="radio" checked={startNow} onChange={() => setStartNow(true)} className="w-5 h-5 text-green-600" />
                                    <span className="ml-3 font-medium">Start Now</span>
                                </label>

                                <label className={`flex flex-col p-4 border rounded-xl cursor-pointer transition-colors ${!startNow ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                                    <div className="flex items-center">
                                        <input type="radio" checked={!startNow} onChange={() => setStartNow(false)} className="w-5 h-5 text-green-600" />
                                        <span className="ml-3 font-medium">Schedule for later</span>
                                    </div>
                                    {!startNow && (
                                        <input
                                            type="datetime-local"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="mt-3 ml-8 p-2 border rounded-lg bg-white"
                                        />
                                    )}
                                </label>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <h3 className="font-semibold text-lg text-gray-800">Growth Settings</h3>

                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm text-gray-600">Use Recommended Settings</span>
                                <button
                                    onClick={() => setUseRecommended(!useRecommended)}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${useRecommended ? 'bg-green-500' : 'bg-gray-300'}`}
                                >
                                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${useRecommended ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>

                            <div className={`space-y-4 ${useRecommended ? 'opacity-50 pointer-events-none' : ''}`}>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 block mb-1">Soak Duration (Hours)</label>
                                    <input
                                        type="number"
                                        value={soakHours}
                                        onChange={(e) => setSoakHours(Number(e.target.value))}
                                        className="w-full p-2 border rounded-lg"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Recommended: {seed.soaking_duration_hours || 'N/A'}</p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700 block mb-1">Blackout Time (Days)</label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        value={blackoutDays}
                                        onChange={(e) => setBlackoutDays(Number(e.target.value))}
                                        className="w-full p-2 border rounded-lg"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Recommended: {seed.blackout_time_days || 'N/A'}</p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700 block mb-1">Watering Frequency (per day)</label>
                                    <select
                                        value={wateringFreq}
                                        onChange={(e) => setWateringFreq(Number(e.target.value))}
                                        className="w-full p-2 border rounded-lg"
                                    >
                                        <option value={1}>Once a day</option>
                                        <option value={2}>Twice a day</option>
                                        <option value={3}>Three times a day</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6">
                            <h3 className="font-semibold text-lg text-gray-800">Notifications</h3>
                            <p className="text-gray-500 text-sm">We'll remind you when it's time to water or change stages.</p>

                            <label className={`flex items-center p-4 border rounded-xl cursor-pointer ${notifyEnabled ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                                <input
                                    type="checkbox"
                                    checked={notifyEnabled}
                                    onChange={(e) => setNotifyEnabled(e.target.checked)}
                                    className="w-5 h-5 text-green-600 rounded"
                                />
                                <div className="ml-3">
                                    <span className="font-medium block">Enable Notifications</span>
                                    <span className="text-xs text-gray-500">Morning (8:00 AM) & Evening (6:00 PM)</span>
                                </div>
                            </label>
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="p-6 pt-0 flex justify-between">
                    {step > 1 ? (
                        <button
                            onClick={() => setStep(step - 1)}
                            className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Back
                        </button>
                    ) : (
                        <div />
                    )}

                    {step < 3 ? (
                        <button
                            onClick={() => setStep(step + 1)}
                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg shadow-green-200"
                        >
                            Continue
                        </button>
                    ) : (
                        <button
                            onClick={handleStart}
                            disabled={loading}
                            className="px-8 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg shadow-green-200 disabled:opacity-50 flex items-center"
                        >
                            {loading ? 'Starting...' : 'Start Growing'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GrowWizard;
