import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Target, Award, CalendarDays, Flower2, Zap, BrainCircuit, Check, X, Sprout } from 'lucide-react';
interface Crop {
  id: number;
  seed_id: number;
  start_date: string;
  watering_frequency: number;
  status: string;
  seed: {
    name: string;
    growth_days: number;
    blackout_days: number;
    avg_yield_grams: number;
  };
}

interface DailyLog {
  id: number;
  day_number: number;
  watered: boolean;
  temperature: number;
  humidity: number;
  predicted_yield?: number;
}

export default function DashboardSimple() {
  const { cropId } = useParams<{ cropId: string }>();
  const navigate = useNavigate();

  const [crop, setCrop] = useState<Crop | null>(null);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (cropId) {
      loadData();
    }
  }, [cropId]);

  const loadData = async () => {
    try {
      const [cropRes, logsRes] = await Promise.all([
        fetch(`http://localhost:8000/api/crops/${cropId}`),
        fetch(`http://localhost:8000/api/crops/${cropId}/logs`)
      ]);

      const cropData = await cropRes.json();
      const logsData = await logsRes.json();

      setCrop(cropData);
      setLogs(logsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !crop) {
    return (
      <div className="flex justify-center items-center h-64 bg-[#0E1015]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const daysSinceStart = Math.floor((new Date().getTime() - new Date(crop.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const currentDay = Math.min(daysSinceStart, crop.seed.growth_days);
  const loggedDays = logs.map(l => l.day_number);
  const latestLog = logs.length > 0 ? logs[logs.length - 1] : null;

  const getPhase = (day: number) => {
    if (day <= crop.seed.blackout_days) return 'Blackout Phase';
    return 'Light Phase';
  };

  return (
    <div className="py-8 bg-[#0E1015]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-10 font-sans">
          <button
            onClick={() => navigate('/atlas')}
            className="flex items-center text-gray-400 hover:text-emerald-400 mb-6 transition-colors font-bold text-sm tracking-widest uppercase"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Atlas
          </button>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#1A1D27] p-8 rounded-[2rem] border border-white/5 shadow-xl relative overflow-hidden text-center sm:text-left">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-3xl rounded-full"></div>
            <div className="relative z-10 w-full">
              <div className="inline-flex items-center justify-center sm:justify-start gap-3 mb-2 w-full">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_15px_rgba(52,211,153,0.1)]">
                  <Sprout className="w-6 h-6 text-emerald-400" />
                </div>
                <h1 className="text-4xl font-black text-white tracking-tight">
                  {crop.seed.name}
                </h1>
              </div>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-sm flex items-center justify-center sm:justify-start gap-2 mt-2">
                <CalendarDays className="w-4 h-4 text-emerald-500/70" />
                Started {new Date(crop.start_date).toLocaleDateString()}
              </p>
            </div>
            <div className="relative z-10 hidden sm:block">
              <div className="bg-[#0E1015] p-4 rounded-2xl border border-white/5 shadow-inner text-center min-w-[150px]">
                <div className="text-sm font-black text-gray-500 uppercase tracking-widest mb-1">Status</div>
                <div className="text-emerald-400 font-black text-xl">{getPhase(currentDay)}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Timeline */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-[#1A1D27] rounded-[2rem] p-8 border border-white/5 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-3xl rounded-full"></div>
              <h3 className="text-lg font-black text-white mb-6 uppercase tracking-widest flex items-center gap-3 relative z-10">
                <Target className="w-5 h-5 text-blue-400" />
                Growth Timeline
              </h3>

              <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent relative z-10 snap-x">
                {Array.from({ length: crop.seed.growth_days }, (_, i) => i + 1).map((day) => {
                  const isLogged = loggedDays.includes(day);
                  const isCurrent = day === currentDay;
                  const isFuture = day > currentDay;

                  let bgColor = 'bg-[#0E1015] border-white/5';
                  let textColor = 'text-gray-500';
                  let icon = <span className="text-lg">{day}</span>;

                  if (isLogged) {
                    bgColor = 'bg-emerald-500/10 border-emerald-500/30';
                    textColor = 'text-emerald-400';
                    icon = <Check className="w-6 h-6" />;
                  } else if (isCurrent) {
                    bgColor = 'bg-blue-500/20 border-blue-400/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]';
                    textColor = 'text-blue-300';
                    icon = <span className="text-xl">{day}</span>;
                  } else if (!isFuture && !isLogged) {
                    bgColor = 'bg-rose-500/10 border-rose-500/30';
                    textColor = 'text-rose-400';
                    icon = <X className="w-6 h-6" />;
                  }

                  return (
                    <div key={day} className="flex flex-col items-center min-w-[70px] snap-center">
                      <div
                        className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center font-black transition-all ${bgColor} ${textColor} ${isCurrent ? 'animate-pulse' : ''}`}
                      >
                        {icon}
                      </div>
                      <span className={`text-[10px] font-bold mt-3 uppercase tracking-widest ${isCurrent ? 'text-blue-400' : 'text-gray-500'}`}>
                        Day {day}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 pt-6 border-t border-white/5 flex flex-wrap gap-6 text-xs font-bold uppercase tracking-widest text-gray-400 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                  <span>Logged</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/50 shadow-[0_0_10px_rgba(244,63,94,0.5)]"></div>
                  <span>Missed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                  <span>Current</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-white/10"></div>
                  <span>Future</span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="text-center sm:text-left">
              {currentDay >= crop.seed.growth_days ? (
                <button
                  className="w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white border border-purple-400/50 rounded-2xl font-black text-lg shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] transition-all hover:-translate-y-1 flex items-center justify-center gap-3 uppercase tracking-widest"
                  onClick={() => alert('Harvest page coming soon!')}
                >
                  <Award className="w-6 h-6" />
                  Harvest Now
                </button>
              ) : loggedDays.includes(currentDay) ? (
                <div className="w-full sm:w-auto inline-flex items-center justify-center px-10 py-5 bg-white/5 border border-white/10 text-gray-400 rounded-2xl font-black text-lg uppercase tracking-widest shadow-inner">
                  <Check className="w-6 h-6 mr-3 text-emerald-500" />
                  Day {currentDay} Logged
                </div>
              ) : (
                <button
                  className="w-full sm:w-auto px-10 py-5 bg-emerald-500 hover:bg-emerald-400 text-white border border-emerald-400/50 rounded-2xl font-black text-lg shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all hover:-translate-y-1 flex items-center justify-center gap-3 uppercase tracking-widest"
                  onClick={() => navigate(`/daily-log/${cropId}/${currentDay}`)}
                >
                  <Zap className="w-6 h-6" />
                  Log Day {currentDay}
                </button>
              )}
            </div>
          </div>

          {/* Status Card */}
          <div className="lg:col-span-1">
            <div className="bg-[#1A1D27] rounded-[2rem] p-8 border border-white/5 shadow-xl sticky top-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none"></div>

              <div className="text-center mb-10 relative z-10">
                <h2 className="text-3xl font-black text-white mb-3 tracking-tight">
                  Day {currentDay} <span className="text-gray-500 font-medium text-xl">of {crop.seed.growth_days}</span>
                </h2>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl text-xs font-black uppercase tracking-widest shadow-[0_0_10px_rgba(59,130,246,0.1)]">
                  <Flower2 className="w-4 h-4" />
                  {getPhase(currentDay)}
                </div>
              </div>

              {/* Yield Prediction */}
              {latestLog?.predicted_yield ? (
                <div className="bg-[#0E1015] p-6 rounded-[2rem] border border-white/5 mb-8 text-center relative z-10 shadow-inner group transition-all hover:border-emerald-500/30">
                  <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-[2rem]"></div>
                  <div className="text-xs font-black uppercase tracking-widest text-emerald-500/70 mb-2 flex items-center justify-center gap-2">
                    <BrainCircuit className="w-4 h-4" />
                    AI Predicted Yield
                  </div>
                  <div className="text-5xl font-black text-emerald-400 tracking-tighter shadow-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)] mb-2">
                    {Math.round(latestLog.predicted_yield)}g
                  </div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                    of {crop.seed.avg_yield_grams}g base
                  </div>
                </div>
              ) : (
                <div className="bg-[#0E1015] p-8 rounded-[2rem] border border-white/5 mb-8 text-center relative z-10 shadow-inner">
                  <div className="text-4xl mb-4 opacity-50"><BrainCircuit className="w-12 h-12 mx-auto text-emerald-500" /></div>
                  <div className="text-sm font-bold text-gray-400 leading-relaxed max-w-[200px] mx-auto">
                    Log your first day to get AI yield predictions!
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="border-t border-white/5 pt-8 relative z-10">
                <div className="text-xs font-black text-gray-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Progress Stats
                </div>
                <div className="space-y-4 text-sm font-bold">
                  <div className="flex justify-between items-center bg-[#0E1015] p-4 rounded-xl border border-white/5">
                    <span className="text-gray-500 flex items-center gap-2"><Check className="w-4 h-4" /> Days Logged:</span>
                    <span className="text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg">{logs.length}/{currentDay}</span>
                  </div>
                  <div className="flex justify-between items-center bg-[#0E1015] p-4 rounded-xl border border-white/5">
                    <span className="text-gray-500 flex items-center gap-2"><CalendarDays className="w-4 h-4" />  Days Remaining:</span>
                    <span className="text-white bg-white/5 px-3 py-1 rounded-lg">{crop.seed.growth_days - currentDay}</span>
                  </div>
                  <div className="flex justify-between items-center bg-[#0E1015] p-4 rounded-xl border border-white/5">
                    <span className="text-gray-500 flex items-center gap-2"><Target className="w-4 h-4" /> Completion:</span>
                    <span className="text-blue-400 bg-blue-500/10 px-3 py-1 rounded-lg">
                      {Math.round((currentDay / crop.seed.growth_days) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

