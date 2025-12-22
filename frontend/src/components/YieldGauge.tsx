import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface YieldGaugeProps {
  predicted: number;
  base: number;
  status: 'excellent' | 'good' | 'fair' | 'poor';
}

export default function YieldGauge({ predicted, base, status }: YieldGaugeProps) {
  const efficiency = (predicted / base) * 100;
  
  // Create data for semi-circle gauge
  const data = [
    { value: efficiency, fill: getStatusColor(status) },
    { value: 100 - efficiency, fill: '#e5e7eb' }
  ];
  
  function getStatusColor(status: string) {
    switch (status) {
      case 'excellent':
        return '#22c55e'; // green-500
      case 'good':
        return '#84cc16'; // lime-500
      case 'fair':
        return '#eab308'; // yellow-500
      case 'poor':
        return '#ef4444'; // red-500
      default:
        return '#6b7280'; // gray-500
    }
  }
  
  function getStatusLabel(status: string) {
    switch (status) {
      case 'excellent':
        return 'Excellent!';
      case 'good':
        return 'Good Progress';
      case 'fair':
        return 'Fair';
      case 'poor':
        return 'Needs Attention';
      default:
        return 'Unknown';
    }
  }
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full max-w-xs">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="80%"
              startAngle={180}
              endAngle={0}
              innerRadius={60}
              outerRadius={90}
              paddingAngle={0}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center text */}
        <div className="absolute top-24 left-1/2 transform -translate-x-1/2 text-center">
          <div className="text-4xl font-bold text-gray-900">
            {predicted.toFixed(0)}g
          </div>
          <div className="text-sm text-gray-600 mt-1">
            of {base}g
          </div>
        </div>
      </div>
      
      {/* Status badge */}
      <div className={`
        mt-4 px-6 py-2 rounded-full font-semibold text-lg
        ${status === 'excellent' && 'bg-green-100 text-green-800'}
        ${status === 'good' && 'bg-lime-100 text-lime-800'}
        ${status === 'fair' && 'bg-yellow-100 text-yellow-800'}
        ${status === 'poor' && 'bg-red-100 text-red-800'}
      `}>
        {getStatusLabel(status)}
      </div>
      
      <div className="text-center mt-2">
        <div className="text-2xl font-bold text-gray-900">
          {efficiency.toFixed(1)}%
        </div>
        <div className="text-sm text-gray-600">
          Yield Efficiency
        </div>
      </div>
    </div>
  );
}

