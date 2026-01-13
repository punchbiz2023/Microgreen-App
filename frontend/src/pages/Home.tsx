import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cropsApi, type Crop } from '../services/api';
import {
    CheckCircle, X, Plus, Droplet, Clock,
    ChevronRight, Zap, CalendarDays
} from 'lucide-react';
import { differenceInDays, format, addHours, isAfter, formatDistanceToNow } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import GrowingLoader from '../components/GrowingLoader';

export default function Home() {
    const [activeCrops, setActiveCrops] = useState<Crop[]>([]);
    const [loading, setLoading] = useState(true);
    const [predictionResult, setPredictionResult] = useState<any | null>(null);
    const [selectedAction, setSelectedAction] = useState<any | null>(null);
    const navigate = useNavigate();
    const { } = useAuth();

    // Modal State
    const [temp, setTemp] = useState(22);
    const [hum, setHum] = useState(50);
    const [notes, setNotes] = useState('');

    const openLogModal = (action: any) => {
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
            const cropsRes = await cropsApi.getAll('active');
            setActiveCrops(cropsRes.data);
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

            if (response.data.prediction) {
                setPredictionResult(response.data.prediction);
            } else {
                setSelectedAction(null);
                loadData();
            }
        } catch (error) {
            console.error('Failed to log action', error);
            alert('Failed to save log. Please try again.');
        }
    };

    const closePredictionModal = () => {
        setPredictionResult(null);
        setSelectedAction(null);
        loadData();
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
                    actions.push({ id: `${crop.id}-start-soak`, crop, title: "Initial Soak", time: start, type: 'start_soak', completed: false, priority: 'high', day_number: currentDay });
                }
                if (!isActionLogged('sow', currentDay)) {
                    const soakEndTime = addHours(start, soakDuration);
                    actions.push({ id: `${crop.id}-sow`, crop, title: "Sow to Tray", time: soakEndTime, type: 'sow', completed: false, priority: 'high', day_number: currentDay });
                }
            } else {
                // Only show today's actions on the Home page feed
                const morningTime = new Date(); morningTime.setHours(8, 0, 0, 0);
                const eveningTime = new Date(); eveningTime.setHours(18, 0, 0, 0);

                if (!isActionLogged('water_morning', currentDay)) {
                    actions.push({
                        id: `${crop.id}-today-water-am`,
                        crop,
                        title: "Morning Mist",
                        time: morningTime,
                        type: 'water_morning',
                        completed: false,
                        priority: 'medium',
                        day_number: currentDay
                    });
                }
                if (!isActionLogged('water_evening', currentDay)) {
                    actions.push({
                        id: `${crop.id}-today-water-pm`,
                        crop,
                        title: "Evening Mist",
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
                    <div className="flex justify-between items-end mb-10 pb-6 border-b border-gray-200">
                        <div>
                            <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest block mb-1">Activity Command</span>
                            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center">
                                Today's Actions
                                <span className="ml-3 bg-gray-100 text-gray-400 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-tighter">
                                    {timelineActions.length} Pending
                                </span>
                            </h1>
                        </div>
                        <div className="flex flex-col items-end">
                            <p className="text-sm font-medium text-gray-500 mb-3">{format(new Date(), 'EEEE, MMMM do')}</p>
                            <button
                                onClick={() => navigate('/atlas')}
                                className="bg-green-500 hover:bg-green-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all hover:shadow-lg flex items-center group"
                            >
                                <Plus size={14} className="mr-2 group-hover:rotate-90 transition-transform" />
                                New Crop
                            </button>
                        </div>
                    </div>

                    {/* Pending Actions Section */}
                    <div className="mb-12">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 px-1">Attention Required</h3>
                        <div className="space-y-4">
                            {timelineActions.length > 0 ? (
                                timelineActions.map((action) => {
                                    const relTime = formatDistanceToNow(action.time, { addSuffix: true });

                                    return (
                                        <div
                                            key={action.id}
                                            className={`group relative bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all border-l-4 ${action.day_number < getCropStatus(action.crop).currentDay ? 'border-l-red-500' : 'border-l-green-400'}`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-5">
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${action.day_number < getCropStatus(action.crop).currentDay ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                                                        {action.type.includes('water') ? <Droplet size={20} /> : <Zap size={20} />}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center space-x-2 mb-1">
                                                            <h4 className="text-lg font-bold text-gray-900 leading-none">{action.title}</h4>
                                                            {action.day_number < getCropStatus(action.crop).currentDay && (
                                                                <span className="bg-red-100 text-red-600 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase animate-pulse">
                                                                    Overdue
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center text-[11px] font-medium text-gray-400">
                                                            <span className="text-green-500 font-bold uppercase tracking-wide mr-2">{action.crop.seed.name}</span>
                                                            <span className="flex items-center">
                                                                <Clock size={12} className="mr-1" />
                                                                {format(action.time, 'hh:mm a')} • {relTime}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => openLogModal(action)}
                                                    className={`px-6 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center border ${action.day_number < getCropStatus(action.crop).currentDay
                                                        ? 'bg-gray-900 text-white border-gray-900 hover:bg-black'
                                                        : 'bg-white border-gray-200 text-gray-600 hover:border-green-400 hover:text-green-500'
                                                        }`}
                                                >
                                                    Complete Action
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
                                    <h4 className="text-xl font-bold text-gray-900 mb-2">Maximum Efficiency</h4>
                                    <p className="text-gray-500 text-sm max-w-xs mx-auto leading-relaxed">
                                        All your cultivation tasks for today have been logged. Sit back and watch your microgreens thrive!
                                    </p>
                                    <button
                                        onClick={() => navigate('/atlas')}
                                        className="mt-8 inline-flex items-center text-green-500 font-bold text-xs uppercase tracking-widest hover:text-green-600 transition-colors"
                                    >
                                        Browse Atlas for more crops
                                        <ChevronRight size={14} className="ml-1" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* All Crops Section */}
                    <div className="mt-16 mb-12">
                        <div className="flex justify-between items-center mb-6 px-1">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Your Active Crops</h3>
                            <span className="text-[10px] font-bold text-gray-300 uppercase">{activeCrops.length} Total</span>
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
                                                            {isFuture ? 'Scheduled' : `Day ${currentDay}`}
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
                                <p className="text-sm text-gray-400 font-medium">No active crops found.</p>
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
                                    <h5 className="text-sm font-bold text-gray-900 truncate">Plant Manager</h5>
                                    <p className="text-[10px] text-gray-400 font-medium">View all active grow cycles</p>
                                </div>
                            </div>
                            <ChevronRight size={16} className="text-gray-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                        </div>
                    </div>
                </div>
            </main>

            {/* Modals */}
            {selectedAction && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-sm w-full p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Finalize Action</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Growth Intelligence Logging</p>
                            </div>
                            <button onClick={() => setSelectedAction(null)} className="p-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="bg-green-50 rounded-2xl p-4 flex items-center space-x-4 mb-8">
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm text-green-500">
                                {selectedAction.type.includes('water') ? <Droplet size={18} /> : <Zap size={18} />}
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-gray-900">{selectedAction.title}</h4>
                                <p className="text-[10px] font-medium text-green-600 uppercase mt-0.5">{selectedAction.crop.seed.name}</p>
                            </div>
                        </div>

                        <div className="space-y-6 mb-8">
                            <div>
                                <div className="flex justify-between text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">
                                    <span className="flex items-center">Ambient Temperature</span>
                                    <span className="text-green-600 font-extrabold">{temp}°C</span>
                                </div>
                                <input
                                    type="range" min="15" max="35" step="0.5"
                                    value={temp} onChange={(e) => setTemp(parseFloat(e.target.value))}
                                    className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-green-500"
                                />
                            </div>
                            <div>
                                <div className="flex justify-between text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">
                                    <span className="flex items-center">Relative Humidity</span>
                                    <span className="text-blue-500 font-extrabold">{hum}%</span>
                                </div>
                                <input
                                    type="range" min="20" max="90" step="1"
                                    value={hum} onChange={(e) => setHum(parseFloat(e.target.value))}
                                    className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleLogAction}
                            className="w-full py-4 bg-green-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-green-100 hover:bg-green-600 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center"
                        >
                            Sync with Cloud & Save
                            <ChevronRight size={16} className="ml-1" />
                        </button>
                    </div>
                </div>
            )}

            {predictionResult && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-xl z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] max-w-sm w-full p-10 shadow-2xl animate-in slide-in-from-bottom-10 duration-500 relative overflow-hidden text-center border-t-8 border-green-500">
                        <div className="relative z-10">
                            <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-sm text-3xl">🪴</div>
                            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Growth Insight</h2>
                            <p className="text-sm font-medium text-gray-500 mb-10">Your cultivation care has been recorded.</p>

                            <div className="bg-gray-50 rounded-3xl p-6 mb-8 border border-gray-100">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Projected Recovery</p>
                                <div className="text-5xl font-extrabold text-gray-900 tracking-tighter">
                                    {predictionResult.predicted_yield}<span className="text-xl text-green-500 ml-1">g</span>
                                </div>
                            </div>

                            <button
                                onClick={closePredictionModal}
                                className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold shadow-xl hover:bg-black transition-all group mb-3"
                            >
                                Continue Cultivation
                                <ChevronRight size={16} className="inline ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>

                            <button
                                onClick={() => {
                                    const cropToView = selectedAction ? selectedAction.crop.id : activeCrops[0]?.id;
                                    closePredictionModal();
                                    if (cropToView) navigate(`/dashboard/${cropToView}`);
                                }}
                                className="w-full py-3 bg-white border border-gray-200 text-gray-600 rounded-2xl font-bold text-xs hover:border-green-500 hover:text-green-500 transition-all"
                            >
                                Go to Crop Details
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
