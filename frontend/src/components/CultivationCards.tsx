import { Package, Clock, Scale, Droplet, Zap, Sprout, Calendar } from 'lucide-react';
import { Seed } from '../services/api';
import { useTranslation } from 'react-i18next';

interface CultivationCardsProps {
    seed: Seed;
    traySize?: string;
    numberOfTrays?: number;
}

const CultivationCards: React.FC<CultivationCardsProps> = ({
    seed,
    traySize = "10x20 inch",
    numberOfTrays = 1
}) => {
    const { t } = useTranslation();
    // Area-based multiplier (Base is 10x20 = 200 sq in)
    const getMultiplier = (size: string) => {
        if (size.includes("10x10")) return 0.5;
        if (size.includes("5x5")) return 0.125;
        return 1.0; // 10x20 default
    };

    const areaMultiplier = getMultiplier(traySize);

    // Calculate total values with area scaling
    const totalSeedWeight = (seed.suggested_seed_weight || 0) * areaMultiplier * numberOfTrays;
    const totalYield = (seed.avg_yield_grams || 0) * areaMultiplier * numberOfTrays;

    return (
        <div className="mb-12">
            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-8 flex items-center group">
                <span className="w-10 h-10 bg-gray-50 dark:bg-[#1A1D27] text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center mr-4 border border-gray-100 dark:border-white/5 group-hover:rotate-12 transition-transform duration-300">
                    <Zap className="w-5 h-5" />
                </span>
                <span className="tracking-tight">{t('cultivation.specs_title')}</span>
            </h3>

            <div className="grid grid-cols-1 gap-6">
                {/* Seed Preparation Block - Large & Prominent */}
                <div className="relative overflow-hidden bg-white dark:bg-[#1A1D27] border border-gray-100 dark:border-white/5 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-500 group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 dark:bg-blue-50/50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                    <div className="relative flex items-center gap-8">
                        <div className="w-20 h-20 bg-gray-50 dark:bg-[#222634] border border-blue-500/20 rounded-3xl flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-500">
                            <Package size={40} />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-xs font-bold text-blue-600 dark:text-blue-500 uppercase tracking-wider mb-1">{t('cultivation.seed_prep')}</h4>
                            <div className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">
                                {totalSeedWeight.toFixed(1)}<span className="text-xl ml-1 text-emerald-600 dark:text-emerald-500/60">g</span>
                            </div>
                            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-500/60 mt-2 flex items-center gap-2">
                                {numberOfTrays > 1 ? <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-lg text-xs">{numberOfTrays}x</span> : ''}
                                {t('cultivation.weight_for')} <span className="text-blue-600 dark:text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full">{traySize}</span>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Soaking Block */}
                    <div className="bg-white dark:bg-[#1A1D27] border border-gray-100 dark:border-white/5 rounded-[2rem] p-7 shadow-sm hover:shadow-xl hover:shadow-cyan-500/10 hover:-translate-y-1 transition-all duration-300 group">
                        <div className="flex items-start gap-5">
                            <div className="w-16 h-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center text-cyan-600 dark:text-cyan-400 group-hover:bg-cyan-500 group-hover:text-white transition-colors duration-300">
                                <Clock size={32} />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-cyan-600 dark:text-cyan-500 uppercase tracking-wider mb-1">{t('cultivation.soaking_details')}</h4>
                                <div className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                                    {seed.soaking_duration_hours && seed.soaking_duration_hours > 0
                                        ? `${seed.soaking_duration_hours} ${t('wizard.hours')}`
                                        : (seed.soaking_req || t('cultivation.no_soak'))}
                                </div>
                                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-500/60 mt-2 leading-relaxed">
                                    {t('cultivation.hydration_desc')}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Sprout Time Block */}
                    <div className="bg-white dark:bg-[#1A1D27] border border-gray-100 dark:border-white/5 rounded-[2rem] p-7 shadow-sm hover:shadow-xl hover:shadow-amber-500/10 hover:-translate-y-1 transition-all duration-300 group">
                        <div className="flex items-start gap-5">
                            <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-colors duration-300">
                                <Sprout size={32} />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider mb-1">{t('cultivation.sprout_time')}</h4>
                                <div className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                                    {seed.germination_days || 3} {t('common.days')}
                                </div>
                                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-500/60 mt-2 leading-relaxed">
                                    {t('cultivation.sprout_desc')}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Watering Block */}
                    <div className="bg-white dark:bg-[#1A1D27] border border-gray-100 dark:border-white/5 rounded-[2rem] p-7 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 group">
                        <div className="flex items-start gap-5">
                            <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors duration-300">
                                <Droplet size={32} />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-500 uppercase tracking-wider mb-1">{t('cultivation.watering_schedule')}</h4>
                                <div className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                                    {seed.watering_req || t('cultivation.standard')}
                                </div>
                                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-500/60 mt-2 leading-relaxed">
                                    {t('cultivation.moisture_desc')}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Growth Time Block */}
                    <div className="bg-white dark:bg-[#1A1D27] border border-gray-100 dark:border-white/5 rounded-[2rem] p-7 shadow-sm hover:shadow-xl hover:shadow-rose-500/10 hover:-translate-y-1 transition-all duration-300 group">
                        <div className="flex items-start gap-5">
                            <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-600 dark:text-rose-400 group-hover:bg-rose-500 group-hover:text-white transition-colors duration-300">
                                <Calendar size={32} />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-rose-600 dark:text-rose-500 uppercase tracking-wider mb-1">{t('cultivation.growth_time')}</h4>
                                <div className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                                    {seed.harvest_days || 10} {t('common.days')}
                                </div>
                                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-500/60 mt-2 leading-relaxed">
                                    {t('cultivation.growth_desc')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Yield Output Block - High Impact */}
                <div className="relative overflow-hidden bg-white dark:bg-[#1A1D27] border border-gray-100 dark:border-white/5 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full -mr-32 -mt-32 group-hover:scale-125 transition-transform duration-1000" />
                    <div className="relative flex flex-col md:flex-row items-center gap-8">
                        <div className="w-24 h-24 bg-gray-50 dark:bg-[#222634] border border-emerald-500/20 rounded-3xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-inner group-hover:rotate-6 transition-transform">
                            <Scale size={48} />
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest mb-1">{t('cultivation.expected_yield')}</h4>
                            <div className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter">
                                ~{totalYield}<span className="text-2xl ml-1 text-emerald-600 dark:text-emerald-500/60">g</span>
                            </div>
                            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-500/60 mt-3">
                                {t('cultivation.yield_estimate')} <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">{numberOfTrays} {numberOfTrays > 1 ? t('cultivation.trays') : t('cultivation.tray')}</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Growth Tips */}
                {(seed.growth_tips || seed.fertilizer_info) && (
                    <div className="mt-4 p-8 bg-gradient-to-br from-gray-900 to-gray-800 rounded-[2.5rem] border border-gray-700 shadow-2xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-green-500/20 rounded-lg">
                                <Zap className="w-5 h-5 text-green-400" />
                            </div>
                            <h3 className="text-xl font-black text-white">{t('cultivation.pro_tips', { name: seed.name })}</h3>
                        </div>
                        <div className="space-y-5">
                            {seed.growth_tips && (
                                <div className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-green-500/30 transition-colors">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-2 shrink-0 animate-pulse" />
                                    <p className="text-sm text-gray-300 leading-relaxed"><span className="font-black text-green-400 uppercase text-[10px] tracking-widest block mb-1">{t('cultivation.growth_label')}</span> {t(`seeds.${seed.seed_type}.tips`, { defaultValue: seed.growth_tips })}</p>
                                </div>
                            )}
                            {seed.fertilizer_info && (
                                <div className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-colors">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0 animate-pulse" />
                                    <p className="text-sm text-gray-300 leading-relaxed"><span className="font-black text-emerald-400 uppercase text-[10px] tracking-widest block mb-1">{t('cultivation.nutrition_label')}</span> {t(`seeds.${seed.seed_type}.fert`, { defaultValue: seed.fertilizer_info })}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CultivationCards;
