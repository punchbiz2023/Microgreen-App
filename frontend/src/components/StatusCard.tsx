import YieldGauge from './YieldGauge';
import { AlertCircle, CheckCircle, AlertTriangle, Zap } from 'lucide-react';
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
      <div className="bg-white dark:bg-[#1A1D27] border border-gray-100 dark:border-white/5 rounded-2xl shadow-sm p-6">
        <div className="text-center text-gray-400 dark:text-gray-500">
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
        return 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400';
      case 'warning':
        return 'bg-amber-500/5 border-amber-500/20 text-amber-600 dark:text-amber-400';
      case 'critical':
        return 'bg-red-500/5 border-red-500/20 text-red-600 dark:text-red-400';
      default:
        return 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/10 text-gray-500 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <div className="bg-white dark:bg-[#1A1D27] border border-gray-100 dark:border-white/5 rounded-[2rem] shadow-sm p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">
            {t('dashboard.day_of', { current: dayNumber, total: totalDays })}
          </h2>
          <div className="flex flex-wrap justify-center gap-2">
            <div className="inline-block px-4 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full font-semibold">
              {phase}
            </div>
          </div>
        </div>

        <YieldGauge
          predicted={prediction.predicted_yield}
          base={prediction.base_yield}
          status={prediction.status as any}
        />

        {prediction.potential_loss > 0 && (
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
            <div className="text-center">
              <div className="text-sm text-red-400 font-bold uppercase tracking-wider">
                {t('dashboard.potential_loss')}
              </div>
              <div className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                {prediction.potential_loss.toFixed(0)}g
              </div>
              <div className="text-[10px] text-red-500/70 font-bold uppercase tracking-widest mt-1">
                {t('dashboard.check_suggestions')}
              </div>
            </div>
          </div>
        )}


      </div>

      {/* Suggestions */}
      <div className="bg-white dark:bg-[#1A1D27] border border-gray-100 dark:border-white/5 rounded-[2rem] shadow-sm p-8">
        <h3 className="text-xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-emerald-400" />
          </div>
          {t('dashboard.ai_suggestions')}
        </h3>

        <div className="space-y-4">
          {prediction.suggestions.map((suggestion, index) => (
            <div
              key={index}
              className={`p-6 rounded-[1.5rem] border ${getSuggestionStyle(suggestion.type)} transition-all hover:bg-white/[0.02]`}
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 mt-1">
                  {getSuggestionIcon(suggestion.type)}
                </div>

                <div className="flex-1">
                  <div className="font-bold text-gray-900 dark:text-white text-lg mb-2">
                    {suggestion.issue}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                    {suggestion.message.split(' - ').map((part, i) => (
                      <div key={i} className={i > 0 ? 'mt-2 border-t border-white/5 pt-2' : ''}>
                        {part.trim().startsWith('-') ? part.trim() : (i > 0 ? `• ${part.trim()}` : part.trim())}
                      </div>
                    ))}
                  </div>

                  {suggestion.potential_loss && (
                    <div className="mt-3 inline-block px-3 py-1 bg-red-500/10 rounded-lg text-xs font-bold text-red-400 border border-red-500/20">
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

