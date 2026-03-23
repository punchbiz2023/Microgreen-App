
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cropsApi, type Crop } from '../services/api';
import PlantImage from '../components/PlantImage';
import { format, differenceInDays } from 'date-fns';
import { ta as taLocale, enUS as enLocale } from 'date-fns/locale';
import { Loader2, Trash2, Leaf } from 'lucide-react';

export default function MyPlants() {
    const { t, i18n } = useTranslation();
    const currentLocale = i18n.language === 'ta' ? taLocale : enLocale;
    const [activeCrops, setActiveCrops] = useState<Crop[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const response = await cropsApi.getAll('active');
            setActiveCrops(response.data);
        } catch (error) {
            console.error('Failed to load data:', error);
            alert(t('common.error'));
        } finally {
            setLoading(false);
        }
    };

    const getCropStatus = (crop: Crop) => {
        const start = new Date(crop.start_datetime);
        const now = new Date();

        let currentDay = 0;
        if (now >= start) {
            currentDay = differenceInDays(now, start) + 1;
        }

        const growthDays = crop.seed.growth_days || 10;
        currentDay = Math.min(currentDay, growthDays);
        const progress = Math.round((Math.max(0, currentDay) / growthDays) * 100);
        return { currentDay, progress };
    };

    const [deletingCrop, setDeletingCrop] = useState<Crop | null>(null);

    const handleDelete = async () => {
        if (!deletingCrop) return;
        try {
            await cropsApi.delete(deletingCrop.id);
            setActiveCrops(prev => prev.filter(c => c.id !== deletingCrop.id));
            setDeletingCrop(null);
        } catch (error) {
            console.error('Failed to delete crop:', error);
            alert('Failed to delete plant. Please try again.');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-green-500" />
            </div>
        );
    }

    return (
        <div className="py-8">
            <div>
                <div className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-gray-200 dark:border-white/10 pb-6">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">{t('my_plants.title', { defaultValue: 'My Plants' })}</h1>
                        <p className="text-sm font-bold text-emerald-500/60 uppercase tracking-[0.3em] mt-2">{t('my_plants.subtitle', { defaultValue: 'Manage your active crops' })}</p>
                    </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {activeCrops.map((crop) => {
                        const { currentDay, progress } = getCropStatus(crop);
                        return (
                            <div
                                key={crop.id}
                                onClick={() => navigate(`/dashboard/${crop.id}`)}
                                className="bg-white dark:bg-[#1A1D27] border border-gray-100 dark:border-white/5 rounded-3xl shadow-sm cursor-pointer hover:shadow-2xl hover:shadow-emerald-500/10 hover:border-emerald-500/20 hover:-translate-y-2 transition-all duration-500 group overflow-hidden relative flex flex-col"
                            >
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setDeletingCrop(crop);
                                    }}
                                    className="absolute top-3 right-3 z-10 p-2 bg-black/40 border border-white/10 backdrop-blur-md rounded-xl text-white hover:bg-red-500/80 transition-all opacity-0 group-hover:opacity-100 shadow-lg"
                                    title={t('my_plants.delete_plant', { defaultValue: 'Delete' })}
                                >
                                    <Trash2 size={18} />
                                </button>

                                <div className="h-40 relative">
                                    <PlantImage seedName={crop.seed.name} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                                        <div>
                                            <h3 className="font-bold text-white text-xl shadow-sm">{t(`seeds.${crop.seed.seed_type}.name`, { defaultValue: crop.seed.name })}</h3>
                                            <p className="text-white/90 text-xs font-medium">{t('my_plants.started')} {format(new Date(crop.start_datetime), 'MMM d', { locale: currentLocale })}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5 flex-1 flex flex-col justify-between">
                                    <div className="flex justify-between items-center mb-5">
                                        <span className="text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full uppercase tracking-wide">
                                            {t('common.day', { defaultValue: 'Day' })} {currentDay}
                                        </span>
                                        <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold bg-gray-100 dark:bg-[#0E1015] border border-gray-100 dark:border-white/5 px-2 py-1 rounded-lg uppercase tracking-wider">
                                            {crop.tray_size || 'Default Tray'}
                                        </span>
                                    </div>

                                    <div>
                                        <div className="w-full bg-gray-100 dark:bg-[#0E1015] border border-gray-200 dark:border-white/5 rounded-full h-1.5 mb-2 overflow-hidden shadow-inner">
                                            <div
                                                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-1000 relative shadow-[0_0_10px_rgba(52,211,153,0.5)]"
                                                style={{ width: `${progress}%` }}
                                            ></div>
                                        </div>
                                        <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                            <span>{t('my_plants.sprout', { defaultValue: 'Sprout' })}</span>
                                            <span>{t('my_plants.harvest_label', { defaultValue: 'Harvest' })}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {activeCrops.length === 0 && (
                        <div className="text-center py-20 px-4 text-gray-500 col-span-full bg-white dark:bg-[#1A1D27] rounded-[3rem] border-2 border-dashed border-gray-200 dark:border-white/10 shadow-sm">
                            <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 transform -rotate-6">
                                <Leaf className="w-10 h-10 text-emerald-500 dark:text-emerald-400" />
                            </div>
                            <h4 className="text-2xl font-black text-gray-900 dark:text-white mb-3">No Active Crops</h4>
                            <p className="mb-10 text-gray-500 dark:text-gray-400 font-medium max-w-xs mx-auto leading-relaxed">{t('my_plants.no_plants', { defaultValue: 'You have no active crops currently growing.' })}</p>
                            <button
                                onClick={() => navigate('/atlas')}
                                className="inline-flex items-center text-emerald-500 dark:text-emerald-400 font-black text-xs tracking-widest uppercase hover:opacity-80 transition-opacity"
                            >
                                {t('my_plants.go_to_atlas', { defaultValue: 'Explore Seed Atlas' })}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deletingCrop && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 dark:bg-[#0E1015]/80 backdrop-blur-md">
                    <div className="bg-white dark:bg-[#1A1D27] border border-gray-200 dark:border-white/10 rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl transform transition-all animate-in fade-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-3xl flex items-center justify-center mb-8 mx-auto border border-red-500/10 shadow-inner">
                            <Trash2 size={36} />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white text-center mb-2 tracking-tight">Delete Crop?</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-center mb-10 text-sm leading-relaxed font-medium">
                            {t('my_plants.delete_warning', { name: t(`seeds.${deletingCrop.seed.seed_type}.name`, { defaultValue: deletingCrop.seed.name }) })}
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setDeletingCrop(null)}
                                className="px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-[#222634] hover:bg-gray-200 dark:hover:bg-white/10 transition-all border border-gray-100 dark:border-white/5"
                            >
                                {t('common.cancel', { defaultValue: 'Cancel' })}
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white bg-red-500 hover:bg-red-600 shadow-xl shadow-red-500/20 transition-all active:scale-95 border-b-4 border-red-700 active:border-b-0"
                            >
                                {t('common.delete', { defaultValue: 'Delete' })}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
