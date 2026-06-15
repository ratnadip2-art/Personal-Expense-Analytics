import React from 'react';
import { motion } from 'motion/react';

interface MetricCardProps {
  id: string;
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
    label: string;
  };
  progress?: {
    percentage: number;
    colorClass: string;
  };
  colorTheme?: 'emerald' | 'amber' | 'blue' | 'rose' | 'slate';
}

export default function MetricCard({
  id,
  title,
  value,
  subtitle,
  icon,
  trend,
  progress,
  colorTheme = 'slate',
}: MetricCardProps) {
  const bgColors = {
    emerald: 'bg-emerald-50/50 border-emerald-100 hover:border-emerald-200',
    amber: 'bg-amber-50/50 border-amber-100 hover:border-amber-200',
    blue: 'bg-blue-50/50 border-blue-100 hover:border-blue-200',
    rose: 'bg-rose-50/50 border-rose-100 hover:border-rose-200',
    slate: 'bg-slate-50/50 border-slate-100 hover:border-slate-200',
  };

  const textColors = {
    emerald: 'text-emerald-700',
    amber: 'text-amber-700',
    blue: 'text-blue-700',
    rose: 'text-rose-700',
    slate: 'text-slate-700',
  };

  return (
    <motion.div
      id={id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-5 rounded-2xl border transition-all duration-300 shadow-xs hover:shadow-md ${bgColors[colorTheme]}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {title}
          </span>
          <h3 className="text-2xl font-bold font-sans text-slate-800 tracking-tight mt-1">
            {value}
          </h3>
          {subtitle && (
            <span className="text-xs text-slate-500 font-medium block mt-0.5">
              {subtitle}
            </span>
          )}
        </div>
        <div className={`p-2.5 rounded-xl bg-white shadow-xs border border-slate-100 ${textColors[colorTheme]}`}>
          {icon}
        </div>
      </div>

      {progress && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
            <span>Progress</span>
            <span>{Math.round(progress.percentage)}%</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progress.percentage, 100)}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={`h-full rounded-full ${progress.colorClass}`}
            />
          </div>
        </div>
      )}

      {trend && (
        <div className="flex items-center gap-1.5 mt-3">
          <span
            className={`text-xs font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 ${
              trend.isPositive
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-rose-100 text-rose-800'
            }`}
          >
            {trend.value}
          </span>
          <span className="text-xs text-slate-400 font-medium">{trend.label}</span>
        </div>
      )}
    </motion.div>
  );
}
