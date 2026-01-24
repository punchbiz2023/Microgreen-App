import React from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, Sprout, Moon, Sun, Scissors } from 'lucide-react';

interface GrowthRoadmapProps {
    soakingHours: number;
    blackoutDays: number;
    harvestDays: number;
}

const GrowthRoadmap: React.FC<GrowthRoadmapProps> = ({ soakingHours, blackoutDays, harvestDays }) => {
    const { t } = useTranslation();

    const steps = [
        {
            icon: <Settings className="w-5 h-5" />,
            title: t('cultivation.step_1'),
            desc: soakingHours > 0 ? `${t('cultivation.step_1_desc')} (${soakingHours}h)` : t('cultivation.no_soak'),
            color: 'bg-blue-500',
            lightColor: 'bg-blue-50'
        },
        {
            icon: <Sprout className="w-5 h-5" />,
            title: t('cultivation.step_2'),
            desc: t('cultivation.step_2_desc'),
            color: 'bg-green-500',
            lightColor: 'bg-green-50'
        },
        {
            icon: <Moon className="w-5 h-5" />,
            title: t('cultivation.step_3'),
            desc: blackoutDays > 0 ? `${t('cultivation.step_3_desc')} (${blackoutDays}d)` : 'Skip blackout',
            color: 'bg-purple-500',
            lightColor: 'bg-purple-50'
        },
        {
            icon: <Sun className="w-5 h-5" />,
            title: t('cultivation.step_4'),
            desc: t('cultivation.step_4_desc'),
            color: 'bg-amber-500',
            lightColor: 'bg-amber-50'
        },
        {
            icon: <Scissors className="w-5 h-5" />,
            title: t('cultivation.step_5'),
            desc: `${t('cultivation.step_5_desc')} (Day ${harvestDays}+)`,
            color: 'bg-rose-500',
            lightColor: 'bg-rose-50'
        }
    ];

    return (
        <div className="mb-10">
            <h3 className="text-xl font-extrabold text-gray-900 mb-6 flex items-center">
                <span className="w-8 h-8 bg-green-500 text-white rounded-lg flex items-center justify-center mr-3 text-sm font-bold">
                    🚀
                </span>
                {t('cultivation.roadmap_title')}
            </h3>

            <div className="relative">
                {/* Vertical Line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-100 -z-10"></div>

                <div className="space-y-6">
                    {steps.map((step, index) => (
                        <div key={index} className="flex items-start gap-4">
                            <div className={`w-12 h-12 ${step.color} text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-gray-100`}>
                                {step.icon}
                            </div>
                            <div className="flex-1 pt-1">
                                <h4 className="font-bold text-gray-900">{step.title}</h4>
                                <p className="text-sm text-gray-500">{step.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default GrowthRoadmap;
