import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface CountResult {
    count: number;
    centroids: [number, number][];
    annotated_image_url: string;
    image_width: number;
    image_height: number;
    method: string;
    parameters: {
        conf_threshold?: number;
        color_type?: string;
        min_area?: number;
        max_area?: number;
    };
}

export default function PlantCounter() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [counting, setCounting] = useState(false);
    const [result, setResult] = useState<CountResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [colorType, setColorType] = useState<string>('green');

    const navigate = useNavigate();

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setResult(null);
            setError(null);
        }
    };

    const handleCount = async () => {
        if (!selectedFile) {
            setError('Please select an image first');
            return;
        }

        setCounting(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);

            const response = await api.post<CountResult>(
                '/api/count-plants',
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                    params: {
                        color_type: colorType,
                        min_area: 50,
                        max_area: 5000,
                    },
                }
            );

            setResult(response.data);
        } catch (err: any) {
            console.error('Count error:', err);
            const errorMessage = err.response?.data?.detail || 'Failed to count plants. Please try again.';
            console.error('Detailed error:', errorMessage);
            setError(errorMessage);
        } finally {
            setCounting(false);
        }
    };

    const handleReset = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        setResult(null);
        setError(null);
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
            padding: '40px 20px',
        }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <div style={{ fontSize: '64px', marginBottom: '16px' }}>🌱</div>
                    <h1 style={{
                        fontSize: '42px',
                        fontWeight: 'bold',
                        color: '#1f2937',
                        marginBottom: '12px',
                    }}>
                        Microgreen Plant Counter
                    </h1>
                    <p style={{ fontSize: '18px', color: '#6b7280' }}>
                        Upload a photo of your tray to count individual plants
                    </p>
                </div>

                {/* Main Card */}
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                    padding: '40px',
                }}>
                    {/* Color Type Selector */}
                    <div style={{ marginBottom: '30px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '16px',
                            fontWeight: '600',
                            color: '#374151',
                            marginBottom: '12px',
                        }}>
                            Microgreen Color Type
                        </label>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            {['green', 'red', 'purple'].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setColorType(type)}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        border: colorType === type ? '2px solid #16a34a' : '2px solid #d1d5db',
                                        backgroundColor: colorType === type ? '#f0fdf4' : 'white',
                                        borderRadius: '8px',
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        color: colorType === type ? '#16a34a' : '#6b7280',
                                        cursor: 'pointer',
                                        textTransform: 'capitalize',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* File Upload */}
                    {!previewUrl && (
                        <div style={{
                            border: '2px dashed #d1d5db',
                            borderRadius: '12px',
                            padding: '60px 20px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                        }}
                            onDragOver={(e) => {
                                e.preventDefault();
                                e.currentTarget.style.borderColor = '#16a34a';
                                e.currentTarget.style.backgroundColor = '#f0fdf4';
                            }}
                            onDragLeave={(e) => {
                                e.currentTarget.style.borderColor = '#d1d5db';
                                e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                            onDrop={(e) => {
                                e.preventDefault();
                                const file = e.dataTransfer.files[0];
                                if (file && file.type.startsWith('image/')) {
                                    setSelectedFile(file);
                                    setPreviewUrl(URL.createObjectURL(file));
                                }
                                e.currentTarget.style.borderColor = '#d1d5db';
                                e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                        >
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📸</div>
                            <p style={{ fontSize: '18px', color: '#374151', marginBottom: '12px' }}>
                                Drop your image here or click to browse
                            </p>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                style={{ display: 'none' }}
                                id="file-input"
                            />
                            <label htmlFor="file-input">
                                <button
                                    onClick={() => document.getElementById('file-input')?.click()}
                                    style={{
                                        padding: '12px 24px',
                                        backgroundColor: '#16a34a',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                    }}
                                >
                                    Choose Image
                                </button>
                            </label>
                        </div>
                    )}

                    {/* Image Preview */}
                    {previewUrl && !result && (
                        <div>
                            <img
                                src={previewUrl}
                                alt="Preview"
                                style={{
                                    width: '100%',
                                    borderRadius: '12px',
                                    marginBottom: '24px',
                                    maxHeight: '500px',
                                    objectFit: 'contain',
                                }}
                            />
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    onClick={handleReset}
                                    disabled={counting}
                                    style={{
                                        flex: 1,
                                        padding: '14px',
                                        border: '2px solid #d1d5db',
                                        backgroundColor: 'white',
                                        color: '#374151',
                                        borderRadius: '8px',
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        cursor: counting ? 'not-allowed' : 'pointer',
                                    }}
                                >
                                    Choose Different Image
                                </button>
                                <button
                                    onClick={handleCount}
                                    disabled={counting}
                                    style={{
                                        flex: 1,
                                        padding: '14px',
                                        backgroundColor: counting ? '#9ca3af' : '#16a34a',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        cursor: counting ? 'not-allowed' : 'pointer',
                                    }}
                                >
                                    {counting ? 'Counting...' : '🔍 Count Plants'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Results */}
                    {result && (
                        <div>
                            <div style={{
                                backgroundColor: '#f0fdf4',
                                border: '2px solid #16a34a',
                                borderRadius: '12px',
                                padding: '24px',
                                marginBottom: '24px',
                                textAlign: 'center',
                            }}>
                                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🌱</div>
                                <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#16a34a', marginBottom: '8px' }}>
                                    {result.count}
                                </div>
                                <div style={{ fontSize: '18px', color: '#374151' }}>
                                    Plants Detected
                                </div>
                            </div>

                            <img
                                src={`${api.defaults.baseURL}${result.annotated_image_url}`}
                                alt="Annotated result"
                                style={{
                                    width: '100%',
                                    borderRadius: '12px',
                                    marginBottom: '24px',
                                    border: '2px solid #e5e7eb',
                                }}
                            />

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '16px',
                                marginBottom: '24px',
                                padding: '20px',
                                backgroundColor: '#f9fafb',
                                borderRadius: '8px',
                            }}>
                                <div>
                                    <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Detection Method</div>
                                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', textTransform: 'capitalize' }}>
                                        {result.method} {result.method === 'YOLO' && '🎯'}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Image Size</div>
                                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                                        {result.image_width} × {result.image_height}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleReset}
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
                                }}
                            >
                                Count Another Image
                            </button>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div style={{
                            backgroundColor: '#fef2f2',
                            border: '2px solid #ef4444',
                            borderRadius: '8px',
                            padding: '16px',
                            marginTop: '16px',
                        }}>
                            <div style={{ color: '#dc2626', fontSize: '16px' }}>
                                ⚠️ {error}
                            </div>
                        </div>
                    )}
                </div>

                {/* Back Button */}
                <div style={{ textAlign: 'center', marginTop: '24px' }}>
                    <button
                        onClick={() => navigate('/')}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: 'white',
                            color: '#374151',
                            border: '2px solid #d1d5db',
                            borderRadius: '8px',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: 'pointer',
                        }}
                    >
                        ← Back to Home
                    </button>
                </div>
            </div>
        </div>
    );
}
