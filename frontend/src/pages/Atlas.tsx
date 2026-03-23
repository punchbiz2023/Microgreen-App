import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { seedsApi, type Seed } from '../services/api';
import { TrendingUp, Calendar, Info } from 'lucide-react';
import GrowWizard from '../components/GrowWizard';
import PlantImage from '../components/PlantImage';

import GrowingLoader from '../components/GrowingLoader';

export default function Atlas() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [seeds, setSeeds] = useState<Seed[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeed, setSelectedSeed] = useState<Seed | null>(null);

  useEffect(() => {
    loadSeeds();
  }, []);

  const loadSeeds = async () => {
    try {
      const response = await seedsApi.getAll();
      setSeeds(response.data);
    } catch (error) {
      console.error('Failed to load seeds:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <GrowingLoader />;
  }

  return (
    <div className="py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-3 tracking-tight uppercase">
          {t('atlas.title', { defaultValue: 'Seed Atlas' })}
        </h2>
        <p className="text-lg font-medium text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
          {t('atlas.subtitle', { defaultValue: 'Discover and plan your next crop.' })}
        </p>

        {/* Growth Category Filter/Legend */}
        <div className="flex flex-wrap justify-center gap-2 mt-6">
          {["Fast", "Slow Veg", "Slow Herb"].map(cat => (
            <span key={cat} className="px-3 py-1 bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-widest rounded-full border border-gray-100 dark:border-white/5">
              {t(`atlas.categories.${cat}`, { defaultValue: cat })}
            </span>
          ))}
        </div>
      </div>

      {/* Seeds Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
        {seeds.map((seed) => (
          <div
            key={seed.id}
            className="group bg-white dark:bg-[#1A1D27] border border-gray-100 dark:border-white/5 rounded-3xl shadow-sm hover:shadow-2xl hover:shadow-emerald-500/10 hover:border-emerald-500/20 hover:-translate-y-2 transition-all duration-500 overflow-hidden cursor-pointer flex flex-col"
            onClick={() => navigate(`/atlas/${seed.id}`)}
          >
            {/* Image Section */}
            <div className="relative h-48">
              <PlantImage seedName={seed.name} className="w-full h-full" />

              {/* Badges Stack */}
              <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
                <span className={`px-3 py-1.5 text-xs font-bold rounded-full backdrop-blur-md shadow-sm border border-white/20 ${seed.difficulty === 'Easy'
                  ? 'bg-emerald-500/80 text-white'
                  : 'bg-amber-500/80 text-white'
                  }`}>
                  {seed.difficulty}
                </span>

                {seed.growth_category && (
                  <span className="px-3 py-1 bg-black/60 border border-white/10 text-white text-[10px] font-bold backdrop-blur-md rounded-full shadow-lg">
                    {t(`atlas.categories.${seed.growth_category}`, { defaultValue: seed.growth_category })}
                  </span>
                )}
              </div>
            </div>

            <div className="p-6 flex-1 flex flex-col relative">
              <div className="mb-4">
                <h3 className="text-xl font-black text-gray-900 dark:text-white group-hover:text-emerald-500 transition-colors leading-tight tracking-tight">{t(`seeds.${seed.seed_type}.name`, { defaultValue: seed.name })}</h3>
                <p className="text-sm text-gray-500 font-medium italic mt-1">{seed.latin_name}</p>
              </div>

              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 line-clamp-2 flex-grow leading-relaxed font-medium">
                {t(`seeds.${seed.seed_type}.description`, { defaultValue: seed.description })}
              </p>

              {/* Stats Grid */}
              <div className="space-y-3 mb-6 bg-gray-50 dark:bg-[#0E1015] p-5 rounded-2xl border border-gray-100 dark:border-white/5">
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-white/5 pb-2">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-emerald-500" />
                    <span className="font-bold">{t('atlas.harvest', { defaultValue: 'Harvest Time' })}</span>
                  </div>
                  <span className="font-black text-gray-900 dark:text-white">{seed.harvest_days || seed.growth_days} {t('common.days', { defaultValue: 'Days' })}</span>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-white/5 pb-2">
                  <div className="flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2 text-emerald-600 dark:text-emerald-500" />
                    <span className="font-bold">{t('atlas.avg_yield', { defaultValue: 'Est. Yield' })}</span>
                  </div>
                  <span className="font-black text-gray-900 dark:text-white">~{seed.avg_yield_grams}g</span>
                </div>

                <div className="flex items-center pt-1 text-[11px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">
                  <Info className="w-3.5 h-3.5 mr-2 text-teal-500 flex-shrink-0" />
                  <span className="line-clamp-1">{seed.care_instructions || t('atlas.standard_care', { defaultValue: 'Standard care protocol' })}</span>
                </div>
              </div>

              <div className="mt-auto">

                <button
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:-translate-y-0.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSeed(seed);
                  }}
                >
                  {t('atlas.grow', { defaultValue: 'Grow' })} {t(`seeds.${seed.seed_type}.name`, { defaultValue: seed.name })}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Wizard */}
      {selectedSeed && (
        <GrowWizard
          seed={selectedSeed}
          onClose={() => setSelectedSeed(null)}
        />
      )}
    </div>
  );
}
