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
        <div className="py-8 pb-32">
            {/* Hero Image */}
            <div className="relative h-64 sm:h-80 rounded-[2rem] overflow-hidden mb-8 border border-white/5 shadow-xl">
                <PlantImage seedName={seed.name} className="w-full h-full object-cover opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/40 dark:from-[#0E1015] to-transparent"></div>
                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-6 left-6 bg-white/80 dark:bg-[#0E1015]/80 p-3 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.1)] dark:shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:bg-gray-50 dark:hover:bg-[#1A1D27] hover:text-emerald-500 transition-colors border border-gray-100 dark:border-white/10 backdrop-blur-md"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-300" />
                </button>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 -mt-20">
                <div className="bg-white dark:bg-[#1A1D27] rounded-[2rem] shadow-2xl p-8 sm:p-12 border border-gray-100 dark:border-white/5 relative overflow-hidden">
                    {/* Subtle background glow */}
                    <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/10 blur-3xl rounded-full"></div>

                    {/* Header */}
                    <div className="mb-10 border-b border-gray-100 dark:border-white/5 pb-8 relative z-10">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
                            <div>
                                <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">{t(`seeds.${seed.seed_type}.name`, { defaultValue: seed.name })}</h1>
                                <p className="text-lg text-emerald-600 dark:text-emerald-500/70 font-bold italic mt-2">{seed.latin_name}</p>
                            </div>
                            <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border shadow-[0_0_10px_rgba(0,0,0,0.2)] ${seed.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                }`}>
                                {t(`common.difficulty.${seed.difficulty.toLowerCase()}`, { defaultValue: seed.difficulty })}
                            </span>
                        </div>

                        {/* Mocked Data for Visuals (User requested these fields) */}
                        <div className="grid grid-cols-2 gap-6 mt-6">
                            <div className="bg-gray-50 dark:bg-[#0E1015] p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                                <span className="text-emerald-600 dark:text-emerald-500/80 text-xs font-bold uppercase tracking-widest block mb-1">{t('seeds.labels.leaves_color')}</span>
                                <span className="font-bold text-gray-900 dark:text-white capitalize">{t(`seeds.traits.leaves_green_purple`)}</span>
                            </div>
                            <div className="bg-gray-50 dark:bg-[#0E1015] p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                                <span className="text-emerald-600 dark:text-emerald-500/80 text-xs font-bold uppercase tracking-widest block mb-1">{t('seeds.labels.stem_color')}</span>
                                <span className="font-bold text-gray-900 dark:text-white capitalize">{t(`seeds.traits.stem_white_pink`)}</span>
                            </div>
                        </div>

                        {/* Taste */}
                        <div className="mt-8">
                            <h3 className="text-xs font-black text-emerald-600 dark:text-emerald-500/80 uppercase tracking-widest mb-4">{t('seeds.taste_label')}</h3>
                            <div className="flex flex-wrap gap-2">
                                {(seed.taste || "Mild,Fresh").split(',').map((tag, i) => (
                                    <span key={i} className="bg-gray-50 dark:bg-[#0E1015] text-gray-600 dark:text-gray-300 px-4 py-2 rounded-xl text-xs font-bold border border-gray-100 dark:border-white/10 hover:border-emerald-500/30 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-default shadow-sm">
                                        {t(`seeds.tags.${tag.trim().toLowerCase()}`, { defaultValue: tag.trim() })}
                                    </span>
                                ))}
                            </div>
                        </div>


                        {/* Tray Size Selection */}
                        <div className="mb-12 p-8 bg-gray-50 dark:bg-[#0E1015] border border-gray-100 dark:border-white/5 rounded-3xl shadow-inner relative z-10">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">{t('seeds.labels.configure_growth')}</h3>
                                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-[0_0_10px_rgba(52,211,153,0.1)]">{t('seeds.labels.dynamic_scaling')}</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {[
                                    { id: "10x20 inch", key: "10x20", area: 200 },
                                    { id: "10x10 inch", key: "10x10", area: 100 },
                                    { id: "5x5 inch", key: "5x5", area: 25 }
                                ].map((tray) => (
                                    <button
                                        key={tray.id}
                                        onClick={() => setSelectedTraySize(tray.id)}
                                        className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 relative overflow-hidden group ${selectedTraySize === tray.id
                                            ? "border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_15px_rgba(52,211,153,0.15)] transform -translate-y-1"
                                            : "border-gray-100 dark:border-white/5 bg-white dark:bg-[#1A1D27] hover:border-emerald-500/20 hover:bg-emerald-500/[0.02]"
                                            }`}
                                    >
                                        <div className={`absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent opacity-0 transition-opacity ${selectedTraySize === tray.id ? 'opacity-100' : 'group-hover:opacity-50'}`}></div>
                                        <span className={`text-sm font-black relative z-10 ${selectedTraySize === tray.id ? "text-emerald-500" : "text-gray-900 dark:text-gray-300 group-hover:text-emerald-500 dark:group-hover:text-white"}`}>
                                            {t(`seeds.trays.${tray.key}_label`)}
                                        </span>
                                        <span className="text-[10px] font-bold text-emerald-500/80 uppercase tracking-widest relative z-10">
                                            {tray.area} {t('seeds.trays.area_unit')}
                                        </span>
                                        <div className={`mt-2 px-3 py-1 rounded-lg text-[10px] font-black tracking-wider relative z-10 border ${selectedTraySize === tray.id ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/30" : "bg-gray-100 dark:bg-[#0E1015] text-gray-400 dark:text-emerald-500/80 border-gray-100 dark:border-white/5"}`}>
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 relative z-10">
                            <div className="bg-gray-50 dark:bg-[#0E1015] p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-inner">
                                <h3 className="text-sm font-black text-gray-900 dark:text-white mb-6 flex items-center gap-3 uppercase tracking-widest">
                                    <Zap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                    {t('seeds.labels.timetable')}
                                </h3>
                                <div className="text-gray-900 dark:text-white filter dark:brightness-125">
                                    <GrowthSchedule seed={seed} />
                                </div>
                            </div>
                            <div className="bg-gray-50 dark:bg-[#0E1015] p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-inner">
                                <h3 className="text-sm font-black text-gray-900 dark:text-white mb-6 flex items-center gap-3 uppercase tracking-widest">
                                    <Sprout className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                                    {t('seeds.labels.progression')}
                                </h3>
                                <div className="text-gray-900 dark:text-white filter dark:brightness-125">
                                    <TimelinePreview
                                        seed={seed}
                                        blackoutDays={seed.blackout_time_days || 3}
                                        harvestDays={seed.harvest_days || 10}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Nutrition */}
                        <div className="mb-12 relative z-10">
                            <h3 className="text-xs font-black text-emerald-600 dark:text-emerald-500/80 uppercase tracking-widest mb-4">{t('seeds.nutrition_label')}</h3>
                            <div className="text-emerald-900 dark:text-emerald-100 leading-relaxed bg-emerald-500/5 p-8 rounded-[2rem] border border-emerald-500/20 shadow-inner relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full group-hover:bg-emerald-500/20 transition-colors"></div>
                                <p className="font-medium italic relative z-10 text-lg">
                                    "{t(`seeds.${seed.seed_type}.nutrition`, { defaultValue: seed.nutrition || "Rich in Vitamins A, B, C, E, and K." })}"
                                </p>
                            </div>
                        </div>

                        {/* Care Guide */}
                        {seed.care_instructions && (
                            <div className="mb-12 relative z-10">
                                <h3 className="text-xs font-black text-emerald-600 dark:text-emerald-500/80 uppercase tracking-widest mb-4">{t('seeds.care_guide_label')}</h3>
                                <div className="text-blue-900 dark:text-blue-100 leading-relaxed bg-blue-500/5 p-8 rounded-[2rem] border border-blue-500/20 shadow-inner whitespace-pre-line font-medium relative overflow-hidden group">
                                    <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full group-hover:bg-blue-500/20 transition-colors"></div>
                                    <div className="relative z-10 text-lg">
                                        {t(`seeds.${seed.seed_type}.care`, { defaultValue: seed.care_instructions })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Pros & Cons */}
                        {(seed.pros || seed.cons) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 relative z-10">
                                {seed.pros && (
                                    <div className="group">
                                        <h3 className="text-xs font-black text-emerald-600 dark:text-emerald-500/80 uppercase tracking-widest mb-4 flex items-center group-hover:text-emerald-500 transition-colors">
                                            <span className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-2 rounded-xl mr-3 text-sm shadow-[0_0_10px_rgba(52,211,153,0.1)]">👍</span> {t('seeds.pros_label')}
                                        </h3>
                                        <div className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-[#0E1015] p-6 rounded-[2rem] border border-gray-100 dark:border-white/5 group-hover:border-emerald-500/30 group-hover:shadow-[0_0_15px_rgba(52,211,153,0.05)] transition-all font-medium text-lg leading-relaxed">
                                            {t(`seeds.${seed.seed_type}.pros`, { defaultValue: seed.pros })}
                                        </div>
                                    </div>
                                )}
                                {seed.cons && (
                                    <div className="group">
                                        <h3 className="text-xs font-black text-emerald-600 dark:text-emerald-500/80 uppercase tracking-widest mb-4 flex items-center group-hover:text-rose-500 transition-colors">
                                            <span className="bg-rose-500/20 text-rose-600 dark:text-rose-400 p-2 rounded-xl mr-3 text-sm shadow-[0_0_10px_rgba(244,63,94,0.1)]">⚠️</span> {t('seeds.cons_label')}
                                        </h3>
                                        <div className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-[#0E1015] p-6 rounded-[2rem] border border-gray-100 dark:border-white/5 group-hover:border-rose-500/30 group-hover:shadow-[0_0_15px_rgba(244,63,94,0.05)] transition-all font-medium text-lg leading-relaxed">
                                            {t(`seeds.${seed.seed_type}.cons`, { defaultValue: seed.cons })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* External Links */}
                        {seed.external_links && seed.external_links.length > 0 && (
                            <div className="mb-4 relative z-10">
                                <h3 className="text-xs font-black text-emerald-600 dark:text-emerald-500/80 uppercase tracking-widest mb-4">{t('seeds.labels.resources')}</h3>
                                <div className="space-y-3">
                                    {seed.external_links.map((link, i) => (
                                        <a
                                            key={i}
                                            href={link.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block bg-gray-50 dark:bg-[#0E1015] hover:bg-gray-100 dark:hover:bg-white/[0.02] p-5 rounded-2xl border border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10 transition-all flex items-center justify-between group"
                                        >
                                            <span className="font-bold text-gray-700 dark:text-gray-300 group-hover:text-emerald-600 dark:group-hover:text-white transition-colors">{link.desc || link.url}</span>
                                            <span className="text-gray-400 dark:text-gray-600 group-hover:text-emerald-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all text-xl">↗</span>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="h-4"></div>
                    </div>
                </div>

                {/* Floating Grow Button */}
                <div className="fixed bottom-0 left-0 right-0 py-4 px-6 bg-white/80 dark:bg-[#0E1015]/80 backdrop-blur-xl border-t border-gray-100 dark:border-white/5 z-40 flex justify-center">
                    <div className="md:pl-64 transition-all duration-300 w-full flex justify-center">
                        <button
                            onClick={() => setShowWizard(true)}
                            className="bg-emerald-500 hover:bg-emerald-400 text-white font-black py-2.5 px-6 border border-emerald-400/50 rounded-xl shadow-lg hover:shadow-emerald-500/30 transition-all active:scale-[0.98] text-sm uppercase tracking-widest inline-flex"
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
