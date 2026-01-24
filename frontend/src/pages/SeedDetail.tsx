import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { seedsApi, type Seed } from '../services/api';
import { ArrowLeft, Zap, Sprout } from 'lucide-react';
import PlantImage from '../components/PlantImage';
import GrowWizard from '../components/GrowWizard';
import GrowingLoader from '../components/GrowingLoader';
import CultivationCards from '../components/CultivationCards';
import GrowthRoadmap from '../components/GrowthRoadmap';
import GrowthSchedule from '../components/GrowthSchedule';
import TimelinePreview from '../components/TimelinePreview';

export default function SeedDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [seed, setSeed] = useState<Seed | null>(null);
    const [loading, setLoading] = useState(true);
    const [showWizard, setShowWizard] = useState(false);
    const [selectedTraySize, setSelectedTraySize] = useState("10x20 inch");

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


                    {/* Tray Size Selection */}
                    <div className="mb-10 p-6 bg-white border-2 border-green-100 rounded-3xl shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Configure Growth</h3>
                            <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full uppercase">Dynamic Scaling</span>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { id: "10x20 inch", label: "10x20\"", area: "200 in²", mult: "1.0x" },
                                { id: "10x10 inch", label: "10x10\"", area: "100 in²", mult: "0.5x" },
                                { id: "5x5 inch", label: "5x5\"", area: "25 in²", mult: "0.125x" }
                            ].map((tray) => (
                                <button
                                    key={tray.id}
                                    onClick={() => setSelectedTraySize(tray.id)}
                                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${selectedTraySize === tray.id
                                        ? "border-green-500 bg-green-50 shadow-md scale-[1.02]"
                                        : "border-gray-100 hover:border-green-200 bg-gray-50/50"
                                        }`}
                                >
                                    <span className={`text-sm font-black ${selectedTraySize === tray.id ? "text-green-700" : "text-gray-900"}`}>{tray.label}</span>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">{tray.area}</span>
                                    <div className={`mt-1 px-2 py-0.5 rounded text-[10px] font-black ${selectedTraySize === tray.id ? "bg-green-200 text-green-700" : "bg-gray-200 text-gray-500"}`}>
                                        {tray.mult}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Growth Roadmap */}
                    <GrowthRoadmap
                        soakingHours={seed.soaking_duration_hours || 0}
                        blackoutDays={seed.blackout_time_days || 0}
                        harvestDays={seed.harvest_days || 10}
                    />

                    {/* Cultivation & Yield Cards - Replaced with Component */}
                    <CultivationCards seed={seed} traySize={selectedTraySize} />

                    {/* Timeline & Schedule - User requested on Seed Page */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Zap className="w-4 h-4 text-green-500" />
                                Growth Timetable
                            </h3>
                            <GrowthSchedule seed={seed} />
                        </div>
                        <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Sprout className="w-4 h-4 text-green-500" />
                                Progression
                            </h3>
                            <TimelinePreview
                                seed={seed}
                                blackoutDays={seed.blackout_time_days || 3}
                                harvestDays={seed.harvest_days || 10}
                            />
                        </div>
                    </div>

                    {/* Nutrition */}
                    <div className="mb-8">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Nutrition Benefits</h3>
                        <p className="text-gray-600 leading-relaxed bg-green-50/50 p-4 rounded-xl border border-green-100/50">
                            {seed.nutrition || "Rich in Vitamins A, B, C, E, and K. High in Calcium, Iron, Magnesium, Phosphorus, Potassium, Zinc."}
                        </p>
                    </div>

                    {/* Care Guide */}
                    {seed.care_instructions && (
                        <div className="mb-8">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Detailed Care Guide</h3>
                            <div className="text-gray-600 leading-relaxed bg-blue-50/50 p-4 rounded-xl border border-blue-100/50 whitespace-pre-line">
                                {seed.care_instructions}
                            </div>
                        </div>
                    )}

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
                    initialTraySize={selectedTraySize}
                    onClose={() => setShowWizard(false)}
                />
            )}
        </div>
    );
}
