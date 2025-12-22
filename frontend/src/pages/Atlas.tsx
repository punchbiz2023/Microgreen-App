import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { seedsApi, type Seed } from '../services/api';
import { TrendingUp, Calendar, Info } from 'lucide-react';
import GrowWizard from '../components/GrowWizard';
import PlantImage from '../components/PlantImage';

import GrowingLoader from '../components/GrowingLoader';

export default function Atlas() {
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
        <h2 className="text-3xl font-extrabold text-gray-900 mb-3 tracking-tight">
          Seed Atlas
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Explore our curated collection of premium microgreen seeds.
        </p>
      </div>

      {/* Seeds Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
        {seeds.map((seed) => (
          <div
            key={seed.id}
            className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer border border-gray-100 flex flex-col"
            onClick={() => navigate(`/atlas/${seed.id}`)}
          >
            {/* Image Section */}
            <div className="relative h-48">
              <PlantImage seedName={seed.name} className="w-full h-full" />
              <div className="absolute top-4 right-4">
                <span className={`px-3 py-1.5 text-xs font-bold rounded-full backdrop-blur-md shadow-sm ${seed.difficulty === 'Easy'
                  ? 'bg-green-500/90 text-white'
                  : 'bg-yellow-500/90 text-white'
                  }`}>
                  {seed.difficulty}
                </span>
              </div>
            </div>

            <div className="p-6 flex-1 flex flex-col">
              <div className="mb-4">
                <h3 className="text-2xl font-bold text-gray-900 group-hover:text-green-700 transition-colors">{seed.name}</h3>
                <p className="text-sm text-gray-500 italic font-serif opacity-80">{seed.latin_name}</p>
              </div>

              <p className="text-gray-600 text-sm mb-6 line-clamp-2 flex-grow">
                {seed.description}
              </p>

              {/* Stats Grid */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-sm text-gray-700 border-b border-gray-100 pb-2">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-green-600" />
                    <span>Harvest</span>
                  </div>
                  <span className="font-semibold">{seed.harvest_days || seed.growth_days} days</span>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-700 border-b border-gray-100 pb-2">
                  <div className="flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2 text-green-600" />
                    <span>Avg. Yield</span>
                  </div>
                  <span className="font-semibold">~{seed.avg_yield_grams}g</span>
                </div>

                <div className="flex items-center pt-1 text-xs text-gray-500">
                  <Info className="w-4 h-4 mr-2 text-blue-500 flex-shrink-0" />
                  <span className="line-clamp-1">{seed.care_instructions || 'Follow standard care'}</span>
                </div>
              </div>

              <button
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center mt-auto shadow-md hover:shadow-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedSeed(seed);
                }}
              >
                Grow {seed.name}
              </button>
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
