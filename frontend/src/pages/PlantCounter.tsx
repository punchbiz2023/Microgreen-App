import { useState } from 'react';

import api from '../services/api';

interface CountResult {
    count: number;
    centroids: [number, number][];
    annotated_image_url: string;
    image_width: number;
    image_height: number;
    method: string;
    parameters: {
        conf_threshold?: number;
        color_type?: string;
        min_area?: number;
        max_area?: number;
    };
}

export default function PlantCounter() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [counting, setCounting] = useState(false);
    const [result, setResult] = useState<CountResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [colorType, setColorType] = useState<string>('green');


    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setResult(null);
            setError(null);
        }
    };

    const handleCount = async () => {
        if (!selectedFile) {
            setError('Please select an image first');
            return;
        }

        setCounting(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);

            const response = await api.post<CountResult>(
                '/api/count-plants',
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                    params: {
                        model_type: 'sprout',
                        color_type: colorType,
                        min_area: 50,
                        max_area: 5000,
                    },
                }
            );

            setResult(response.data);
        } catch (err: any) {
            console.error('Count error:', err);
            const errorMessage = err.response?.data?.detail || 'Failed to count plants. Please try again.';
            console.error('Detailed error:', errorMessage);
            setError(errorMessage);
        } finally {
            setCounting(false);
        }
    };

    const handleReset = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        setResult(null);
        setError(null);
    };

    return (
        <div className="py-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-10 text-center">
                    <div className="text-6xl mb-4">🌱</div>
                    <h1 className="text-4xl font-extrabold text-white tracking-tight mb-3">
                        {/* Microgreen Plant Counter */}
                    </h1>
                    <p className="text-lg text-gray-400">
                        Upload a photo of your tray to count individual plants
                    </p>
                </div>

                {/* Main Card */}
                <div className="bg-[#1A1D27] border border-white/5 shadow-xl rounded-[2rem] p-8 sm:p-12 relative overflow-hidden">
                    {/* Subtle background glow */}
                    <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/10 blur-3xl rounded-full"></div>
                    {/* Color Type Selector */}
                    <div className="mb-8 relative z-10">
                        <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">
                            Microgreen Color Type
                        </label>
                        <div className="flex gap-3">
                            {['green', 'red', 'purple'].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setColorType(type)}
                                    className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm tracking-wide capitalize transition-all border ${colorType === type
                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(52,211,153,0.1)]'
                                        : 'bg-[#0E1015] text-gray-500 border-white/5 hover:border-white/10 hover:text-gray-300'
                                        }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Detection Model - Fixed to Sprout */}
                    <div className="mb-8 relative z-10">
                        <p className="text-[10px] font-bold text-emerald-500/50 uppercase tracking-widest mb-1 text-center">
                            Using Optimized Sprout Detection AI
                        </p>
                    </div>

                    {/* File Upload */}
                    {!previewUrl && (
                        <div
                            className="border-2 border-dashed border-white/10 rounded-2xl p-16 text-center cursor-pointer transition-all hover:bg-white/[0.02] hover:border-emerald-500/30 relative z-10"
                            onDragOver={(e) => {
                                e.preventDefault();
                                e.currentTarget.classList.add('border-emerald-500/50', 'bg-emerald-500/5');
                            }}
                            onDragLeave={(e) => {
                                e.currentTarget.classList.remove('border-emerald-500/50', 'bg-emerald-500/5');
                            }}
                            onDrop={(e) => {
                                e.preventDefault();
                                e.currentTarget.classList.remove('border-emerald-500/50', 'bg-emerald-500/5');
                                const file = e.dataTransfer.files[0];
                                if (file && file.type.startsWith('image/')) {
                                    setSelectedFile(file);
                                    setPreviewUrl(URL.createObjectURL(file));
                                }
                            }}
                        >
                            <div className="text-5xl mb-4">📸</div>
                            <p className="text-lg text-gray-300 font-medium mb-6">
                                Drop your image here or click to browse
                            </p>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="hidden"
                                id="file-input"
                            />
                            <label htmlFor="file-input">
                                <button
                                    onClick={() => document.getElementById('file-input')?.click()}
                                    className="bg-emerald-500/10 text-emerald-400 font-bold py-3 px-6 rounded-xl border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors shadow-sm"
                                >
                                    Choose Image
                                </button>
                            </label>
                        </div>
                    )}

                    {/* Image Preview */}
                    {previewUrl && !result && (
                        <div className="relative z-10 animate-fade-in">
                            <img
                                src={previewUrl}
                                alt="Preview"
                                className="w-full rounded-2xl mb-6 max-h-[500px] object-contain bg-[#0E1015] border border-white/5"
                            />
                            <div className="flex flex-col sm:flex-row gap-4">
                                <button
                                    onClick={handleReset}
                                    disabled={counting}
                                    className={`flex-1 py-3.5 px-4 rounded-xl font-bold transition-all border ${counting
                                        ? 'bg-[#0E1015] text-gray-600 border-white/5 cursor-not-allowed'
                                        : 'bg-[#222634] text-gray-300 border-white/10 hover:bg-white/10 cursor-pointer'
                                        }`}
                                >
                                    Choose Different Image
                                </button>
                                <button
                                    onClick={handleCount}
                                    disabled={counting}
                                    className={`flex-1 py-3.5 px-4 rounded-xl font-bold transition-all border ${counting
                                        ? 'bg-emerald-500/5 text-emerald-500/50 border-emerald-500/10 cursor-not-allowed'
                                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 shadow-[0_0_15px_rgba(52,211,153,0.1)] cursor-pointer'
                                        }`}
                                >
                                    {counting ? 'Counting...' : '🔍 Count Plants'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Results */}
                    {result && (
                        <div className="relative z-10 animate-fade-in-up">
                            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-8 mb-6 text-center shadow-[0_0_20px_rgba(52,211,153,0.1)]">
                                <div className="text-5xl mb-3">🌱</div>
                                <div className="text-6xl font-black text-emerald-400 mb-2 tracking-tight">
                                    {result.count}
                                </div>
                                <div className="text-lg font-medium text-emerald-500/80 uppercase tracking-widest">
                                    Plants Detected
                                </div>
                            </div>

                            <div className="bg-[#0E1015] p-2 rounded-2xl border border-white/5 mb-6">
                                <img
                                    src={`${api.defaults.baseURL}${result.annotated_image_url}`}
                                    alt="Annotated result"
                                    className="w-full rounded-xl"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-8 bg-[#0E1015] p-6 rounded-2xl border border-white/5">
                                <div>
                                    <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Detection Method</div>
                                    <div className="text-lg font-bold text-white capitalize flex items-center">
                                        {result.method} {result.method === 'YOLO' && '🎯'}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Image Size</div>
                                    <div className="text-lg font-bold text-white">
                                        {result.image_width} × {result.image_height}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleReset}
                                className="w-full py-4 bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 transition-colors"
                            >
                                Count Another Image
                            </button>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="mt-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4 relative z-10">
                            <div className="text-red-400 font-medium flex items-center">
                                <span className="mr-2">⚠️</span> {error}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
