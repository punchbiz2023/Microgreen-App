import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Seed {
  id: number;
  seed_type: string;
  name: string;
  difficulty: string;
  avg_yield_grams: number;
  growth_days: number;
  ideal_temp: number;
  ideal_humidity: number;
  description?: string;
}

export default function AtlasSimple() {
  const [seeds, setSeeds] = useState<Seed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSeed, setSelectedSeed] = useState<Seed | null>(null);
  const [showModal, setShowModal] = useState(false);
  
  // Customization options
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [wateringFrequency, setWateringFrequency] = useState(2);
  const [traySize, setTraySize] = useState('10x20 inch');
  const [submitting, setSubmitting] = useState(false);
  
  const navigate = useNavigate();
  
  useEffect(() => {
    loadSeeds();
  }, []);
  
  const loadSeeds = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/seeds');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setSeeds(data);
    } catch (error) {
      console.error('Failed to load seeds:', error);
      setError('Failed to load seeds. Make sure backend is running on port 8000.');
    } finally {
      setLoading(false);
    }
  };
  
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return '#22c55e';
      case 'medium': return '#eab308';
      case 'hard': return '#ef4444';
      default: return '#6b7280';
    }
  };
  
  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f0fdf4'
      }}>
        <div style={{ fontSize: '24px', color: '#16a34a' }}>Loading seeds...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#fef2f2',
        padding: '20px'
      }}>
        <div style={{ 
          backgroundColor: 'white', 
          padding: '40px', 
          borderRadius: '12px',
          maxWidth: '500px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
          <div style={{ fontSize: '20px', color: '#dc2626', marginBottom: '10px' }}>
            {error}
          </div>
          <button 
            onClick={loadSeeds}
            style={{
              marginTop: '20px',
              padding: '12px 24px',
              backgroundColor: '#16a34a',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div style={{ 
      minHeight: '100vh', 
      padding: '40px 20px',
      backgroundColor: '#f0fdf4'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>🌱</div>
          <h1 style={{ 
            fontSize: '48px', 
            fontWeight: 'bold', 
            color: '#1f2937',
            marginBottom: '12px'
          }}>
            Microgreens Atlas
          </h1>
          <p style={{ fontSize: '18px', color: '#6b7280' }}>
            Choose your seeds and start growing with AI-powered guidance
          </p>
        </div>
        
        {/* Seeds Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '24px'
        }}>
          {seeds.map((seed) => (
            <div
              key={seed.id}
              style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 10px 15px rgba(0, 0, 0, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
              }}
            >
              {/* Header with gradient */}
              <div style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                height: '120px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '72px'
              }}>
                🌱
              </div>
              
              {/* Content */}
              <div style={{ padding: '24px' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  marginBottom: '12px'
                }}>
                  <h3 style={{ 
                    fontSize: '24px', 
                    fontWeight: 'bold', 
                    color: '#1f2937',
                    margin: 0
                  }}>
                    {seed.name}
                  </h3>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    backgroundColor: getDifficultyColor(seed.difficulty) + '20',
                    color: getDifficultyColor(seed.difficulty),
                    border: `2px solid ${getDifficultyColor(seed.difficulty)}`
                  }}>
                    {seed.difficulty}
                  </span>
                </div>
                
                <p style={{ 
                  color: '#6b7280', 
                  fontSize: '14px',
                  marginBottom: '16px',
                  minHeight: '40px'
                }}>
                  {seed.description}
                </p>
                
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ 
                    fontSize: '14px', 
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    📊 <strong>Avg Yield:</strong> {seed.avg_yield_grams}g
                  </div>
                  <div style={{ 
                    fontSize: '14px', 
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    📅 <strong>Growth Time:</strong> {seed.growth_days} days
                  </div>
                  <div style={{ 
                    fontSize: '14px', 
                    color: '#374151'
                  }}>
                    🌡️ <strong>Ideal:</strong> {seed.ideal_temp}°C, {seed.ideal_humidity}% humidity
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    setSelectedSeed(seed);
                    setShowModal(true);
                  }}
                  style={{
                    width: '100%',
                    padding: '14px',
                    backgroundColor: '#16a34a',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#15803d';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#16a34a';
                  }}
                >
                  Grow This
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {seeds.length === 0 && !loading && (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px', 
            color: '#6b7280',
            fontSize: '18px'
          }}>
            No seeds available. Backend may not be running.
          </div>
        )}
      </div>
      
      {/* Customization Modal */}
      {showModal && selectedSeed && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 50
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            maxWidth: '500px',
            width: '100%',
            padding: '32px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '24px'
            }}>
              Setup Your {selectedSeed.name} Crop
            </h2>
            
            {/* Watering Frequency */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '12px'
              }}>
                Watering Commitment
              </label>
              
              <button
                onClick={() => setWateringFrequency(1)}
                style={{
                  width: '100%',
                  padding: '16px',
                  marginBottom: '8px',
                  border: wateringFrequency === 1 ? '2px solid #16a34a' : '2px solid #d1d5db',
                  backgroundColor: wateringFrequency === 1 ? '#f0fdf4' : 'white',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ fontWeight: '600', color: '#1f2937' }}>Once Daily</div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>Morning watering</div>
              </button>
              
              <button
                onClick={() => setWateringFrequency(2)}
                style={{
                  width: '100%',
                  padding: '16px',
                  border: wateringFrequency === 2 ? '2px solid #16a34a' : '2px solid #d1d5db',
                  backgroundColor: wateringFrequency === 2 ? '#f0fdf4' : 'white',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ fontWeight: '600', color: '#1f2937' }}>Twice Daily</div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>Morning & Evening</div>
              </button>
            </div>
            
            {/* Start Date */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
              />
              <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                Select today or a past date if you already started
              </p>
            </div>
            
            {/* Tray Size */}
            <div style={{ marginBottom: '32px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Tray Size (Optional)
              </label>
              <input
                type="text"
                value={traySize}
                onChange={(e) => setTraySize(e.target.value)}
                placeholder="e.g., 10x20 inch"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
              />
            </div>
            
            {/* Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedSeed(null);
                }}
                disabled={submitting}
                style={{
                  flex: 1,
                  padding: '14px',
                  border: '2px solid #d1d5db',
                  backgroundColor: 'white',
                  color: '#374151',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: submitting ? 'not-allowed' : 'pointer'
                }}
              >
                Cancel
              </button>
              
              <button
                onClick={async () => {
                  setSubmitting(true);
                  try {
                    const response = await fetch('http://localhost:8000/api/crops', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        seed_id: selectedSeed.id,
                        start_date: startDate,
                        watering_frequency: wateringFrequency,
                        tray_size: traySize
                      })
                    });
                    
                    if (!response.ok) throw new Error('Failed to create crop');
                    
                    const data = await response.json();
                    // Navigate to dashboard
                    navigate(`/dashboard/${data.id}`);
                  } catch (error) {
                    console.error('Failed to create crop:', error);
                    alert('Failed to create crop. Please try again.');
                  } finally {
                    setSubmitting(false);
                  }
                }}
                disabled={submitting}
                style={{
                  flex: 1,
                  padding: '14px',
                  backgroundColor: submitting ? '#9ca3af' : '#16a34a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: submitting ? 'not-allowed' : 'pointer'
                }}
              >
                {submitting ? 'Creating...' : 'Confirm & Start'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

