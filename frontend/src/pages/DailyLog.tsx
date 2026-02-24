import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cropsApi, logsApi, type Crop } from '../services/api';
import api from '../services/api';
import { ArrowLeft, Camera, Droplet, Thermometer, CloudRain, Save } from 'lucide-react';

export default function DailyLog() {
  const { cropId, day } = useParams<{ cropId: string; day: string }>();
  const navigate = useNavigate();

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

      // Submit log data
      await logsApi.create(parseInt(cropId), {
        day_number: parseInt(day),
        watered,
        temperature,
        humidity,
        notes: notes || undefined,
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500"></div>
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
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <button
          onClick={() => navigate(`/dashboard/${cropId}`)}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Dashboard
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isBackLogging ? `Back-log: Day ${day}` : `Log Day ${day}`}
            </h1>
            <p className="text-gray-600">
              {crop.seed.name} - {parseInt(day!) <= blackoutDays ? 'Blackout Phase' : 'Light Phase'}
            </p>
          </div>

          {isBackLogging && (
            <div className="mb-8 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Save className="h-5 w-5 text-amber-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-amber-700 font-medium">
                    You are logging data for a past day.
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    This will update the historical record and re-calculate yield predictions for this crop.
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Watering */}
            <div>
              <label className="flex items-center text-lg font-semibold text-gray-900 mb-4">
                <Droplet className="w-6 h-6 mr-2 text-blue-600" />
                Did you water the plants today?
              </label>
              <div className="flex space-x-4 mb-6">
                <button
                  type="button"
                  onClick={() => setWatered(true)}
                  className={`flex-1 p-4 rounded-lg border-2 font-semibold transition-all ${watered
                    ? 'border-green-500 bg-green-50 text-green-900 shadow-sm'
                    : 'border-gray-300 text-gray-700 hover:border-green-300'
                    }`}
                >
                  ✓ Yes, I watered
                </button>
                <button
                  type="button"
                  onClick={() => setWatered(false)}
                  className={`flex-1 p-4 rounded-lg border-2 font-semibold transition-all ${!watered
                    ? 'border-red-600 bg-red-50 text-red-900'
                    : 'border-gray-300 text-gray-700 hover:border-red-400'
                    }`}
                >
                  ✗ No, I didn't
                </button>
              </div>

              {!watered && (
                <div className="p-3 bg-yellow-50 text-yellow-800 rounded-lg text-sm mb-6">
                  Note: Consistent watering is key to yield. Only skip if soil is still moist.
                </div>
              )}
            </div>

            {/* Conditional Temp/Hum Display */}
            <div className={`transition-all duration-500 ${watered ? 'opacity-100' : 'opacity-80'}`}>
              {watered && (
                <div className="mb-4 text-sm font-semibold text-blue-800 bg-blue-50 p-2 rounded animate-pulse">
                  💧 Since you watered, please log the current conditions for accurate AI prediction!
                </div>
              )}
              {/* Temperature */}
              <div>
                <label className="flex items-center justify-between text-lg font-semibold text-gray-900 mb-3">
                  <span className="flex items-center">
                    <Thermometer className="w-6 h-6 mr-2 text-orange-600" />
                    Temperature
                  </span>
                  <span className={`text-3xl font-bold ${getTempColor()}`}>
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
                  className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />

                <div className="flex justify-between text-xs text-gray-600 mt-2">
                  <span>15°C</span>
                  <span className="font-medium">
                    Ideal: {crop.seed.ideal_temp ?? '--'}°C
                  </span>
                  <span>35°C</span>
                </div>

                {crop.seed.ideal_temp && Math.abs(temperature - crop.seed.ideal_temp) > 3 && (
                  <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      ⚠️ Temperature is outside the ideal range. This may affect yield.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Humidity */}
            <div>
              <label className="flex items-center justify-between text-lg font-semibold text-gray-900 mb-3">
                <span className="flex items-center">
                  <CloudRain className="w-6 h-6 mr-2 text-blue-600" />
                  Humidity
                </span>
                <span className={`text-3xl font-bold ${getHumidityColor()}`}>
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
                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />

              <div className="flex justify-between text-xs text-gray-600 mt-2">
                <span>25%</span>
                <span className="font-medium">
                  Ideal: {crop.seed.ideal_humidity ?? '--'}%
                </span>
                <span>85%</span>
              </div>

              {crop.seed.ideal_humidity && Math.abs(humidity - crop.seed.ideal_humidity) > 15 && (
                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Humidity is outside the ideal range. Adjust ventilation or misting.
                  </p>
                </div>
              )}
            </div>

            {/* Photo Upload */}
            <div>
              <label className="flex items-center text-lg font-semibold text-gray-900 mb-3">
                <Camera className="w-6 h-6 mr-2 text-purple-600" />
                Photo (Optional)
              </label>

              {photoPreview ? (
                <div className="space-y-4">
                  <div className="relative">
                    {/* <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-full rounded-lg shadow-md"
                    /> */}
                    <div className="w-full h-48 bg-gray-100 flex items-center justify-center rounded-lg text-gray-500">
                      Image Selected (Hidden)
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPhoto(null);
                        setPhotoPreview(null);
                        setPlantCount(null);
                        setCountError(null);
                        setAnnotatedImageUrl(null);
                      }}
                      className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-2 hover:bg-red-700 transition-colors"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Count Plants Button */}
                  <button
                    type="button"
                    onClick={handleCountPlants}
                    disabled={counting}
                    className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-semibold transition-all ${counting
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg'
                      }`}
                  >
                    <span>{counting ? 'Counting Plants...' : 'Count Plants in Photo'}</span>
                  </button>

                  {/* Count Result with Annotated Image */}
                  {plantCount !== null && annotatedImageUrl && (
                    <div className="space-y-3">
                      <div className="relative rounded-lg overflow-hidden border-2 border-green-200 bg-gray-900">
                        <img
                          src={`${api.defaults.baseURL}${annotatedImageUrl}`}
                          alt="Detected plants"
                          className="w-full h-64 object-contain"
                        />
                        <div className="absolute top-3 right-3 bg-green-600/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg shadow-lg border border-green-400">
                          <div className="text-[10px] font-bold uppercase tracking-wider">Count</div>
                          <div className="text-xl font-bold leading-none">{plantCount}</div>
                        </div>
                      </div>
                      <p className="text-xs text-green-700 text-center">Count added to notes</p>
                    </div>
                  )}

                  {/* Count Error */}
                  {countError && (
                    <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                      <p className="text-sm text-red-800">{countError}</p>
                    </div>
                  )}
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Camera className="w-12 h-12 text-gray-400 mb-3" />
                    <p className="text-sm text-gray-600 font-medium">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
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
              <label className="block text-lg font-semibold text-gray-900 mb-3">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Any observations? (e.g., 'Leaves looking vibrant', 'Noticed some yellowing')"
                className="w-full p-4 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none resize-none"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className={`w-full flex items-center justify-center space-x-3 px-8 py-4 font-bold text-lg rounded-xl shadow-lg transition-all ${submitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600 text-white hover:shadow-xl transform hover:scale-105 shadow-green-100'
                }`}
            >
              <Save className="w-6 h-6" />
              <span>{submitting ? 'Submitting...' : 'Submit Log & Get Prediction'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

