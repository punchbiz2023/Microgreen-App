import { X, Thermometer, CloudRain, CheckCircle, XCircle } from 'lucide-react';
import type { DailyLog } from '../services/api';
import { format } from 'date-fns';

interface HistoryPopupProps {
  log: DailyLog;
  phase: string;
  onClose: () => void;
}

export default function HistoryPopup({ log, phase, onClose }: HistoryPopupProps) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-[#1A1D27] rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-white/5">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Day {log.day_number} History
            </h2>
            <div className="text-green-100 text-sm mt-1">
              {phase}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Time Logged */}
          <div className="bg-gray-50 dark:bg-white/5 rounded-lg p-4 transition-colors">
            <div className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">
              Logged At
            </div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {format(new Date(log.logged_at), 'MMM dd, yyyy hh:mm a')}
            </div>
          </div>

          {/* Environmental Data */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-orange-50 dark:bg-orange-500/10 rounded-lg p-4 border-2 border-orange-200 dark:border-orange-500/20 transition-colors">
              <div className="flex items-center mb-2">
                <Thermometer className="w-5 h-5 text-orange-600 dark:text-orange-400 mr-2" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Temperature</span>
              </div>
              <div className="text-3xl font-bold text-orange-900 dark:text-orange-100">
                {log.temperature}°C
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-500/10 rounded-lg p-4 border-2 border-blue-200 dark:border-blue-500/20 transition-colors">
              <div className="flex items-center mb-2">
                <CloudRain className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Humidity</span>
              </div>
              <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                {log.humidity}%
              </div>
            </div>
          </div>

          {/* Watering Status */}
          <div className={`rounded-lg p-4 border-2 transition-colors ${log.watered
            ? 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20'
            : 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20'
            }`}>
            <div className="flex items-center">
              {log.watered ? (
                <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600 mr-3" />
              )}
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {log.watered ? 'Plant Watered' : 'Watering Missed'}
                </div>
                <div className={`text-sm ${log.watered ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
                  }`}>
                  {log.watered ? 'Good job!' : 'This may affect yield'}
                </div>
              </div>
            </div>
          </div>

          {/* Photo */}
          {log.photo_path && (
            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">
                Photo
              </div>
              {/* Image hidden requested by user */}
              {/* <img
                src={`http://localhost:8001${log.photo_path}`}
                alt={`Day ${log.day_number}`}
                className="w-full rounded-lg shadow-md"
              /> */}
              <div className="p-4 bg-gray-100 rounded text-center text-gray-500">
                Image Hidden
              </div>
            </div>
          )}

          {/* Notes */}
          {log.notes && (
            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes
              </div>
              <div className="bg-gray-50 dark:bg-white/5 rounded-lg p-4 text-gray-900 dark:text-gray-200 italic transition-colors">
                {log.notes}
              </div>
            </div>
          )}

          {/* Predicted Yield */}
          {log.predicted_yield && (
            <div className="bg-purple-50 dark:bg-purple-500/10 rounded-lg p-4 border-2 border-purple-200 dark:border-purple-500/20 transition-colors">
              <div className="text-sm text-purple-700 dark:text-purple-400 font-medium mb-1">
                Predicted Yield (at this point)
              </div>
              <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                {log.predicted_yield.toFixed(0)}g
              </div>
            </div>
          )}

          {/* AI Assessment */}
          <div className="bg-blue-50 dark:bg-blue-500/10 rounded-lg p-4 border-2 border-blue-200 dark:border-blue-500/20 transition-colors">
            <div className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              AI Assessment
            </div>
            <div className="text-sm text-blue-800 dark:text-blue-300">
              {getAssessment(log)}
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="sticky bottom-0 bg-white dark:bg-[#1A1D27] border-t border-gray-200 dark:border-white/5 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gray-600 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function getAssessment(log: DailyLog): string {
  const issues = [];

  // Check temperature (assuming ideal around 22°C, tolerance ±3°C)
  if (log.temperature !== undefined) {
    if (log.temperature > 25) {
      issues.push('Temperature was high');
    } else if (log.temperature < 19) {
      issues.push('Temperature was low');
    }
  }

  // Check humidity (assuming ideal around 50%, tolerance ±10%)
  if (log.humidity !== undefined) {
    if (log.humidity < 40) {
      issues.push('Humidity was low');
    } else if (log.humidity > 70) {
      issues.push('Humidity was high');
    }
  }

  // Check watering
  if (!log.watered) {
    issues.push('Watering was missed');
  }

  if (issues.length === 0) {
    return 'Conditions were optimal on this day. Great job!';
  } else {
    return `Issues detected: ${issues.join(', ')}. These factors may have impacted growth.`;
  }
}

