import React from 'react';
import { Users, UserCheck, UserX, Star } from 'lucide-react';

/**
 * Modern glassmorphic statistic counters grid.
 * Shows separate stats for Peserta Workshop vs Tamu Undangan.
 */
const StatCards = ({ participants = [] }) => {
  // Peserta biasa (non-Tamu) yang sudah di-ACC
  const pesertaVerified = participants.filter(p => p.category !== 'Tamu' && p.paymentStatus === 'Lunas');
  const totalPeserta = pesertaVerified.length;
  const pesertaHadir = pesertaVerified.filter(p => p.status === 'Hadir').length;
  
  // Tamu Undangan (semua yang terdaftar sebagai Tamu)
  const tamuList = participants.filter(p => p.category === 'Tamu');
  const tamuHadir = tamuList.filter(p => p.status === 'Hadir').length;
  
  // Total kehadiran (Peserta + Tamu yang hadir)
  const totalHadir = participants.filter(p => p.status === 'Hadir').length;
  const totalACC = totalPeserta + tamuList.length; // semua yang diundang/lunas
  const percentage = totalACC > 0 ? Math.round((totalHadir / totalACC) * 100) : 0;

  const stats = [
    {
      title: 'Peserta Workshop',
      value: totalPeserta,
      subText: `${pesertaHadir} orang sudah hadir`,
      icon: <Users className="w-5 h-5" />,
      color: 'from-blue-500/20 to-indigo-500/10 text-blue-400 border-blue-500/20',
      glow: 'shadow-[0_4px_20px_rgba(59,130,246,0.05)]'
    },
    {
      title: 'Total Hadir',
      value: totalHadir,
      subText: 'Sudah Presensi Hari Ini',
      icon: <UserCheck className="w-5 h-5" />,
      color: 'from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/20',
      glow: 'shadow-[0_4px_20px_rgba(16,185,129,0.05)]'
    },
    {
      title: 'Tamu Undangan',
      value: tamuList.length,
      subText: tamuHadir > 0 ? `${tamuHadir} tamu sudah hadir` : 'Belum ada yang hadir',
      icon: <Star className="w-5 h-5" />,
      color: 'from-purple-500/20 to-violet-500/10 text-purple-400 border-purple-500/20',
      glow: 'shadow-[0_4px_20px_rgba(168,85,247,0.05)]'
    },
    {
      title: 'Rasio Kehadiran',
      value: `${percentage}%`,
      subText: `${totalHadir} dari ${totalACC} diundang`,
      icon: <UserX className="w-5 h-5" />,
      color: 'from-cyan-500/20 to-brand-blue/10 text-brand-cyan border-brand-cyan/20',
      glow: 'shadow-[0_4px_20px_rgba(6,182,212,0.05)]'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {stats.map((stat, index) => (
        <div
          key={index}
          className={`relative overflow-hidden rounded-xl border p-5 bg-gradient-to-br glass-panel ${stat.color} ${stat.glow} animate-slide-up`}
          style={{ animationDelay: `${index * 80}ms` }}
        >
          {/* Subtle background glow circle */}
          <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-current opacity-[0.03] blur-xl" />
          
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {stat.title}
            </span>
            <div className="p-2 rounded-lg bg-white/5 border border-white/5">
              {stat.icon}
            </div>
          </div>

          <div className="mt-4">
            <span className="text-3xl font-extrabold tracking-tight text-white">
              {stat.value}
            </span>
            <p className="mt-1 text-xs text-slate-400 font-medium">
              {stat.subText}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatCards;
