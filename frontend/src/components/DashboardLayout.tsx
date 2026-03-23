import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { useTheme } from '../contexts/ThemeContext';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const { isDarkMode } = useTheme();

    return (
        <div className={`min-h-screen ${isDarkMode ? 'bg-[#0E1015] text-gray-200' : 'bg-gray-50 text-gray-800'} font-sans selection:bg-emerald-500/30 flex transition-colors duration-300`}>
            {/* Desktop Sidebar */}
            <Sidebar
                isCollapsed={isSidebarCollapsed}
                toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            />

            {/* Main Content Area */}
            <div className={`flex-1 ${isSidebarCollapsed ? 'ml-20' : 'ml-64'} flex flex-col min-h-screen relative overflow-hidden transition-all duration-300`}>
                {/* Global Background Glow effects */}
                <div className={`fixed top-0 ${isSidebarCollapsed ? 'left-20' : 'left-64'} w-full h-full pointer-events-none z-0 overflow-hidden transition-all duration-300`}>
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/5 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[20%] right-[-5%] w-[30%] h-[30%] bg-teal-500/5 rounded-full blur-[100px]" />
                    <div className="absolute top-[40%] left-[60%] w-[20%] h-[20%] bg-purple-500/5 rounded-full blur-[100px]" />
                </div>

                {/* Page Content */}
                <main className="flex-1 p-8 overflow-y-auto relative z-10 custom-scrollbar">
                    <div className="max-w-[1600px] mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
