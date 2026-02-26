import React, { useEffect, useState, useCallback, useRef } from 'react';
import { ShieldAlert, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

export interface Toast {
  id: string;
  title: string;
  message: string;
  type: 'security' | 'success' | 'warning' | 'info';
}

interface NotificationSystemProps {
  toasts: Toast[];
  removeToast: (id: string) => void;
}

const NotificationSystem: React.FC<NotificationSystemProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-8 right-8 z-[10000] flex flex-col gap-4 w-96 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: Toast; onRemove: () => void }> = ({ toast, onRemove }) => {
  const [isExiting, setIsExiting] = useState(false);
  const timerRef = useRef<number | null>(null);

  const triggerDismiss = useCallback(() => {
    setIsExiting(true);
    // Allow animation to play before removal
    setTimeout(onRemove, 300);
  }, [onRemove]);

  useEffect(() => {
    const hideTime = 4000;
    const timer = window.setTimeout(triggerDismiss, hideTime);
    
    return () => {
      window.clearTimeout(timer);
    };
  }, []); // Run only once on mount to avoid timer resets on parent re-renders

  const configMap = {
    security: { icon: ShieldAlert, color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
    success: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  };

  const config = configMap[toast.type] || configMap.info;
  const Icon = config.icon;

  return (
    <div 
      className={`pointer-events-auto group relative overflow-hidden backdrop-blur-3xl border ${config.border} ${config.bg} p-6 rounded-[2.5rem] shadow-2xl transition-all duration-300 ${
        isExiting ? 'opacity-0 translate-x-20 scale-90' : 'animate-in slide-in-from-right-10'
      }`}
    >
      <div className="flex gap-4">
        <div className={`p-3 rounded-2xl ${config.bg} border ${config.border} shrink-0`}>
          <Icon className={`w-5 h-5 ${config.color}`} />
        </div>
        <div className="flex-1 pr-6">
          <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-white">{toast.title}</h4>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">{toast.message}</p>
        </div>
        <button onClick={triggerDismiss} className="absolute top-4 right-4 text-slate-600 hover:text-white p-1">
          <X size={16} />
        </button>
      </div>
      
      <div className="absolute bottom-0 left-0 h-1 bg-white/5 w-full">
        <div 
          className={`h-full ${config.color.replace('text', 'bg')} animate-progress-bar`} 
          style={{ animationDuration: '4s' }}
        />
      </div>
      
      <style>{`
        @keyframes progress-timer {
          from { width: 100%; }
          to { width: 0%; }
        }
        .animate-progress-bar {
          animation: progress-timer linear forwards;
        }
      `}</style>
    </div>
  );
};

export default NotificationSystem;