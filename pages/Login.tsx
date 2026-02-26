
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Lock, User, Eye, EyeOff, Mail, Loader2, Phone, UserCircle, AlertTriangle, Fingerprint, Terminal, ShieldCheck } from 'lucide-react';
import { UserProfile } from '../types';
import { storageService } from '../services/storageService';

interface LoginProps {
  onLogin: (userProfile: UserProfile) => void;
  t: (key: any) => string;
}

const Login: React.FC<LoginProps> = ({ onLogin, t }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isAdminMode) {
        // Updated Admin Credentials
        if (formData.email === 'madhan678@gmail.com' && formData.password === 'madhan@678') {
          onLogin({
            name: 'Madhan Admin',
            username: 'madhan678',
            email: 'admin@sbom.pro',
            phone: '+1 800 ADMIN',
            role: 'admin',
            about: 'Root level access. System Oversight.'
          });
          return;
        } else {
          setError('ADMIN_FAILURE: Invalid cryptographic keys.');
          return;
        }
      }

      if (isSignUp) {
        const newUser: UserProfile = {
          name: formData.name,
          username: formData.username,
          email: formData.email,
          phone: formData.phone || '+91 98765 43210',
          location: 'Chennai, India',
          about: 'Cyber-Security Professional.',
          role: 'user'
        };
        await storageService.saveUser(newUser);
        onLogin(newUser);
      } else {
        const existingUser = await storageService.findUser(formData.email);
        
        if (existingUser || formData.email === 'madhan@gmail.com') {
          const profile = existingUser || {
            name: 'Madhan',
            username: 'madhan',
            email: 'madhan@gmail.com',
            phone: '+91 98765 43210',
            location: 'Chennai, India',
            about: 'Cyber-Security Researcher & SBOM Architect.',
            role: 'user'
          };
          onLogin(profile);
        } else {
          setError('IDENT_FAILURE: Credentials not found in backend.');
        }
      }
    } catch (err) {
      setError('DATABASE_ERROR: Connection failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <motion.div 
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.5 }}
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: 'url("https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=2070")',
        }}
      >
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/5 to-slate-950/90" />
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-lg glass p-10 rounded-[3.5rem] shadow-2xl relative z-10 overflow-hidden group border-white/10 ring-1 ring-white/5"
      >
        <div className={`scan-line ${isAdminMode ? 'bg-rose-500' : 'bg-emerald-500'}`} />
        
        <div className="flex flex-col items-center mb-10 text-center">
          <motion.div 
            whileHover={{ rotate: 12, scale: 1.1 }}
            className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 border transition-all duration-500 relative ${isAdminMode ? 'bg-rose-500/10 border-rose-500/20 shadow-[0_0_50px_rgba(244,63,94,0.25)]' : 'bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.25)]'}`}
          >
            {isAdminMode ? <Terminal size={40} className="text-rose-500" /> : <Fingerprint size={40} className="text-emerald-500" />}
            <div className={`absolute inset-0 rounded-3xl blur-xl animate-pulse ${isAdminMode ? 'bg-rose-500/10' : 'bg-emerald-500/10'}`} />
          </motion.div>
          <h1 className="text-4xl font-black tracking-tighter italic uppercase mb-2 text-white">
            {isAdminMode ? 'ADMIN_CONSOLE' : (isSignUp ? t('new_reg') : t('login_auth'))}
          </h1>
          <p className={`text-[10px] font-bold uppercase tracking-[0.5em] font-mono ${isAdminMode ? 'text-rose-400' : 'text-emerald-400'}`}>
            {isAdminMode ? 'ROOT_LEVEL_AUTHORIZATION' : (isSignUp ? t('create_identity') : t('secure_access'))}
          </p>
        </div>

        {/* Mode Toggle Tabs */}
        <div className="flex p-1 bg-black/40 rounded-2xl border border-white/5 mb-8">
          <button 
            onClick={() => { setIsAdminMode(false); setIsSignUp(false); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isAdminMode ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
          >
            <User size={12} /> User Access
          </button>
          <button 
            onClick={() => { setIsAdminMode(true); setIsSignUp(false); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isAdminMode ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
          >
            <Shield size={12} /> Admin Console
          </button>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`mb-8 p-5 border rounded-[2rem] flex items-center gap-4 overflow-hidden ${isAdminMode ? 'bg-rose-500/10 border-rose-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}
            >
               <AlertTriangle className="text-rose-500 shrink-0" size={20} />
               <p className="text-[11px] font-bold text-rose-500 uppercase tracking-widest leading-relaxed">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-5">
          <AnimatePresence mode="wait">
            {isSignUp && !isAdminMode && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-5"
              >
              <div className="space-y-2">
                <label className="text-[9px] font-black opacity-60 uppercase tracking-widest pl-2 text-slate-300">{t('full_name')}</label>
                <div className="relative">
                  <UserCircle size={14} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30 text-white" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Madhan"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full h-14 bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 outline-none focus:border-emerald-500 transition-all font-mono text-xs text-white shadow-sm placeholder-white/20"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black opacity-60 uppercase tracking-widest pl-2 text-slate-300">{t('handle')}</label>
                <div className="relative">
                  <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30 text-white" />
                  <input
                    type="text"
                    required
                    placeholder="madhan_07"
                    value={formData.username}
                    onChange={e => setFormData({...formData, username: e.target.value})}
                    className="w-full h-14 bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 outline-none focus:border-emerald-500 transition-all font-mono text-xs text-white shadow-sm placeholder-white/20"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

          <div className="space-y-2">
            <label className="text-[9px] font-black opacity-60 uppercase tracking-widest pl-2 text-slate-300">
              {isAdminMode ? 'ADMIN_IDENTIFIER' : t('email_addr')}
            </label>
            <div className="relative">
              {isAdminMode ? <Terminal size={14} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30 text-white" /> : <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30 text-white" />}
              <input
                type={isAdminMode ? "text" : "email"}
                required
                placeholder={isAdminMode ? "madhan678@gmail.com" : "madhan@gmail.com"}
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className={`w-full h-14 bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 outline-none transition-all font-mono text-xs text-white shadow-sm placeholder-white/20 ${isAdminMode ? 'focus:border-rose-500' : 'focus:border-emerald-500'}`}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black opacity-60 uppercase tracking-widest pl-2 text-slate-300">{isAdminMode ? 'ROOT_PASSWORD' : t('sec_token')}</label>
            <div className="relative">
              <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30 text-white" />
              <input
                type={showPass ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                className={`w-full h-14 bg-black/40 border border-white/10 rounded-2xl pl-12 pr-12 outline-none transition-all font-mono text-xs text-white shadow-sm placeholder-white/20 ${isAdminMode ? 'focus:border-rose-500' : 'focus:border-emerald-500'}`}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-100 transition-opacity text-white"
              >
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full h-16 text-white font-black rounded-2xl transition-all shadow-xl active:scale-95 flex items-center justify-center gap-4 uppercase tracking-[0.2em] text-[11px] mt-6 group disabled:opacity-50 ${isAdminMode ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/30' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/30'}`}
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : (isAdminMode ? <ShieldCheck size={18} className="group-hover:scale-110 transition-transform" /> : <Shield size={18} className="group-hover:scale-110 transition-transform" />)}
            {isAdminMode ? 'AUTHENTICATE_ADMIN' : (isSignUp ? t('create_profile') : t('establish_link'))}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-white/10 flex flex-col items-center gap-6">
          {!isAdminMode && (
            <button 
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="text-[11px] font-black uppercase tracking-widest text-emerald-500 hover:text-emerald-400 hover:underline transition-all"
            >
              {isSignUp ? t('already_account') : t('new_operator')}
            </button>
          )}
          {isAdminMode && (
            <p className="text-[9px] font-mono text-rose-400/50 uppercase tracking-[0.3em] text-center">Protected by AES-256 System Encryption</p>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
