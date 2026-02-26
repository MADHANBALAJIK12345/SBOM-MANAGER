
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ExternalLink, Activity, CheckCircle, ShieldAlert, Layers, Package, Globe, Database, FileJson, FileCode, Printer, X, Server, Loader2, Info, Zap, ShieldCheck, FileArchive } from 'lucide-react';
import { ScanResult, RiskLevel, Dependency, CodeError, FileRecord, UserProfile } from '../types';
import { storageService } from '../services/storageService';
import { transformToCycloneDX, transformToSPDX, transformToALS } from '../services/sbomExportService';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface SbomResultProps {
  scanResult: ScanResult | null;
  user: UserProfile | null;
  t: (key: any) => string;
}

const SbomResult: React.FC<SbomResultProps> = ({ scanResult, user, t }) => {
  const [activeTab, setActiveTab] = useState<'internal' | 'external' | 'third-party' | 'code' | 'vault'>('internal');
  const [search, setSearch] = useState('');
  const [vaultFiles, setVaultFiles] = useState<FileRecord[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedDep, setSelectedDep] = useState<Dependency | null>(null);

  useEffect(() => {
    if (scanResult) {
      const hasInternal = scanResult.dependencies.some(d => d.type === 'internal');
      if (!hasInternal) {
        const hasThirdParty = scanResult.dependencies.some(d => d.type === 'third-party');
        if (hasThirdParty) setActiveTab('third-party');
        else if (scanResult.dependencies.some(d => d.type === 'external')) setActiveTab('external');
      }
    }
  }, [scanResult?.id]);

  useEffect(() => {
    const fetchFiles = async () => {
      if (scanResult) {
        const files = await storageService.getScanFiles(scanResult.id);
        setVaultFiles(files);
      }
    };
    fetchFiles();
  }, [scanResult]);

  if (!scanResult) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="h-full flex flex-col items-center justify-center p-20 text-center opacity-30 space-y-6"
      >
        <Database size={64} className="text-[var(--text-muted)]" />
        <h2 className="text-3xl font-black tracking-tighter uppercase text-[var(--text-main)]">No Audit Data Found</h2>
        <p className="text-sm max-w-sm text-[var(--text-muted)]">Run a scan in the Audit Center to generate results.</p>
      </motion.div>
    );
  }

  const generateProfessionalPdf = async () => {
    if (!scanResult || !user) return;
    setIsExporting(true);

    const doc = new jsPDF('p', 'mm', 'a4') as any;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    doc.setFillColor(15, 23, 42); 
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(2);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

    doc.setFontSize(32);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('SOFTWARE BILL OF MATERIALS', 20, 50);
    doc.setFontSize(28);
    doc.text('(SBOM) REPORT', 20, 62);
    
    doc.setFillColor(16, 185, 129);
    doc.rect(20, 75, 40, 4, 'F');

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text('SUPPLY CHAIN SECURITY ANALYSIS', 20, 90);

    doc.setFillColor(30, 41, 59);
    doc.rect(20, 120, pageWidth - 40, 100, 'F');
    
    const labelX = 35;
    let detailY = 140;
    const spacing = 15;

    const drawDetail = (label: string, value: string) => {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(16, 185, 129);
      doc.text(label.toUpperCase(), labelX, detailY);
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text(value || 'N/A', labelX, detailY + 7);
      detailY += spacing + 7;
    };

    drawDetail('Candidate Name', user.name);
    drawDetail('Register Number', user.registerNumber || 'PRO-2025-001');
    drawDetail('Department', user.department || 'Cyber Security');
    drawDetail('Project ID', scanResult.projectName);
    drawDetail('Timestamp', new Date().toLocaleString());

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text('CONFIDENTIAL SECURITY DOCUMENT - GENERATED VIA SBOM MANAGER PRO', pageWidth / 2, pageHeight - 15, { align: 'center' });

    doc.addPage();
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(18);
    doc.text('EXECUTIVE SUMMARY', 15, 20);
    
    doc.autoTable({
      startY: 30,
      head: [['Metric Identifier', 'Analysis Result']],
      body: [
        ['Total Mapped Dependencies', scanResult.dependencies.length],
        ['Critical Vulnerabilities', scanResult.vulnerabilities.critical],
        ['High Risk Findings', scanResult.vulnerabilities.high],
        ['Internal Proprietary Nodes', scanResult.dependencies.filter(d => d.type === 'internal').length],
        ['Third-Party Packages', scanResult.dependencies.filter(d => d.type === 'third-party').length],
        ['Analysis Engine', scanResult.metadata.engine]
      ],
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] }
    });

    doc.addPage();
    doc.text('DEPENDENCY INVENTORY', 15, 20);
    doc.autoTable({
      startY: 30,
      head: [['Component', 'Version', 'Type', 'License', 'Risk Status']],
      body: scanResult.dependencies.map(d => [d.name, d.version, d.type, d.license, d.risk]),
      theme: 'striped',
      headStyles: { fillColor: [30, 41, 59] }
    });

    doc.save(`${scanResult.projectName}_Professional_SBOM.pdf`);
    setIsExporting(false);
  };

  const exportStandard = (format: 'cyclonedx' | 'spdx' | 'als') => {
    if (!scanResult) return;
    let content;
    switch(format) {
      case 'cyclonedx': content = transformToCycloneDX(scanResult); break;
      case 'spdx': content = transformToSPDX(scanResult); break;
      case 'als': content = transformToALS(scanResult); break;
    }
    const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${scanResult.projectName}_${format.toUpperCase()}.json`;
    a.click();
  };

  const filteredDeps = scanResult.dependencies.filter(d => 
    d.type === activeTab && d.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredErrors = scanResult.codeErrors.filter(e => 
    e.filePath.toLowerCase().includes(search.toLowerCase())
  );

  const filteredVault = vaultFiles.filter(f => 
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-end gap-10">
        <div>
          <h1 className="text-6xl font-black tracking-tighter uppercase italic text-[var(--text-main)]">{t('security_output')}</h1>
          <p className="text-xs font-bold text-[var(--text-muted)] mt-2 uppercase tracking-widest">{scanResult.projectName}</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <ExportBtn 
            icon={isExporting ? Loader2 : Printer} 
            label={isExporting ? "Processing..." : "Generate Pro PDF"} 
            onClick={generateProfessionalPdf} 
            disabled={isExporting}
            highlight 
          />
          <ExportBtn icon={FileJson} label="CycloneDX" onClick={() => exportStandard('cyclonedx')} />
          <ExportBtn icon={FileCode} label="SPDX" onClick={() => exportStandard('spdx')} />
          <ExportBtn icon={FileJson} label="ALS JSON" onClick={() => exportStandard('als')} />
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-6 items-center justify-between border-b border-[var(--border)] pb-6">
        <div className="flex flex-wrap gap-2 p-1 bg-[var(--border)] rounded-[2.5rem] w-fit">
          <TabBtn id="internal" active={activeTab === 'internal'} icon={Layers} label="Internal" onClick={setActiveTab} />
          <TabBtn id="third-party" active={activeTab === 'third-party'} icon={Package} label="Third-Party" onClick={setActiveTab} />
          <TabBtn id="external" active={activeTab === 'external'} icon={Globe} label="External" onClick={setActiveTab} />
          <TabBtn id="code" active={activeTab === 'code'} icon={ShieldCheck} label="Findings" onClick={setActiveTab} />
          <TabBtn id="vault" active={activeTab === 'vault'} icon={Server} label="Vault" onClick={setActiveTab} />
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" size={16} />
          <input 
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search SBOM registry..."
            className="w-full h-12 bg-[var(--input-bg)] border border-[var(--border)] rounded-2xl pl-12 pr-4 outline-none focus:border-emerald-500 font-mono text-xs text-[var(--text-main)]"
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 gap-6"
        >
          {activeTab === 'code' ? (
            <div className="space-y-6">
              {filteredErrors.length === 0 ? (
                <div className="p-20 text-center opacity-30 text-xs font-mono">No security findings detected.</div>
              ) : filteredErrors.map(err => (
                <CodeErrorCard key={err.id} error={err} />
              ))}
            </div>
          ) : activeTab === 'vault' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredVault.length === 0 ? (
                <div className="col-span-3 p-20 text-center opacity-30 text-xs font-mono">No artifacts in vault.</div>
              ) : filteredVault.map(file => (
                <VaultFileCard key={file.id} file={file} />
              ))}
            </div>
          ) : (
            <div className="glass rounded-[3rem] overflow-hidden border-[var(--border)]">
              <table className="w-full text-left">
                <thead className="bg-black/20">
                  <tr>
                    <th className="p-6 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Component Name</th>
                    <th className="p-6 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Version</th>
                    <th className="p-6 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">License</th>
                    <th className="p-6 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Risk Level</th>
                    <th className="p-6 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-right">Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {filteredDeps.length === 0 ? (
                    <tr><td colSpan={5} className="p-20 text-center opacity-30 text-xs font-mono">No entries recorded in this category.</td></tr>
                  ) : filteredDeps.map(dep => (
                    <tr key={dep.id} className="hover:bg-emerald-500/5 group transition-colors">
                      <td className="p-6 font-bold text-sm text-[var(--text-main)]">{dep.name}</td>
                      <td className="p-6 text-xs font-mono text-[var(--text-muted)]">v{dep.version}</td>
                      <td className="p-6 text-xs font-bold text-blue-500 uppercase">{dep.license}</td>
                      <td className="p-6"><RiskBadge risk={dep.risk} /></td>
                      <td className="p-6 text-right">
                        <button onClick={() => setSelectedDep(dep)} className="text-emerald-500 hover:text-emerald-400 opacity-0 group-hover:opacity-100 transition-all p-2 bg-emerald-500/10 rounded-lg">
                          <ExternalLink size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {selectedDep && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/70 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass w-full max-w-2xl rounded-[3rem] p-10 relative overflow-hidden"
            >
              <div className="scan-line" />
              <button onClick={() => setSelectedDep(null)} className="absolute top-8 right-8 text-[var(--text-muted)] hover:text-white transition-colors"><X /></button>
              <div className="flex items-center gap-6 mb-8">
                <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                  <Package className="text-emerald-500" size={32} />
                </div>
                <div>
                  <h2 className="text-3xl font-black uppercase italic tracking-tighter leading-none">{selectedDep.name}</h2>
                  <p className="text-xs font-mono text-emerald-500 mt-2 font-bold uppercase tracking-widest">v{selectedDep.version} • {selectedDep.license}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-6">
                <DetailBox icon={Zap} label="Heuristic Reasoning" value={selectedDep.reason || "Analyzed via deterministic manifest extraction engine. No rule violations found."} />
                <DetailBox icon={ShieldCheck} label="Remediation Strategy" value={selectedDep.suggestedFix || "Component is classified as stable. Continue routine monitoring."} />
              </div>
              
              <button onClick={() => setSelectedDep(null)} className="btn-primary w-full mt-10 h-16 flex items-center justify-center" >
                Close Component Audit
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const VaultFileCard: React.FC<{ file: FileRecord }> = ({ file }) => (
  <div className="glass p-8 rounded-[2.5rem] border-[var(--border)] hover:border-emerald-500/30 transition-all flex flex-col justify-between h-48 shadow-sm">
    <div className="flex items-start justify-between">
      <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
        <FileArchive className="text-emerald-500" size={24} />
      </div>
    </div>
    <div>
      <h4 className="text-sm font-black text-[var(--text-main)] truncate mb-1">{file.name}</h4>
      <div className="flex justify-between items-center text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-widest">
        <span>{(file.size / 1024).toFixed(1)} KB</span>
        <span className="text-emerald-500 font-bold">VERIFIED</span>
      </div>
    </div>
  </div>
);

const CodeErrorCard: React.FC<{ error: CodeError }> = ({ error }) => (
  <div className={`glass p-10 rounded-[3.5rem] flex flex-col gap-8 shadow-xl border-l-4 ${error.severity === 'Critical' ? 'border-l-rose-500' : 'border-l-orange-500'}`}>
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className={`px-4 py-1 rounded-full border font-black text-[9px] uppercase tracking-widest ${error.severity === 'Critical' ? 'text-rose-500 border-rose-500/20' : 'text-orange-500 border-orange-500/20'}`}>
          {error.severity} THREAT
        </div>
        <h3 className="text-2xl font-black text-[var(--text-main)] uppercase tracking-tight italic">{error.errorType}</h3>
      </div>
      <p className="text-sm text-[var(--text-muted)] font-medium leading-relaxed">{error.description}</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="p-6 bg-rose-500/5 rounded-[2rem] border border-rose-500/10">
        <h4 className="text-[10px] font-black uppercase text-rose-500 mb-2">Impact</h4>
        <p className="text-xs text-rose-400 font-bold italic">{error.impact}</p>
      </div>
      <div className="p-6 bg-emerald-500/5 rounded-[2.5rem] border border-emerald-500/10">
        <h4 className="text-[10px] font-black uppercase text-emerald-500 mb-2">Fix Path</h4>
        <p className="text-xs text-emerald-400 font-black italic">{error.suggestedFix}</p>
      </div>
    </div>
  </div>
);

const DetailBox = ({ icon: Icon, label, value }: any) => (
  <div className="p-8 bg-white/5 rounded-3xl border border-white/10 group hover:border-emerald-500/30 transition-colors">
    <div className="flex items-center gap-3 mb-3">
      <Icon size={16} className="text-emerald-500" />
      <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">{label}</p>
    </div>
    <p className="text-sm font-medium leading-relaxed italic text-[var(--text-main)]">{value}</p>
  </div>
);

const RiskBadge = ({ risk }: { risk: RiskLevel }) => {
  const colors: Record<RiskLevel, string> = {
    Stable: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    Low: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    Medium: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    High: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    Critical: 'bg-rose-500/10 text-rose-500 border-rose-500/20 animate-pulse'
  };
  return <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${colors[risk]}`}>{risk}</span>;
};

const TabBtn = ({ id, active, icon: Icon, label, onClick }: any) => (
  <button onClick={() => onClick(id)} className={`flex items-center gap-3 px-8 py-4 rounded-[2rem] transition-all font-black uppercase text-[10px] tracking-widest ${active ? 'bg-emerald-600 text-white shadow-xl scale-105' : 'text-[var(--text-muted)] hover:text-white'}`}>
    <Icon size={14} /> {label}
  </button>
);

const ExportBtn = ({ icon: Icon, label, onClick, disabled, highlight }: any) => (
  <button 
    onClick={onClick} 
    disabled={disabled} 
    className={`flex items-center gap-3 px-6 py-4 glass rounded-2xl transition-all font-black uppercase text-[10px] tracking-widest shadow-sm active:scale-95 ${disabled ? 'opacity-40 grayscale cursor-not-allowed' : highlight ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-500/20' : 'hover:bg-emerald-500/10 border-white/5'}`}
  >
    {disabled && label === "Processing..." ? <Loader2 size={14} className="animate-spin" /> : <Icon size={14} />}
    {label}
  </button>
);

export default SbomResult;
