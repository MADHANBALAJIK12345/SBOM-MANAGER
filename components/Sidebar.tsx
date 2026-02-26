
import React from 'react';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, 
  Upload, 
  FileText, 
  Bell, 
  User, 
  ShieldCheck,
  LogOut,
  Info,
  PhoneCall,
  Activity,
  Terminal
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  t: (key: any) => string;
  isAdmin?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, onLogout, t, isAdmin }) => {
  const menuItems = [
    { id: 'dashboard', label: t('telemetry'), icon: LayoutDashboard },
    { id: 'scan', label: t('scan_node'), icon: Upload },
    { id: 'sbom', label: t('security_output'), icon: FileText },
    { id: 'notifications', label: t('alert_hub'), icon: Bell },
    { id: 'profile', label: t('profile'), icon: User },
    { id: 'contact', label: t('secure_uplink'), icon: PhoneCall },
    { id: 'about', label: t('system_info'), icon: Info },
  ];

  // Add Admin Console if user is admin
  if (isAdmin) {
    menuItems.splice(menuItems.length - 2, 0, { id: 'admin', label: 'Admin Console', icon: Terminal });
  }

  return (
    <div className="w-72 bg-[var(--bg-sidebar)] border-r border-[var(--border)] flex flex-col h-screen sticky top-0 z-40 transition-colors duration-500">
      <div className="p-10 border-b border-[var(--border)] flex items-center gap-4">
        <motion.div 
          whileHover={{ scale: 1.05, rotate: 5 }}
          className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30"
        >
          <ShieldCheck className="w-7 h-7 text-white" />
        </motion.div>
        <div className="flex flex-col">
          <span className="font-black text-3xl tracking-tighter text-[var(--text-main)] leading-none">SBOM</span>
          <span className="text-[10px] font-bold text-[var(--text-muted)] tracking-[0.4em] mt-2">V3_SYSTEM</span>
        </div>
      </div>

      <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group relative overflow-hidden ${
              activeTab === item.id 
                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-[0_0_25px_rgba(16,185,129,0.1)]' 
                : 'text-[var(--text-muted)] hover:bg-emerald-500/5 hover:text-emerald-500 border border-transparent'
            }`}
          >
            {activeTab === item.id && (
              <motion.div 
                layoutId="activeTab"
                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-emerald-500 rounded-full" 
              />
            )}
            <item.icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${activeTab === item.id ? 'text-emerald-400' : 'text-[var(--text-muted)]'}`} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-8 border-t border-[var(--border)] space-y-4">
        <div className="flex items-center gap-3 px-4 py-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
          <Activity size={14} className="text-emerald-500 animate-pulse" />
          <span className="text-[9px] font-bold text-emerald-500/70 uppercase tracking-widest font-mono">System Integrity: 100%</span>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-4 px-6 py-4 text-[var(--text-muted)] hover:text-rose-400 hover:bg-rose-500/10 rounded-2xl transition-all group"
        >
          <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          <span className="text-xs font-black uppercase tracking-[0.2em]">{t('terminate_session')}</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
