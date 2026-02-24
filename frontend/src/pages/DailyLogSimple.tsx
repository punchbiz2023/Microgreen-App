import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface Crop {
  id: number;
  seed: {
    name: string;
    ideal_temp: number;
    ideal_humidity: number;
    blackout_days: number;
  };
}

export default function DailyLogSimple() {
  const { cropId, day } = useParams<{ cropId: string; day: string }>();
  const navigate = useNavigate();

  const [crop, setCrop] = useState<Crop | null>(null);
  const [watered, setWatered] = useState(true);
  const [temperature, setTemperature] = useState(22);
  const [humidity, setHumidity] = useState(50);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (cropId) {
      loadCrop();
    }
  }, [cropId]);

  const loadCrop = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/crops/${cropId}`);
      const data = await response.json();
      setCrop(data);

      // Set defaults based on ideal conditions
      setTemperature(data.seed.ideal_temp);
      setHumidity(data.seed.ideal_humidity);
    } catch (error) {
      console.error('Failed to load crop:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cropId || !day) return;

    try {
      setSubmitting(true);

      const response = await fetch(`http://localhost:8000/api/crops/${cropId}/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          day_number: parseInt(day),
          watered,
          temperature,
          humidity,
          notes: notes || undefined
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to submit log');
      }

      // Navigate back to dashboard
      navigate(`/dashboard/${cropId}`);
    } catch (error: any) {
      console.error('Failed to submit log:', error);
      alert(error.message || 'Failed to submit log. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!crop) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '24px', color: '#16a34a' }}>Loading...</div>
      </div>
    );
  }

  const getTempColor = () => {
    const diff = Math.abs(temperature - crop.seed.ideal_temp);
    if (diff <= 1) return '#22c55e';
    if (diff <= 3) return '#eab308';
    return '#ef4444';
  };

  const getHumidityColor = () => {
    const diff = Math.abs(humidity - crop.seed.ideal_humidity);
    if (diff <= 5) return '#22c55e';
    if (diff <= 10) return '#eab308';
    return '#ef4444';
  };

  const phase = parseInt(day!) <= crop.seed.blackout_days ? 'Blackout Phase' : 'Light Phase';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0fdf4', padding: '20px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <button
          onClick={() => navigate(`/dashboard/${cropId}`)}
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
          ← Back to Dashboard
        </button>

        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
              Log Day {day}
            </h1>
            <p style={{ color: '#6b7280' }}>
              {crop.seed.name} - {phase}
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {/* Watering */}
            <div>
              <label style={{ display: 'block', fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '12px' }}>
                💧 Did you water the plants today?
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setWatered(true)}
                  style={{
                    flex: 1,
                    padding: '16px',
                    border: watered ? '2px solid #22c55e' : '2px solid #d1d5db',
                    backgroundColor: watered ? '#f0fdf4' : 'white',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    color: watered ? '#16a34a' : '#6b7280'
                  }}
                >
                  ✓ Yes, I watered
                </button>
                <button
                  type="button"
                  onClick={() => setWatered(false)}
                  style={{
                    flex: 1,
                    padding: '16px',
                    border: !watered ? '2px solid #ef4444' : '2px solid #d1d5db',
                    backgroundColor: !watered ? '#fef2f2' : 'white',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    color: !watered ? '#dc2626' : '#6b7280'
                  }}
                >
                  ✗ No, I didn't
                </button>
              </div>
            </div>

            {/* Temperature */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <label style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                  🌡️ Temperature
                </label>
                <span style={{ fontSize: '32px', fontWeight: 'bold', color: getTempColor() }}>
                  {temperature}°C
                </span>
              </div>

              <input
                type="range"
                min="15"
                max="35"
                step="0.5"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                style={{ width: '100%', height: '8px', cursor: 'pointer' }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
                <span>15°C</span>
                <span style={{ fontWeight: '600' }}>Ideal: {crop.seed.ideal_temp}°C</span>
                <span>35°C</span>
              </div>

              {Math.abs(temperature - crop.seed.ideal_temp) > 3 && (
                <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#fef3c7', border: '1px solid #fbbf24', borderRadius: '8px' }}>
                  <p style={{ fontSize: '14px', color: '#92400e', margin: 0 }}>
                    ⚠️ Temperature is outside ideal range. This may affect yield.
                  </p>
                </div>
              )}
            </div>

            {/* Humidity */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <label style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                  💨 Humidity
                </label>
                <span style={{ fontSize: '32px', fontWeight: 'bold', color: getHumidityColor() }}>
                  {humidity}%
                </span>
              </div>

              <input
                type="range"
                min="25"
                max="85"
                step="1"
                value={humidity}
                onChange={(e) => setHumidity(parseInt(e.target.value))}
                style={{ width: '100%', height: '8px', cursor: 'pointer' }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
                <span>25%</span>
                <span style={{ fontWeight: '600' }}>Ideal: {crop.seed.ideal_humidity}%</span>
                <span>85%</span>
              </div>

              {Math.abs(humidity - crop.seed.ideal_humidity) > 15 && (
                <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#fef3c7', border: '1px solid #fbbf24', borderRadius: '8px' }}>
                  <p style={{ fontSize: '14px', color: '#92400e', margin: 0 }}>
                    ⚠️ Humidity is outside ideal range. Adjust ventilation or misting.
                  </p>
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label style={{ display: 'block', fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>
                📝 Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Any observations? (e.g., 'Leaves looking vibrant', 'Noticed some yellowing')"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '16px',
                backgroundColor: submitting ? '#9ca3af' : '#16a34a',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: submitting ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s'
              }}
            >
              {submitting ? '⏳ Submitting...' : '✓ Submit Log & Get AI Prediction'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

