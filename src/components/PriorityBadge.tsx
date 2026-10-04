import React from 'react';
import { PriorityLevel } from '../types';
import { Flame, AlertTriangle, Clock, CheckCircle2, Pin } from 'lucide-react';

interface PriorityBadgeProps {
  priority: PriorityLevel;
  rank?: number;
  isPinned?: boolean;
  onPinToggle?: () => void;
  interactive?: boolean;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
  rank,
  isPinned,
  onPinToggle,
  interactive = false,
}) => {
  const config = {
    emergency: {
      label: 'اضطراری و فوری',
      icon: Flame,
      bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40 ring-1 ring-rose-500/30',
      dot: 'bg-rose-500 animate-ping',
    },
    high: {
      label: 'اولویت بالا',
      icon: AlertTriangle,
      bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      dot: 'bg-amber-500',
    },
    medium: {
      label: 'اولویت متوسط',
      icon: Clock,
      bg: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
      dot: 'bg-blue-400',
    },
    low: {
      label: 'اولویت عادی',
      icon: CheckCircle2,
      bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      dot: 'bg-emerald-400',
    },
  }[priority] || {
    label: 'عادی',
    icon: Clock,
    bg: 'bg-slate-700 text-slate-300 border-slate-600',
    dot: 'bg-slate-400',
  };

  const Icon = config.icon;

  return (
    <div className="inline-flex items-center gap-1.5 flex-wrap">
      {isPinned && (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-400 text-slate-950 shadow-sm animate-pulse"
          title="اولویت اول و برتر (Pin شده)"
        >
          <Pin className="w-3 h-3 fill-current rotate-45" />
          <span>اولویت با این است!</span>
        </span>
      )}

      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${config.bg}`}
      >
        <span className="relative flex h-2 w-2">
          {priority === 'emergency' && (
            <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${config.dot}`} />
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dot}`} />
        </span>
        <Icon className="w-3.5 h-3.5" />
        <span>{config.label}</span>

        {typeof rank === 'number' && (
          <span className="mr-1 px-1.5 py-0.2 rounded bg-black/40 text-[11px] font-mono border border-white/10 text-slate-200">
            رتبه #{rank}
          </span>
        )}
      </span>

      {interactive && onPinToggle && (
        <button
          type="button"
          onClick={onPinToggle}
          className={`p-1 rounded-md transition-colors ${
            isPinned
              ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
              : 'text-slate-400 hover:text-amber-300 hover:bg-slate-800'
          }`}
          title={isPinned ? 'حذف از اولویت ویژه' : 'انتخاب به عنوان اولویت اول (اولویت با این باشد)'}
        >
          <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-current' : ''}`} />
        </button>
      )}
    </div>
  );
};
