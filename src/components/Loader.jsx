import React from 'react';

/**
 * A beautiful glowing ring loader.
 * @param {string} message - Optional loading message.
 * @param {boolean} fullScreen - If true, occupies the full viewport.
 */
const Loader = ({ message = 'Memuat Data...', fullScreen = false }) => {
  const containerClass = fullScreen 
    ? "fixed inset-0 z-[999] flex flex-col items-center justify-center bg-brand-bg-dark/80 backdrop-blur-md" 
    : "flex flex-col items-center justify-center p-8 w-full";

  return (
    <div className={containerClass}>
      <div className="relative flex items-center justify-center">
        {/* Outer pulsing shadow ring */}
        <div className="absolute w-16 h-16 rounded-full bg-brand-cyan/10 blur-md animate-pulse"></div>
        {/* Rotating colorful ring */}
        <div className="w-12 h-12 rounded-full border-4 border-slate-800 border-t-brand-cyan animate-spin"></div>
      </div>
      {message && (
        <p className="mt-4 text-sm font-medium text-slate-400 tracking-wider uppercase animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
};

export default Loader;
