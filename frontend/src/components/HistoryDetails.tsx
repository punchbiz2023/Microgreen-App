import { X, Droplet, Thermometer, CloudRain, CheckCircle, XCircle, Clock } from 'lucide-react';
import type { DailyLog } from '../services/api';
import { format } from 'date-fns';

interface HistoryDetailsProps {
    log: DailyLog;
    phase: string;
    onClose: () => void;
}

export default function HistoryDetails({ log, phase, onClose }: HistoryDetailsProps) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
            {/* Header */}
            <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-b border-gray-100">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center">
                        Day {log.day_number} Summary
                        <span className="ml-3 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 uppercase tracking-wide">
                            {phase}
                        </span>
                    </h3>
                </div>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left: Key Metrics */}
                    <div className="space-y-4">
                        <div className="flex items-center text-sm text-gray-500">
                            <Clock className="w-4 h-4 mr-2" />
                            Logged at {format(new Date(log.logged_at), 'hh:mm a')}
                        </div>

                        <div className={`p-4 rounded-xl border ${log.watered ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                            <div className="flex items-center">
                                {log.watered ? <CheckCircle className="w-5 h-5 text-green-600 mr-2" /> : <XCircle className="w-5 h-5 text-red-600 mr-2" />}
                                <span className={`font-semibold ${log.watered ? 'text-green-800' : 'text-red-800'}`}>
                                    {log.watered ? 'Watered Correctly' : 'Watering Missed'}
                                </span>
                            </div>
                        </div>

                        {log.predicted_yield && (
                            <div className="p-4 rounded-xl border border-purple-100 bg-purple-50">
                                <span className="block text-xs font-bold text-purple-600 uppercase tracking-wider mb-1">Predicted Yield</span>
                                <span className="text-2xl font-bold text-purple-900">{log.predicted_yield.toFixed(0)}g</span>
                            </div>
                        )}
                    </div>

                    {/* Right: Environment & Notes */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-orange-50 rounded-lg border border-orange-100">
                                <div className="flex items-center text-orange-600 mb-1">
                                    <Thermometer className="w-4 h-4 mr-1" />
                                    <span className="text-xs font-bold uppercase">Temp</span>
                                </div>
                                <span className="text-lg font-bold text-orange-900">{log.temperature}°C</span>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                                <div className="flex items-center text-blue-600 mb-1">
                                    <CloudRain className="w-4 h-4 mr-1" />
                                    <span className="text-xs font-bold uppercase">Hum</span>
                                </div>
                                <span className="text-lg font-bold text-blue-900">{log.humidity}%</span>
                            </div>
                        </div>

                        {log.notes && (
                            <div className="p-4 bg-gray-50 rounded-xl text-sm text-gray-600 italic">
                                "{log.notes}"
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
