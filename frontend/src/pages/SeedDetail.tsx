import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
    const { t } = useTranslation();
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
                                <h1 className="text-3xl font-black text-gray-900 tracking-tight">{t(`seeds.${seed.seed_type}.name`, { defaultValue: seed.name })}</h1>
                                <p className="text-lg text-gray-400 font-medium italic mt-1">{seed.latin_name}</p>
                            </div>
                            <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${seed.difficulty === 'Easy' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                } shadow-sm`}>
                                {t(`common.difficulty.${seed.difficulty.toLowerCase()}`, { defaultValue: seed.difficulty })}
                            </span>
                        </div>

                        {/* Mocked Data for Visuals (User requested these fields) */}
                        <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                            <div>
                                <span className="text-gray-500 block">{t('seeds.labels.leaves_color')}</span>
                                <span className="font-semibold text-gray-900">{t(`seeds.traits.leaves_green_purple`)}</span>
                            </div>
                            <div>
                                <span className="text-gray-500 block">{t('seeds.labels.stem_color')}</span>
                                <span className="font-semibold text-gray-900">{t(`seeds.traits.stem_white_pink`)}</span>
                            </div>
                        </div>

                        {/* Taste */}
                        <div className="mb-10">
                            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">{t('seeds.taste_label')}</h3>
                            <div className="flex flex-wrap gap-3">
                                {(seed.taste || "Mild,Fresh").split(',').map((tag, i) => (
                                    <span key={i} className="bg-gray-50 text-gray-700 px-4 py-2 rounded-xl text-sm font-bold border border-gray-100 shadow-sm hover:scale-105 transition-transform cursor-default">
                                        {t(`seeds.tags.${tag.trim().toLowerCase()}`, { defaultValue: tag.trim() })}
                                    </span>
                                ))}
                            </div>
                        </div>


                        {/* Tray Size Selection */}
                        <div className="mb-10 p-6 bg-white border-2 border-green-100 rounded-3xl shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-gray-900">{t('seeds.labels.configure_growth')}</h3>
                                <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full uppercase">{t('seeds.labels.dynamic_scaling')}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { id: "10x20 inch", key: "10x20", area: 200 },
                                    { id: "10x10 inch", key: "10x10", area: 100 },
                                    { id: "5x5 inch", key: "5x5", area: 25 }
                                ].map((tray) => (
                                    <button
                                        key={tray.id}
                                        onClick={() => setSelectedTraySize(tray.id)}
                                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${selectedTraySize === tray.id
                                            ? "border-green-500 bg-green-50 shadow-md scale-[1.02]"
                                            : "border-gray-100 hover:border-green-200 bg-gray-50/50"
                                            }`}
                                    >
                                        <span className={`text-sm font-black ${selectedTraySize === tray.id ? "text-green-700" : "text-gray-900"}`}>
                                            {t(`seeds.trays.${tray.key}_label`)}
                                        </span>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">
                                            {tray.area} {t('seeds.trays.area_unit')}
                                        </span>
                                        <div className={`mt-1 px-2 py-0.5 rounded text-[10px] font-black ${selectedTraySize === tray.id ? "bg-green-200 text-green-700" : "bg-gray-200 text-gray-500"}`}>
                                            {(tray.area / 200).toFixed(2)}x
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
                                    {t('seeds.labels.timetable')}
                                </h3>
                                <GrowthSchedule seed={seed} />
                            </div>
                            <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Sprout className="w-4 h-4 text-green-500" />
                                    {t('seeds.labels.progression')}
                                </h3>
                                <TimelinePreview
                                    seed={seed}
                                    blackoutDays={seed.blackout_time_days || 3}
                                    harvestDays={seed.harvest_days || 10}
                                />
                            </div>
                        </div>

                        {/* Nutrition */}
                        <div className="mb-10">
                            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-3">{t('seeds.nutrition_label')}</h3>
                            <div className="text-gray-700 leading-relaxed bg-emerald-50/30 p-6 rounded-[2rem] border border-emerald-100/50 shadow-inner">
                                <p className="font-medium italic">
                                    "{t(`seeds.${seed.seed_type}.nutrition`, { defaultValue: seed.nutrition || "Rich in Vitamins A, B, C, E, and K." })}"
                                </p>
                            </div>
                        </div>

                        {/* Care Guide */}
                        {seed.care_instructions && (
                            <div className="mb-10 text-center sm:text-left">
                                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-3">{t('seeds.care_guide_label')}</h3>
                                <div className="text-gray-600 leading-relaxed bg-blue-50/30 p-6 rounded-[2rem] border border-blue-100/50 shadow-inner whitespace-pre-line font-medium">
                                    {t(`seeds.${seed.seed_type}.care`, { defaultValue: seed.care_instructions })}
                                </div>
                            </div>
                        )}

                        {/* Pros & Cons */}
                        {(seed.pros || seed.cons) && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-10">
                                {seed.pros && (
                                    <div className="group">
                                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center group-hover:text-emerald-500 transition-colors">
                                            <span className="bg-emerald-100 text-emerald-600 p-1.5 rounded-lg mr-2 text-xs">👍</span> {t('seeds.pros_label')}
                                        </h3>
                                        <div className="text-gray-600 bg-gray-50/50 p-5 rounded-3xl border border-gray-100 group-hover:bg-white group-hover:shadow-md transition-all font-medium">
                                            {t(`seeds.${seed.seed_type}.pros`, { defaultValue: seed.pros })}
                                        </div>
                                    </div>
                                )}
                                {seed.cons && (
                                    <div className="group">
                                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center group-hover:text-rose-500 transition-colors">
                                            <span className="bg-rose-100 text-rose-600 p-1.5 rounded-lg mr-2 text-xs">⚠️</span> {t('seeds.cons_label')}
                                        </h3>
                                        <div className="text-gray-600 bg-gray-50/50 p-5 rounded-3xl border border-gray-100 group-hover:bg-white group-hover:shadow-md transition-all font-medium">
                                            {t(`seeds.${seed.seed_type}.cons`, { defaultValue: seed.cons })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* External Links */}
                        {seed.external_links && seed.external_links.length > 0 && (
                            <div className="mb-8">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">{t('seeds.labels.resources')}</h3>
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
                            {t('seeds.labels.start_growing', { name: t(`seeds.${seed.seed_type}.name`, { defaultValue: seed.name }) })}
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
        </div>
    );
}
