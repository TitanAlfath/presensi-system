import React, { useEffect } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, X } from 'lucide-react';

/**
 * Premium glassmorphism floating alert notification.
 */
const Toast = ({ message, type = 'success', onClose, duration = 4000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const typeConfig = {
    success: {
      bg: 'border-emerald-500/30 bg-emerald-950/20 text-emerald-200',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
      barColor: 'bg-emerald-500',
      glow: 'shadow-[0_0_15px_rgba(16,185,129,0.15)]'
    },
    error: {
      bg: 'border-rose-500/30 bg-rose-950/20 text-rose-200',
      icon: <XCircle className="w-5 h-5 text-rose-400" />,
      barColor: 'bg-rose-500',
      glow: 'shadow-[0_0_15px_rgba(244,63,94,0.15)]'
    },
    warning: {
      bg: 'border-amber-500/30 bg-amber-950/20 text-amber-200',
      icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
      barColor: 'bg-amber-500',
      glow: 'shadow-[0_0_15px_rgba(245,158,11,0.15)]'
    }
  };

  const config = typeConfig[type] || typeConfig.success;

  return (
    <div 
      className={`fixed top-4 right-4 z-[9999] flex flex-col w-full max-w-sm overflow-hidden rounded-lg border backdrop-blur-md animate-slide-up ${config.bg} ${config.glow}`}
    >
      <div className="flex items-start p-4">
        <div className="flex-shrink-0 mr-3">
          {config.icon}
        </div>
        <div className="flex-1 pt-0.5">
          <p className="text-sm font-semibold tracking-wide text-white">
            {type === 'success' ? 'Berhasil' : type === 'error' ? 'Presensi Ditolak' : 'Pemberitahuan'}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-300 font-medium">
            {message}
          </p>
        </div>
        <button 
          onClick={onClose}
          className="ml-4 inline-flex text-slate-400 hover:text-white hover:bg-white/5 p-1 rounded-md transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      {/* Animated self-closing progress bar */}
      <div className="w-full h-1 bg-white/5">
        <div 
          className={`h-full ${config.barColor} transition-all ease-linear`}
          style={{ 
            animation: `shrinkWidth ${duration}ms linear forwards` 
          }}
        />
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shrinkWidth {
          0% { width: 100%; }
          100% { width: 0%; }
        }
      `}} />
    </div>
  );
};

export default Toast;
