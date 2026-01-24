import YieldGauge from './YieldGauge';
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Prediction } from '../services/api';

interface StatusCardProps {
  dayNumber: number;
  totalDays: number;
  phase: string;
  prediction: Prediction | null;
}

export default function StatusCard({
  dayNumber,
  totalDays,
  phase,
  prediction
}: StatusCardProps) {
  const { t } = useTranslation();
  if (!prediction) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-center text-gray-500">
          {t('dashboard.no_prediction')}
        </div>
      </div>
    );
  }

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'critical':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getSuggestionStyle = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'critical':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {t('dashboard.day_of', { current: dayNumber, total: totalDays })}
          </h2>
          <div className="inline-block px-4 py-2 bg-blue-100 text-blue-800 rounded-full font-semibold">
            {phase}
          </div>
        </div>

        <YieldGauge
          predicted={prediction.predicted_yield}
          base={prediction.base_yield}
          status={prediction.status as any}
        />

        {prediction.potential_loss > 0 && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-center">
              <div className="text-sm text-red-700 font-medium">
                {t('dashboard.potential_loss')}
              </div>
              <div className="text-2xl font-bold text-red-900 mt-1">
                {prediction.potential_loss.toFixed(0)}g
              </div>
              <div className="text-xs text-red-600 mt-1">
                {t('dashboard.check_suggestions')}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Suggestions */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          {t('dashboard.ai_suggestions')}
        </h3>

        <div className="space-y-3">
          {prediction.suggestions.map((suggestion, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-2 ${getSuggestionStyle(suggestion.type)}`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getSuggestionIcon(suggestion.type)}
                </div>

                <div className="flex-1">
                  <div className="font-semibold text-gray-900 mb-1">
                    {suggestion.issue}
                  </div>
                  <div className="text-sm text-gray-700">
                    {suggestion.message}
                  </div>

                  {suggestion.potential_loss && (
                    <div className="mt-2 text-xs font-medium text-red-700">
                      {t('dashboard.loss_label')}: {suggestion.potential_loss}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

