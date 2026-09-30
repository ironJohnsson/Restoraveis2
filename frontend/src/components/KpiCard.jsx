import React from 'react';

export default function KpiCard({ title, value, subtitle, icon: Icon, color = 'emerald', tag }) {
  const colorMap = {
    emerald: {
      bgIcon: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      border: 'hover:border-emerald-300'
    },
    amber: {
      bgIcon: 'bg-amber-50 text-amber-600 border-amber-200',
      border: 'hover:border-amber-300'
    },
    rose: {
      bgIcon: 'bg-rose-50 text-rose-600 border-rose-200',
      border: 'hover:border-rose-300'
    },
    blue: {
      bgIcon: 'bg-blue-50 text-blue-600 border-blue-200',
      border: 'hover:border-blue-300'
    }
  };

  const currentTheme = colorMap[color] || colorMap.emerald;

  return (
    <div className={`bg-white rounded-2xl p-5 border border-slate-200 shadow-sm transition-all duration-200 ${currentTheme.border}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${currentTheme.bgIcon}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-bold text-slate-900 tracking-tight">
            {value}
          </span>
          {tag && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-700">
              {tag}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="mt-1 text-xs text-slate-500 line-clamp-1">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
