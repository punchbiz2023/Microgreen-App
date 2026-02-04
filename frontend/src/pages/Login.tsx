import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Leaf } from 'lucide-react';

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
                                    <span className="text-3xl font-extrabold text-gray-900 tracking-tight leading-none">{t('header.brand_urban')}</span>
                                    <span className="text-3xl font-light text-green-500 tracking-tight leading-none ml-1">{t('header.brand_sims')}</span>
                                </div>
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em] leading-none mt-2 block">{t('header.slogan')}</span>
                            </div>
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        {t('auth.sign_in_to_account')}
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        {t('auth.or')}{' '}
                        <Link to="/register" className="font-medium text-green-500 hover:text-green-400">
                            {t('auth.create_new_account')}
                        </Link>
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <input
                                type="text"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-green-400 focus:border-green-400 focus:z-10 sm:text-sm"
                                placeholder={t('auth.username')}
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                        <div>
                            <input
                                type="password"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-green-400 focus:border-green-400 focus:z-10 sm:text-sm"
                                placeholder={t('auth.password')}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">
                            {error}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-400 transition-colors ${loading ? 'opacity-75 cursor-not-allowed' : ''
                                }`}
                        >
                            {loading ? t('auth.signing_in') : t('auth.sign_in')}
                        </button>
                    </div>

                    <div className="text-center text-xs text-gray-400">
                        {t('auth.debug_login')}
                    </div>
                </form>
            </div>
        </div>
    );
}
