import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cropsApi, type Crop } from '../services/api';
import { CheckCircle, Lock, X } from 'lucide-react';
import { differenceInDays, format, addHours, isAfter, formatDistanceToNow } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import GrowingLoader from '../components/GrowingLoader';

export default function Home() {
    const [activeCrops, setActiveCrops] = useState<Crop[]>([]);
    const [loading, setLoading] = useState(true);
    const [predictionResult, setPredictionResult] = useState<any | null>(null);
    const [selectedAction, setSelectedAction] = useState<any | null>(null);
    const navigate = useNavigate();
    const { user } = useAuth();

    // Modal State
    const [temp, setTemp] = useState(22);
    const [hum, setHum] = useState(50);
    const [notes, setNotes] = useState('');

    const openLogModal = (action: any) => {
        // use defaults or current crop ideal
        setTemp(action.crop.seed.ideal_temp || 22);
        setHum(action.crop.seed.ideal_humidity || 50);
        setNotes('');
        setSelectedAction(action);
    };

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const response = await cropsApi.getAll('active');
            setActiveCrops(response.data);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogAction = async () => {
        if (!selectedAction) return;
        try {
            const response = await cropsApi.logAction(selectedAction.crop.id, {
                action_type: selectedAction.type,
                notes: notes || `Logged via Home at ${new Date().toISOString()}`,
                temperature: temp,
                humidity: hum
            });

            setSelectedAction(null);

            // Show Feedback if prediction exists
            if (response.data.prediction) {
                setPredictionResult(response.data.prediction);
            } else {
                loadData(); // Reload if no prediction
            }
        } catch (error) {
            console.error('Failed to log action', error);
            alert('Failed to save log. Please try again.');
        }
    };

    const closePredictionModal = () => {
        setPredictionResult(null);
        loadData();
    };

    // Helper: Calculate progress
    const getCropStatus = (crop: Crop) => {
        const start = new Date(crop.start_datetime);
        const daysSinceStart = differenceInDays(new Date(), start) + 1;
        const currentDay = Math.min(daysSinceStart, crop.seed.growth_days);
        const progress = Math.round((currentDay / crop.seed.growth_days) * 100);
        return { currentDay, progress };
    };

    if (loading) {
        return <GrowingLoader />;
    }

    // --- GENERATE TIMELINE ACTIONS ---
    const getTimelineActions = () => {
        const actions: any[] = [];
        const now = new Date();

        for (const crop of activeCrops) {
            const start = new Date(crop.start_datetime);
            const hoursSinceStart = (now.getTime() - start.getTime()) / (1000 * 60 * 60);

            // Helper to check if logged
            const isLogged = (type: string) => {
                if (!crop.daily_logs) return false;
                if (type === 'water') {
                    const { currentDay } = getCropStatus(crop);
                    const todayLog = crop.daily_logs.find(log => log.day_number === currentDay);
                    return todayLog?.actions_recorded?.includes(type) || false;
                }
                return crop.daily_logs.some(log => log.actions_recorded?.includes(type));
            };

            // --- DAY 1: SOAKING LOGIC ---
            // Switch to daily mode if 48h passed OR 'sow' action is already logged
            if (hoursSinceStart < 48 && !isLogged('sow')) {
                const soakDuration = crop.seed.soaking_duration_hours || 10;

                // FIX: Day 1 tasks should map to Start Time, not "Start of Today"
                // If it's the very first action, show it at start time

                // 1. Put seeds in water (Start Soak)
                actions.push({
                    id: `${crop.id}-start-soak`,
                    crop,
                    title: "Put seeds into water",
                    time: start, // EXACT start time
                    type: 'start_soak',
                    completed: isLogged('start_soak'),
                    instructions: `Soak time: ${soakDuration}h. Keep in bowl.`,
                });

                const soakEndTime = addHours(start, soakDuration);

                // 2. Finish soaking (Sow)
                actions.push({
                    id: `${crop.id}-sow`,
                    crop,
                    title: "Finish soaking, move to dark",
                    time: soakEndTime,
                    type: 'sow',
                    completed: isLogged('sow'),
                    instructions: "Drain well. Spread on soil. Mist heavily. Cover.",
                });
            }

            // --- DAILY TASKS ---
            else {
                // Generate "Morning" and "Evening" slots for today
                const morningTime = new Date(); morningTime.setHours(8, 0, 0, 0);
                const eveningTime = new Date(); eveningTime.setHours(18, 0, 0, 0);

                // Morning Action
                actions.push({
                    id: `${crop.id}-water-am`,
                    crop,
                    title: "Water your plant and keep it in dark",
                    time: morningTime,
                    type: 'water_morning', // Distinct type
                    completed: crop.daily_logs.some(l => l.actions_recorded?.includes('water_morning') && l.day_number === getCropStatus(crop).currentDay),
                    instructions: "Spray evenly. Check humidity."
                });

                // Evening Action
                actions.push({
                    id: `${crop.id}-water-pm`,
                    crop,
                    title: "Water your plant and keep in dark",
                    time: eveningTime,
                    type: 'water_evening', // Distinct type
                    completed: crop.daily_logs.some(l => l.actions_recorded?.includes('water_evening') && l.day_number === getCropStatus(crop).currentDay),
                    instructions: "Light misting before night."
                });
            }
        }

        // Filter completed & Sort
        return actions
            .filter(a => !a.completed) // ONLY show pending tasks
            .sort((a, b) => a.time.getTime() - b.time.getTime());
    };

    const timelineActions = getTimelineActions();

    return (
        <div className="min-h-screen bg-gray-50 py-6 px-4 pb-24 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Today's Actions</h1>
                    <p className="text-gray-600 mt-2">Here is what you need to do for your plants.</p>
                </div>

                <div className="min-h-[60vh]">
                    <div className="max-w-2xl mx-auto space-y-8">
                        {activeCrops.map(crop => {
                            const cropActions = timelineActions.filter(a => a.crop.id === crop.id);
                            if (cropActions.length === 0) return null;

                            return (
                                <div key={crop.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-xl font-bold text-gray-900">{crop.seed.name}</h3>
                                        <button
                                            onClick={() => navigate(`/dashboard/${crop.id}`)}
                                            className="text-xs font-bold text-gray-400 hover:text-green-600 uppercase tracking-wider bg-gray-50 px-3 py-1 rounded-full"
                                        >
                                            Detail
                                        </button>
                                    </div>

                                    <div className="space-y-6 relative ml-2">
                                        {/* Vertical Line */}
                                        <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gray-100"></div>

                                        {cropActions.map((action) => {
                                            const timeString = format(action.time, 'HH:mm');
                                            const now = new Date();
                                            const isFuture = isAfter(action.time, now);
                                            const relTime = formatDistanceToNow(action.time, { addSuffix: true });

                                            // Calculate Day Number relative to start
                                            const start = new Date(crop.start_datetime);
                                            const actionDay = differenceInDays(action.time, start) + 1;

                                            const displayTime = `Day ${actionDay} • ${timeString} (${relTime})`;

                                            return (
                                                <div key={action.id} className={`relative pl-8 group ${action.completed ? 'opacity-50' : ''}`}>
                                                    {/* Dot */}
                                                    <div className={`absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 z-10 bg-white ${action.completed ? 'bg-green-500 border-green-500' :
                                                        isFuture ? 'border-gray-300 bg-gray-100' :
                                                            'border-red-500 bg-red-50'
                                                        }`}>
                                                        {action.completed && <CheckCircle className="w-3 h-3 text-white" />}
                                                    </div>

                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <span className={`text-sm font-bold block mb-0.5 ${action.completed ? 'text-green-600 line-through' :
                                                                isFuture ? 'text-gray-400' : 'text-red-500'
                                                                }`}>
                                                                {displayTime}
                                                            </span>
                                                            <p className={`font-medium leading-snug ${action.completed ? 'text-gray-400' : 'text-gray-600'}`}>
                                                                {action.title}
                                                            </p>
                                                        </div>

                                                        {/* Tick Box Logic */}
                                                        {!action.completed && !isFuture && (
                                                            <button
                                                                onClick={() => openLogModal(action)}
                                                                className="ml-4 w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center hover:bg-green-50 hover:border-green-500 hover:text-green-600 transition-colors"
                                                            >
                                                                <div className="w-4 h-4 rounded-full border border-gray-300" />
                                                            </button>
                                                        )}

                                                        {/* Future Lock Indicator */}
                                                        {isFuture && !action.completed && (
                                                            <div className="ml-4 flex items-center text-xs text-gray-400 italic py-2 bg-gray-50 px-2 rounded-lg">
                                                                <Lock className="w-3 h-3 mr-1" />
                                                                Wait for time
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}

                        {activeCrops.length === 0 && (
                            <div className="text-center py-12 text-gray-500">
                                <p className="text-lg font-medium">No active plants.</p>
                                <p className="text-sm mt-2">Go to <span className="text-green-600 font-bold cursor-pointer hover:underline" onClick={() => navigate('/atlas')}>Seed Atlas</span> to start a new crop.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Log Action Modal */}
            {
                selectedAction && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-gray-900">Log Action</h3>
                                <button onClick={() => setSelectedAction(null)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                                    <X className="w-5 h-5 text-gray-600" />
                                </button>
                            </div>

                            <div className="text-center mb-8">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="w-8 h-8 text-green-600" />
                                </div>
                                <p className="text-gray-600">
                                    Did you complete: <br />
                                    <span className="font-bold text-gray-900 block mt-1 text-lg">{selectedAction.title}</span>
                                </p>
                                <p className="text-sm text-gray-400 mt-2">
                                    Scheduled for: {format(selectedAction.time, 'PPp')}
                                </p>
                            </div>

                            {/* Environmental Inputs */}
                            <div className="space-y-4 mb-8">
                                <div>
                                    <div className="flex justify-between text-sm font-semibold text-gray-700 mb-1">
                                        <span>Temperature</span>
                                        <span>{temp}°C</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="15" max="35" step="0.5"
                                        value={temp}
                                        onChange={(e) => setTemp(parseFloat(e.target.value))}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>

                                <div>
                                    <div className="flex justify-between text-sm font-semibold text-gray-700 mb-1">
                                        <span>Humidity</span>
                                        <span>{hum}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="20" max="90" step="1"
                                        value={hum}
                                        onChange={(e) => setHum(parseFloat(e.target.value))}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Notes (Optional)
                                    </label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        className="w-full p-3 rounded-xl bg-gray-50 border-gray-200 text-sm focus:ring-green-500 focus:border-green-500"
                                        rows={2}
                                        placeholder="Add a quick note..."
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setSelectedAction(null)}
                                    className="w-full py-3 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200"

                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleLogAction}
                                    className="w-full py-3 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200"
                                >
                                    Confirm Log
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* PREDICTION FEEDBACK MODAL */}
            {predictionResult && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] max-w-sm w-full p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-300 relative overflow-hidden">
                        {/* Background Decor */}
                        <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-br from-green-50 to-emerald-50 z-0"></div>

                        <div className="relative z-10 text-center">
                            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-200 border-4 border-white">
                                <span className="text-3xl">🌱</span>
                            </div>

                            <h2 className="text-2xl font-black text-gray-900 mb-2">Great Job!</h2>
                            <p className="text-gray-500 mb-8">We've updated your prediction.</p>

                            <div className="bg-white/80 backdrop-blur border border-green-100 rounded-2xl p-6 mb-8 shadow-sm">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Projected Yield</p>
                                <div className="text-4xl font-black text-gray-900 mb-2">
                                    {predictionResult.predicted_yield}<span className="text-lg text-gray-400 font-bold ml-1">g</span>
                                </div>
                                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${predictionResult.status === 'excellent' ? 'bg-green-100 text-green-700' :
                                    predictionResult.status === 'good' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                                    {predictionResult.status} Status
                                </div>
                            </div>

                            <button
                                onClick={closePredictionModal}
                                className="w-full py-4 rounded-2xl font-bold text-white bg-gray-900 hover:bg-black transition-all transform hover:scale-[1.02] active:scale-95 shadow-xl"
                            >
                                Continue Growing
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}


// Sub-components: None needed

 
