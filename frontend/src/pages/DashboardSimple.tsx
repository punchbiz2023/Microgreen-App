import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface Crop {
  id: number;
  seed_id: number;
  start_date: string;
  watering_frequency: number;
  status: string;
  seed: {
    name: string;
    growth_days: number;
    blackout_days: number;
    avg_yield_grams: number;
  };
}

interface DailyLog {
  id: number;
  day_number: number;
  watered: boolean;
  temperature: number;
  humidity: number;
  predicted_yield?: number;
}

export default function DashboardSimple() {
  const { cropId } = useParams<{ cropId: string }>();
  const navigate = useNavigate();

  const [crop, setCrop] = useState<Crop | null>(null);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (cropId) {
      loadData();
    }
  }, [cropId]);

  const loadData = async () => {
    try {
      const [cropRes, logsRes] = await Promise.all([
        fetch(`http://localhost:8000/api/crops/${cropId}`),
        fetch(`http://localhost:8000/api/crops/${cropId}/logs`)
      ]);

      const cropData = await cropRes.json();
      const logsData = await logsRes.json();

      setCrop(cropData);
      setLogs(logsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !crop) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '24px', color: '#16a34a' }}>Loading...</div>
      </div>
    );
  }

  const daysSinceStart = Math.floor((new Date().getTime() - new Date(crop.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const currentDay = Math.min(daysSinceStart, crop.seed.growth_days);
  const loggedDays = logs.map(l => l.day_number);
  const latestLog = logs.length > 0 ? logs[logs.length - 1] : null;

  const getPhase = (day: number) => {
    if (day <= crop.seed.blackout_days) return 'Blackout Phase';
    return 'Light Phase';
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0fdf4', padding: '20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '30px' }}>
          <button
            onClick={() => navigate('/atlas')}
            style={{
              padding: '10px 20px',
              backgroundColor: 'white',
              border: '2px solid #d1d5db',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              marginBottom: '20px'
            }}
          >
            ← Back to Atlas
          </button>

          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: '#1f2937', margin: '0 0 8px 0' }}>
              🌱 {crop.seed.name} Crop
            </h1>
            <p style={{ color: '#6b7280' }}>
              Started on {new Date(crop.start_date).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
          {/* Timeline */}
          <div>
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>Growth Timeline</h3>

              <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '10px' }}>
                {Array.from({ length: crop.seed.growth_days }, (_, i) => i + 1).map((day) => {
                  const isLogged = loggedDays.includes(day);
                  const isCurrent = day === currentDay;
                  const isFuture = day > currentDay;

                  let bgColor = '#d1d5db';
                  let textColor = 'white';
                  let border = 'none';

                  if (isLogged) {
                    bgColor = '#22c55e';
                  } else if (isCurrent) {
                    bgColor = '#3b82f6';
                    border = '3px solid #93c5fd';
                  } else if (!isFuture && !isLogged) {
                    bgColor = '#ef4444';
                  }

                  return (
                    <div key={day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div
                        style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '50%',
                          backgroundColor: bgColor,
                          color: textColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          fontSize: '18px',
                          border: border,
                          animation: isCurrent ? 'pulse 2s infinite' : 'none'
                        }}
                      >
                        {isLogged ? '✓' : day}
                      </div>
                      <span style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
                        Day {day}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '16px', fontSize: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#22c55e' }}></div>
                  <span>Logged</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#ef4444' }}></div>
                  <span>Missed</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#3b82f6' }}></div>
                  <span>Current</span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div style={{ textAlign: 'center' }}>
              {currentDay >= crop.seed.growth_days ? (
                <button
                  style={{
                    padding: '16px 32px',
                    backgroundColor: '#9333ea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                  onClick={() => alert('Harvest page coming soon!')}
                >
                  🎉 Harvest Now
                </button>
              ) : loggedDays.includes(currentDay) ? (
                <div style={{
                  padding: '16px 32px',
                  backgroundColor: '#9ca3af',
                  color: 'white',
                  borderRadius: '12px',
                  fontSize: '18px',
                  fontWeight: 'bold'
                }}>
                  ✓ Day {currentDay} Logged
                </div>
              ) : (
                <button
                  style={{
                    padding: '16px 32px',
                    backgroundColor: '#16a34a',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                  onClick={() => navigate(`/log/${cropId}/${currentDay}`)}
                >
                  📝 Log Day {currentDay}
                </button>
              )}
            </div>
          </div>

          {/* Status Card */}
          <div>
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px' }}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
                  Day {currentDay} of {crop.seed.growth_days}
                </h2>
                <div style={{
                  display: 'inline-block',
                  padding: '8px 16px',
                  backgroundColor: '#dbeafe',
                  color: '#1e40af',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  {getPhase(currentDay)}
                </div>
              </div>

              {/* Yield Prediction */}
              {latestLog?.predicted_yield ? (
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                    AI Predicted Yield
                  </div>
                  <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#16a34a' }}>
                    {Math.round(latestLog.predicted_yield)}g
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                    of {crop.seed.avg_yield_grams}g base
                  </div>
                </div>
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '32px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  marginBottom: '24px'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>🤖</div>
                  <div style={{ color: '#6b7280', fontSize: '14px' }}>
                    Log your first day to get AI yield predictions!
                  </div>
                </div>
              )}

              {/* Stats */}
              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>
                  Progress Stats
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6b7280' }}>Days Logged:</span>
                    <span style={{ fontWeight: '600', color: '#22c55e' }}>{logs.length}/{currentDay}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6b7280' }}>Days Remaining:</span>
                    <span style={{ fontWeight: '600' }}>{crop.seed.growth_days - currentDay}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6b7280' }}>Completion:</span>
                    <span style={{ fontWeight: '600', color: '#3b82f6' }}>
                      {Math.round((currentDay / crop.seed.growth_days) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

