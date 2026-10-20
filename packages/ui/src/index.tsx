import React from 'react';

/**
 * Kineo Standardized CSS Design Tokens
 */
export const THEME_TOKENS = {
  brandPrimary: '#6366f1',
  brandSecondary: '#a855f7',
  brandAccent: '#ec4899',
  darkBackground: '#0b0f19',
  cardBackground: 'rgba(15, 23, 42, 0.75)',
  borderDefault: 'rgba(51, 65, 85, 0.6)',
  textPrimary: '#f8fafc',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#f43f5e',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const MangaButton: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5 font-semibold',
  }[size];

  const variantStyles = {
    primary:
      'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/25 border border-indigo-400/30',
    secondary:
      'bg-slate-800/90 hover:bg-slate-700/90 text-slate-100 border border-slate-700/80 shadow-md',
    outline:
      'border border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/10 hover:border-indigo-400',
    ghost: 'text-slate-300 hover:bg-slate-800/60 hover:text-white',
    danger:
      'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-lg shadow-rose-500/25 border border-rose-400/30',
  }[variant];

  return (
    <button className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`} {...props}>
      {children}
    </button>
  );
};

export interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export const MangaCard: React.FC<CardProps> = ({
  title,
  subtitle,
  children,
  className = '',
  action,
}) => {
  return (
    <div
      className={`bg-slate-900/75 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-5 shadow-2xl shadow-black/40 transition-all duration-300 hover:border-slate-700/80 ${className}`}
    >
      {(title || action) && (
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/60">
          <div>
            {title && (
              <h3 className="text-base font-semibold text-slate-100 tracking-tight">{title}</h3>
            )}
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

export interface StatusBadgeProps {
  status: 'success' | 'warning' | 'error' | 'info' | 'pending';
  label: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, size = 'md' }) => {
  const colors = {
    success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-emerald-500/10',
    warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30 shadow-amber-500/10',
    error: 'bg-rose-500/15 text-rose-400 border-rose-500/30 shadow-rose-500/10',
    info: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30 shadow-indigo-500/10',
    pending: 'bg-slate-500/15 text-slate-400 border-slate-500/30 shadow-slate-500/10',
  };

  const sizes = {
    sm: 'text-[11px] px-2.5 py-0.5 font-medium',
    md: 'text-xs px-3 py-1 font-medium tracking-wide',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border backdrop-blur-md shadow-sm ${colors[status]} ${sizes[size]}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse" />
      {label}
    </span>
  );
};

export interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 44,
  strokeWidth = 4,
  color = '#6366f1',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(100, Math.max(0, progress)) / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(51, 65, 85, 0.4)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <span className="absolute text-[10px] font-bold text-slate-200">{Math.round(progress)}%</span>
    </div>
  );
};

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, icon, action }) => (
  <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-slate-800/80 rounded-2xl bg-slate-900/40 backdrop-blur-md">
    {icon && (
      <div className="text-slate-500 mb-4 p-3 bg-slate-800/40 rounded-full border border-slate-700/50">
        {icon}
      </div>
    )}
    <h3 className="text-base font-semibold text-slate-200 mb-1 tracking-tight">{title}</h3>
    {description && (
      <p className="text-slate-400 text-xs mb-6 max-w-sm leading-relaxed">{description}</p>
    )}
    {action && <div>{action}</div>}
  </div>
);
