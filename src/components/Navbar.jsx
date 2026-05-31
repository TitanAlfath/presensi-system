import React from 'react';
import { Menu, Database, Shield } from 'lucide-react';
import { isFirebaseConfigured } from '../firebase/config';

/**
 * Top dashboard header bar displaying page metadata and database link indicators.
 */
const Navbar = ({ onOpenSidebar, title = 'Panel Administrasi' }) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between w-full px-6 py-4 glass-panel border-b border-brand-cyan/10 bg-[#FFFDF9]/85">
      <div className="flex items-center space-x-3">
        {/* Toggle drawer on mobile */}
        <button 
          onClick={onOpenSidebar}
          className="p-1.5 rounded-lg md:hidden text-slate-500 hover:text-slate-800 hover:bg-brand-cyan/5 transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <h1 className="text-sm md:text-base font-black text-slate-800 tracking-wide uppercase">
          {title}
        </h1>
      </div>

      <div className="flex items-center space-x-4">
        {/* Realtime Database Mode indicator */}
        <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full border border-brand-cyan/10 bg-white/90 shadow-xs">
          <Database className={`w-3.5 h-3.5 ${isFirebaseConfigured ? 'text-brand-cyan' : 'text-amber-500'}`} />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">
            {isFirebaseConfigured ? 'Live Firebase' : 'Simulasi Lokal'}
          </span>
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isFirebaseConfigured ? 'bg-brand-cyan' : 'bg-amber-500'
            }`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${
              isFirebaseConfigured ? 'bg-brand-cyan' : 'bg-amber-500'
            }`} />
          </span>
        </div>

        {/* Profile Card */}
        <div className="flex items-center space-x-3 pl-3 border-l border-brand-cyan/10">
          <div className="text-right hidden md:block">
            <p className="text-xs font-bold text-slate-800">Administrator</p>
            <p className="text-[9px] font-bold text-brand-cyan uppercase tracking-wider">BEM FASTIKOM</p>
          </div>
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-cyan to-brand-blue text-white shadow-md shadow-brand-cyan/10">
            <Shield className="w-4 h-4" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
