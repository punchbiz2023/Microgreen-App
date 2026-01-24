import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, LogOut, Home as HomeIcon, Leaf, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

export default function Header() {
    const location = useLocation();
    const { t, i18n } = useTranslation();
    const { isAuthenticated, logout, user } = useAuth();

    const isActive = (path: string) => location.pathname === path;

    const toggleLanguage = () => {
        const newLang = i18n.language === 'ta' ? 'en' : 'ta';
        i18n.changeLanguage(newLang);
    };

    return (
        <header className="bg-white shadow-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* Logo / Brand */}
                    <div className="flex">
                        <Link to="/" className="flex-shrink-0 flex items-center group">
                            <div className="bg-gradient-to-br from-green-400 to-emerald-500 p-2 rounded-xl shadow-lg group-hover:shadow-green-300/50 transition-all duration-300 transform group-hover:-rotate-6">
                                <Leaf className="h-6 w-6 text-white" />
                            </div>
                            <div className="ml-3 flex flex-col justify-center">
                                <div className="flex items-center">
                                    <span className="text-xl font-extrabold text-gray-900 tracking-tight leading-none">Urban</span>
                                    <span className="text-xl font-light text-green-400 tracking-tight leading-none ml-0.5">Sims</span>
                                </div>
                                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.2em] leading-none mt-1.5 overflow-hidden whitespace-nowrap">{t('header.slogan')}</span>
                            </div>
                        </Link>
                    </div>

                    {/* Navigation Links */}
                    <div className="hidden sm:flex sm:space-x-8">
                        <Link
                            to="/"
                            className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${isActive('/')
                                ? 'border-green-400 text-gray-900'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <HomeIcon className="w-4 h-4 mr-2" />
                            {t('header.home')}
                        </Link>

                        <Link
                            to="/atlas"
                            className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${isActive('/atlas')
                                ? 'border-green-400 text-gray-900'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <LayoutDashboard className="w-4 h-4 mr-2" />
                            {t('header.atlas')}
                        </Link>

                        <Link
                            to="/my-plants"
                            className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${isActive('/my-plants')
                                ? 'border-green-400 text-gray-900'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <Leaf className="w-4 h-4 mr-2" />
                            {t('header.my_plants')}
                        </Link>
                    </div>

                    {/* User/Auth Section */}
                    <div className="flex items-center space-x-6">
                        {/* Language Switcher */}
                        <button
                            onClick={toggleLanguage}
                            className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-gray-50 hover:bg-green-50 text-gray-600 hover:text-green-600 border border-gray-200 hover:border-green-200 transition-all duration-300"
                            title="Switch Language"
                        >
                            <Globe className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">
                                {i18n.language === 'ta' ? 'English' : 'தமிழ்'}
                            </span>
                        </button>

                        {isAuthenticated ? (
                            <div className="flex items-center space-x-4">
                                <span className="text-sm font-medium text-gray-700">
                                    {t('header.welcome', { name: user?.username })}
                                </span>
                                <button
                                    onClick={logout}
                                    className="flex items-center text-sm font-medium text-gray-500 hover:text-red-600 transition-colors"
                                >
                                    <LogOut className="w-4 h-4 mr-1" />
                                    {t('header.logout')}
                                </button>
                            </div>
                        ) : (
                            <div className="hidden sm:flex items-center space-x-4">
                                <Link to="/login" className="text-gray-500 hover:text-green-500 font-medium text-sm">
                                    {t('header.login')}
                                </Link>
                                <Link to="/register" className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md transition-all hover:shadow-lg">
                                    {t('header.get_started')}
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
