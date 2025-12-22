import { Check, X, Lock } from 'lucide-react';

interface TimelineProps {
  totalDays: number;
  currentDay: number;
  completedDays: number[];
  missedDays: number[];
  onDayClick: (day: number) => void;
}

export default function Timeline({ 
  totalDays, 
  currentDay, 
  completedDays, 
  missedDays,
  onDayClick 
}: TimelineProps) {
  const days = Array.from({ length: totalDays }, (_, i) => i + 1);
  
  const getDayStatus = (day: number) => {
    if (day > currentDay) return 'future';
    if (completedDays.includes(day)) return 'completed';
    if (missedDays.includes(day)) return 'missed';
    if (day === currentDay) return 'current';
    return 'pending';
  };
  
  const getDayStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 text-white border-green-600';
      case 'missed':
        return 'bg-red-500 text-white border-red-600';
      case 'current':
        return 'bg-blue-500 text-white border-blue-600 animate-pulse-slow ring-4 ring-blue-300';
      case 'future':
        return 'bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed';
      default:
        return 'bg-yellow-400 text-white border-yellow-500';
    }
  };
  
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Growth Timeline</h3>
      
      <div className="overflow-x-auto pb-4">
        <div className="flex space-x-4 min-w-max">
          {days.map((day) => {
            const status = getDayStatus(day);
            const isClickable = status === 'completed' || status === 'missed';
            
            return (
              <div key={day} className="flex flex-col items-center">
                <button
                  onClick={() => isClickable && onDayClick(day)}
                  disabled={!isClickable}
                  className={`
                    w-14 h-14 rounded-full border-2 font-bold text-sm
                    flex items-center justify-center
                    transition-all duration-200
                    ${getDayStyle(status)}
                    ${isClickable ? 'hover:scale-110 cursor-pointer' : ''}
                  `}
                >
                  {status === 'completed' && <Check className="w-6 h-6" />}
                  {status === 'missed' && <X className="w-6 h-6" />}
                  {status === 'future' && <Lock className="w-5 h-5" />}
                  {(status === 'current' || status === 'pending') && day}
                </button>
                
                <span className="text-xs text-gray-600 mt-2 font-medium">
                  Day {day}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-green-600"></div>
          <span className="text-sm text-gray-700">Logged</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-red-600"></div>
          <span className="text-sm text-gray-700">Missed</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-blue-600"></div>
          <span className="text-sm text-gray-700">Current Day</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-full bg-gray-200 border-2 border-gray-300"></div>
          <span className="text-sm text-gray-700">Future</span>
        </div>
      </div>
    </div>
  );
}

