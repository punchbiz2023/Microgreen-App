import { X, Droplet, Thermometer, CloudRain, CheckCircle, XCircle } from 'lucide-react';
import type { DailyLog } from '../services/api';
import { format } from 'date-fns';

interface HistoryPopupProps {
  log: DailyLog;
  phase: string;
  onClose: () => void;
}

export default function HistoryPopup({ log, phase, onClose }: HistoryPopupProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
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
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 font-medium mb-1">
              Logged At
            </div>
            <div className="text-lg font-semibold text-gray-900">
              {format(new Date(log.logged_at), 'MMM dd, yyyy hh:mm a')}
            </div>
          </div>

          {/* Environmental Data */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-orange-50 rounded-lg p-4 border-2 border-orange-200">
              <div className="flex items-center mb-2">
                <Thermometer className="w-5 h-5 text-orange-600 mr-2" />
                <span className="text-sm font-medium text-gray-700">Temperature</span>
              </div>
              <div className="text-3xl font-bold text-orange-900">
                {log.temperature}°C
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
              <div className="flex items-center mb-2">
                <CloudRain className="w-5 h-5 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-gray-700">Humidity</span>
              </div>
              <div className="text-3xl font-bold text-blue-900">
                {log.humidity}%
              </div>
            </div>
          </div>

          {/* Watering Status */}
          <div className={`rounded-lg p-4 border-2 ${log.watered
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
            }`}>
            <div className="flex items-center">
              {log.watered ? (
                <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600 mr-3" />
              )}
              <div>
                <div className="font-semibold text-gray-900">
                  {log.watered ? 'Plant Watered' : 'Watering Missed'}
                </div>
                <div className={`text-sm ${log.watered ? 'text-green-700' : 'text-red-700'
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
                src={`http://localhost:8000${log.photo_path}`}
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
              <div className="text-sm font-medium text-gray-700 mb-2">
                Notes
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-gray-900">
                {log.notes}
              </div>
            </div>
          )}

          {/* Predicted Yield */}
          {log.predicted_yield && (
            <div className="bg-purple-50 rounded-lg p-4 border-2 border-purple-200">
              <div className="text-sm text-purple-700 font-medium mb-1">
                Predicted Yield (at this point)
              </div>
              <div className="text-3xl font-bold text-purple-900">
                {log.predicted_yield.toFixed(0)}g
              </div>
            </div>
          )}

          {/* AI Assessment */}
          <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
            <div className="font-semibold text-blue-900 mb-2">
              AI Assessment
            </div>
            <div className="text-sm text-blue-800">
              {getAssessment(log)}
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
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
  if (log.temperature > 25) {
    issues.push('Temperature was high');
  } else if (log.temperature < 19) {
    issues.push('Temperature was low');
  }

  // Check humidity (assuming ideal around 50%, tolerance ±10%)
  if (log.humidity < 40) {
    issues.push('Humidity was low');
  } else if (log.humidity > 70) {
    issues.push('Humidity was high');
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

