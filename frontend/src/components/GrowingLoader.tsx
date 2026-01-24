import { Circle, Sprout } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function GrowingLoader() {
    const { t } = useTranslation();
    return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center">
            <div className="relative w-24 h-24 flex items-end justify-center">
                {/* Soil */}
                <div className="absolute bottom-2 w-16 h-1 bg-amber-900/20 rounded-full blur-[1px]"></div>

                {/* Seed Phase (0-33%) */}
                <div className="absolute bottom-2 animate-seed-phase opacity-0">
                    <Circle className="w-4 h-4 text-amber-700 fill-amber-700" />
                </div>

                {/* Sprout Phase (33-66%) */}
                <div className="absolute bottom-2 animate-sprout-phase opacity-0 origin-bottom">
                    <div className="w-1 h-6 bg-green-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-full -mt-1 -ml-1"></div>
                </div>

                {/* Plant Phase (66-100%) */}
                <div className="absolute bottom-2 animate-plant-phase opacity-0 origin-bottom">
                    <Sprout className="w-12 h-12 text-green-500 stroke-[1.5]" />
                </div>
            </div>
            <p className="mt-4 text-sm font-medium text-green-800/60 animate-pulse tracking-widest uppercase text-[10px]">
                {t('dashboard.germinating')}
            </p>
        </div>
    );
}
