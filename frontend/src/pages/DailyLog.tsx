import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { cropsApi, logsApi, type Crop } from '../services/api';
import api from '../services/api';
import { ArrowLeft, Camera, Droplet, Thermometer, CloudRain, Save } from 'lucide-react';

export default function DailyLog() {
  const { cropId, day } = useParams<{ cropId: string; day: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const actionType = queryParams.get('actionType');

  const [crop, setCrop] = useState<Crop | null>(null);
  const [watered, setWatered] = useState(true);
  const [temperature, setTemperature] = useState(22);
  const [humidity, setHumidity] = useState(50);
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Plant counting state
  const [plantCount, setPlantCount] = useState<number | null>(null);
  const [counting, setCounting] = useState(false);
  const [countError, setCountError] = useState<string | null>(null);
  const [annotatedImageUrl, setAnnotatedImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (cropId) {
      loadCrop();
    }
  }, [cropId]);

  const loadCrop = async () => {
    try {
      const response = await cropsApi.getById(parseInt(cropId!));
      setCrop(response.data);

      // Set default values based on ideal conditions
      setTemperature(response.data.seed.ideal_temp ?? 22);
      setHumidity(response.data.seed.ideal_humidity ?? 50);
    } catch (error) {
      console.error('Failed to load crop:', error);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCountPlants = async () => {
    if (!photo) return;

    setCounting(true);
    setCountError(null);

    try {
      const formData = new FormData();
      formData.append('file', photo);

      const response = await api.post('/api/count-plants', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        params: {
          model_type: 'sprout',
          color_type: 'green',
          min_area: 50,
          max_area: 5000
        }
      });

      setPlantCount(response.data.count);
      setAnnotatedImageUrl(response.data.annotated_image_url);

      // Append count to notes
      const countInfo = `\n\n🌱 Plant count: ${response.data.count} (detected using ${response.data.method})`;
      setNotes(prev => prev.trim() + countInfo);
    } catch (err: any) {
      console.error('Count error:', err);
      setCountError(err.response?.data?.detail || 'Failed to count plants');
    } finally {
      setCounting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cropId || !day) return;

    try {
      setSubmitting(true);

      // Prepare actions: if back-logging and watered, mark both mists as done
      let actions = actionType ? [actionType] : [];
      if (isBackLogging && watered && actions.length === 0) {
        actions = ['water_morning', 'water_evening'];
      }

      // Submit log data
      await logsApi.create(parseInt(cropId), {
        day_number: parseInt(day),
        watered,
        temperature,
        humidity,
        notes: notes || undefined,
        actions_recorded: actions
      });

      // Upload photo if provided
      if (photo) {
        await logsApi.uploadPhoto(parseInt(cropId), parseInt(day), photo);
      }

      // Navigate back to dashboard
      navigate(`/dashboard/${cropId}`);
    } catch (error: any) {
      console.error('Failed to submit log:', error);
      alert(error.response?.data?.detail || 'Failed to submit log. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!crop) {
    return (
      <div className="flex justify-center items-center h-64 bg-gray-50 dark:bg-[#0E1015] transition-colors duration-300">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const blackoutDays = typeof crop.seed.blackout_time_days === 'string' ? parseInt(crop.seed.blackout_time_days || '0') : (crop.seed.blackout_time_days || 0);

  const startUtc = new Date(crop.start_datetime);
  const nowUtc = new Date();
  const diffTime = nowUtc.getTime() - startUtc.getTime();
  const currentDay = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1);
  const isBackLogging = parseInt(day || '0') < currentDay;

  const getTempColor = () => {
    const diff = Math.abs(temperature - (crop.seed.ideal_temp ?? 22));
    if (diff <= 1) return 'text-green-500';
    if (diff <= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHumidityColor = () => {
    const diff = Math.abs(humidity - (crop.seed.ideal_humidity ?? 50));
    if (diff <= 5) return 'text-green-500';
    if (diff <= 10) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <button
          onClick={() => navigate(`/dashboard/${cropId}`)}
          className="flex items-center text-xs font-black uppercase tracking-widest text-gray-500 hover:text-emerald-500 mb-8 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </button>

        <div className="bg-white dark:bg-[#1A1D27] rounded-[2.5rem] shadow-xl p-8 sm:p-12 border border-gray-100 dark:border-white/5 relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/10 blur-3xl rounded-full"></div>

          <div className="text-center mb-12 relative z-10">
            <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-3 tracking-tighter uppercase">
              {(() => {
                if (actionType === 'water_morning') return `Mist 1: Day ${day}`;
                if (actionType === 'water_evening') return `Mist 2: Day ${day}`;
                if (actionType === 'sow_seed') return `Sow Seed: Day ${day}`;
                return isBackLogging ? `Back-log: Day ${day}` : `Log Day ${day}`;
              })()}
            </h1>
            <p className="text-emerald-600 dark:text-emerald-500 font-black uppercase tracking-[0.3em] text-[10px]">
              {crop.seed.name} • {parseInt(day!) <= blackoutDays ? 'Blackout Phase' : 'Light Phase'}
            </p>
          </div>

          {isBackLogging && (
            <div className="mb-8 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl relative z-10">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Save className="h-5 w-5 text-amber-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-amber-400 font-bold">
                    You are logging data for a past day.
                  </p>
                  <p className="text-xs text-amber-500/80 mt-1 font-medium">
                    This will update the historical record and re-calculate yield predictions for this crop.
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
            {/* Watering */}
            <div>
              <label className="flex items-center text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">
                <Droplet className="w-5 h-5 mr-2 text-blue-500 dark:text-blue-400" />
                {actionType?.includes('water') ? `Record ${actionType === 'water_morning' ? 'Mist 1' : 'Mist 2'} status` : 'Did you water the plants today?'}
              </label>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <button
                  type="button"
                  onClick={() => setWatered(true)}
                  className={`flex-1 p-5 rounded-2xl border-2 font-black text-xs uppercase tracking-widest transition-all ${watered
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-lg shadow-emerald-500/10 transform -translate-y-1'
                    : 'border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-[#0E1015] text-gray-400 dark:text-gray-500 hover:border-gray-200 dark:hover:border-white/10'
                    }`}
                >
                  ✓ Yes, I watered
                </button>
                <button
                  type="button"
                  onClick={() => setWatered(false)}
                  className={`flex-1 p-5 rounded-2xl border-2 font-black text-xs uppercase tracking-widest transition-all ${!watered
                    ? 'border-red-500 bg-red-500/10 text-red-600 dark:text-red-400 shadow-lg shadow-red-500/10 transform -translate-y-1'
                    : 'border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-[#0E1015] text-gray-400 dark:text-gray-500 hover:border-gray-200 dark:hover:border-white/10'
                    }`}
                >
                  ✗ No, I didn't
                </button>
              </div>

              {!watered && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg text-sm font-medium">
                  Note: Consistent watering is key to yield. Only skip if soil is still moist.
                </div>
              )}
            </div>

            {/* Conditional Temp/Hum Display */}
            <div className={`transition-all duration-500 ${watered ? 'opacity-100' : 'opacity-50 grayscale'}`}>
              {watered && (
                <div className="mb-6 text-sm font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg animate-pulse-slow">
                  💧 Since you watered, please log the current conditions for accurate AI prediction!
                </div>
              )}
              {/* Temperature */}
              <div className="mb-8">
                <label className="flex items-center justify-between text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">
                  <span className="flex items-center">
                    <Thermometer className="w-5 h-5 mr-2 text-orange-500 dark:text-orange-400" />
                    Temperature
                  </span>
                  <span className={`text-2xl font-black ${getTempColor()}`}>
                    {temperature}°C
                  </span>
                </label>

                <input
                  type="range"
                  min="15"
                  max="35"
                  step="0.5"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />

                <div className="flex justify-between text-xs text-gray-500 mt-2 font-bold font-mono">
                  <span>15°C</span>
                  <span className="text-emerald-500/70">
                    Ideal: {crop.seed.ideal_temp ?? '--'}°C
                  </span>
                  <span>35°C</span>
                </div>

                {crop.seed.ideal_temp && Math.abs(temperature - crop.seed.ideal_temp) > 3 && (
                  <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <p className="text-sm font-medium text-amber-400">
                      ⚠️ Temperature is outside the ideal range. This may affect yield.
                    </p>
                  </div>
                )}
              </div>

              {/* Humidity */}
              <div className="mb-8">
                <label className="flex items-center justify-between text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">
                  <span className="flex items-center">
                    <CloudRain className="w-5 h-5 mr-2 text-blue-500 dark:text-blue-400" />
                    Humidity
                  </span>
                  <span className={`text-2xl font-black ${getHumidityColor()}`}>
                    {humidity}%
                  </span>
                </label>

                <input
                  type="range"
                  min="25"
                  max="85"
                  step="1"
                  value={humidity}
                  onChange={(e) => setHumidity(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />

                <div className="flex justify-between text-xs text-gray-500 mt-2 font-bold font-mono">
                  <span>25%</span>
                  <span className="text-blue-500/70">
                    Ideal: {crop.seed.ideal_humidity ?? '--'}%
                  </span>
                  <span>85%</span>
                </div>

                {crop.seed.ideal_humidity && Math.abs(humidity - crop.seed.ideal_humidity) > 15 && (
                  <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <p className="text-sm font-medium text-amber-400">
                      ⚠️ Humidity is outside the ideal range. Adjust ventilation or misting.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Photo Upload */}
            <div>
              <label className="flex items-center text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">
                <Camera className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
                Photo (Optional)
              </label>

              {photoPreview ? (
                <div className="space-y-4 animate-fade-in-up">
                  <div className="relative">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-full rounded-2xl shadow-lg border border-gray-100 dark:border-white/5 max-h-64 object-contain bg-gray-50 dark:bg-[#0E1015]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPhoto(null);
                        setPhotoPreview(null);
                        setPlantCount(null);
                        setCountError(null);
                        setAnnotatedImageUrl(null);
                      }}
                      className="absolute top-2 right-2 bg-red-500/80 text-white rounded-full p-2 hover:bg-red-500 transition-colors backdrop-blur-sm shadow-lg"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Detection Model - Fixed to Sprout */}
                  <div className="mb-4">
                    <p className="text-[10px] font-bold text-emerald-500/50 uppercase tracking-widest mb-1">
                      Using Sprout Detection AI
                    </p>
                  </div>

                  {/* Count Plants Button */}
                  <button
                    type="button"
                    onClick={handleCountPlants}
                    disabled={counting}
                    className={`w-full flex items-center justify-center space-x-2 px-4 py-3.5 rounded-xl font-bold transition-all border shadow-lg ${counting
                      ? 'bg-gray-800 border-gray-700 cursor-not-allowed text-gray-500'
                      : 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border-purple-500/30'
                      }`}
                  >
                    <span>{counting ? 'Counting Plants...' : 'Count Plants in Photo'}</span>
                  </button>

                  {/* Count Result with Annotated Image */}
                  {plantCount !== null && annotatedImageUrl && (
                    <div className="space-y-3 animate-fade-in">
                      <div className="relative rounded-xl overflow-hidden border border-emerald-500/20 bg-[#0E1015]">
                        <img
                          src={`${api.defaults.baseURL}${annotatedImageUrl}`}
                          alt="Detected plants"
                          className="w-full h-64 object-contain"
                        />
                        <div className="absolute top-3 right-3 bg-emerald-500/10 backdrop-blur-md text-emerald-400 px-4 py-2 rounded-xl shadow-[0_0_15px_rgba(52,211,153,0.1)] border border-emerald-500/30 flex flex-col items-center">
                          <div className="text-[10px] font-black uppercase tracking-wider mb-1">Count</div>
                          <div className="text-2xl font-black leading-none">{plantCount}</div>
                        </div>
                      </div>
                      <p className="text-xs font-bold text-emerald-500/50 uppercase tracking-widest text-center">Count added to notes</p>
                    </div>
                  )}

                  {/* Count Error */}
                  {countError && (
                    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                      <p className="text-sm font-medium text-red-400 flex items-center">
                        <span className="mr-2">⚠️</span> {countError}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-white/10 border-dashed rounded-2xl cursor-pointer bg-white/[0.02] hover:bg-white/[0.04] hover:border-emerald-500/30 transition-all group">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Camera className="w-12 h-12 text-gray-500 group-hover:text-emerald-400 group-hover:scale-110 transition-all mb-3" />
                    <p className="text-sm font-bold text-gray-400 group-hover:text-gray-300">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs font-medium text-gray-500 mt-2 uppercase tracking-widest">
                      PNG, JPG or WEBP (MAX. 10MB)
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handlePhotoChange}
                  />
                </label>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Any observations? (e.g., 'Leaves looking vibrant', 'Noticed some yellowing')"
                className="w-full p-5 border border-gray-100 dark:border-white/10 rounded-2xl bg-gray-50 dark:bg-[#0E1015] text-gray-900 dark:text-white focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 focus:outline-none resize-none font-medium placeholder-gray-400 dark:placeholder-gray-600 transition-all"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className={`w-full flex items-center justify-center space-x-3 px-8 py-5 font-black text-lg uppercase tracking-widest rounded-xl transition-all shadow-lg ${submitting
                ? 'bg-gray-800 cursor-not-allowed text-gray-500 border border-gray-700'
                : 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-1'
                }`}
            >
              <Save className="w-5 h-5" />
              <span>{submitting ? 'Submitting...' : 'Submit Log'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

