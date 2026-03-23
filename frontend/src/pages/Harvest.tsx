import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cropsApi, harvestApi, predictionsApi, type Crop, type Prediction } from '../services/api';

import { ArrowLeft, Award, TrendingUp, BarChart3, CheckCircle, Info, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function Harvest() {
  const { t } = useTranslation();
  const { cropId } = useParams<{ cropId: string }>();
  const navigate = useNavigate();

  const [crop, setCrop] = useState<Crop | null>(null);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [actualWeight, setActualWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [harvestResult, setHarvestResult] = useState<any>(null);

  // Harvest Success Checklist
  const [checklist, setChecklist] = useState({
    cut: false,
    wash: false,
    dry: false,
    cool: false
  });

  const isChecklistComplete = checklist.cut && checklist.wash && checklist.dry && checklist.cool;

  useEffect(() => {
    if (cropId) {
      loadData();
    }
  }, [cropId]);

  const loadData = async () => {
    try {
      const cropResponse = await cropsApi.getById(parseInt(cropId!));
      setCrop(cropResponse.data);

      const predResponse = await predictionsApi.get(parseInt(cropId!));
      setPrediction(predResponse.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cropId || !actualWeight) return;

    const weight = parseFloat(actualWeight);
    if (isNaN(weight) || weight <= 0) {
      alert(t('harvest.invalid_weight'));
      return;
    }

    try {
      setSubmitting(true);

      const response = await harvestApi.create(parseInt(cropId), {
        actual_weight: weight,
        notes: notes || undefined,
      });

      setHarvestResult(response.data);
      setSubmitted(true);
    } catch (error: any) {
      console.error('Failed to submit harvest:', error);
      alert(error.response?.data?.detail || t('harvest.submit_error'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!crop) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (submitted && harvestResult) {
    const chartData = [
      {
        name: t('harvest.predicted'),
        weight: harvestResult.predicted_weight,
        fill: '#3b82f6'
      },
      {
        name: t('harvest.actual'),
        weight: harvestResult.actual_weight,
        fill: '#22c55e'
      },
      {
        name: t('harvest.base'),
        weight: crop.seed.avg_yield_grams,
        fill: '#94a3b8'
      }
    ];

    const difference = harvestResult.actual_weight - harvestResult.predicted_weight;
    const percentDiff = (difference / harvestResult.predicted_weight) * 100;

    return (
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-[#0E1015]">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-[#1A1D27] rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-white/5">
            {/* Success Header */}
            <div className="bg-emerald-500/10 border-b border-emerald-500/20 p-8 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl -ml-20 -mt-20 z-0"></div>
              <div className="flex justify-center mb-4 relative z-10">
                <div className="bg-gray-50 dark:bg-[#0E1015] border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)] rounded-full p-5">
                  <Award className="w-16 h-16 text-emerald-400" />
                </div>
              </div>
              <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2 relative z-10 tracking-tight">
                {t('harvest.complete_title')}
              </h1>
              <p className="text-emerald-400 font-bold uppercase tracking-widest text-sm relative z-10">
                {t(`seeds.${crop.seed.seed_type}.name`, { defaultValue: crop.seed.name })} - {crop.seed.growth_days} {t('harvest.cycle_complete')}
              </p>
            </div>

            <div className="p-8 space-y-8">
              {/* Comparison Chart */}
              <div>
                <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-6 flex items-center">
                  <BarChart3 className="w-6 h-6 mr-3 text-purple-400" />
                  {t('harvest.yield_comparison')}
                </h2>

                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2D303E" />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis label={{ value: t('harvest.grams'), angle: -90, position: 'insideLeft', fill: '#94a3b8' }} stroke="#94a3b8" />
                    <Tooltip contentStyle={{ backgroundColor: '#1A1D27', borderColor: '#2D303E', color: 'white' }} itemStyle={{ color: 'white' }} />
                    <Bar dataKey="weight" radius={[8, 8, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-500/10 rounded-2xl p-6 border border-blue-500/20 shadow-inner">
                  <div className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-2">
                    {t('harvest.ai_predicted')}
                  </div>
                  <div className="text-4xl font-black text-gray-900 dark:text-white">
                    {harvestResult.predicted_weight.toFixed(0)}<span className="text-blue-500/50 text-2xl ml-1">g</span>
                  </div>
                </div>

                <div className="bg-emerald-500/10 rounded-2xl p-6 border border-emerald-500/20 shadow-inner">
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-widest mb-2">
                    {t('harvest.actual_harvest')}
                  </div>
                  <div className="text-4xl font-black text-gray-900 dark:text-white">
                    {harvestResult.actual_weight.toFixed(0)}<span className="text-emerald-500/50 text-2xl ml-1">g</span>
                  </div>
                </div>

                <div className="bg-purple-500/10 rounded-2xl p-6 border border-purple-500/20 shadow-inner">
                  <div className="text-[10px] text-purple-600 dark:text-purple-400 font-bold uppercase tracking-widest mb-2">
                    {t('harvest.ai_accuracy')}
                  </div>
                  <div className="text-4xl font-black text-gray-900 dark:text-white">
                    {harvestResult.accuracy_percent.toFixed(1)}<span className="text-purple-500/50 text-2xl ml-1">%</span>
                  </div>
                </div>
              </div>

              {/* Performance Message */}
              <div className={`rounded-2xl p-6 border-2 ${difference >= 0
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-amber-500/10 border-amber-500/30'
                }`}>
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 mt-1 bg-gray-50 dark:bg-[#0E1015] p-2 rounded-xl">
                    {difference >= 0 ? (
                      <CheckCircle className="w-8 h-8 text-emerald-400" />
                    ) : (
                      <TrendingUp className="w-8 h-8 text-amber-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-xl font-extrabold mb-1 tracking-tight ${difference >= 0 ? 'text-gray-900 dark:text-white' : 'text-gray-900 dark:text-white'
                      }`}>
                      {difference >= 0
                        ? t('harvest.great_job')
                        : t('harvest.learning_opportunity')
                      }
                    </h3>
                    <p className={`text-sm font-bold ${difference >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                      }`}>
                      {t('harvest.performance_msg', {
                        result: difference >= 0 ? t('harvest.exceeded') : t('harvest.came_close'),
                        weight: Math.abs(difference).toFixed(0),
                        percent: Math.abs(percentDiff).toFixed(1)
                      })}
                    </p>
                    <p className={`text-xs mt-2 uppercase tracking-widest font-black ${difference >= 0 ? 'text-emerald-500/50' : 'text-amber-500/50'
                      }`}>
                      {difference >= 0
                        ? t('harvest.success_detail')
                        : t('harvest.learning_detail')
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {harvestResult.notes && (
                <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">
                    {t('harvest.your_notes')}
                  </h3>
                  <p className="text-gray-700 dark:text-white font-medium">{harvestResult.notes}</p>
                </div>
              )}

              {/* Model Learning Info */}
              <div className="bg-purple-500/10 rounded-2xl p-6 border border-purple-500/20">
                <h3 className="text-sm font-bold text-purple-400 uppercase tracking-widest mb-2 flex items-center">
                  <Zap className="w-4 h-4 mr-2" />
                  {t('harvest.ai_training_title')}
                </h3>
                <p className="text-sm text-purple-300/70 font-medium">
                  {t('harvest.ai_training_desc')}
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={() => navigate('/atlas')}
                  className="flex-1 px-6 py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-black uppercase tracking-widest text-sm rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] active:scale-[0.98]"
                >
                  {t('harvest.start_new')}
                </button>

                <button
                  onClick={() => navigate('/atlas')}
                  className="flex-1 px-6 py-4 border border-white/10 bg-[#0E1015] hover:bg-white/5 text-gray-400 hover:text-white font-bold uppercase tracking-widest text-sm rounded-xl transition-all"
                >
                  {t('harvest.back_to_atlas')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate(`/dashboard/${cropId}`)}
          className="flex items-center text-gray-400 hover:text-white transition-colors mb-6 font-bold uppercase tracking-widest text-sm"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          {t('harvest.back_to_dashboard')}
        </button>

        <div className="bg-white dark:bg-[#1A1D27] rounded-[2.5rem] shadow-2xl p-8 border border-gray-100 dark:border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -ml-20 -mt-20 z-0 pointer-events-none"></div>

          <div className="text-center mb-10 relative z-10">
            <div className="flex justify-center mb-6">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 shadow-[inset_0_0_20px_rgba(16,185,129,0.1)]">
                <Award className="w-12 h-12 text-emerald-400" />
              </div>
            </div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">
              {t('harvest.harvest_time')}
            </h1>
            <p className="text-gray-400 font-medium">
              {t(`seeds.${crop.seed.seed_type}.name`, { defaultValue: crop.seed.name })} - <span className="text-emerald-500 font-bold">{crop.seed.growth_days} {t('harvest.cycle_complete')}</span>
            </p>
          </div>

          {prediction && (
            <div className="bg-blue-500/10 rounded-2xl p-6 border border-blue-500/20 mb-10 relative z-10 text-center shadow-inner">
              <div className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-1">
                {t('harvest.ai_predicted_yield')}
              </div>
              <div className="text-5xl font-black text-gray-900 dark:text-white mb-2 drop-shadow-md">
                {prediction.predicted_yield.toFixed(0)}<span className="text-blue-500/50 text-3xl ml-1">g</span>
              </div>
              <div className="text-xs font-bold text-blue-500/70 uppercase tracking-widest">
                {t('harvest.based_on_conditions', { days: crop.seed.growth_days })}
              </div>
            </div>
          )}

          {/* Harvest Success Checklist */}
          <div className="mb-10 space-y-4 relative z-10">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">{t('harvest.title')}</h2>
              <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border ${isChecklistComplete ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/20 border-amber-500/30 text-amber-600 dark:text-amber-500'}`}>
                {isChecklistComplete ? t('harvest.ready') : t('harvest.pending')}
              </span>
            </div>

            <p className="text-sm font-medium text-gray-500 mb-6">{t('harvest.subtitle')}</p>

            <div className="grid gap-3">
              {[
                { id: 'cut', label: t('harvest.cut_at_base') },
                { id: 'wash', label: t('harvest.wash_2_3x') },
                { id: 'dry', label: t('harvest.dry_thoroughly') },
                { id: 'cool', label: t('harvest.refrigerate') }
              ].map(item => (
                <label
                  key={item.id}
                  className={`flex items-center p-4 border rounded-2xl cursor-pointer transition-all ${checklist[item.id as keyof typeof checklist]
                    ? 'border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.1)] transform -translate-y-0.5'
                    : 'border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-[#0E1015] hover:border-gray-200 dark:hover:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500'
                    }`}
                >
                  <input
                    type="checkbox"
                    checked={checklist[item.id as keyof typeof checklist]}
                    onChange={(e) => setChecklist({ ...checklist, [item.id]: e.target.checked })}
                    className="w-6 h-6 rounded bg-gray-50 dark:bg-[#1A1D27] border-gray-200 dark:border-white/10 text-emerald-500 focus:ring-emerald-500 mr-4 transition-colors"
                  />
                  <span className={`font-bold text-[15px] ${checklist[item.id as keyof typeof checklist] ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-300'}`}>
                    {item.label}
                  </span>
                </label>
              ))}
            </div>

            {!isChecklistComplete && (
              <p className="text-xs text-amber-500 font-bold mt-5 flex items-center justify-center bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                <Info className="w-4 h-4 mr-2" /> {t('harvest.checklist_gate')}
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10 pt-4 border-t border-white/5">
            <div>
              <label className="block text-[10px] font-black tracking-widest uppercase text-gray-400 mb-3">
                {t('harvest.actual_weight_label')}
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={actualWeight}
                  onChange={(e) => setActualWeight(e.target.value)}
                  placeholder={t('harvest.enter_weight_placeholder')}
                  required
                  className="w-full p-5 pl-8 pr-16 text-3xl font-black bg-gray-50 dark:bg-[#0E1015] border border-gray-200 dark:border-white/10 rounded-2xl focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 focus:outline-none text-gray-900 dark:text-white transition-all placeholder-gray-400 dark:placeholder-gray-700"
                />
                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xl font-black text-gray-500 pointer-events-none">g</span>
              </div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-500/50 mt-3 text-center">
                {t('harvest.weight_desc')}
              </p>
            </div>

            <div>
              <label className="block text-[10px] font-black tracking-widest uppercase text-gray-400 mb-3">
                {t('harvest.notes_label')}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder={t('harvest.notes_placeholder')}
                className="w-full p-4 bg-gray-50 dark:bg-[#0E1015] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-2xl focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 focus:outline-none resize-none font-medium placeholder-gray-400 dark:placeholder-gray-600 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !actualWeight || !isChecklistComplete}
              className={`w-full flex items-center justify-center space-x-3 px-8 py-5 font-black text-[15px] uppercase tracking-widest rounded-2xl transition-all shadow-lg overflow-hidden relative ${submitting || !actualWeight || !isChecklistComplete
                ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-700'
                : 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] active:scale-[0.98]'
                }`}
            >
              <Award className="w-6 h-6 relative z-10" />
              <span className="relative z-10">{submitting ? t('harvest.processing') : t('harvest.complete_btn')}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

