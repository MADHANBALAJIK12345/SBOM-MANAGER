
import React, { useState } from 'react';
// Added missing Loader2 import
import { User, Mail, Shield, Edit2, Save, X, Phone, UserCircle, CheckCircle, GraduationCap, Building, Loader2 } from 'lucide-react';
import { UserProfile } from '../types';

interface ProfileProps {
  user: UserProfile;
  setUser: (u: UserProfile) => void;
  t: (key: any) => string;
}

const Profile: React.FC<ProfileProps> = ({ user, setUser, t }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UserProfile>({ ...user });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setUser({ ...formData });
      setIsEditing(false);
      setIsSaving(false);
    }, 600);
  };

  const getInitial = (name: string) => name.charAt(0).toUpperCase();

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-6xl font-black tracking-tighter italic uppercase mb-2 text-[var(--text-main)]">{t('profile')}</h1>
          <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-[0.4em] font-mono">Platform Identity Ledger</p>
        </div>
        {!isEditing && (
          <button 
            onClick={() => {
              setFormData({...user});
              setIsEditing(true);
            }} 
            className="px-8 py-4 glass rounded-2xl flex items-center gap-3 font-black text-[10px] uppercase tracking-widest hover:border-emerald-500/30 transition-all text-[var(--text-main)] active:scale-95 shadow-sm"
          >
            <Edit2 size={14} /> Modify_Credentials
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 glass p-10 rounded-[4rem] relative overflow-hidden group shadow-xl transition-all duration-500">
          <div className="scan-line" />
          
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="shrink-0">
              <div className="w-52 h-52 rounded-[3.5rem] bg-gradient-to-br from-emerald-500 to-blue-700 flex items-center justify-center border-4 border-emerald-500/20 shadow-2xl relative overflow-hidden">
                <span className="text-white text-8xl font-black tracking-tighter animate-in zoom-in duration-500">
                  {getInitial(isEditing ? formData.name : user.name)}
                </span>
                <div className="absolute inset-0 bg-white/5 opacity-20 pointer-events-none" />
              </div>
            </div>

            <div className="flex-1 w-full space-y-8">
              {isEditing ? (
                <div className="grid gap-6 animate-in slide-in-from-bottom-4 duration-300">
                  <ProfileField label="Operator Name" value={formData.name} onChange={v => setFormData({...formData, name: v})} icon={UserCircle} />
                  <div className="grid grid-cols-2 gap-4">
                    <ProfileField label="Register Number" value={formData.registerNumber || ''} onChange={v => setFormData({...formData, registerNumber: v})} icon={GraduationCap} />
                    <ProfileField label="Department" value={formData.department || ''} onChange={v => setFormData({...formData, department: v})} icon={Building} />
                  </div>
                  <ProfileField label="Communication ID (Email)" value={formData.email} onChange={v => setFormData({...formData, email: v})} icon={Mail} />
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in duration-500">
                  <div>
                    <h2 className="text-4xl font-black italic tracking-tighter uppercase text-[var(--text-main)]">{user.name}</h2>
                    <p className="text-emerald-500 font-mono text-sm tracking-widest mt-1">@{user.username}</p>
                  </div>
                  <div className="space-y-5 pt-6 border-t border-[var(--border)]">
                    <InfoRow icon={GraduationCap} text={`Reg: ${user.registerNumber || 'PRO-2025-XXX'}`} />
                    <InfoRow icon={Building} text={`Dept: ${user.department || 'Security Intelligence'}`} />
                    <InfoRow icon={Mail} text={user.email} />
                    <InfoRow icon={Shield} text="CLEARANCE: ALPHA_OPERATOR" color="text-emerald-500" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {isEditing && (
            <div className="mt-12 flex gap-4 animate-in slide-in-from-bottom-4 duration-400">
              <button 
                onClick={handleSave} 
                disabled={isSaving}
                className="flex-1 h-16 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-3xl transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 uppercase tracking-widest text-[11px] active:scale-95 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={16} />}
                {isSaving ? 'Syncing...' : 'Sync_Changes'}
              </button>
              <button 
                onClick={() => setIsEditing(false)} 
                className="px-10 h-16 bg-[var(--bg-body)] border border-[var(--border)] text-[var(--text-main)] hover:bg-[var(--border)] font-black rounded-3xl transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-[11px] active:scale-95"
              >
                <X size={16} /> Cancel
              </button>
            </div>
          )}
        </div>

        <div className="glass p-10 rounded-[4rem] flex flex-col items-center justify-center text-center space-y-8 relative overflow-hidden shadow-xl hover:shadow-emerald-500/10 transition-shadow duration-700">
          <div className="w-24 h-24 bg-emerald-500/10 rounded-full border border-emerald-500/20 flex items-center justify-center relative">
            <Shield size={48} className="text-emerald-500" />
            <div className="absolute inset-0 bg-emerald-500 blur-2xl opacity-20 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xl font-black uppercase tracking-widest mb-3 italic text-[var(--text-main)]">Vault Identity</h3>
            <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase leading-relaxed tracking-widest">Biometric profile verified. Report generation will utilize these credentials.</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20">
            <CheckCircle size={12} className="text-emerald-500" />
            <span className="text-[9px] font-black uppercase text-emerald-500 tracking-tighter">Identity Sync Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProfileField = ({ label, value, onChange, icon: Icon }: any) => (
  <div className="space-y-2">
    <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] pl-2">{label}</label>
    <div className="relative">
      <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] opacity-60" size={16} />
      <input 
        value={value} onChange={e => onChange(e.target.value)}
        className="w-full h-14 bg-[var(--input-bg)] border border-[var(--border)] rounded-3xl pl-12 pr-4 outline-none focus:border-emerald-500 font-mono text-xs transition-all text-[var(--text-main)] shadow-sm"
      />
    </div>
  </div>
);

const InfoRow = ({ icon: Icon, text, color = "" }: any) => (
  <div className={`flex items-center gap-4 text-[11px] font-bold ${color || "text-[var(--text-muted)]"}`}>
    <Icon size={16} />
    <span className="tracking-tight uppercase tracking-widest font-mono">{text}</span>
  </div>
);

export default Profile;
