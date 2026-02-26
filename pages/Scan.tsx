
import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Upload, Folder, FileArchive, X, ShieldCheck, Database, Loader2, FileText, Server } from 'lucide-react';
import { Toast } from '../components/NotificationSystem';
import { ScanResult } from '../types';
import { analyzeFiles } from '../services/analyzerService';

interface ScanProps {
  onScanComplete: (result: ScanResult, files: File[]) => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  t: (key: any) => string;
}

const Scan: React.FC<ScanProps> = ({ onScanComplete, addToast, t }) => {
  const [selectedItems, setSelectedItems] = useState<File[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dbStatus, setDbStatus] = useState<'IDLE' | 'INGESTING' | 'SYNCED'>('IDLE');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  const handleSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setSelectedItems(prev => [...prev, ...files]);
    addToast({
      title: t('payload_staged'),
      message: `${files.length} items added to analysis queue.`,
      type: 'info'
    });
  };

  const startScan = async () => {
    if (selectedItems.length === 0) return;
    setIsScanning(true);
    setDbStatus('INGESTING');
    setProgress(0);

    // Mock progress while actual deterministic analysis happens
    const interval = setInterval(() => {
      setProgress(prev => Math.min(prev + 5, 95));
    }, 100);

    try {
      // Execute the deterministic analysis (Async parsing of manifests)
      const result = await analyzeFiles(selectedItems);
      
      clearInterval(interval);
      setProgress(100);
      
      setTimeout(() => {
        setIsScanning(false);
        setDbStatus('SYNCED');
        onScanComplete(result, selectedItems);
      }, 500);

    } catch (err) {
      clearInterval(interval);
      setIsScanning(false);
      setDbStatus('IDLE');
      addToast({
        title: 'Audit Failed',
        message: 'A system error occurred during deterministic parsing.',
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
          <div className="grid grid-cols-3 gap-4">
            <UploadButton icon={FileText} label="Files" onClick={() => fileInputRef.current?.click()} />
            <UploadButton icon={Folder} label="Folders" onClick={() => folderInputRef.current?.click()} />
            <UploadButton icon={FileArchive} label="ZIPs" onClick={() => zipInputRef.current?.click()} />
          </div>

          <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleSelection} />
          <input type="file" ref={folderInputRef} className="hidden" {...({ webkitdirectory: "" } as any)} onChange={handleSelection} />
          <input type="file" ref={zipInputRef} className="hidden" accept=".zip,.rar,.tar" onChange={handleSelection} />

          <div className={`w-full h-80 border-2 border-dashed rounded-[3rem] transition-all flex flex-col items-center justify-center p-10 text-center relative overflow-hidden ${selectedItems.length > 0 ? 'border-emerald-500 bg-emerald-500/5' : 'border-[var(--border)] hover:border-emerald-500/30'}`}>
            {isScanning && <div className="scan-line" />}
            {selectedItems.length === 0 ? (
              <div className="opacity-40">
                <Database size={48} className="mx-auto mb-4 text-[var(--text-main)]" />
                <p className="text-sm font-bold uppercase tracking-widest text-[var(--text-main)]">No Payload Detected</p>
              </div>
            ) : (
              <div className="w-full space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-emerald-500 tracking-widest">{selectedItems.length} {t('nodes_staged')}</span>
                  <button onClick={() => setSelectedItems([])} className="text-rose-500 hover:underline text-[10px] font-bold uppercase tracking-widest">Clear All</button>
                </div>
                <div className="max-h-40 overflow-y-auto pr-2 space-y-2">
                  {selectedItems.slice(0, 5).map((f, i) => (
                    <div key={i} className="flex items-center justify-between text-[10px] font-mono p-3 bg-[var(--bg-body)] rounded-xl border border-[var(--border)] text-[var(--text-main)]">
                      <span className="truncate max-w-[200px]">{f.name}</span>
                      <span className="opacity-40">{(f.size / 1024).toFixed(1)}KB</span>
                    </div>
                  ))}
                  {selectedItems.length > 5 && <div className="text-[9px] font-bold text-[var(--text-muted)] italic">+{selectedItems.length - 5} more files...</div>}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={startScan}
            disabled={isScanning || selectedItems.length === 0}
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
                <p className="text-sm font-bold uppercase tracking-[0.4em] text-emerald-500">{t('analyzing_streams')}</p>
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
