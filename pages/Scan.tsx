
import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Upload, Folder, FileArchive, X, ShieldCheck, Database, Loader2, FileText, Server, Github, Link as LinkIcon } from 'lucide-react';
import { Toast } from '../components/NotificationSystem';
import { ScanResult } from '../types';

interface ScanProps {
  onScanComplete: (result: ScanResult, files: File[]) => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  t: (key: any) => string;
}

const Scan: React.FC<ScanProps> = ({ onScanComplete, addToast, t }) => {
  const [selectedItems, setSelectedItems] = useState<File[]>([]);
  const [githubUrl, setGithubUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Ready for Audit');
  const [dbStatus, setDbStatus] = useState<'IDLE' | 'INGESTING' | 'SYNCED'>('IDLE');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  const handleSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setSelectedItems(prev => [...prev, ...files]);
    setGithubUrl(''); // Clear GitHub URL if files are selected
    addToast({
      title: t('payload_staged'),
      message: `${files.length} items added to analysis queue.`,
      type: 'info'
    });
  };

  const startScan = async () => {
    if (selectedItems.length === 0 && !githubUrl) return;
    
    setIsScanning(true);
    setDbStatus('INGESTING');
    setProgress(0);
    setStatus(githubUrl ? 'Fetching GitHub Repository...' : 'Initializing Scan Engine...');

    console.log('--- FRONTEND SCAN START ---');
    
    // Mock progress while actual deterministic analysis happens
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return 95;
        const step = Math.random() * 10;
        if (githubUrl) {
          if (prev < 30) setStatus('Connecting to GitHub API...');
          else if (prev < 50) setStatus('Downloading Repository Payload...');
          else if (prev < 70) setStatus('Extracting Artifacts...');
          else if (prev < 85) setStatus('Analyzing Dependency Manifests...');
          else setStatus('Finalizing SBOM Report...');
        } else {
          if (prev < 30) setStatus('Initializing Scan Engine...');
          else if (prev < 60) setStatus('Parsing Dependency Manifests...');
          else if (prev < 85) setStatus('Analyzing Source Code for Secrets...');
          else setStatus('Finalizing SBOM Report...');
        }
        return Math.floor(prev + step);
      });
    }, 800);

    try {
      let data;
      if (githubUrl) {
        const response = await fetch('/api/scan-github', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: githubUrl })
        });
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'GitHub scan failed');
        }
        data = await response.json();
      } else {
        const formData = new FormData();
        selectedItems.forEach(file => {
          formData.append('files', file);
        });
        const response = await fetch('/api/scan', {
          method: 'POST',
          body: formData
        });
        if (!response.ok) throw new Error('Network response was not ok');
        data = await response.json();
      }

      console.log('Backend Response Received:', data);

      // Transform backend response into ScanResult structure
      const result: ScanResult = {
        id: `scan-${Date.now()}`,
        projectName: data.repoInfo ? data.repoInfo.name : (selectedItems[0]?.name.split('.')[0] || 'Untitled Project'),
        timestamp: new Date().toLocaleString(),
        vulnerabilities: {
          critical: [...data.internal, ...data.external, ...data.thirdParty].filter(d => d.risk === 'Critical').length + 
                    (data.codeErrors?.filter((f: any) => f.severity === 'Critical').length || 0),
          high: [...data.internal, ...data.external, ...data.thirdParty].filter(d => d.risk === 'High').length +
                (data.codeErrors?.filter((f: any) => f.severity === 'High').length || 0),
          medium: [...data.internal, ...data.external, ...data.thirdParty].filter(d => d.risk === 'Medium').length,
          low: [...data.internal, ...data.external, ...data.thirdParty].filter(d => d.risk === 'Low').length,
        },
        dependencies: [
          ...data.internal.map((d: any) => ({ ...d, type: 'internal' })),
          ...data.external.map((d: any) => ({ ...d, type: 'external' })),
          ...data.thirdParty.map((d: any) => ({ ...d, type: 'third-party' })),
        ],
        internal: data.internal.map((d: any) => ({ ...d, type: 'internal' })),
        external: data.external.map((d: any) => ({ ...d, type: 'external' })),
        thirdParty: data.thirdParty.map((d: any) => ({ ...d, type: 'third-party' })),
        codeErrors: data.codeErrors || [],
        aiSuggestions: data.aiSuggestions || [],
        licenseWarnings: data.licenseWarnings || [],
        dependencyGraph: data.dependencyGraph || { id: 'root', name: 'Project', version: '1.0.0', type: 'internal', children: [] },
        riskPredictions: data.riskPredictions || [],
        metadata: {
          engine: 'V9.0 Advanced Intelligence',
          fileCount: data.internal.length + data.external.length + data.thirdParty.length,
          detectedStack: data.repoInfo ? `GitHub: ${data.repoInfo.owner}/${data.repoInfo.name}` : 'Hybrid Analysis',
          totalSize: data.repoInfo ? 'Remote Repository' : `${(selectedItems.reduce((acc, f) => acc + f.size, 0) / 1024).toFixed(2)} KB`,
          repoInfo: data.repoInfo
        },
        securityScore: data.securityScore || 0
      };

      console.log('Mapped ScanResult:', result);
      
      clearInterval(interval);
      setProgress(100);
      
      setTimeout(() => {
        setIsScanning(false);
        setDbStatus('SYNCED');
        onScanComplete(result, selectedItems);
      }, 500);

    } catch (err: any) {
      console.error('Scan Error:', err);
      clearInterval(interval);
      setIsScanning(false);
      setDbStatus('IDLE');
      addToast({
        title: 'Audit Failed',
        message: err.message || 'A system error occurred during deterministic parsing.',
        type: 'error'
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-6xl font-black tracking-tighter italic uppercase mb-2 text-[var(--text-main)]">{t('audit_center')}</h1>
          <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-[0.4em] font-mono">Supply Chain Intelligence Node</p>
        </div>
        <div className="flex gap-4">
           <div className={`px-4 py-2 rounded-xl glass border flex items-center gap-3 ${dbStatus === 'SYNCED' ? 'border-emerald-500/30 text-emerald-500' : 'border-[var(--border)] text-[var(--text-muted)]'}`}>
              <Server size={14} className={dbStatus === 'INGESTING' ? 'animate-pulse' : ''} />
              <span className="text-[10px] font-black uppercase tracking-widest font-mono">DB_BACKEND: {dbStatus}</span>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass p-10 rounded-[3rem] space-y-8 flex flex-col justify-center min-h-[500px] shadow-2xl"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <UploadButton icon={FileText} label="Files" onClick={() => fileInputRef.current?.click()} />
              <UploadButton icon={Folder} label="Folders" onClick={() => folderInputRef.current?.click()} />
              <UploadButton icon={FileArchive} label="ZIPs" onClick={() => zipInputRef.current?.click()} />
            </div>

            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-40">
                <Github size={16} />
                <div className="w-[1px] h-4 bg-[var(--text-muted)]" />
              </div>
              <input 
                type="text"
                value={githubUrl}
                onChange={(e) => {
                  setGithubUrl(e.target.value);
                  if (e.target.value) setSelectedItems([]);
                }}
                placeholder="Paste GitHub Repository URL..."
                className="w-full h-14 bg-black/20 border border-[var(--border)] rounded-2xl pl-14 pr-4 text-xs font-mono outline-none focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleSelection} />
          <input type="file" ref={folderInputRef} className="hidden" {...({ webkitdirectory: "" } as any)} onChange={handleSelection} />
          <input type="file" ref={zipInputRef} className="hidden" accept=".zip,.rar,.tar" onChange={handleSelection} />

          <div className={`w-full h-64 border-2 border-dashed rounded-[3rem] transition-all flex flex-col items-center justify-center p-10 text-center relative overflow-hidden ${selectedItems.length > 0 || githubUrl ? 'border-emerald-500 bg-emerald-500/5' : 'border-[var(--border)] hover:border-emerald-500/30'}`}>
            {isScanning && <div className="scan-line" />}
            {selectedItems.length === 0 && !githubUrl ? (
              <div className="opacity-40">
                <Database size={48} className="mx-auto mb-4 text-[var(--text-main)]" />
                <p className="text-sm font-bold uppercase tracking-widest text-[var(--text-main)]">No Payload Detected</p>
              </div>
            ) : githubUrl ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 inline-block">
                  <Github size={32} className="text-emerald-500" />
                </div>
                <p className="text-xs font-mono text-emerald-500 font-bold truncate max-w-[300px]">{githubUrl}</p>
                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest">Remote Repository Staged</p>
              </div>
            ) : (
              <div className="w-full space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-emerald-500 tracking-widest">{selectedItems.length} {t('nodes_staged')}</span>
                  <button onClick={() => setSelectedItems([])} className="text-rose-500 hover:underline text-[10px] font-bold uppercase tracking-widest">Clear All</button>
                </div>
                <div className="max-h-32 overflow-y-auto pr-2 space-y-2">
                  {selectedItems.slice(0, 3).map((f, i) => (
                    <div key={i} className="flex items-center justify-between text-[10px] font-mono p-3 bg-[var(--bg-body)] rounded-xl border border-[var(--border)] text-[var(--text-main)]">
                      <span className="truncate max-w-[200px]">{f.name}</span>
                      <span className="opacity-40">{(f.size / 1024).toFixed(1)}KB</span>
                    </div>
                  ))}
                  {selectedItems.length > 3 && <div className="text-[9px] font-bold text-[var(--text-muted)] italic">+{selectedItems.length - 3} more files...</div>}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={startScan}
            disabled={isScanning || (selectedItems.length === 0 && !githubUrl)}
            className="btn-primary w-full h-16 flex items-center justify-center gap-4"
          >
            {isScanning ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
            {isScanning ? 'Determining_Security_Rules...' : t('execute_audit')}
          </button>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass p-10 rounded-[3rem] relative flex flex-col items-center justify-center text-center overflow-hidden shadow-xl"
        >
          {isScanning ? (
            <div className="w-full space-y-10 animate-in zoom-in duration-500">
              <div className="relative w-48 h-48 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-emerald-500/10" />
                <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl font-black font-mono text-[var(--text-main)]">{progress}%</span>
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-sm font-bold uppercase tracking-[0.4em] text-emerald-500">{status}</p>
                <p className="text-[10px] text-[var(--text-muted)] font-mono animate-pulse">APPLYING DETERMINISTIC RULES...</p>
              </div>
            </div>
          ) : (
            <div className="opacity-20 space-y-6">
              <ShieldCheck size={120} className="mx-auto text-[var(--text-main)]" />
              <p className="text-xs font-mono uppercase tracking-[0.4em] text-[var(--text-main)]">{t('engine_standing_by')}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

const UploadButton = ({ icon: Icon, label, onClick }: any) => (
  <button onClick={onClick} className="flex flex-col items-center gap-3 p-6 bg-[var(--bg-body)] border border-[var(--border)] rounded-3xl hover:bg-emerald-500/5 hover:border-emerald-500/50 transition-all group shadow-sm">
    <Icon className="text-emerald-500 group-hover:scale-110 transition-transform" />
    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-main)]">{label}</span>
  </button>
);

export default Scan;
