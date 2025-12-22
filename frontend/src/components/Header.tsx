import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, LogOut, Home as HomeIcon, Leaf } from 'lucide-react';
// We will add auth hook later
import { useAuth } from '../contexts/AuthContext';

export default function Header() {
    const location = useLocation();
    // Placeholder for auth
    const { isAuthenticated, logout, user } = useAuth();

    const isActive = (path: string) => location.pathname === path;

    return (
        <header className="bg-white shadow-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* Logo / Brand */}
                    <div className="flex">
                        <Link to="/" className="flex-shrink-0 flex items-center group">
                            <div className="bg-gradient-to-br from-green-500 to-emerald-700 p-2.5 rounded-xl shadow-lg group-hover:shadow-green-200/50 transition-all duration-300">
                                <Leaf className="h-6 w-6 text-white" />
                            </div>
                            <div className="ml-3 flex flex-col justify-center">
                                <span className="text-xl font-bold text-gray-900 tracking-tight leading-none font-serif">URBAN SIMS</span>
                                <span className="text-[10px] text-green-600 font-bold uppercase tracking-widest leading-none mt-1">Pro Grower</span>
                            </div>
                        </Link>
                    </div>

                    {/* Navigation Links */}
                    <div className="hidden sm:flex sm:space-x-8">
                        <Link
                            to="/"
                            className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${isActive('/')
                                ? 'border-green-500 text-gray-900'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <HomeIcon className="w-4 h-4 mr-2" />
                            Home
                        </Link>

                        <Link
                            to="/atlas"
                            className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${isActive('/atlas')
                                ? 'border-green-500 text-gray-900'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <LayoutDashboard className="w-4 h-4 mr-2" />
                            Seed Atlas
                        </Link>

                        <Link
                            to="/my-plants"
                            className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${isActive('/my-plants')
                                ? 'border-green-500 text-gray-900'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <Leaf className="w-4 h-4 mr-2" />
                            My Plants
                        </Link>
                    </div>

                    {/* User/Auth Section */}
                    <div className="flex items-center">
                        {isAuthenticated ? (
                            <div className="flex items-center space-x-4">
                                <span className="text-sm font-medium text-gray-700">
                                    Welcome, {user?.username}
                                </span>
                                <button
                                    onClick={logout}
                                    className="flex items-center text-sm font-medium text-gray-500 hover:text-red-600 transition-colors"
                                >
                                    <LogOut className="w-4 h-4 mr-1" />
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <div className="hidden sm:flex items-center space-x-4">
                                <Link to="/login" className="text-gray-500 hover:text-green-600 font-medium text-sm">
                                    Log in
                                </Link>
                                <Link to="/register" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md transition-all hover:shadow-lg">
                                    Get Started
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
