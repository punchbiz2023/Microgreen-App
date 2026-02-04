import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cropsApi, harvestApi, predictionsApi, type Crop, type Prediction } from '../services/api';

import { ArrowLeft, Award, TrendingUp, BarChart3, CheckCircle, Info } from 'lucide-react';
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
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Success Header */}
            <div className="bg-gradient-to-r from-green-400 to-emerald-500 p-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-white rounded-full p-4">
                  <Award className="w-16 h-16 text-green-500" />
                </div>
              </div>
              <h1 className="text-4xl font-bold text-white mb-2">
                {t('harvest.complete_title')}
              </h1>
              <p className="text-green-100 text-lg">
                {t(`seeds.${crop.seed.seed_type}.name`, { defaultValue: crop.seed.name })} - {crop.seed.growth_days} {t('harvest.cycle_complete')}
              </p>
            </div>

            <div className="p-8 space-y-8">
              {/* Comparison Chart */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <BarChart3 className="w-6 h-6 mr-2 text-purple-600" />
                  {t('harvest.yield_comparison')}
                </h2>

                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis label={{ value: t('harvest.grams'), angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
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
                <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
                  <div className="text-sm text-blue-700 font-medium mb-2">
                    {t('harvest.ai_predicted')}
                  </div>
                  <div className="text-4xl font-bold text-blue-900">
                    {harvestResult.predicted_weight.toFixed(0)}g
                  </div>
                </div>

                <div className="bg-green-50 rounded-xl p-6 border-2 border-green-200">
                  <div className="text-sm text-green-700 font-medium mb-2">
                    {t('harvest.actual_harvest')}
                  </div>
                  <div className="text-4xl font-bold text-green-900">
                    {harvestResult.actual_weight.toFixed(0)}g
                  </div>
                </div>

                <div className="bg-purple-50 rounded-xl p-6 border-2 border-purple-200">
                  <div className="text-sm text-purple-700 font-medium mb-2">
                    {t('harvest.ai_accuracy')}
                  </div>
                  <div className="text-4xl font-bold text-purple-900">
                    {harvestResult.accuracy_percent.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Performance Message */}
              <div className={`rounded-xl p-6 border-2 ${difference >= 0
                ? 'bg-green-50 border-green-200'
                : 'bg-yellow-50 border-yellow-200'
                }`}>
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 mt-1">
                    {difference >= 0 ? (
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    ) : (
                      <TrendingUp className="w-8 h-8 text-yellow-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-xl font-bold mb-2 ${difference >= 0 ? 'text-green-900' : 'text-yellow-900'
                      }`}>
                      {difference >= 0
                        ? t('harvest.great_job')
                        : t('harvest.learning_opportunity')
                      }
                    </h3>
                    <p className={`text-lg ${difference >= 0 ? 'text-green-800' : 'text-yellow-800'
                      }`}>
                      {t('harvest.performance_msg', {
                        result: difference >= 0 ? t('harvest.exceeded') : t('harvest.came_close'),
                        weight: Math.abs(difference).toFixed(0),
                        percent: Math.abs(percentDiff).toFixed(1)
                      })}
                    </p>
                    <p className={`text-sm mt-2 ${difference >= 0 ? 'text-green-700' : 'text-yellow-700'
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
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {t('harvest.your_notes')}
                  </h3>
                  <p className="text-gray-700">{harvestResult.notes}</p>
                </div>
              )}

              {/* Model Learning Info */}
              <div className="bg-purple-50 rounded-xl p-6 border-2 border-purple-200">
                <h3 className="text-lg font-bold text-purple-900 mb-2">
                  {t('harvest.ai_training_title')}
                </h3>
                <p className="text-sm text-purple-800">
                  {t('harvest.ai_training_desc')}
                </p>
              </div>

              {/* Actions */}
              <div className="flex space-x-4">
                <button
                  onClick={() => navigate('/atlas')}
                  className="flex-1 px-6 py-4 bg-green-500 hover:bg-green-600 text-white font-bold text-lg rounded-xl transition-colors shadow-lg hover:shadow-xl shadow-green-100"
                >
                  {t('harvest.start_new')}
                </button>

                <button
                  onClick={() => navigate('/atlas')}
                  className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 font-bold text-lg rounded-xl hover:bg-gray-50 transition-colors"
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
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          {t('harvest.back_to_dashboard')}
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-purple-100 rounded-full p-4">
                <Award className="w-12 h-12 text-purple-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t('harvest.harvest_time')}
            </h1>
            <p className="text-gray-600">
              {t(`seeds.${crop.seed.seed_type}.name`, { defaultValue: crop.seed.name })} - {crop.seed.growth_days} {t('harvest.cycle_complete')}
            </p>
          </div>

          {prediction && (
            <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200 mb-8">
              <div className="text-center">
                <div className="text-sm text-blue-700 font-medium mb-1">
                  {t('harvest.ai_predicted_yield')}
                </div>
                <div className="text-5xl font-bold text-blue-900 mb-2">
                  {prediction.predicted_yield.toFixed(0)}g
                </div>
                <div className="text-sm text-blue-700">
                  {t('harvest.based_on_conditions', { days: crop.seed.growth_days })}
                </div>
              </div>
            </div>
          )}

          {/* Harvest Success Checklist */}
          <div className="mb-10 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">{t('harvest.title')}</h2>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest ${isChecklistComplete ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                {isChecklistComplete ? t('harvest.ready') : t('harvest.pending')}
              </span>
            </div>

            <p className="text-sm text-gray-500 mb-6">{t('harvest.subtitle')}</p>

            <div className="grid gap-3">
              {[
                { id: 'cut', label: t('harvest.cut_at_base') },
                { id: 'wash', label: t('harvest.wash_2_3x') },
                { id: 'dry', label: t('harvest.dry_thoroughly') },
                { id: 'cool', label: t('harvest.refrigerate') }
              ].map(item => (
                <label
                  key={item.id}
                  className={`flex items-center p-4 border-2 rounded-2xl cursor-pointer transition-all ${checklist[item.id as keyof typeof checklist]
                    ? 'border-green-500 bg-green-50 shadow-sm'
                    : 'border-gray-100 hover:border-green-200'
                    }`}
                >
                  <input
                    type="checkbox"
                    checked={checklist[item.id as keyof typeof checklist]}
                    onChange={(e) => setChecklist({ ...checklist, [item.id]: e.target.checked })}
                    className="w-5 h-5 rounded text-green-600 mr-4"
                  />
                  <span className={`font-semibold ${checklist[item.id as keyof typeof checklist] ? 'text-green-700' : 'text-gray-700'}`}>
                    {item.label}
                  </span>
                </label>
              ))}
            </div>

            {!isChecklistComplete && (
              <p className="text-xs text-amber-600 font-bold mt-4 flex items-center justify-center">
                <Info className="w-3 h-3 mr-1" /> {t('harvest.checklist_gate')}
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-3">
                {t('harvest.actual_weight_label')}
              </label>
              <input
                type="number"
                step="0.1"
                value={actualWeight}
                onChange={(e) => setActualWeight(e.target.value)}
                placeholder={t('harvest.enter_weight_placeholder')}
                required
                className="w-full p-4 text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none text-center"
              />
              <p className="text-sm text-gray-600 mt-2 text-center">
                {t('harvest.weight_desc')}
              </p>
            </div>

            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-3">
                {t('harvest.notes_label')}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder={t('harvest.notes_placeholder')}
                className="w-full p-4 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !actualWeight || !isChecklistComplete}
              className={`w-full flex items-center justify-center space-x-3 px-8 py-4 font-bold text-lg rounded-xl shadow-lg transition-all ${submitting || !actualWeight || !isChecklistComplete
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700 text-white hover:shadow-xl transform hover:scale-105'
                }`}
            >
              <Award className="w-6 h-6" />
              <span>{submitting ? t('harvest.processing') : t('harvest.complete_btn')}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

