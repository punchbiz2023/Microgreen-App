import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { seedsApi, type Seed } from '../services/api';
import { Sprout, Droplet, Thermometer, Clock, Sun, Moon, ArrowLeft } from 'lucide-react';
import PlantImage from '../components/PlantImage';
import GrowWizard from '../components/GrowWizard';
import GrowingLoader from '../components/GrowingLoader';

export default function SeedDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [seed, setSeed] = useState<Seed | null>(null);
    const [loading, setLoading] = useState(true);
    const [showWizard, setShowWizard] = useState(false);

    useEffect(() => {
        if (id) loadSeed(Number(id));
    }, [id]);

    const loadSeed = async (seedId: number) => {
        try {
            const response = await seedsApi.getById(seedId);
            setSeed(response.data);
        } catch (error) {
            console.error('Failed to load seed:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !seed) {
        return <GrowingLoader />;
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Hero Image */}
            <div className="relative h-64 sm:h-80">
                <PlantImage seedName={seed.name} className="w-full h-full" />
                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-4 left-4 bg-white/80 p-2 rounded-full shadow-md hover:bg-white transition-colors"
                >
                    <ArrowLeft className="w-6 h-6 text-gray-800" />
                </button>
            </div>

            <div className="max-w-3xl mx-auto -mt-10 relative px-4 sm:px-6">
                <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8">
                    {/* Header */}
                    <div className="mb-8 border-b border-gray-100 pb-6">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">{seed.name}</h1>
                                <p className="text-lg text-gray-500 italic">{seed.latin_name}</p>
                            </div>
                            <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${seed.difficulty === 'Easy' ? 'bg-green-50 text-green-500' : 'bg-yellow-50 text-yellow-600'
                                }`}>
                                {seed.difficulty}
                            </span>
                        </div>

                        {/* Mocked Data for Visuals (User requested these fields) */}
                        <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                            <div>
                                <span className="text-gray-500 block">Leaves Color</span>
                                <span className="font-semibold text-gray-900">Green / Purple</span>
                            </div>
                            <div>
                                <span className="text-gray-500 block">Stem Color</span>
                                <span className="font-semibold text-gray-900">White / Pink</span>
                            </div>
                        </div>
                    </div>

                    {/* Taste */}
                    <div className="mb-8">
                        <h3 className="text-lg font-bold text-gray-900 mb-3">Taste</h3>
                        <div className="flex flex-wrap gap-2">
                            {(seed.taste || "Mild,Fresh").split(',').map((tag, i) => (
                                <span key={i} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm font-medium">
                                    {tag.trim()}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Care Instructions */}
                    <div className="mb-8">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Care Instructions</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-blue-50 p-4 rounded-xl text-center">
                                <Droplet className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                                <span className="block text-xs text-gray-500 uppercase font-bold">Watering</span>
                                <span className="font-semibold text-gray-900">{seed.watering_req || 'Standard'}</span>
                            </div>
                            <div className="bg-purple-50 p-4 rounded-xl text-center">
                                <Clock className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                                <span className="block text-xs text-gray-500 uppercase font-bold">Soaking</span>
                                <span className="font-semibold text-gray-900">
                                    {seed.soaking_duration_hours ? `${seed.soaking_duration_hours}h` : 'No'}
                                </span>
                            </div>
                            <div className="bg-orange-50 p-4 rounded-xl text-center">
                                <Thermometer className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                                <span className="block text-xs text-gray-500 uppercase font-bold">Low Temp</span>
                                <span className="font-semibold text-gray-900">No</span>
                            </div>
                        </div>
                    </div>

                    {/* Growing Cycle */}
                    <div className="mb-8">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Growing Cycle</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                                <div className="flex items-center text-gray-700">
                                    <Sprout className="w-5 h-5 mr-3 text-green-500" />
                                    Growing Time
                                </div>
                                <span className="font-bold text-gray-900">{seed.growth_days} - {seed.harvest_days || seed.growth_days + 2} days</span>
                            </div>
                            <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                                <div className="flex items-center text-gray-700">
                                    <Moon className="w-5 h-5 mr-3 text-gray-800" />
                                    Blackout Time
                                </div>
                                <span className="font-bold text-gray-900">{seed.blackout_time_days || 3} - {(seed.blackout_time_days || 3) + 1} days</span>
                            </div>
                            <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                                <div className="flex items-center text-gray-700">
                                    <Sun className="w-5 h-5 mr-3 text-yellow-500" />
                                    Light Time
                                </div>
                                <span className="font-bold text-gray-900">
                                    {(seed.growth_days || 14) - (seed.blackout_time_days || 3)} days
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center text-gray-700">
                                    <span className="w-5 h-5 mr-3 font-bold text-center text-gray-400">#</span>
                                    Seed Count
                                </div>
                                <span className="font-bold text-gray-900">{seed.seed_count_per_gram || '300'}/g</span>
                            </div>
                        </div>
                    </div>

                    {/* Nutrition */}
                    <div className="mb-8">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Nutrition Benefits</h3>
                        <p className="text-gray-600 leading-relaxed bg-green-50/50 p-4 rounded-xl border border-green-100/50">
                            {seed.nutrition || "Rich in Vitamins A, B, C, E, and K. High in Calcium, Iron, Magnesium, Phosphorus, Potassium, Zinc."}
                        </p>
                    </div>

                    {/* Pros & Cons */}
                    {(seed.pros || seed.cons) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                            {seed.pros && (
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center">
                                        <span className="bg-green-50 text-green-500 p-1 rounded-lg mr-2">👍</span> Suitable For
                                    </h3>
                                    <p className="text-gray-600 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        {seed.pros}
                                    </p>
                                </div>
                            )}
                            {seed.cons && (
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center">
                                        <span className="bg-red-100 text-red-600 p-1 rounded-lg mr-2">⚠️</span> Cons
                                    </h3>
                                    <p className="text-gray-600 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        {seed.cons}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* External Links */}
                    {seed.external_links && seed.external_links.length > 0 && (
                        <div className="mb-8">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Resources</h3>
                            <div className="space-y-2">
                                {seed.external_links.map((link, i) => (
                                    <a
                                        key={i}
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block bg-gray-50 hover:bg-gray-100 p-4 rounded-xl border border-gray-100 transition-colors flex items-center justify-between"
                                    >
                                        <span className="font-semibold text-gray-900">{link.desc || link.url}</span>
                                        <span className="text-gray-400">↗</span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="h-4"></div>
                </div>
            </div>

            {/* Floating Grow Button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 z-40">
                <div className="max-w-3xl mx-auto">
                    <button
                        onClick={() => setShowWizard(true)}
                        className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl shadow-lg transition-transform active:scale-[0.98] text-lg shadow-green-100"
                    >
                        Start Growing {seed.name}
                    </button>
                </div>
            </div>

            {/* Wizard Modal */}
            {showWizard && (
                <GrowWizard
                    seed={seed}
                    onClose={() => setShowWizard(false)}
                />
            )}
        </div>
    );
}
