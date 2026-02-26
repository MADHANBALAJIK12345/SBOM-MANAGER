
import React, { useState } from 'react';
import { Phone, Mail, MessageSquare, Shield, Globe, Send, Terminal, Key, Loader2, CheckCircle, User, Info } from 'lucide-react';
import { storageService } from '../services/storageService';
import { UserProfile } from '../types';

interface ContactProps {
  t: (key: any) => string;
  user: UserProfile;
  addToast: (toast: any) => void;
}

const Contact: React.FC<ContactProps> = ({ t, user, addToast }) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    subject: '',
    content: ''
  });
  const [isSending, setIsSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, email, subject, content } = formData;
    if (!subject.trim() || !content.trim() || !name.trim()) return;

    setIsSending(true);
    try {
      // The message is sent to the central 'messages' store in IndexedDB, which the AdminPanel reads from.
      await storageService.sendMessage({
        senderName: name,
        senderEmail: email || 'GUEST_USER',
        subject: subject,
        content: content
      });
      
      setIsSuccess(true);
      setFormData(prev => ({ ...prev, subject: '', content: '' }));
      
      addToast({
        title: 'Transmission Established',
        message: 'Your signal has reached the Admin Console successfully.',
        type: 'success'
      });
      
      setTimeout(() => setIsSuccess(false), 8000);
    } catch (err) {
      addToast({
        title: 'Signal Lost',
        message: 'Could not establish connection with the Admin node.',
        type: 'error'
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-500 pb-20">
      <header>
        <h1 className="text-6xl font-black tracking-tighter italic uppercase mb-2 text-[var(--text-main)]">{t('secure_uplink')}</h1>
        <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-[0.4em] font-mono">Encrypted Communication Channels</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="glass p-12 rounded-[4rem] space-y-10 relative overflow-hidden shadow-xl">
          <div className="scan-line" />
          <h2 className="text-2xl font-black text-[var(--text-main)] uppercase tracking-tighter flex items-center gap-4">
            <Terminal className="text-emerald-500" /> Support_Terminals
          </h2>
          
          <div className="space-y-8">
            <ContactItem icon={Mail} label="Core Security" value="root@sbom.internal" desc="Direct encrypted channel for vulnerability reports." />
            <PhoneItem icon={Phone} label="Emergency Uplink" value="+91 98400 12345" desc="24/7 Indian Supply chain emergency response." />
            <ContactItem icon={Globe} label="Portal Docs" value="docs.sbom.io" desc="Public knowledge base and integration guides." />
          </div>

          <div className="p-8 bg-emerald-500/10 border border-emerald-500/20 rounded-[2.5rem] flex gap-4">
            <Info className="text-emerald-500 shrink-0 mt-1" size={16} />
            <p className="text-[10px] font-mono text-emerald-500 leading-relaxed uppercase font-bold">
              All signals are routed via AES-256 encrypted VPN tunnels. Metadata is stripped to protect the sender's node identity.
            </p>
          </div>
        </div>

        <div className="glass p-12 rounded-[4rem] space-y-8 shadow-xl relative">
          <h2 className="text-2xl font-black text-[var(--text-main)] uppercase tracking-tighter flex items-center gap-4">
            <Send className="text-blue-500" /> Message_Relay
          </h2>
          
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-24 text-center space-y-6 animate-in zoom-in duration-500">
              <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/30">
                <CheckCircle size={48} className="text-emerald-500 animate-pulse" />
              </div>
              <div>
                <h3 className="text-2xl font-black uppercase text-white tracking-tighter italic">Transmission_Finalized</h3>
                <p className="text-xs text-[var(--text-muted)] font-mono uppercase tracking-[0.2em] mt-2">Packet delivered. Admin verification pending.</p>
              </div>
              <button 
                onClick={() => setIsSuccess(false)} 
                className="mt-4 px-10 py-4 bg-emerald-600/10 text-emerald-500 border border-emerald-500/20 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-600 hover:text-white transition-all active:scale-95"
              >
                Send New Signal
              </button>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest pl-2">Operator Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white opacity-20" size={14} />
                    <input 
                      required
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full h-12 bg-[var(--input-bg)] border border-[var(--border)] rounded-2xl pl-10 pr-4 outline-none focus:border-emerald-500 font-mono text-xs text-[var(--text-main)] shadow-sm" 
                      placeholder="e.g. Guest_User" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest pl-2">Uplink Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white opacity-20" size={14} />
                    <input 
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full h-12 bg-[var(--input-bg)] border border-[var(--border)] rounded-2xl pl-10 pr-4 outline-none focus:border-emerald-500 font-mono text-xs text-[var(--text-main)] shadow-sm" 
                      placeholder="optional@node.com" 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest pl-2">Subject Header</label>
                <input 
                  required
                  value={formData.subject}
                  onChange={e => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full h-14 bg-[var(--input-bg)] border border-[var(--border)] rounded-2xl px-6 outline-none focus:border-emerald-500 font-mono text-xs text-[var(--text-main)] shadow-sm" 
                  placeholder="RE: SYSTEM_ANOMALY" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest pl-2">Data Payload</label>
                <textarea 
                  required
                  value={formData.content}
                  onChange={e => setFormData({ ...formData, content: e.target.value })}
                  className="w-full h-40 bg-[var(--input-bg)] border border-[var(--border)] rounded-2xl p-6 outline-none focus:border-emerald-500 font-mono text-xs text-[var(--text-main)] resize-none shadow-sm" 
                  placeholder="Describe the security query or incident..." 
                />
              </div>

              <button 
                type="submit"
                disabled={isSending || !formData.subject || !formData.content || !formData.name}
                className="w-full h-16 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white font-black rounded-3xl transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-4 uppercase tracking-[0.2em] text-[11px] active:scale-95"
              >
                {isSending ? <Loader2 className="animate-spin" size={18} /> : <Key size={18} />}
                {isSending ? 'Relaying_Signal...' : 'Broadcast_Signal'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

const ContactItem = ({ icon: Icon, label, value, desc }: any) => (
  <div className="flex gap-6 items-start group">
    <div className="p-4 rounded-2xl bg-[var(--bg-body)] border border-[var(--border)] text-emerald-500 group-hover:scale-110 transition-transform shadow-sm">
      <Icon size={24} />
    </div>
    <div>
      <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">{label}</p>
      <p className="text-lg font-black text-[var(--text-main)] group-hover:text-emerald-500 transition-colors tracking-tight">{value}</p>
      <p className="text-[10px] text-[var(--text-muted)] font-medium mt-1 leading-relaxed">{desc}</p>
    </div>
  </div>
);

const PhoneItem = ({ icon: Icon, label, value, desc }: any) => (
  <div className="flex gap-6 items-start group">
    <div className="p-4 rounded-2xl bg-[var(--bg-body)] border border-[var(--border)] text-blue-500 group-hover:scale-110 transition-transform shadow-sm">
      <Icon size={24} />
    </div>
    <div>
      <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">{label}</p>
      <p className="text-lg font-black text-[var(--text-main)] group-hover:text-blue-500 transition-colors tracking-tight">{value}</p>
      <p className="text-[10px] text-[var(--text-muted)] font-medium mt-1 leading-relaxed">{desc}</p>
    </div>
  </div>
);

export default Contact;
