import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, AlertTriangle, Sprout, Calendar, Droplets, ThermometerSun, Maximize, X } from 'lucide-react';

interface Seed {
  id: number;
  seed_type: string;
  name: string;
  difficulty: string;
  avg_yield_grams: number;
  growth_days: number;
  ideal_temp: number;
  ideal_humidity: number;
  description?: string;
}

export default function AtlasSimple() {
  const [seeds, setSeeds] = useState<Seed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSeed, setSelectedSeed] = useState<Seed | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Customization options
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [wateringFrequency, setWateringFrequency] = useState(2);
  const [traySize, setTraySize] = useState('10x20 inch');
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    loadSeeds();
  }, []);

  const loadSeeds = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/seeds');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setSeeds(data);
    } catch (error) {
      console.error('Failed to load seeds:', error);
      setError('Failed to load seeds. Make sure backend is running on port 8000.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#0E1015]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
          <div className="text-emerald-500 font-bold tracking-widest uppercase">Loading seeds...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#0E1015] p-6">
        <div className="bg-[#1A1D27] p-10 rounded-[2rem] border border-rose-500/20 shadow-[0_0_30px_rgba(244,63,94,0.1)] max-w-lg text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-orange-500"></div>
          <AlertTriangle className="w-16 h-16 text-rose-500 mx-auto mb-6 opacity-80" />
          <div className="text-xl text-rose-400 font-bold mb-8">{error}</div>
          <button
            onClick={loadSeeds}
            className="px-8 py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl font-bold transition-all uppercase tracking-widest text-sm"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 bg-[#0E1015] font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-32 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none"></div>
          <div className="inline-flex items-center justify-center p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 shadow-[0_0_20px_rgba(52,211,153,0.1)] mb-6">
            <Leaf className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-6 tracking-tight drop-shadow-lg">
            Microgreens <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">Atlas</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto font-medium">
            Choose your seeds and start growing with AI-powered guidance
          </p>
        </div>

        {/* Seeds Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {seeds.map((seed) => (
            <div
              key={seed.id}
              className="bg-[#1A1D27] rounded-[2rem] border border-white/5 shadow-xl overflow-hidden group hover:-translate-y-2 hover:border-emerald-500/30 hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.2)] transition-all duration-300 cursor-pointer flex flex-col"
              onClick={() => {
                setSelectedSeed(seed);
                setShowModal(true);
              }}
            >
              <div className="h-48 relative overflow-hidden bg-[#0E1015] flex items-center justify-center border-b border-white/5">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 group-hover:opacity-100 opacity-50 transition-opacity"></div>
                <Sprout className="w-20 h-20 text-emerald-500/40 group-hover:text-emerald-400 group-hover:scale-110 transition-all duration-500" />
              </div>

              {/* Content */}
              <div className="p-8 flex-grow flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-2xl font-black text-white leading-tight">
                    {seed.name}
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${seed.difficulty.toLowerCase() === 'easy' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      seed.difficulty.toLowerCase() === 'medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}>
                    {seed.difficulty}
                  </span>
                </div>

                <p className="text-gray-400 text-sm mb-6 flex-grow line-clamp-3">
                  {seed.description || "A wonderful variety of microgreens to grow at home."}
                </p>

                <div className="space-y-3 mb-8">
                  <div className="flex items-center text-sm bg-[#0E1015] p-3 rounded-xl border border-white/5">
                    <span className="text-emerald-500 mr-3"><Sprout className="w-4 h-4" /></span>
                    <span className="text-gray-300">Avg Yield: <span className="font-bold text-white">{seed.avg_yield_grams}g</span></span>
                  </div>
                  <div className="flex items-center text-sm bg-[#0E1015] p-3 rounded-xl border border-white/5">
                    <span className="text-blue-400 mr-3"><Calendar className="w-4 h-4" /></span>
                    <span className="text-gray-300">Growth: <span className="font-bold text-white">{seed.growth_days} days</span></span>
                  </div>
                  <div className="flex items-center text-sm bg-[#0E1015] p-3 rounded-xl border border-white/5">
                    <span className="text-orange-400 mr-3"><ThermometerSun className="w-4 h-4" /></span>
                    <span className="text-gray-300 text-xs">Ideal: <span className="font-bold text-white">{seed.ideal_temp}°C, {seed.ideal_humidity}%</span></span>
                  </div>
                </div>

                <button
                  className="w-full py-4 bg-white/5 hover:bg-emerald-500 group-hover:bg-emerald-500 text-white border border-white/10 group-hover:border-emerald-400/50 rounded-xl font-black text-sm uppercase tracking-widest transition-all shadow-inner relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Start Growing
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {seeds.length === 0 && !loading && (
          <div className="text-center py-20 text-gray-500 text-lg border-2 border-dashed border-white/5 rounded-[2rem]">
            No seeds available. Backend may not be running.
          </div>
        )}
      </div>

      {/* Customization Modal */}
      {showModal && selectedSeed && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 font-sans">
          <div className="bg-[#1A1D27] rounded-[2rem] border border-white/10 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#0E1015]/50">
              <h2 className="text-2xl font-black text-white flex items-center gap-3">
                <Leaf className="w-6 h-6 text-emerald-400" />
                Setup {selectedSeed.name}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedSeed(null);
                }}
                className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 overflow-y-auto custom-scrollbar flex-grow space-y-8">
              {/* Watering Frequency */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-300 tracking-widest uppercase mb-4">
                  <Droplets className="w-4 h-4 text-blue-400" />
                  Watering Commitment
                </label>

                <div className="space-y-3">
                  <button
                    onClick={() => setWateringFrequency(1)}
                    className={`w-full p-4 rounded-2xl border text-left transition-all ${wateringFrequency === 1
                        ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                        : 'bg-[#0E1015] border-white/5 hover:border-white/20 text-gray-400'
                      }`}
                  >
                    <div className={`font-black mb-1 ${wateringFrequency === 1 ? 'text-emerald-400' : 'text-white'}`}>Once Daily</div>
                    <div className="text-sm opacity-80">Light misting in the morning</div>
                  </button>

                  <button
                    onClick={() => setWateringFrequency(2)}
                    className={`w-full p-4 rounded-2xl border text-left transition-all ${wateringFrequency === 2
                        ? 'bg-blue-500/10 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                        : 'bg-[#0E1015] border-white/5 hover:border-white/20 text-gray-400'
                      }`}
                  >
                    <div className={`font-black mb-1 ${wateringFrequency === 2 ? 'text-blue-400' : 'text-white'}`}>Twice Daily</div>
                    <div className="text-sm opacity-80">Morning and evening misting (Recommended)</div>
                  </button>
                </div>
              </div>

              {/* Start Date */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-300 tracking-widest uppercase mb-4">
                  <Calendar className="w-4 h-4 text-purple-400" />
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-[#0E1015] border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all font-medium"
                  style={{ colorScheme: 'dark' }}
                />
                <p className="text-xs font-medium text-gray-500 mt-3">
                  Select today or a past date if you already started soaking/sowing.
                </p>
              </div>

              {/* Tray Size */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-300 tracking-widest uppercase mb-4">
                  <Maximize className="w-4 h-4 text-orange-400" />
                  Tray Size
                </label>
                <input
                  type="text"
                  value={traySize}
                  onChange={(e) => setTraySize(e.target.value)}
                  placeholder="e.g., 10x20 inch"
                  className="w-full bg-[#0E1015] border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-gray-600 font-medium"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-white/5 bg-[#0E1015]/50 flex gap-4">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedSeed(null);
                }}
                disabled={submitting}
                className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold uppercase tracking-widest transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed border border-white/10"
              >
                Cancel
              </button>

              <button
                onClick={async () => {
                  setSubmitting(true);
                  try {
                    const response = await fetch('http://localhost:8000/api/crops', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        seed_id: selectedSeed.id,
                        start_date: startDate,
                        watering_frequency: wateringFrequency,
                        tray_size: traySize
                      })
                    });

                    if (!response.ok) throw new Error('Failed to create crop');

                    const data = await response.json();
                    navigate(`/dashboard/${data.id}`);
                  } catch (error) {
                    console.error('Failed to create crop:', error);
                    alert('Failed to create crop. Please try again.');
                  } finally {
                    setSubmitting(false);
                  }
                }}
                disabled={submitting}
                className="flex-[2] py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-xl font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] text-sm disabled:opacity-50 disabled:cursor-not-allowed border border-emerald-400/50 relative overflow-hidden"
              >
                <div className="relative z-10">
                  {submitting ? 'Creating...' : 'Confirm & Start'}
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

