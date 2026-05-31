import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  QrCode, 
  LogOut, 
  BookOpen, 
  X,
  Star,
  GraduationCap,
  Camera,
  Monitor
} from 'lucide-react';


/**
 * Premium glassmorphic sidebar for admin workspace.
 */
const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    sessionStorage.removeItem('admin_session');
    navigate('/login');
  };

  const navItems = [
    { 
      path: '/admin/dashboard', 
      name: 'Dashboard Presensi', 
      icon: <LayoutDashboard className="w-5 h-5" />,
      accent: 'brand-cyan'
    },
    {
      path: '/admin/scanner',
      name: 'Terminal Scan QR',
      icon: <Camera className="w-5 h-5" />,
      accent: 'brand-cyan'
    },
    {
      path: '/admin/daftar-peserta',
      name: 'Daftar Peserta',
      icon: <GraduationCap className="w-5 h-5" />,
      accent: 'brand-cyan'
    },
    { 
      path: '/admin/tamu-undangan', 
      name: 'Tamu Undangan', 
      icon: <Star className="w-5 h-5" />,
      accent: 'purple'
    },
    {
      path: '/live',
      name: 'Layar Proyektor Live',
      icon: <Monitor className="w-5 h-5" />,
      accent: 'brand-cyan'
    },
    { 
      path: '/admin/event-qr', 
      name: 'Tampilkan QR Acara', 
      icon: <QrCode className="w-5 h-5" />,
      accent: 'brand-cyan'
    }
  ];


  const sidebarClass = `fixed top-0 bottom-0 left-0 z-40 w-64 glass-panel border-r border-brand-cyan/10 bg-[#FFFDF9]/85 transition-transform duration-300 transform md:translate-x-0 flex flex-col ${
    isOpen ? 'translate-x-0' : '-translate-x-full'
  }`;

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-xs md:hidden"
        />
      )}

      <aside className={sidebarClass}>
        {/* Logo and Brand */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-brand-cyan/10 bg-brand-cyan/[0.04]">
          <div className="flex items-center space-x-3">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-brand-cyan/10 border border-brand-cyan/30 text-brand-cyan">
              <BookOpen className="w-5 h-5" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-brand-cyan rounded-full animate-ping" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm tracking-widest text-slate-800">
                BEM FASTIKOM
              </h2>
              <p className="text-[10px] font-black text-brand-cyan tracking-wider uppercase">
                Dies Natalis XXV
              </p>
            </div>
          </div>

          {/* Mobile Close Button */}
          <button 
            onClick={onClose}
            className="md:hidden text-slate-500 hover:text-slate-800 p-1 rounded-md hover:bg-black/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => {
                if (window.innerWidth < 768) onClose();
              }}
              className={({ isActive }) => `
                flex items-center space-x-3.5 px-4 py-3 rounded-lg font-bold text-sm transition-all duration-300 group
                ${isActive 
                  ? item.accent === 'purple'
                    ? 'bg-gradient-to-r from-purple-500/10 to-violet-500/5 text-purple-700 border-l-2 border-purple-500 shadow-[0_4px_15px_rgba(168,85,247,0.05)] font-black'
                    : 'bg-gradient-to-r from-brand-cyan/10 to-brand-blue/5 text-brand-cyan border-l-2 border-brand-cyan shadow-[0_4px_15px_rgba(140,29,29,0.04)] font-black'
                  : 'text-slate-550 hover:text-slate-800 hover:bg-brand-cyan/5'
                }
              `}
            >
              <span className={`transition-transform group-hover:scale-110 ${
                item.accent === 'purple' ? 'group-hover:text-purple-600' : 'group-hover:text-brand-cyan'
              }`}>
                {item.icon}
              </span>
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer with Logout */}
        <div className="p-4 border-t border-brand-cyan/10 bg-brand-cyan/[0.02]">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center space-x-3 w-full px-4 py-3 text-slate-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-lg text-sm font-bold transition-all duration-300 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Sesi</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
