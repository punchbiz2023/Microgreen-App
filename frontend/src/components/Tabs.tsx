import React from 'react';

interface Tab {
    id: string;
    label: string;
}

interface TabsProps {
    tabs: Tab[];
    activeTab: string;
    onTabChange: (id: string) => void;
    className?: string;
}

const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onTabChange, className = '' }) => {
    return (
        <div className={`flex space-x-1 bg-gray-100 p-1 rounded-xl ${className}`}>
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`
            flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200
            ${activeTab === tab.id
                            ? 'bg-white text-green-700 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'}
          `}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
};

export default Tabs;
