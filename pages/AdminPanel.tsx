
import React, { useState, useEffect } from 'react';
import { Mail, Shield, User, Clock, CheckCircle, Trash2, ShieldAlert, Inbox, Search, RefreshCw, BadgeCheck, Zap, Server, Terminal, Lock, Activity, Wifi } from 'lucide-react';
import { storageService } from '../services/storageService';
import { UserMessage, UserProfile } from '../types';

interface AdminPanelProps {
  t: (key: any) => string;
  admin: UserProfile;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ t, admin }) => {
  const [messages, setMessages] = useState<UserMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'read'>('all');

  const fetchMessages = async () => {
    setIsLoading(true);
    try {
      const msgs = await storageService.getAdminMessages();
      setMessages(msgs);
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    } finally {
      setTimeout(() => setIsLoading(false), 600);
    }
  };

  useEffect(() => {
    fetchMessages();

    // Subscribe to real-time signals from User Contact relay
    const unsubscribe = storageService.subscribeToSignals((payload) => {
      if (payload.type === 'NEW_MESSAGE') {
        // Instant update: prepend the new message to state
        setMessages(prev => {
          // Prevent duplicates if multiple events fire
          if (prev.find(m => m.id === payload.data.id)) return prev;
          return [payload.data, ...prev];
        });
        
        // Brief live indicator pulse
        setIsLive(true);
        setTimeout(() => setIsLive(false), 3000);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleAcknowledge = async (id: string) => {
    try {
      await storageService.acknowledgeMessage(id);
      setMessages(prev => prev.map(m => m.id === id ? { ...m, read: true } : m));
    } catch (err) {
      console.error("Failed to acknowledge message:", err);
    }
  };

  const filteredMessages = messages.filter(m => {
    const matchesSearch = (m.senderName + m.senderEmail + m.subject).toLowerCase().includes(search.toLowerCase());
    const matchesFilter = activeFilter === 'all' ? true : 
                          activeFilter === 'unread' ? !m.read : m.read;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
        <div className="relative group">
          <h1 className="text-6xl font-black tracking-tighter italic uppercase mb-4 text-[var(--text-main)]">Admin_HQ</h1>
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em]">Authorized Operator</span>
              <span className="text-sm font-bold uppercase tracking-tighter italic text-emerald-500">{admin.name}</span>
            </div>
            <div className="flex flex-col border-l border-[var(--border)] pl-6">
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em]">Access Token</span>
              <span className="text-sm font-bold uppercase tracking-tighter italic text-rose-500 font-mono">ROOT_LEVEL_SIG</span>
            </div>
            <div className="flex flex-col border-l border-[var(--border)] pl-6">
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em]">Live Stream</span>
              <div className="flex items-center gap-2">
                 <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-blue-400 animate-ping' : 'bg-emerald-500 animate-pulse'}`} />
                 <span className={`text-sm font-bold uppercase tracking-tighter italic ${isLive ? 'text-blue-400' : 'text-emerald-500'}`}>
                   {isLive ? 'RECEIVING_SIGNAL...' : 'IDLE_WATCH'}
                 </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex gap-4">
          <div className="hidden lg:flex items-center gap-3 px-6 py-4 glass rounded-2xl border-blue-500/20 shadow-lg shadow-blue-500/5">
            <Wifi size={14} className="text-blue-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Socket_Relay: Active</span>
          </div>
          <button 
            onClick={fetchMessages}
            disabled={isLoading}
            className="flex items-center gap-3 px-8 py-4 glass rounded-2xl hover:bg-emerald-500/10 transition-all font-black text-[10px] uppercase tracking-widest shadow-sm group active:scale-95"
          >
            <RefreshCw size={14} className={`${isLoading ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"} text-emerald-500`} /> 
            {isLoading ? 'Decrypting...' : 'Force_Sync'}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        {/* Admin Command Center */}
        <div className="lg:col-span-1 space-y-8">
          <div className="glass p-10 rounded-[4rem] relative overflow-hidden shadow-2xl border-emerald-500/20 ring-1 ring-emerald-500/10">
            <div className="scan-line" />
            <div className="flex flex-col items-center text-center space-y-8">
              <div className="w-40 h-40 rounded-[3rem] bg-gradient-to-br from-emerald-600 to-slate-950 flex items-center justify-center border-4 border-emerald-500/20 shadow-2xl relative group overflow-hidden">
                <Shield size={80} className="text-white group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-emerald-500 opacity-10 mix-blend-overlay pointer-events-none" />
              </div>
              
              <div>
                <h3 className="text-3xl font-black italic uppercase text-white tracking-tighter leading-none">{admin.name}</h3>
                <p className="text-[10px] font-mono font-bold text-emerald-500 uppercase tracking-[0.3em] mt-3">Chief_Systems_Auditor</p>
              </div>

              <div className="w-full space-y-3 pt-8 border-t border-white/5">
                <AdminStatRow icon={Mail} label="Comms" value={admin.email} />
                <AdminStatRow icon={BadgeCheck} label="Tier" value="Admin_Level_1" />
                <AdminStatRow icon={Lock} label="Vault" value="AES_256_ACTIVE" />
                <AdminStatRow icon={Activity} label="Pulse" value="OPTIMAL" success />
              </div>
            </div>
          </div>

          <div className="glass p-8 rounded-[3rem] bg-blue-500/5 border-blue-500/10 shadow-lg group">
            <div className="flex items-center gap-3 text-blue-400 mb-4">
               <Wifi size={20} className="animate-pulse" />
               <h4 className="text-[11px] font-black uppercase tracking-widest italic">Signal Relay</h4>
            </div>
            <p className="text-[10px] text-blue-400/70 font-mono leading-relaxed uppercase font-bold">
              User messages are prioritized and delivered via instant cryptographic broadcast.
            </p>
          </div>
        </div>

        {/* Transmission Inbox */}
        <div className="lg:col-span-3 space-y-10">
          <div className="flex flex-col md:flex-row gap-6 items-center justify-between border-b border-white/5 pb-8">
            <div className="flex flex-wrap gap-2 p-1.5 bg-black/40 rounded-[2.5rem] border border-white/5">
               <FilterTab label="All Signals" active={activeFilter === 'all'} count={messages.length} onClick={() => setActiveFilter('all')} />
               <FilterTab label="Urgent/New" active={activeFilter === 'unread'} count={messages.filter(m => !m.read).length} onClick={() => setActiveFilter('unread')} />
               <FilterTab label="Archived" active={activeFilter === 'read'} count={messages.filter(m => m.read).length} onClick={() => setActiveFilter('read')} />
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30 text-white" size={16} />
              <input 
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search signal logs..."
                className="w-full h-14 bg-black/40 border border-white/10 rounded-[1.5rem] pl-12 pr-6 outline-none focus:border-emerald-500 font-mono text-xs text-white shadow-inner transition-all"
              />
            </div>
          </div>

          <div className="space-y-6">
            {isLoading && messages.length === 0 ? (
              <div className="py-48 flex flex-col items-center justify-center gap-8 opacity-40 animate-pulse">
                <Terminal size={80} className="text-emerald-500" />
                <span className="text-xs font-black uppercase tracking-[0.5em] font-mono italic">Syncing_Encrypted_Channels...</span>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="py-48 flex flex-col items-center justify-center gap-8 opacity-20 text-center grayscale">
                <Inbox size={100} className="text-[var(--text-muted)]" />
                <div className="space-y-3">
                  <h3 className="text-3xl font-black uppercase tracking-tighter">Zero_Transmissions</h3>
                  <p className="text-xs font-mono uppercase tracking-[0.2em]">Signal inbox is currently silent.</p>
                </div>
              </div>
            ) : (
              filteredMessages.map(msg => (
                <InboxMessageItem 
                  key={msg.id} 
                  msg={msg} 
                  onAcknowledge={() => handleAcknowledge(msg.id)} 
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const FilterTab = ({ label, active, count, onClick }: any) => (
  <button onClick={onClick} className={`px-8 py-4 rounded-[2rem] transition-all font-black uppercase text-[10px] tracking-widest flex items-center gap-3 ${active ? 'bg-emerald-600 text-white shadow-xl scale-105' : 'text-slate-500 hover:text-white'}`}>
    {label} <span className={`px-2.5 py-1 rounded-full text-[9px] ${active ? 'bg-white/20' : 'bg-white/5'}`}>{count}</span>
  </button>
);

const AdminStatRow = ({ icon: Icon, label, value, success }: any) => (
  <div className="flex items-center justify-between group py-1">
    <div className="flex items-center gap-3">
      <Icon size={14} className={`${success ? 'text-emerald-500' : 'text-slate-500'} group-hover:scale-125 transition-transform`} />
      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
    </div>
    <span className={`text-[9px] font-black uppercase tracking-tighter truncate max-w-[140px] ${success ? 'text-emerald-500' : 'text-white'}`}>{value}</span>
  </div>
);

const InboxMessageItem: React.FC<{ msg: UserMessage; onAcknowledge: () => void | Promise<void> }> = ({ msg, onAcknowledge }) => (
  <div className={`glass p-10 rounded-[4rem] transition-all flex flex-col gap-8 shadow-2xl border-l-8 ${msg.read ? 'border-l-white/10 opacity-60 grayscale-[0.4]' : 'border-l-blue-600 animate-in slide-in-from-right-10 duration-500'}`}>
    <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
      <div className="flex-1 space-y-5">
        <div className="flex items-center gap-5">
          {!msg.read && (
            <div className="px-5 py-2 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-500 font-black text-[10px] uppercase tracking-widest animate-pulse">
              LIVE_SIGNAL
            </div>
          )}
          <h3 className="text-3xl font-black text-white uppercase tracking-tighter italic leading-none">{msg.subject}</h3>
        </div>
        
        <div className="flex flex-wrap items-center gap-6 font-mono text-[11px] text-slate-400 uppercase tracking-widest">
           <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
             <User size={16} className="text-emerald-500" /> 
             <span className="font-black text-white">{msg.senderName}</span>
           </div>
           <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
             <Mail size={16} className="text-blue-500" /> 
             <span className="font-bold">{msg.senderEmail}</span>
           </div>
           <div className="flex items-center gap-3 opacity-60">
             <Clock size={16} /> 
             <span>{new Date(msg.timestamp).toLocaleString()}</span>
           </div>
        </div>
      </div>
      
      {!msg.read && (
        <button 
          onClick={() => {
            const result = onAcknowledge();
            if (result instanceof Promise) {
              result.catch(err => console.error("Signal Ack Failed:", err));
            }
          }}
          className="px-10 py-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-[2rem] transition-all shadow-2xl shadow-emerald-600/30 flex items-center gap-3 uppercase tracking-widest text-[11px] active:scale-95 group"
        >
          <CheckCircle size={18} className="group-hover:scale-110 transition-transform" /> Acknowledge_Signal
        </button>
      )}
    </div>
    
    <div className="p-10 bg-black/60 rounded-[3rem] border border-white/5 relative group overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-blue-600/20" />
      <Server size={24} className="absolute top-6 right-8 text-white/5 group-hover:text-emerald-500/20 transition-colors" />
      <p className="text-base text-slate-300 leading-relaxed font-medium whitespace-pre-wrap font-mono">
        {msg.content}
      </p>
    </div>
  </div>
);

export default AdminPanel;
