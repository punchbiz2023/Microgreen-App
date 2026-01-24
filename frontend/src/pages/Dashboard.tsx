import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cropsApi, logsApi, predictionsApi, type Crop, type DailyLog, type Prediction } from '../services/api';
import Timeline from '../components/Timeline';
import StatusCard from '../components/StatusCard';
import HistoryDetails from '../components/HistoryDetails';
import GrowthSchedule from '../components/GrowthSchedule';
import CultivationCards from '../components/CultivationCards';
import { ArrowLeft, Plus, Sprout, Zap } from 'lucide-react';
import { differenceInDays, format } from 'date-fns';
import { ta as taLocale, enUS as enLocale } from 'date-fns/locale';

export default function Dashboard() {
  const { cropId } = useParams<{ cropId: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const currentLocale = i18n.language === 'ta' ? taLocale : enLocale;

  const [crop, setCrop] = useState<Crop | null>(null);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [selectedLog, setSelectedLog] = useState<DailyLog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (cropId) {
      loadData();
    }
  }, [cropId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load crop details
      const cropResponse = await cropsApi.getById(parseInt(cropId!));
      setCrop(cropResponse.data);

      // Load daily logs
      const logsResponse = await logsApi.getAll(parseInt(cropId!));
      setLogs(logsResponse.data);

      // Load prediction if logs exist
      if (logsResponse.data.length > 0) {
        try {
          const [predResponse] = await Promise.all([
            predictionsApi.get(parseInt(cropId!))
          ]);

          let aiSuggestion = null;

          // Attempt to use Puter.js for AI suggestion
          if (window.puter && window.puter.ai) {
            const seedName = cropResponse.data.seed.name;
            const cropData = cropResponse.data;
            const logsData = logsResponse.data;
            const currentDay = Math.floor(logsData.length / 1); // Approx: 1 log per day
            const recentLogs = logsData.slice(-3).map(l =>
              `Day ${l.day_number}: Temp ${l.temperature}C, Hum ${l.humidity}%, Watered: ${l.watered}`
            ).join('\n');

            const prompt = `
             I am growing ${seedName} microgreens. 
             Current progress: Day ${currentDay} of ${cropData.seed.harvest_days || 'standard cycle'}.
             Recent conditions:
             ${recentLogs}
             
             The ideal temperature is ${cropData.seed.ideal_temp}C and humidity ${cropData.seed.ideal_humidity}%.
             
             Analyze the conditions. If they are off, warn me. 
             Give me 2-3 short, actionable tips for the next 24 hours to maximize yield.
             Keep it encouraging but technical.
             CRITICAL: Keep the response extremely concise. Maximum 3-4 lines total. Use bullet points.
             LANGUAGE: Respond strictly in ${i18n.language === 'ta' ? 'Tamil' : 'English'}.
             `;

            try {
              const response = await window.puter.ai.chat(prompt, { model: 'gpt-4o-mini' });
              aiSuggestion = response?.message?.content || response?.text || response;
              // Handle object response if needed
              if (typeof aiSuggestion === 'object') {
                aiSuggestion = aiSuggestion.content || JSON.stringify(aiSuggestion);
              }
            } catch (err) {
              console.warn("Puter AI failed:", err);
            }
          }

          setPrediction({
            ...predResponse.data,
            // Append AI suggestion if available
            suggestions: [
              ...predResponse.data.suggestions,
              ...(aiSuggestion ? [{
                type: 'success' as const,
                issue: t('dashboard.ai_coach'),
                message: aiSuggestion
              }] : [])
            ]
          });
        } catch (error) {
          console.error('Failed to load prediction:', error);
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      alert(t('dashboard.load_error'));
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

  // Parse numeric fields from potentially string DB columns
  const growthDays = typeof crop.seed.growth_days === 'string' ? parseInt(crop.seed.growth_days) : crop.seed.growth_days;
  const blackoutDays = typeof crop.seed.blackout_time_days === 'string' ? parseInt(crop.seed.blackout_time_days || '0') : (crop.seed.blackout_time_days || 0);

  // Calculate current day
  const start = new Date(crop.start_datetime);
  const now = new Date();
  let currentDay = 0;
  if (now >= start) {
    currentDay = differenceInDays(now, start) + 1;
  }
  currentDay = Math.min(currentDay, growthDays);
  const isHarvestDay = currentDay >= growthDays && currentDay > 0;

  // Get completed and missed days
  const loggedDays = logs.map(log => log.day_number);
  const allDaysSoFar = Array.from({ length: Math.min(currentDay, growthDays) }, (_, i) => i + 1);
  const completedDays = allDaysSoFar.filter(day => loggedDays.includes(day));
  const missedDays = allDaysSoFar.filter(day => !loggedDays.includes(day) && day < currentDay);

  // Determine phase
  const getPhase = () => {
    if (currentDay <= blackoutDays) {
      return t('dashboard.blackout_phase_full');
    } else if (currentDay < growthDays) {
      return t('dashboard.light_phase_full');
    } else {
      return t('dashboard.harvest_day');
    }
  };

  const handleDayClick = (day: number) => {
    const log = logs.find(l => l.day_number === day);
    if (log) {
      setSelectedLog(log);
    } else if (day < currentDay) {
      // Allow back-logging
      navigate(`/log/${cropId}/${day}`);
    }
  };

  const handleLogToday = () => {
    if (loggedDays.includes(currentDay)) {
      alert(t('dashboard.day_logged', { day: currentDay }));
      return;
    }
    navigate(`/log/${cropId}/${currentDay}`);
  };

  const handleHarvest = () => {
    navigate(`/harvest/${cropId}`);
  };

  const handleDelete = async () => {
    if (confirm(t('common.delete_confirm'))) {
      try {
        await cropsApi.delete(parseInt(cropId!));
        navigate('/atlas'); // Redirect to Atlas or Home
      } catch (error) {
        console.error('Failed to delete crop:', error);
        alert('Failed to delete crop');
      }
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/atlas')}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            {t('dashboard.back_to_atlas')}
          </button>

          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">
              {t('dashboard.crop_title', { name: crop.seed.name })}
            </h1>
            <p className="text-gray-600 mt-1">
              {t('dashboard.started_on')} {format(new Date(crop.start_datetime), 'PPP', { locale: currentLocale })}
            </p>
          </div>

          <div className="w-24 text-right">
            <button
              onClick={handleDelete}
              className="text-red-500 hover:text-red-700 text-sm font-semibold hover:underline"
            >
              {t('common.delete')}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Timeline */}
          <div className="lg:col-span-2 space-y-6">
            <Timeline
              totalDays={growthDays}
              currentDay={currentDay}
              completedDays={completedDays}
              missedDays={missedDays}
              onDayClick={handleDayClick}
            />

            {/* Inline History Details */}
            {selectedLog && (
              <div className="mt-6">
                <HistoryDetails
                  log={selectedLog}
                  phase={selectedLog.day_number <= blackoutDays ? t('dashboard.blackout_phase') : t('dashboard.light_phase')}
                  onClose={() => setSelectedLog(null)}
                />
              </div>
            )}

            {/* Cultivation Details Cards */}
            <CultivationCards
              seed={crop.seed}
              traySize={crop.tray_size}
              numberOfTrays={crop.number_of_trays}
            />

            {/* Action Button */}
            <div className="flex justify-center">
              {isHarvestDay ? (
                <button
                  onClick={handleHarvest}
                  className="flex items-center space-x-3 px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                >
                  <Sprout className="w-6 h-6" />
                  <span>{t('dashboard.harvest_now')}</span>
                </button>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <button
                    onClick={handleLogToday}
                    disabled={loggedDays.includes(currentDay)}
                    className={`flex items-center space-x-3 px-8 py-4 font-bold text-lg rounded-xl shadow-lg transition-all ${loggedDays.includes(currentDay)
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-500 hover:bg-green-600 text-white hover:shadow-xl transform hover:scale-105 shadow-green-100'
                      }`}
                  >
                    <Plus className="w-6 h-6" />
                    <span>
                      {loggedDays.includes(currentDay)
                        ? t('dashboard.day_logged', { day: currentDay })
                        : t('dashboard.log_day', { day: currentDay })
                      }
                    </span>
                  </button>
                  <button
                    onClick={() => navigate(`/guide/${cropId}`)}
                    className="flex items-center space-x-2 text-green-600 font-bold hover:underline"
                  >
                    <Zap size={16} />
                    <span>{t('dashboard.view_full_guide')}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Status */}
          <div>
            <StatusCard
              dayNumber={currentDay}
              totalDays={growthDays}
              phase={getPhase()}
              prediction={prediction}
            />

            <div className="mt-8 bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm">
              <GrowthSchedule
                seed={crop.seed}
                currentDay={currentDay}
                blackoutDaysOverride={blackoutDays}
              />
            </div>
          </div>
        </div>
      </div>


    </div >
  );
}

