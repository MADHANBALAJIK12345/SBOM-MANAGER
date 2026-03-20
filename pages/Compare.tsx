import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { GitCompare, ArrowRight, Shield, AlertTriangle, Package, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { ScanResult, ScanComparison } from '../types';

interface CompareProps {
  history: ScanResult[];
}

const Compare: React.FC<CompareProps> = ({ history }) => {
  const [id1, setId1] = useState('');
  const [id2, setId2] = useState('');
  const [comparison, setComparison] = useState<ScanComparison | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCompare = async () => {
    if (!id1 || !id2) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/compare/${id1}/${id2}`);
      if (!response.ok) throw new Error('Failed to fetch comparison');
      const data = await response.json();
      setComparison(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-10 space-y-10">
      <header className="space-y-3">
        <h1 className="text-6xl font-black tracking-tighter uppercase italic text-[var(--text-main)]">Audit_Comparison</h1>
        <p className="text-[var(--text-muted)] font-mono text-xs uppercase tracking-[0.5em]">Differential Analysis Engine</p>
      </header>

      <div className="glass p-10 rounded-[3rem] border-white/5 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Baseline Audit (Scan 1)</label>
            <select 
              value={id1} 
              onChange={(e) => setId1(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm font-mono text-white outline-none focus:border-emerald-500 transition-all"
            >
              <option value="">Select Baseline...</option>
              {history.map(scan => (
                <option key={scan.id} value={scan.id}>
                  {scan.projectName} - {new Date(scan.timestamp).toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Target Audit (Scan 2)</label>
            <select 
              value={id2} 
              onChange={(e) => setId2(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm font-mono text-white outline-none focus:border-emerald-500 transition-all"
            >
              <option value="">Select Target...</option>
              {history.map(scan => (
                <option key={scan.id} value={scan.id}>
                  {scan.projectName} - {new Date(scan.timestamp).toLocaleString()}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button 
          onClick={handleCompare}
          disabled={!id1 || !id2 || loading}
          className="btn-primary w-full py-6 text-lg flex items-center justify-center gap-4 disabled:opacity-50"
        >
          {loading ? 'Analyzing Differentials...' : (
            <>
              <GitCompare size={24} />
              Execute Differential Analysis
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-3xl text-rose-500 font-mono text-sm">
          ERROR: {error}
        </div>
      )}

      {comparison && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-10"
        >
          {/* Score & Vulnerability Diff */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="glass p-10 rounded-[3rem] border-white/5 flex flex-col items-center justify-center text-center space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Security Score Delta</h3>
              <div className={`text-7xl font-black tracking-tighter flex items-center gap-4 ${comparison.scoreDiff > 0 ? 'text-emerald-500' : comparison.scoreDiff < 0 ? 'text-rose-500' : 'text-white'}`}>
                {comparison.scoreDiff > 0 ? <TrendingUp size={48} /> : comparison.scoreDiff < 0 ? <TrendingDown size={48} /> : <Minus size={48} />}
                {comparison.scoreDiff > 0 ? `+${comparison.scoreDiff}` : comparison.scoreDiff}
              </div>
              <p className="text-xs text-[var(--text-muted)] font-medium">Net change in overall security posture</p>
            </div>

            <div className="glass p-10 rounded-[3rem] border-white/5 space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Vulnerability Delta</h3>
              <div className="grid grid-cols-2 gap-6">
                <DiffMetric label="Critical" value={comparison.vulnerabilityDiff.critical} color="text-rose-500" />
                <DiffMetric label="High" value={comparison.vulnerabilityDiff.high} color="text-orange-500" />
                <DiffMetric label="Medium" value={comparison.vulnerabilityDiff.medium} color="text-amber-500" />
                <DiffMetric label="Low" value={comparison.vulnerabilityDiff.low} color="text-blue-500" />
              </div>
            </div>
          </div>

          {/* Dependency Changes */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <ChangeList 
              title="Added Dependencies" 
              items={comparison.addedDependencies} 
              icon={Package} 
              color="emerald" 
            />
            <ChangeList 
              title="Removed Dependencies" 
              items={comparison.removedDependencies} 
              icon={Package} 
              color="rose" 
            />
            <div className="glass p-8 rounded-[3rem] border-white/5 space-y-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-2xl">
                  <GitCompare className="text-blue-500" size={20} />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest">Version Shifts</h3>
              </div>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {comparison.changedVersions.length > 0 ? comparison.changedVersions.map((item, i) => (
                  <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                    <span className="text-xs font-bold">{item.name}</span>
                    <div className="flex items-center gap-3 font-mono text-[10px]">
                      <span className="text-slate-500">{item.oldVersion}</span>
                      <ArrowRight size={12} className="text-blue-500" />
                      <span className="text-blue-500 font-bold">{item.newVersion}</span>
                    </div>
                  </div>
                )) : (
                  <p className="text-xs text-slate-500 italic p-4">No version changes detected.</p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

const DiffMetric = ({ label, value, color }: any) => (
  <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex justify-between items-center">
    <span className="text-[10px] font-black uppercase tracking-widest opacity-50">{label}</span>
    <span className={`text-lg font-black ${value > 0 ? 'text-rose-500' : value < 0 ? 'text-emerald-500' : 'text-white'}`}>
      {value > 0 ? `+${value}` : value}
    </span>
  </div>
);

const ChangeList = ({ title, items, icon: Icon, color }: any) => (
  <div className="glass p-8 rounded-[3rem] border-white/5 space-y-6">
    <div className="flex items-center gap-4">
      <div className={`p-3 bg-${color}-500/10 rounded-2xl`}>
        <Icon className={`text-${color}-500`} size={20} />
      </div>
      <h3 className="text-sm font-black uppercase tracking-widest">{title}</h3>
    </div>
    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
      {items.length > 0 ? items.map((item: any, i: number) => (
        <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
          <span className="text-xs font-bold">{item.name}</span>
          <span className="text-[10px] font-mono opacity-50">{item.version}</span>
        </div>
      )) : (
        <p className="text-xs text-slate-500 italic p-4">No changes detected.</p>
      )}
    </div>
  </div>
);

export default Compare;
