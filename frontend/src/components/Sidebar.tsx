import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, Compass, Leaf, LogOut, Globe, PanelLeftClose } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from './ThemeToggle';

const NAV_ITEMS = [
    { name: 'header.home', path: '/', icon: Home },
    { name: 'header.atlas', path: '/atlas', icon: Compass },
    { name: 'header.my_plants', path: '/my-plants', icon: Leaf },
];

interface SidebarProps {
    isCollapsed?: boolean;
    toggleCollapse?: () => void;
}

export default function Sidebar({ isCollapsed = false, toggleCollapse }: SidebarProps) {
    const { t, i18n } = useTranslation();
    const { user, logout } = useAuth();
    const { isDarkMode } = useTheme();
    const location = useLocation();

    const toggleLanguage = () => {
        const newLang = i18n.language === 'ta' ? 'en' : 'ta';
        i18n.changeLanguage(newLang);
    };

    return (
        <aside className={`fixed left-0 top-0 h-screen ${isCollapsed ? 'w-20' : 'w-64'} ${isDarkMode ? 'bg-[#12141D] text-gray-400 border-white/5' : 'bg-white text-gray-600 border-gray-100'} flex flex-col border-r shadow-2xl z-50 transition-all duration-300`}>
            {/* Logo Area */}
            <div className={`px-6 py-8 flex items-center ${isCollapsed ? 'justify-center' : ''} transition-all`}>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
                    <Leaf className="w-6 h-6 text-white" />
                </div>
                {!isCollapsed && (
                    <div className="ml-3 flex flex-col leading-none">
                        <span className={`text-sm font-black uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            Microgreens
                        </span>
                        <span className="text-emerald-400 font-black text-[10px] uppercase tracking-[0.3em] mt-0.5">
                            Tracker
                        </span>
                    </div>
                )}
            </div>

            {/* Main Navigation */}
            <div className="flex-1 px-4 overflow-y-auto mt-6 relative custom-scrollbar">
                <div className="space-y-1 relative z-10">
                    {NAV_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));

                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={`flex items-center px-4 py-3.5 rounded-xl font-medium transition-all duration-300 group relative ${isActive
                                    ? (isDarkMode ? 'text-white bg-white/5 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' : 'text-emerald-600 bg-emerald-50 border border-emerald-100')
                                    : (isDarkMode ? 'hover:text-white hover:bg-white/5' : 'hover:text-gray-900 hover:bg-gray-50')
                                    }`}
                            >
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-emerald-400 to-teal-500 rounded-r-full shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                                )}
                                <Icon className={`w-5 h-5 ${isCollapsed ? 'mr-0' : 'mr-3'} transition-colors duration-300 ${isActive ? 'text-emerald-400' : 'text-gray-500 group-hover:text-emerald-400'}`} />
                                {!isCollapsed && <span className={isActive ? 'font-semibold tracking-wide' : 'tracking-wide'}>{t(item.name)}</span>}

                                {isActive && isDarkMode && (
                                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-emerald-500/10 to-transparent rounded-xl pointer-events-none opacity-50" />
                                )}
                            </NavLink>
                        );
                    })}
                </div>
            </div>

            {/* Utility Toggles Area */}
            <div className={`px-4 mb-2 flex ${isCollapsed ? 'flex-col space-y-2' : 'justify-between items-center space-x-2'}`}>
                <button
                    onClick={toggleLanguage}
                    className={`flex-1 flex items-center justify-center space-x-2 p-3 rounded-xl border transition-all group ${isDarkMode ? 'bg-[#1A1D27] hover:bg-white/5 border-white/5 text-gray-400 hover:text-white' : 'bg-gray-50 hover:bg-gray-100 border-gray-100 text-gray-500 hover:text-gray-900'}`}
                    title="Switch Language"
                >
                    <Globe className="w-4 h-4 group-hover:text-emerald-400 transition-colors" />
                    {!isCollapsed && <span className="text-xs font-bold uppercase tracking-widest">
                        {i18n.language === 'ta' ? 'EN' : 'TA'}
                    </span>}
                </button>

                <ThemeToggle className="flex-1" />

                <button
                    onClick={toggleCollapse}
                    className={`flex-1 flex items-center justify-center p-3 rounded-xl border transition-all ${isDarkMode ? 'bg-[#1A1D27] hover:bg-white/5 border-white/5 text-gray-400 hover:text-white' : 'bg-gray-50 hover:bg-gray-100 border-gray-100 text-gray-500 hover:text-gray-900'}`}
                    title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                >
                    <PanelLeftClose className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
                </button>
            </div>

            {/* Powered By Branding */}
            {!isCollapsed && (
                <div className={`px-8 py-2 text-[9px] font-bold uppercase tracking-[0.2em] ${isDarkMode ? 'text-gray-600' : 'text-gray-400'} text-center`}>
                    Microgreens Tracker <span className="mx-1 text-emerald-500/50">•</span> Powered by <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Punchbiz</span>
                </div>
            )}

            {/* Bottom User Area */}
            {user && (
                <div className={`p-4 mx-4 mb-4 rounded-2xl border relative overflow-hidden group ${isCollapsed ? 'flex justify-center px-0' : ''} ${isDarkMode ? 'bg-[#1A1D27] border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative z-10 flex items-center">
                        <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-white shadow-inner flex-shrink-0 cursor-pointer ${isDarkMode ? 'bg-gradient-to-br from-gray-700 to-gray-800 border-gray-600' : 'bg-gradient-to-br from-gray-200 to-gray-300 border-white'}`} onClick={isCollapsed ? logout : undefined} title={isCollapsed ? t('nav.logout') : ''}>
                            <span className={isDarkMode ? 'text-white' : 'text-gray-700'}>{(user?.email?.charAt(0) || user?.username?.charAt(0) || 'U').toUpperCase()}</span>
                        </div>
                        {!isCollapsed && (
                            <>
                                <div className="ml-3 flex-1 min-w-0">
                                    <p className={`text-sm font-bold truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{user.email}</p>
                                    <p className="text-[10px] font-medium text-emerald-500 uppercase tracking-widest mt-0.5">Grower</p>
                                </div>
                                <button
                                    onClick={logout}
                                    className="p-2 ml-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                                    title={t('nav.logout')}
                                >
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </aside>
    );
}
