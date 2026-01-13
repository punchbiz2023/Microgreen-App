
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cropsApi, type Crop } from '../services/api';
import PlantImage from '../components/PlantImage';
import { format, differenceInDays } from 'date-fns';
import { Loader2, Trash2 } from 'lucide-react';

export default function MyPlants() {
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
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                <div className="mb-8 flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">My Plants</h1>
                        <p className="text-gray-600 mt-2">Track your active crops and their progress.</p>
                    </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {activeCrops.map((crop) => {
                        const { currentDay, progress } = getCropStatus(crop);
                        return (
                            <div
                                key={crop.id}
                                onClick={() => navigate(`/dashboard/${crop.id}`)}
                                className="bg-white rounded-2xl shadow-sm cursor-pointer border border-gray-100 hover:shadow-md transition-all group overflow-hidden relative"
                            >
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setDeletingCrop(crop);
                                    }}
                                    className="absolute top-3 right-3 z-10 p-2 bg-white/20 backdrop-blur-md rounded-xl text-white hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                    title="Delete Plant"
                                >
                                    <Trash2 size={18} />
                                </button>

                                <div className="h-40 relative">
                                    <PlantImage seedName={crop.seed.name} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                                        <div>
                                            <h3 className="font-bold text-white text-xl shadow-sm">{crop.seed.name}</h3>
                                            <p className="text-white/90 text-xs font-medium">Started {format(new Date(crop.start_datetime), 'MMM d')}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-xs font-bold bg-green-50 text-green-600 px-2.5 py-1 rounded-full uppercase tracking-wide">
                                            Day {currentDay}
                                        </span>
                                        <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded-lg">
                                            {crop.tray_size || 'Default Tray'}
                                        </span>
                                    </div>

                                    <div className="w-full bg-gray-100 rounded-full h-2.5 mb-2">
                                        <div
                                            className="bg-gradient-to-r from-green-400 to-emerald-500 h-2.5 rounded-full transition-all duration-500 shadow-sm"
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-400 font-medium">
                                        <span>Sprout</span>
                                        <span>Harvest</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {activeCrops.length === 0 && (
                        <div className="text-center py-12 text-gray-500 col-span-full bg-white rounded-3xl border border-dashed border-gray-300">
                            <p className="mb-4">You don't have any plants growing yet.</p>
                            <button
                                onClick={() => navigate('/atlas')}
                                className="text-green-500 font-bold hover:underline"
                            >
                                Go to Seed Atlas to start one!
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deletingCrop && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl transform transition-all animate-in fade-in zoom-in duration-200">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                            <Trash2 size={32} />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 text-center mb-2">Delete Plant?</h3>
                        <p className="text-gray-500 text-center mb-8">
                            Are you sure you want to delete your <span className="font-bold text-gray-700">{deletingCrop.seed.name}</span>? This action cannot be undone and all growth history will be lost.
                        </p>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => setDeletingCrop(null)}
                                className="flex-1 px-6 py-3 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-1 px-6 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200 transition-all active:scale-95"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
