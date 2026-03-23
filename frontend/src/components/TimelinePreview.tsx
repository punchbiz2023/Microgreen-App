import { useTranslation } from 'react-i18next';
import { Seed } from '../services/api';

interface TimelinePreviewProps {
    seed: Seed;
    blackoutDays: number;
    harvestDays: number; // or growth_days
}

export default function TimelinePreview({ seed, blackoutDays, harvestDays }: TimelinePreviewProps) {
    const { t } = useTranslation();
    const totalDays = harvestDays || seed.growth_days;
    const lightDays = totalDays - blackoutDays;

    // Percentage calcs
    const blackoutPct = (blackoutDays / totalDays) * 100;
    const lightPct = (lightDays / totalDays) * 100;

    return (
        <div className="w-full">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4 tracking-tight">{t('seeds.labels.timeline_preview')}</h4>

            {/* Bar */}
            <div className="h-6 w-full bg-gray-100 dark:bg-[#1A1D27] border border-gray-200 dark:border-white/5 rounded-full flex overflow-hidden shadow-inner">
                {/* Blackout Phase */}
                <div
                    className="h-full bg-gray-700 dark:bg-gray-800 relative group flex items-center justify-center"
                    style={{ width: `${blackoutPct}%` }}
                    title={`${t('seeds.labels.dark')}: ${blackoutDays}d`}
                >
                    <span className="text-[10px] uppercase font-bold text-gray-100 dark:text-gray-300 tracking-wider transition-colors">{t('seeds.labels.dark')}</span>
                </div>

                {/* Light Phase */}
                <div
                    className="h-full bg-yellow-400 relative group flex items-center justify-center"
                    style={{ width: `${lightPct}%` }}
                    title={`${t('seeds.labels.light')}: ${lightDays}d`}
                >
                    <span className="text-[10px] uppercase font-bold text-yellow-900 tracking-wider">{t('seeds.labels.light')}</span>
                </div>
            </div>

            {/* Legend / Info */}
            <div className="flex justify-between mt-3 text-xs font-bold text-gray-500 dark:text-gray-400">
                <div className="flex items-center">
                    <span className="w-3 h-3 rounded-full bg-gray-700 dark:bg-gray-800 shadow-[0_0_10px_rgba(31,41,55,0.5)] mr-2"></span>
                    <span>{t('seeds.labels.dark')} ({blackoutDays}d)</span>
                </div>
                <div className="flex items-center">
                    <span className="w-3 h-3 rounded-full bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.3)] mr-2"></span>
                    <span className="text-gray-700 dark:text-gray-300">{t('seeds.labels.light')} ({lightDays}d)</span>
                </div>
                <div className="font-extrabold text-emerald-400">
                    {t('seeds.labels.harvest_day')} <span className="text-gray-500">(Day {totalDays})</span>
                </div>
            </div>
        </div>
    );
}
