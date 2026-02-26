
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Package, ShieldAlert, Library, Box, Zap, Bell, ShieldCheck, Activity, Globe, Cpu, Server, History, ChevronRight, Database } from 'lucide-react';
import { ScanResult } from '../types';
import { storageService } from '../services/storageService';

interface DashboardProps {
  latestScan: ScanResult | null;
  userEmail?: string;
  onNavigate: (tab: string) => void;
  isDark: boolean;
  t: (key: any) => string;
}

const Dashboard: React.FC<DashboardProps> = ({ latestScan, userEmail, onNavigate, isDark, t }) => {
  const [logs, setLogs] = useState<{ id: number; msg: string; time: string }[]>([]);
  const [history, setHistory] = useState<ScanResult[]>([]);
  const [storageUsed, setStorageUsed] = useState('0.0 MB');

  useEffect(() => {
    const fetchData = async () => {
      if (userEmail) {
        const h = await storageService.getUserScanHistory(userEmail);
        setHistory(h);
        
        // Calculate storage usage (sum of metadata sizes in mock way for dashboard)
        const totalKB = h.reduce((acc, scan) => {
          const sizeStr = scan.metadata.totalSize?.split(' ')[0] || '0';
          return acc + parseFloat(sizeStr);
        }, 0);
        setStorageUsed(`${(totalKB / 1024).toFixed(2)} MB`);
      }
    };
    fetchData();
  }, [userEmail, latestScan]);

  useEffect(() => {
    const messages = [
      "SCRAPING_NODE_BITSTREAM...",
      "PACKET_INSPECTION_COMPLETE",
      "VULN_DB_SYNC_AUTHORIZED",
      "MAPPING_DEPENDENCY_TREE",
      "HEURISTIC_ANALYSIS_STAGED",
      "SUPPLY_CHAIN_VERIFIED",
      "INDEXED_DB_COMMIT_SUCCESS"
    ];
    
    const interval = setInterval(() => {
      setLogs(prev => [
        { id: Date.now(), msg: messages[Math.floor(Math.random() * messages.length)], time: new Date().toLocaleTimeString() },
        ...prev.slice(0, 5)
      ]);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const chartData = [
    { name: '00:00', threat: 4, nodes: 40 },
    { name: '04:00', threat: 12, nodes: 120 },
    { name: '08:00', threat: 8, nodes: 90 },
    { name: '12:00', threat: latestScan?.vulnerabilities.critical || 5, nodes: latestScan?.dependencies.length || 80 },
    { name: '16:00', threat: 6, nodes: 110 },
    { name: '20:00', threat: 10, nodes: 95 },
  ];

  const stats = {
    totalProjects: history.length,
    internal: latestScan?.dependencies.filter(d => d.type === 'internal').length || 0,
    external: latestScan?.dependencies.filter(d => d.type === 'external').length || 0,
    thirdParty: latestScan?.dependencies.filter(d => d.type === 'third-party').length || 0,
    highRisk: latestScan?.vulnerabilities.critical || 0,
  };

  const gridColor = isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.05)';
  const labelColor = isDark ? '#94a3b8' : '#64748b';

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="p-4 md:p-10 space-y-12">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div className="space-y-3">
          <h1 className="text-6xl font-black tracking-tighter uppercase italic text-[var(--text-main)]">{t('ops_telemetry')}</h1>
          <p className="text-[var(--text-muted)] font-mono text-xs uppercase tracking-[0.5em]">{t('active_threat')}</p>
        </div>
        
        <div className="flex gap-4">
          <div className="glass px-8 py-5 rounded-[2rem] flex items-center gap-6 shadow-xl border-emerald-500/10">
             <div className="relative">
               <Database className="w-5 h-5 text-emerald-500" />
               <div className="absolute inset-0 bg-emerald-500 blur-lg opacity-40 animate-pulse" />
             </div>
             <div>
               <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest block">Vault_Storage</span>
               <span className="text-xs font-mono text-emerald-500 font-bold uppercase tracking-widest">{storageUsed} Used</span>
             </div>
          </div>
          <div className="glass px-8 py-5 rounded-[2rem] flex items-center gap-6 shadow-xl">
             <Globe className="w-5 h-5 text-blue-500" />
             <div>
               <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest block">{t('network_hub')}</span>
               <span className="text-xs font-mono text-blue-500 font-bold uppercase tracking-widest">Region: US-WEST</span>
             </div>
          </div>
        </div>
      </header>

      {!latestScan && history.length === 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-12 border border-emerald-500/20 bg-emerald-500/5 rounded-[3.5rem] flex flex-col md:flex-row items-center gap-10 group cursor-pointer" 
          onClick={() => onNavigate('scan')}
        >
          <div className="relative">
            <ShieldCheck className="w-20 h-20 text-emerald-500 flex-shrink-0 group-hover:scale-110 transition-transform" />
            <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-3xl font-black text-[var(--text-main)] uppercase tracking-tighter">System Idle. Pending Audit.</h3>
            <p className="text-[var(--text-muted)] mt-2 font-medium max-w-2xl">Platform environment is primed for ingestion. No active project SBOM is loaded. Execute a scan to map security surfaces.</p>
          </div>
          <button 
            className="btn-primary"
          >
            Initiate Scan Sequence
          </button>
        </motion.div>
      )}

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6"
      >
        <StatCard icon={Box} label={t('active_audits')} value={stats.totalProjects} color="text-[var(--text-main)]" variants={itemVariants} />
        <StatCard icon={Cpu} label={t('internal_nodes')} value={stats.internal} color="text-emerald-500" variants={itemVariants} />
        <StatCard icon={Package} label={t('external_libs')} value={stats.external} color="text-blue-500" variants={itemVariants} />
        <StatCard icon={Library} label={t('third_party')} value={stats.thirdParty} color="text-amber-500" variants={itemVariants} />
        <StatCard icon={ShieldAlert} label={t('threat_index')} value={stats.highRisk} color="text-rose-500" highlight onClick={() => onNavigate('sbom')} variants={itemVariants} />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 glass rounded-[4rem] p-12 relative overflow-hidden group"
        >
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-emerald-500/5 blur-[120px] rounded-full group-hover:bg-emerald-500/10 transition-all duration-1000" />
          
          <div className="flex justify-between items-start mb-12">
            <div>
              <h3 className="text-2xl font-black text-[var(--text-main)] tracking-tighter flex items-center gap-4">
                <Zap className="w-6 h-6 text-amber-400" /> {t('threat_history')}
              </h3>
              <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-2">Historical node vulnerability trajectory</p>
            </div>
            <div className="flex gap-2">
              <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[9px] font-black uppercase text-emerald-500">24H Window</div>
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorThreat" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorNodes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="name" stroke={labelColor} fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                <YAxis stroke={labelColor} fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-body)', border: '1px solid var(--border)', borderRadius: '24px', color: 'var(--text-main)', fontSize: '10px' }}
                />
                <Area type="monotone" dataKey="threat" stroke="#f43f5e" fillOpacity={1} fill="url(#colorThreat)" strokeWidth={4} />
                <Area type="monotone" dataKey="nodes" stroke="#10b981" fillOpacity={1} fill="url(#colorNodes)" strokeWidth={2} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-12 space-y-4">
             <h4 className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2">
               <History size={14} className="text-emerald-500" /> Recent_Audits_DB
             </h4>
             <div className="space-y-2">
               {history.length > 0 ? history.slice(0, 3).map((scan) => (
                 <div key={scan.id} className="flex items-center justify-between p-4 bg-[var(--bg-body)] border border-[var(--border)] rounded-2xl hover:border-emerald-500/30 transition-all group cursor-pointer" onClick={() => onNavigate('sbom')}>
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-emerald-500/5 flex items-center justify-center border border-emerald-500/10">
                          <ShieldCheck size={18} className="text-emerald-500" />
                       </div>
                       <div>
                          <p className="text-xs font-bold text-[var(--text-main)]">{scan.projectName}</p>
                          <p className="text-[10px] font-mono text-[var(--text-muted)]">{scan.timestamp}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-6">
                       <div className="flex gap-2">
                          <span className="px-2 py-1 bg-rose-500/10 text-rose-500 text-[9px] font-bold rounded-lg border border-rose-500/10">{scan.vulnerabilities.critical} Crit</span>
                          <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 text-[9px] font-bold rounded-lg border border-emerald-500/10">{scan.dependencies.length} Nodes</span>
                       </div>
                       <ChevronRight size={14} className="text-[var(--text-muted)] group-hover:text-emerald-500 transition-colors" />
                    </div>
                 </div>
               )) : (
                 <p className="text-[10px] font-mono text-[var(--text-muted)] italic">Database is empty. Execute a scan to populate history.</p>
               )}
             </div>
          </div>
        </motion.div>

        <div className="flex flex-col gap-8">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="glass rounded-[3.5rem] p-10 flex-1 relative overflow-hidden"
          >
            <h3 className="text-lg font-black text-[var(--text-main)] tracking-tighter mb-8 flex items-center gap-3 uppercase">
               <Server className="w-5 h-5 text-emerald-500" /> {t('real_time_audit')}
            </h3>
            <div className="space-y-4 font-mono">
              {logs.map((log) => (
                <div key={log.id} className="flex gap-4 items-center text-[10px] animate-in slide-in-from-left-2 fade-in">
                  <span className="text-[var(--text-muted)] shrink-0">[{log.time}]</span>
                  <span className="text-emerald-500 font-bold tracking-tight">{log.msg}</span>
                </div>
              ))}
              <div className="pt-2">
                <div className="w-full h-1 bg-[var(--border)] rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-1/3 animate-ping origin-left opacity-30" />
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 dark:from-indigo-900/40 dark:to-slate-950 border border-[var(--border)] rounded-[3.5rem] p-10 group cursor-pointer shadow-sm hover:shadow-md transition-shadow" onClick={() => onNavigate('notifications')}
          >
            <h3 className="text-lg font-black text-[var(--text-main)] tracking-tighter mb-6 flex items-center gap-3 uppercase">
               <Bell className="w-5 h-5 text-blue-500 animate-bounce" /> {t('alerts_hub')}
            </h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed font-medium">Monitoring global security feeds for supply chain vulnerabilities affecting your nodes.</p>
            <div className="mt-8 flex justify-between items-center">
              <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">3 Priority Alerts</span>
              <div className="p-2 bg-blue-500/10 rounded-lg group-hover:translate-x-1 transition-transform">
                <Zap size={16} className="text-blue-500" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ icon: any; label: string; value: number; color: string; highlight?: boolean; onClick?: () => void; variants?: any }> = ({ icon: Icon, label, value, color, highlight, onClick, variants }) => (
  <motion.div 
    variants={variants}
    onClick={onClick}
    className={`p-10 card-bento ${highlight ? 'border-rose-500/30 ring-1 ring-rose-500/10 shadow-rose-500/5 shadow-2xl' : ''} ${onClick ? 'cursor-pointer' : ''}`}
  >
    <div className="flex justify-between items-center relative z-10">
      <div className={`p-4 rounded-2xl ${highlight ? 'bg-rose-500/10' : 'bg-emerald-500/5 border border-emerald-500/10'}`}>
        <Icon className={`w-8 h-8 ${color} group-hover:rotate-12 transition-transform`} />
      </div>
      <span className={`text-5xl font-black font-mono tracking-tighter ${color}`}>{value.toString().padStart(2, '0')}</span>
    </div>
    <div className="mt-8 relative z-10">
      <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">{label}</p>
    </div>
    {highlight && (
      <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-rose-500/5 blur-[50px] pointer-events-none group-hover:bg-rose-500/10 transition-all" />
    )}
  </motion.div>
);

export default Dashboard;
