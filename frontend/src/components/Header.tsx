import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, LogOut, Home as HomeIcon, Leaf, Globe, BarChart3, Menu, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

export default function Header() {
    const location = useLocation();
    const { t, i18n } = useTranslation();
    const { isAuthenticated, logout, user } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const isActive = (path: string) => location.pathname === path;

    const toggleLanguage = () => {
        const newLang = i18n.language === 'ta' ? 'en' : 'ta';
        i18n.changeLanguage(newLang);
    };

    const navLinks = [
        { path: '/', label: t('header.home'), icon: HomeIcon },
        { path: '/atlas', label: t('header.atlas'), icon: LayoutDashboard },
        { path: '/my-plants', label: t('header.my_plants'), icon: Leaf },
        { path: '/analytics', label: t('header.analytics'), icon: BarChart3 },
    ];

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

                    {/* Navigation Links - Desktop */}
                    <div className="hidden sm:flex sm:space-x-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${isActive(link.path)
                                    ? 'border-green-400 text-gray-900'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                <link.icon className="w-4 h-4 mr-2" />
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* User/Auth Section & Mobile Menu Toggle */}
                    <div className="flex items-center space-x-2 sm:space-x-6">
                        {/* Language Switcher - Hidden on very small screens to fit, or kept if space allows */}
                        <button
                            onClick={toggleLanguage}
                            className="flex items-center space-x-2 px-2 sm:px-3 py-1.5 rounded-full bg-gray-50 hover:bg-green-50 text-gray-600 hover:text-green-600 border border-gray-200 hover:border-green-200 transition-all duration-300"
                            title="Switch Language"
                        >
                            <Globe className="w-4 h-4" />
                            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                                {i18n.language === 'ta' ? 'English' : 'தமிழ்'}
                            </span>
                        </button>

                        {isAuthenticated ? (
                            <div className="hidden sm:flex items-center space-x-4">
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

                        {/* Mobile menu button */}
                        <div className="flex items-center sm:hidden">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="inline-flex items-center justify-center p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none transition-colors"
                            >
                                {isMenuOpen ? (
                                    <X className="block h-6 w-6" aria-hidden="true" />
                                ) : (
                                    <Menu className="block h-6 w-6" aria-hidden="true" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="sm:hidden bg-white border-t border-gray-100 animate-in slide-in-from-top duration-200">
                    <div className="pt-2 pb-3 space-y-1 px-4">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                onClick={() => setIsMenuOpen(false)}
                                className={`flex items-center px-4 py-3 rounded-xl text-base font-medium transition-all ${isActive(link.path)
                                    ? 'bg-green-50 text-green-600'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <link.icon className="w-5 h-5 mr-4" />
                                {link.label}
                            </Link>
                        ))}
                    </div>
                    <div className="pt-4 pb-3 border-t border-gray-100 px-4">
                        {isAuthenticated ? (
                            <div className="space-y-1">
                                <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                                    {t('header.welcome', { name: user?.username })}
                                </div>
                                <button
                                    onClick={() => {
                                        logout();
                                        setIsMenuOpen(false);
                                    }}
                                    className="w-full flex items-center px-4 py-3 rounded-xl text-base font-medium text-red-500 hover:bg-red-50 transition-all"
                                >
                                    <LogOut className="w-5 h-5 mr-4" />
                                    {t('header.logout')}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                <Link
                                    to="/login"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center px-4 py-3 rounded-xl text-base font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                                >
                                    {t('header.login')}
                                </Link>
                                <Link
                                    to="/register"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center px-4 py-3 rounded-xl text-base font-bold text-white bg-green-500 hover:bg-green-600 shadow-lg shadow-green-100"
                                >
                                    {t('header.get_started')}
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}
