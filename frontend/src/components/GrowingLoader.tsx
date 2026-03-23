import React from 'react';

const GrowingLoader: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] w-full bg-white dark:bg-[#0E1015] rounded-[2.5rem] p-12 transition-colors duration-300">
            <div className="relative w-24 h-24 mb-6">
                <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-4 bg-emerald-500/10 rounded-full flex items-center justify-center">
                    <div className="w-8 h-8 bg-emerald-500 rounded-lg animate-pulse"></div>
                </div>
            </div>
            <div className="text-center space-y-2">
                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Preparing Seeds...</h3>
                <p className="text-gray-500 dark:text-emerald-500/60 font-black uppercase text-[10px] tracking-[0.3em]">Microgreen Engine v2.0</p>
            </div>
        </div>
    );
};

export default GrowingLoader;
