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
    { value: 100 - efficiency, fill: 'currentColor', className: 'text-gray-200 dark:text-[#2D303E]' }
  ];

  function getStatusColor(status: string) {
    switch (status) {
      case 'excellent':
        return '#10b981'; // emerald-500
      case 'good':
        return '#34d399'; // emerald-400
      case 'fair':
        return '#fbbf24'; // amber-400
      case 'poor':
        return '#ef4444'; // red-500
      default:
        return '#6b7280'; // gray-500
    }
  }

  function getStatusLabel(status: string | undefined) {
    if (!status) return 'In Progress';
    switch (status.toLowerCase()) {
      case 'excellent':
        return 'Excellent!';
      case 'good':
        return 'Good Progress';
      case 'fair':
        return 'Fair';
      case 'poor':
        return 'Needs Attention';
      default:
        return 'Stable';
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
          <div className="text-4xl font-black text-gray-900 dark:text-white">
            {predicted.toFixed(0)}g
          </div>
          <div className="text-sm font-bold tracking-widest uppercase text-gray-500 dark:text-gray-400 mt-1">
            of {base}g
          </div>
        </div>
      </div>

      {/* Status badge */}
      {(status === 'excellent' || !status) && <div className="mt-4 px-6 py-2 rounded-full font-bold text-sm tracking-widest uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">{getStatusLabel(status)}</div>}
      {status === 'good' && <div className="mt-4 px-6 py-2 rounded-full font-bold text-sm tracking-widest uppercase bg-emerald-400/10 text-emerald-600 dark:text-emerald-300 border border-emerald-400/20">{getStatusLabel(status)}</div>}
      {status === 'fair' && <div className="mt-4 px-6 py-2 rounded-full font-bold text-sm tracking-widest uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">{getStatusLabel(status)}</div>}
      {status === 'poor' && <div className="mt-4 px-6 py-2 rounded-full font-bold text-sm tracking-widest uppercase bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">{getStatusLabel(status)}</div>}

      <div className="text-center mt-4">
        <div className="text-2xl font-black text-gray-900 dark:text-white">
          {efficiency.toFixed(1)}%
        </div>
        <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">
          Yield Efficiency
        </div>
      </div>
    </div>
  );
}

