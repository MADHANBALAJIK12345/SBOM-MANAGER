
import React, { useState, useEffect, useCallback } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Scan from './pages/Scan';
import SbomResult from './pages/SbomResult';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Contact from './pages/Contact';
import About from './pages/About';
import AdminPanel from './pages/AdminPanel';
import Sidebar from './components/Sidebar';
import NotificationSystem, { Toast } from './components/NotificationSystem';
import ChatBot from './components/ChatBot';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Sun, Moon, Shield, Languages, User } from 'lucide-react';
import { UserProfile, ScanResult, Notification } from './types';
import { mockUser, mockNotifications } from './mockData';
import { translations, Language } from './services/translationService';
import { storageService } from './services/storageService';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('sbom_lang') as Language) || 'en';
  });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [time, setTime] = useState(new Date());

  const t = (key: keyof typeof translations.en) => {
    return translations[lang][key] || translations.en[key] || key;
  };

  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('sbom_current_session_user');
    try {
      return saved ? JSON.parse(saved) : mockUser;
    } catch {
      return mockUser;
    }
  });

  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [latestScan, setLatestScan] = useState<ScanResult | null>(null);

  useEffect(() => {
    const syncSession = async () => {
      if (isAuthenticated && user) {
        localStorage.setItem('sbom_current_session_user', JSON.stringify(user));
        const lastSessionScan = await storageService.getLatestScan(user.email);
        if (lastSessionScan) {
          setLatestScan(lastSessionScan);
        }
      }
    };
    syncSession();
  }, [isAuthenticated, user]);

  useEffect(() => {
    localStorage.setItem('sbom_lang', lang);
  }, [lang]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleLogin = async (profile: UserProfile) => {
    await storageService.saveUser(profile);
    setUser(profile);
    setIsAuthenticated(true);
    
    const historyScan = await storageService.getLatestScan(profile.email);
    if (historyScan) {
      setLatestScan(historyScan);
      addToast({
        title: 'Archive Restored',
        message: `Welcome back, ${profile.name}. Latest audit state synchronized.`,
        type: 'info'
      });
    } else {
      addToast({
        title: 'Uplink Established',
        message: `Welcome ${profile.name}. Secure session initiated.`,
        type: 'success'
      });
    }
  };

  const onScanComplete = async (result: ScanResult, files: File[]) => {
    setLatestScan(result);
    if (user) {
      addToast({ title: 'DB Commit', message: 'Syncing artifacts to vault...', type: 'info' });
      await storageService.saveScanResult(user.email, result, files);
    }
    
    setNotifications(prev => [{
      id: `n-${Date.now()}`,
      title: 'Audit Finalized',
      message: `Project ${result.projectName} analyzed and synced.`,
      type: 'success',
      timestamp: 'Just now',
      read: false
    }, ...prev]);
    addToast({ title: 'Scan Success', message: 'Deterministic audit complete.', type: 'success' });
    setActiveTab('sbom');
  };

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  const toggleLang = () => {
    const langs: Language[] = ['en', 'hi', 'ta'];
    const next = langs[(langs.indexOf(lang) + 1) % langs.length];
    setLang(next);
  };

  if (!isAuthenticated) {
    return (
      <div className={theme === 'dark' ? 'theme-dark' : 'theme-light'}>
        <Login onLogin={handleLogin} t={t} />
      </div>
    );
  }

  const getInitial = (name: string) => name.charAt(0).toUpperCase();

  return (
    <div className={`${theme === 'dark' ? 'theme-dark' : 'theme-light'} flex min-h-screen text-[var(--text-main)] transition-all duration-500`}>
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        onLogout={() => setIsAuthenticated(false)} 
        t={t} 
        isAdmin={user.role === 'admin'}
      />
      
      <div className="flex-1 flex flex-col min-w-0 bg-[var(--bg-body)]">
        <header className="h-20 glass flex items-center justify-between px-10 sticky top-0 z-50">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-500 font-mono tracking-widest uppercase">Node_Connected</span>
            </div>
            {user.role === 'admin' && (
              <div className="px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">SYSTEM_ADMIN</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-6">
            <button 
              onClick={toggleLang} 
              className="px-4 py-2 bg-[var(--border)] hover:bg-emerald-500/10 rounded-xl flex items-center gap-2 group"
            >
              <Languages size={18} className="text-emerald-500 group-hover:rotate-12 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest">{lang}</span>
            </button>

            <button onClick={toggleTheme} className="p-3 bg-[var(--border)] hover:bg-emerald-500/10 rounded-xl transition-all">
              {theme === 'dark' ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-indigo-600" />}
            </button>
            
            <button 
              onClick={() => setActiveTab('profile')}
              className="flex items-center gap-4 border-l border-[var(--border)] pl-6 group hover:opacity-80 transition-opacity"
            >
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{user.role === 'admin' ? 'Root Administrator' : 'System Operator'}</p>
                <p className="text-xs font-bold font-mono text-[var(--text-main)] group-hover:text-emerald-500 transition-colors">{user.name}</p>
              </div>
              <div className="relative">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-lg ring-2 transition-all ${user.role === 'admin' ? 'bg-gradient-to-br from-rose-500 to-rose-700 ring-rose-500/20' : 'bg-gradient-to-br from-emerald-500 to-blue-600 ring-emerald-500/20'}`}>
                  {getInitial(user.name)}
                </div>
              </div>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto relative p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="h-full"
            >
              {activeTab === 'dashboard' && <Dashboard latestScan={latestScan} userEmail={user?.email} onNavigate={setActiveTab} isDark={theme === 'dark'} t={t} />}
              {activeTab === 'scan' && <Scan onScanComplete={onScanComplete} addToast={addToast} t={t} />}
              {activeTab === 'sbom' && <SbomResult scanResult={latestScan} user={user} t={t} />}
              {activeTab === 'notifications' && <Notifications notifications={notifications} setNotifications={setNotifications} t={t} />}
              {activeTab === 'profile' && <Profile user={user} setUser={setUser} t={t} />}
              {activeTab === 'contact' && <Contact t={t} user={user} addToast={addToast} />}
              {activeTab === 'about' && <About t={t} />}
              {activeTab === 'admin' && user.role === 'admin' && <AdminPanel t={t} admin={user} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <NotificationSystem toasts={toasts} removeToast={removeToast} />
      <ChatBot isDarkTheme={theme === 'dark'} />
    </div>
  );
};

export default App;
