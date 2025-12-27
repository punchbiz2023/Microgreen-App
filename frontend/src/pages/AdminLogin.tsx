import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock } from 'lucide-react';
import axios from 'axios';
import api from '../services/api';

export default function AdminLogin() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // 1. Authenticate (Get Token)
            const formData = new FormData();
            formData.append('username', username);
            formData.append('password', password);

            // Note: Using direct axios call for token endpoint usually, or api instance if base URL matched
            // Login.tsx used 'http://localhost:8000/api/auth/token'
            // We should use relative path if proxy is set, or same absolute path. 
            // Let's use relative '/api/auth/token' and hope Vite proxy or axios base URL handles it.
            // If Login.tsx uses hardcoded localhost:8000, I should probably do same or fix both.
            // api.ts has axios instance. Let's try using that.

            const tokenRes = await axios.post('http://localhost:8000/api/auth/token', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const { access_token } = tokenRes.data;

            // 2. Verify Role (Using the new token)
            // We need to pass the token explicitly because auth context isn't updated yet
            const userRes = await axios.get('http://localhost:8000/api/users/me', {
                headers: { Authorization: `Bearer ${access_token}` }
            });

            if (userRes.data.role !== 'admin') {
                setError('Access Denied: You are not an administrator.');
                setLoading(false);
                return;
            }

            // 3. Success - Update Context and Redirect
            login(access_token, username);
            navigate('/admin');

        } catch (err: any) {
            console.error(err);
            if (err.response && err.response.status === 401) {
                setError('Invalid username or password');
            } else {
                setError('Login failed. Server might be unreachable.');
            }
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-gray-800 rounded-2xl shadow-xl border border-gray-700 overflow-hidden">
                <div className="p-8">
                    <div className="text-center mb-10">
                        <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-900/50">
                            <ShieldCheck className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-3xl font-bold text-white">Admin Console</h2>
                        <p className="text-gray-400 mt-2">Restricted Access Only</p>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg p-3 mb-6 text-sm text-center font-bold">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                placeholder="admin"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Password</label>
                            <div className="relative">
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    placeholder="••••••••"
                                />
                                <Lock className="absolute right-3 top-3 text-gray-500 w-5 h-5" />
                            </div>
                        </div>

                        <button
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-lg shadow-lg shadow-blue-900/30 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Authenticating...' : 'Enter System'}
                        </button>
                    </form>
                </div>
                <div className="px-8 py-4 bg-gray-900/50 border-t border-gray-700 text-center">
                    <a href="/" className="text-gray-500 hover:text-white text-sm font-medium transition-colors">← Back to Standard Site</a>
                </div>
            </div>
        </div>
    );
}
