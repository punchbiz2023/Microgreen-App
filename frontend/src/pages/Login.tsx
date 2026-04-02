import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Leaf, ArrowRight } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

export default function Login() {
    const { t } = useTranslation();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('username', username);
            formData.append('password', password);

            const response = await api.post('/api/auth/token', formData, {
                headers: { 'Content-Type': 'multipart/form-data' } // OAuth2 expects form data
            });

            const { access_token } = response.data;
            login(access_token, username);
            navigate('/'); // Go to home or dashboard
        } catch (err: any) {
            console.error(err);
            setError(t('auth.invalid_credentials'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0E1015] flex m-0 p-0 overflow-hidden font-sans selection:bg-emerald-500/30 transition-colors duration-300">
            {/* Theme Toggle - Fixed in corner */}
            <div className="absolute top-6 right-6 z-50">
                <ThemeToggle />
            </div>

            {/* Left Side - Image/Brand */}
            <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden items-start">
                {/* Background Image with Overlay */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1591857177580-dc82b9ac4e10?q=80&w=2564&auto=format&fit=crop"
                        alt="Lush microgreens"
                        className="w-full h-full object-cover object-center opacity-40 scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 via-transparent to-transparent dark:from-[#0E1015]/90 dark:via-[#0E1015]/60 dark:to-emerald-900/40 mix-blend-multiply" />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-50 via-transparent to-transparent dark:from-[#0E1015]" />
                </div>

                <div className="relative z-10 flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <Leaf className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-none">Microgreens<span className="text-emerald-400">Tracker</span></h1>
                    </div>
                </div>

                <div className="relative z-10 max-w-lg mt-auto">
                    <span className="inline-block py-1 px-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold tracking-widest uppercase mb-6 backdrop-blur-md">
                        {t('header.slogan')}
                    </span>
                    <h2 className="text-5xl font-extrabold text-gray-900 dark:text-white mb-6 leading-[1.1] tracking-tight">
                        Grow Smarter.<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400 dark:from-emerald-400 dark:to-teal-300">
                            Scale Faster.
                        </span>
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
                        Join the next generation of precision agriculture. Manage your crops, analyze yields, and forecast profits with our pro-grade tools.
                    </p>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 relative">
                {/* Ambient Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none z-0" />

                <div className="w-full max-w-md relative z-10">
                    <div className="lg:hidden flex items-center mb-12 space-x-3 justify-center">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <Leaf className="w-7 h-7 text-white" />
                        </div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Microgreens<span className="text-emerald-400">Tracker</span></h1>
                    </div>

                    <div className="mb-10 text-center lg:text-left">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-2">
                            {t('auth.sign_in_to_account', { defaultValue: 'Welcome back' })}
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            {t('auth.or', { defaultValue: 'Don\'t have an account?' })}{' '}
                            <Link to="/register" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 transition-colors">
                                {t('auth.create_new_account', { defaultValue: 'Register for pro access' })}
                            </Link>
                        </p>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
                                    {t('auth.username', { defaultValue: 'Username' })}
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-3.5 bg-white dark:bg-[#1A1D27] border border-gray-200 dark:border-white/5 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 focus:bg-gray-50 dark:focus:bg-[#222634] transition-all shadow-sm dark:shadow-none"
                                    placeholder="Enter your username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
                                    {t('auth.password', { defaultValue: 'Password' })}
                                </label>
                                <input
                                    type="password"
                                    required
                                    className="w-full px-4 py-3.5 bg-white dark:bg-[#1A1D27] border border-gray-200 dark:border-white/5 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 focus:bg-gray-50 dark:focus:bg-[#222634] transition-all shadow-sm dark:shadow-none"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="text-red-600 dark:text-red-400 text-sm p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl flex items-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mr-2 animate-pulse" />
                                {error}
                            </div>
                        )}

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className={`group relative w-full flex items-center justify-center py-4 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-[#0E1015] focus:ring-emerald-500 shadow-lg shadow-emerald-500/20 transition-all duration-300 ${loading ? 'opacity-75 cursor-not-allowed' : 'hover:-translate-y-0.5'}`}
                            >
                                <span>{loading ? t('auth.signing_in', { defaultValue: 'Authenticating...' }) : t('auth.sign_in', { defaultValue: 'Sign in to Dashboard' })}</span>
                                {!loading && <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
