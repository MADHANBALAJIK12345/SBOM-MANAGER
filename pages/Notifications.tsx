
import React from 'react';
import { AlertCircle, CheckCircle, Info, Trash2, ShieldAlert, CheckSquare } from 'lucide-react';
import { Notification } from '../types';

interface NotificationsProps {
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  // Fixed: Added missing t function for translations
  t: (key: any) => string;
}

const Notifications: React.FC<NotificationsProps> = ({ notifications, setNotifications, t }) => {
  const markRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const purgeAll = () => {
    setNotifications([]);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-[var(--text-main)] uppercase italic tracking-tighter">{t('alert_hub')}</h1>
          <p className="text-[var(--text-muted)] mt-1 font-medium">Uplink history of SBOM events and scan detections.</p>
        </div>
        <button 
          onClick={purgeAll}
          className="px-6 py-3 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-95"
        >
          Purge Log
        </button>
      </header>

      {notifications.length === 0 ? (
        <div className="py-40 text-center space-y-4 opacity-40">
          <CheckSquare className="w-16 h-16 text-[var(--text-main)] mx-auto" />
          <h3 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tighter">Audit Clear</h3>
          <p className="text-[var(--text-muted)] text-sm">No security events currently flagged in the log.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map(notif => (
            <div 
              key={notif.id} 
              className={`p-6 bg-[var(--bg-body)] border rounded-[2rem] flex gap-6 group transition-all backdrop-blur-3xl shadow-sm hover:shadow-md ${
                notif.read ? 'border-[var(--border)] opacity-60' : 'border-[var(--text-muted)]/30'
              }`}
            >
              <div className={`p-4 rounded-2xl flex-shrink-0 ${
                notif.type === 'error' || notif.type === 'security' ? 'bg-rose-500/10 text-rose-500' :
                notif.type === 'warning' ? 'bg-amber-500/10 text-amber-500' :
                notif.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'
              }`}>
                {notif.type === 'error' || notif.type === 'security' ? <ShieldAlert className="w-6 h-6" /> :
                 notif.type === 'warning' ? <AlertCircle className="w-6 h-6" /> :
                 notif.type === 'success' ? <CheckCircle className="w-6 h-6" /> : <Info className="w-6 h-6" />}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-black text-[var(--text-main)] uppercase tracking-tighter">{notif.title}</h3>
                  <span className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-widest font-bold">{notif.timestamp}</span>
                </div>
                <p className="text-sm text-[var(--text-muted)] mt-2 leading-relaxed font-medium">{notif.message}</p>
                <div className="mt-4 flex gap-6">
                  {!notif.read && (
                    <button 
                      onClick={() => markRead(notif.id)}
                      className="text-[10px] font-black text-emerald-500 uppercase tracking-widest hover:underline"
                    >
                      Acknowledge Alert
                    </button>
                  )}
                  <button className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest hover:text-[var(--text-main)] transition-colors">
                    View Metadata
                  </button>
                </div>
              </div>
              <button 
                onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-[var(--text-muted)] hover:text-rose-500 self-start"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
