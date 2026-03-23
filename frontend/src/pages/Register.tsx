import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Leaf, ArrowRight, User, Mail, Lock } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

export default function Register() {
    const { t } = useTranslation();
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
                setError(t('auth.failed_register', { defaultValue: 'Failed to create account. Try a different username.' }));
            }
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
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-none">Urban<span className="text-emerald-400">Sims</span></h1>
                    </div>
                </div>

                <div className="relative z-10 max-w-lg mt-auto">
                    <span className="inline-block py-1 px-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold tracking-widest uppercase mb-6 backdrop-blur-md">
                        {t('header.slogan')}
                    </span>
                    <h2 className="text-5xl font-extrabold text-gray-900 dark:text-white mb-6 leading-[1.1] tracking-tight">
                        Start Growing.<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400 dark:from-emerald-400 dark:to-teal-300">
                            Join the Network.
                        </span>
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
                        Create an account to track your crops, predict yields, and optimize your operations with precision agriculture AI.
                    </p>
                </div>
            </div>

            {/* Right Side - Register Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 relative overflow-y-auto">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none z-0" />

                <div className="w-full max-w-md relative z-10 mt-8">
                    <div className="lg:hidden flex items-center mb-10 space-x-3 justify-center">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <Leaf className="w-7 h-7 text-white" />
                        </div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Urban<span className="text-emerald-400">Sims</span></h1>
                    </div>

                    <div className="mb-10 text-center lg:text-left">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-2">
                            {t('auth.create_account', { defaultValue: 'Create account' })}
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            {t('auth.already_have_account', { defaultValue: 'Already have an account?' })}{' '}
                            <Link to="/login" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 transition-colors">
                                {t('auth.sign_in', { defaultValue: 'Sign in' })}
                            </Link>
                        </p>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
                                    {t('auth.username', { defaultValue: 'Username' })}
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-[#1A1D27] border border-gray-200 dark:border-white/5 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 focus:bg-gray-50 dark:focus:bg-[#222634] transition-all shadow-sm dark:shadow-none"
                                        placeholder="Choose a username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
                                    {t('auth.email', { defaultValue: 'Email Address' })}
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-[#1A1D27] border border-gray-200 dark:border-white/5 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 focus:bg-gray-50 dark:focus:bg-[#222634] transition-all shadow-sm dark:shadow-none"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
                                    {t('auth.password', { defaultValue: 'Password' })}
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-[#1A1D27] border border-gray-200 dark:border-white/5 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 focus:bg-gray-50 dark:focus:bg-[#222634] transition-all shadow-sm dark:shadow-none"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Preference Mode Selection */}
                        <div className="bg-white dark:bg-[#1A1D27] p-5 rounded-2xl border border-gray-200 dark:border-white/5 mt-6 shadow-sm dark:shadow-none">
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">
                                {t('auth.i_am_a', { defaultValue: 'Select Account Type' })}
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                <label className={`cursor-pointer rounded-xl p-4 flex flex-col items-center text-center transition-all ${preferenceMode === 'home' ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]' : 'bg-gray-50 dark:bg-[#0E1015] border border-gray-200 dark:border-white/5 hover:border-emerald-500/20 dark:hover:border-white/10 dark:hover:bg-white/5'}`}>
                                    <input
                                        type="radio"
                                        name="preference"
                                        value="home"
                                        checked={preferenceMode === 'home'}
                                        onChange={(e) => setPreferenceMode(e.target.value)}
                                        className="sr-only"
                                    />
                                    <span className={`font-bold ${preferenceMode === 'home' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-300'}`}>
                                        {t('auth.home_grower', { defaultValue: 'Home Grower' })}
                                    </span>
                                    <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-wider">{t('auth.simple_tracking', { defaultValue: 'Simple Tracking' })}</span>
                                </label>

                                <label className={`cursor-pointer rounded-xl p-4 flex flex-col items-center text-center transition-all ${preferenceMode === 'pro' ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]' : 'bg-gray-50 dark:bg-[#0E1015] border border-gray-200 dark:border-white/5 hover:border-emerald-500/20 dark:hover:border-white/10 dark:hover:bg-white/5'}`}>
                                    <input
                                        type="radio"
                                        name="preference"
                                        value="pro"
                                        checked={preferenceMode === 'pro'}
                                        onChange={(e) => setPreferenceMode(e.target.value)}
                                        className="sr-only"
                                    />
                                    <span className={`font-bold ${preferenceMode === 'pro' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-300'}`}>
                                        {t('auth.professional', { defaultValue: 'Professional' })}
                                    </span>
                                    <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-wider">{t('auth.batch_management', { defaultValue: 'Batch Management' })}</span>
                                </label>
                            </div>
                        </div>

                        {error && (
                            <div className="text-red-600 dark:text-red-400 text-sm p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl flex items-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mr-2 animate-pulse" />
                                {error}
                            </div>
                        )}

                        <div className="pt-2 pb-8">
                            <button
                                type="submit"
                                disabled={loading}
                                className={`group relative w-full flex items-center justify-center py-4 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-[#0E1015] focus:ring-emerald-500 shadow-lg shadow-emerald-500/20 transition-all duration-300 ${loading ? 'opacity-75 cursor-not-allowed' : 'hover:-translate-y-0.5'}`}
                            >
                                <span>{loading ? t('auth.creating_account', { defaultValue: 'Creating Account...' }) : t('auth.create_account', { defaultValue: 'Create Account' })}</span>
                                {!loading && <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
