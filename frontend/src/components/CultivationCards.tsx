import { Package, Clock, Scale, Droplet, Zap, Sprout, Calendar } from 'lucide-react';
import { Seed } from '../services/api';

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
        <div className="mb-10">
            <h3 className="text-xl font-extrabold text-gray-900 mb-6 flex items-center">
                <span className="w-8 h-8 bg-green-500 text-white rounded-lg flex items-center justify-center mr-3 text-sm">
                    <Zap className="w-4 h-4" />
                </span>
                Cultivation Specs
            </h3>

            <div className="space-y-4">
                {/* Seed Preparation Block */}
                <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex items-center gap-6 group">
                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                        <Package size={32} />
                    </div>
                    <div className="flex-1">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Seed Preparation</h4>
                        <div className="text-2xl font-black text-gray-900">
                            {totalSeedWeight.toFixed(1)}g
                        </div>
                        <p className="text-xs font-medium text-gray-500 mt-1">
                            {numberOfTrays > 1 ? `${numberOfTrays}x ` : ''}Suggested weight for <span className="text-blue-600 font-bold">{traySize}</span>
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Soaking Block */}
                    <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex items-center gap-5 group">
                        <div className="w-14 h-14 bg-cyan-50 rounded-2xl flex items-center justify-center text-cyan-500 group-hover:scale-110 transition-transform">
                            <Clock size={28} />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Soaking Details</h4>
                            <div className="text-xl font-black text-gray-900">
                                {seed.soaking_duration_hours && seed.soaking_duration_hours > 0
                                    ? `${seed.soaking_duration_hours} Hours`
                                    : (seed.soaking_req || 'No Soak')}
                            </div>
                            <p className="text-[11px] font-medium text-gray-500 mt-1 leading-tight">
                                Essential hydration phase
                            </p>
                        </div>
                    </div>

                    {/* Sprout Time Block (Germination) */}
                    <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex items-center gap-5 group">
                        <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                            <Sprout size={28} />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Sprout Time</h4>
                            <div className="text-xl font-black text-gray-900">
                                {seed.germination_days || 3} Days
                            </div>
                            <p className="text-[11px] font-medium text-gray-500 mt-1 leading-tight">
                                Time until first sprouts appear
                            </p>
                        </div>
                    </div>

                    {/* Watering Block */}
                    <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex items-center gap-5 group">
                        <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                            <Droplet size={28} />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Watering Schedule</h4>
                            <div className="text-xl font-black text-gray-900">
                                {seed.watering_req || 'Standard'}
                            </div>
                            <p className="text-[11px] font-medium text-gray-500 mt-1 leading-tight">
                                Regular moisture maintenance
                            </p>
                        </div>
                    </div>

                    {/* Growth Time Block (Harvest) */}
                    <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex items-center gap-5 group">
                        <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform">
                            <Calendar size={28} />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Growth Time</h4>
                            <div className="text-xl font-black text-gray-900">
                                {seed.harvest_days || 10} Days
                            </div>
                            <p className="text-[11px] font-medium text-gray-500 mt-1 leading-tight">
                                Total time from seed to harvest
                            </p>
                        </div>
                    </div>
                </div>

                {/* Yield Output Block */}
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 border border-transparent rounded-3xl p-6 shadow-lg shadow-green-100 flex items-center gap-6 group text-white">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                        <Scale size={32} />
                    </div>
                    <div className="flex-1">
                        <h4 className="text-xs font-bold text-green-100 uppercase tracking-widest mb-1">Expected Yield</h4>
                        <div className="text-3xl font-black">
                            ~{totalYield}g
                        </div>
                        <p className="text-xs font-medium text-green-50/80 mt-1">
                            Final output estimate for <span className="font-bold text-white">{numberOfTrays} {numberOfTrays > 1 ? 'Trays' : 'Tray'}</span>
                        </p>
                    </div>
                </div>

                {/* Growth Tips - Added Research-based details */}
                {(seed.growth_tips || seed.fertilizer_info) && (
                    <div className="mt-8 p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl border border-green-100">
                        <div className="flex items-center gap-2 mb-3">
                            <Zap className="w-5 h-5 text-green-600" />
                            <h3 className="text-lg font-bold text-green-900">Pro Tips for {seed.name}</h3>
                        </div>
                        <div className="space-y-3">
                            {seed.growth_tips && (
                                <div className="flex gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-2 shrink-0" />
                                    <p className="text-sm text-green-800 leading-relaxed"><span className="font-bold">Growth:</span> {seed.growth_tips}</p>
                                </div>
                            )}
                            {seed.fertilizer_info && (
                                <div className="flex gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                                    <p className="text-sm text-emerald-800 leading-relaxed"><span className="font-bold">Nutrition:</span> {seed.fertilizer_info}</p>
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
