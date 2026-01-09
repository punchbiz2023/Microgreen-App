import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Leaf } from 'lucide-react';

export default function Register() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [preferenceMode, setPreferenceMode] = useState('home');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth(); // We can login immediately after register

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // 1. Register
            await axios.post('http://localhost:8000/api/auth/register', {
                username,
                email,
                password,
                preference_mode: preferenceMode
            });

            // 2. Login immediately
            const formData = new FormData();
            formData.append('username', username);
            formData.append('password', password);

            const loginResponse = await axios.post('http://localhost:8000/api/auth/token', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const { access_token } = loginResponse.data;
            login(access_token, username);

            navigate('/');
        } catch (err: any) {
            console.error(err);
            if (axios.isAxiosError(err) && err.response?.data?.detail) {
                setError(err.response.data.detail);
            } else {
                setError('Failed to create account. Try a different username.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
                <div className="text-center">
                    <div className="flex justify-center mb-6">
                        <div className="flex items-center group">
                            <div className="bg-gradient-to-br from-green-400 to-emerald-500 p-3 rounded-2xl shadow-lg transform -rotate-6">
                                <Leaf className="h-8 w-8 text-white" />
                            </div>
                            <div className="ml-4 text-left">
                                <div className="flex items-center">
                                    <span className="text-3xl font-extrabold text-gray-900 tracking-tight leading-none">Urban</span>
                                    <span className="text-3xl font-light text-green-500 tracking-tight leading-none ml-1">Sims</span>
                                </div>
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em] leading-none mt-2 block">Professional Growth</span>
                            </div>
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        Create an account
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Already have an account?{' '}
                        <Link to="/login" className="font-medium text-green-500 hover:text-green-400">
                            Sign in
                        </Link>
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <input
                                type="text"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-xl focus:outline-none focus:ring-green-400 focus:border-green-400 focus:z-10 sm:text-sm"
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                        <div>
                            <input
                                type="email"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-400 focus:border-green-400 focus:z-10 sm:text-sm"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <input
                                type="password"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-xl focus:outline-none focus:ring-green-400 focus:border-green-400 focus:z-10 sm:text-sm"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Preference Mode Selection */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <label className="block text-sm font-medium text-gray-700 mb-3">I am a...</label>
                        <div className="grid grid-cols-2 gap-3">
                            <label className={`cursor-pointer border rounded-lg p-3 flex flex-col items-center text-center transition-all ${preferenceMode === 'home' ? 'bg-white border-green-400 shadow-sm ring-1 ring-green-400' : 'bg-transparent border-gray-300 hover:bg-white'}`}>
                                <input
                                    type="radio"
                                    name="preference"
                                    value="home"
                                    checked={preferenceMode === 'home'}
                                    onChange={(e) => setPreferenceMode(e.target.value)}
                                    className="sr-only"
                                />
                                <span className="font-bold text-gray-900">Home Grower</span>
                                <span className="text-xs text-gray-500 mt-1">Simple tracking</span>
                            </label>

                            <label className={`cursor-pointer border rounded-lg p-3 flex flex-col items-center text-center transition-all ${preferenceMode === 'pro' ? 'bg-white border-green-400 shadow-sm ring-1 ring-green-400' : 'bg-transparent border-gray-300 hover:bg-white'}`}>
                                <input
                                    type="radio"
                                    name="preference"
                                    value="pro"
                                    checked={preferenceMode === 'pro'}
                                    onChange={(e) => setPreferenceMode(e.target.value)}
                                    className="sr-only"
                                />
                                <span className="font-bold text-gray-900">Professional</span>
                                <span className="text-xs text-gray-500 mt-1">Batch management</span>
                            </label>
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-400 transition-colors ${loading ? 'opacity-75 cursor-not-allowed' : ''
                            }`}
                    >
                        {loading ? 'Creating account...' : 'Create Account'}
                    </button>
                </form>
            </div>
        </div>
    );
}
