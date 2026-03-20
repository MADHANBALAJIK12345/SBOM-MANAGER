
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ExternalLink, Activity, CheckCircle, ShieldAlert, Layers, Package, Globe, Database, FileJson, FileCode, Printer, X, Server, Loader2, Info, Zap, ShieldCheck, FileArchive } from 'lucide-react';
import { ScanResult, RiskLevel, Dependency, CodeError, FileRecord, UserProfile } from '../types';
import { storageService } from '../services/storageService';
import { transformToCycloneDX, transformToSPDX, transformToALS } from '../services/sbomExportService';
import SecurityScore from '../components/SecurityScore';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as d3 from 'd3';

interface SbomResultProps {
  scanResult: ScanResult | null;
  user: UserProfile | null;
  t: (key: any) => string;
}

const DependencyGraph: React.FC<{ data: any }> = ({ data }) => {
  const svgRef = React.useRef<SVGSVGElement>(null);

  React.useEffect(() => {
    if (!data || !svgRef.current) return;

    const width = 800;
    const height = 500;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const root = d3.hierarchy(data);
    const treeLayout = d3.tree().size([height - 100, width - 200]);
    treeLayout(root);

    const g = svg.append('g').attr('transform', 'translate(100, 50)');

    // Links
    g.selectAll('.link')
      .data(root.links())
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('d', d3.linkHorizontal()
        .x((d: any) => d.y)
        .y((d: any) => d.x) as any)
      .attr('fill', 'none')
      .attr('stroke', 'rgba(16, 185, 129, 0.2)')
      .attr('stroke-width', 2);

    // Nodes
    const nodes = g.selectAll('.node')
      .data(root.descendants())
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', (d: any) => `translate(${d.y},${d.x})`);

    nodes.append('circle')
      .attr('r', 6)
      .attr('fill', (d: any) => d.data.type === 'internal' ? '#10b981' : '#3b82f6')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    nodes.append('text')
      .attr('dy', '.35em')
      .attr('x', (d: any) => d.children ? -12 : 12)
      .attr('text-anchor', (d: any) => d.children ? 'end' : 'start')
      .text((d: any) => d.data.name)
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('fill', '#94a3b8')
      .attr('font-family', 'monospace');

  }, [data]);

  return (
    <div className="w-full h-full overflow-auto flex items-center justify-center">
      <svg ref={svgRef} width="800" height="500" viewBox="0 0 800 500" />
    </div>
  );
};

const AISuggestionCard: React.FC<{ suggestion: any, onApply: (id: string) => void }> = ({ suggestion, onApply }) => (
  <div className="glass p-8 rounded-[2.5rem] border-l-4 border-l-emerald-500 shadow-lg">
    <div className="flex items-start gap-6">
      <div className="p-4 bg-emerald-500/10 rounded-2xl">
        <Zap className="text-emerald-500" size={24} />
      </div>
      <div className="flex-1 space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="text-lg font-black uppercase italic tracking-tight">{suggestion.dependencyName}</h4>
            <p className="text-xs font-mono text-[var(--text-muted)] mt-1">Current: {suggestion.currentVersion} → Suggested: <span className="text-emerald-500 font-bold">{suggestion.suggestedVersion}</span></p>
          </div>
          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${suggestion.riskLevel === 'Critical' ? 'text-rose-500 border-rose-500/20' : 'text-amber-500 border-amber-500/20'}`}>{suggestion.riskLevel}</span>
        </div>
        <p className="text-sm text-[var(--text-muted)] leading-relaxed">{suggestion.reason}</p>
        <div className="flex gap-4">
          <button 
            onClick={() => onApply(suggestion.id)}
            className="px-6 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all"
          >
            Apply Fix
          </button>
          <button className="px-6 py-2 bg-white/5 text-[var(--text-muted)] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Ignore</button>
        </div>
      </div>
    </div>
  </div>
);

const LicenseWarningCard: React.FC<{ warning: any }> = ({ warning }) => (
  <div className="glass p-8 rounded-[2.5rem] border-l-4 border-l-amber-500 shadow-lg">
    <div className="flex items-start gap-6">
      <div className="p-4 bg-amber-500/10 rounded-2xl">
        <CheckCircle className="text-amber-500" size={24} />
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start mb-2">
          <h4 className="text-lg font-black uppercase italic tracking-tight">{warning.dependencyName}</h4>
          <span className="px-3 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full text-[9px] font-black uppercase">{warning.license}</span>
        </div>
        <p className="text-sm text-[var(--text-muted)] font-medium">{warning.message}</p>
      </div>
    </div>
  </div>
);

const RiskPredictionCard: React.FC<{ prediction: any }> = ({ prediction }) => (
  <div className="glass p-8 rounded-[2.5rem] border-[var(--border)] shadow-sm">
    <div className="flex items-center justify-between mb-6">
      <h4 className="text-sm font-black uppercase tracking-widest text-[var(--text-main)]">{prediction.dependencyName}</h4>
      <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${prediction.updateFrequency === 'High' ? 'bg-orange-500/10 text-orange-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
        {prediction.updateFrequency} Frequency
      </div>
    </div>
    <div className="space-y-4">
      <div className="flex justify-between text-[10px] font-mono text-[var(--text-muted)] uppercase">
        <span>Stability Score</span>
        <span>{prediction.predictionScore}%</span>
      </div>
      <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${prediction.predictionScore}%` }}
          className={`h-full ${prediction.predictionScore < 50 ? 'bg-rose-500' : 'bg-emerald-500'}`}
        />
      </div>
      <p className="text-xs text-[var(--text-muted)] italic leading-relaxed">{prediction.message}</p>
    </div>
  </div>
);

const SbomResult: React.FC<SbomResultProps> = ({ scanResult: initialScanResult, user, t }) => {
  const [scanResult, setScanResult] = useState<ScanResult | null>(initialScanResult);
  const [activeTab, setActiveTab] = useState<'internal' | 'external' | 'third-party' | 'code' | 'vault' | 'graph' | 'ai' | 'compliance' | 'risk'>('internal');
  const [search, setSearch] = useState('');
  const [vaultFiles, setVaultFiles] = useState<FileRecord[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedDep, setSelectedDep] = useState<Dependency | null>(null);

  useEffect(() => {
    setScanResult(initialScanResult);
  }, [initialScanResult]);

  const handleApplyFix = (id: string) => {
    if (!scanResult) return;
    const suggestion = scanResult.aiSuggestions?.find(s => s.id === id);
    if (!suggestion) return;

    const updatedThirdParty = scanResult.thirdParty.map(dep => {
      if (dep.name === suggestion.dependencyName) {
        return { ...dep, version: suggestion.suggestedVersion, riskLevel: 'Stable' as RiskLevel };
      }
      return dep;
    });

    const updatedSuggestions = scanResult.aiSuggestions?.filter(s => s.id !== id);

    setScanResult({
      ...scanResult,
      thirdParty: updatedThirdParty,
      aiSuggestions: updatedSuggestions,
      securityScore: Math.min(100, scanResult.securityScore + 5)
    });
  };

  useEffect(() => {
    if (scanResult) {
      console.log('ScanResult loaded in SbomResult:', scanResult.id);
      const hasInternal = (scanResult.internal?.length || 0) > 0;
      if (!hasInternal) {
        const hasThirdParty = (scanResult.thirdParty?.length || 0) > 0;
        if (hasThirdParty) setActiveTab('third-party');
        else if ((scanResult.external?.length || 0) > 0) setActiveTab('external');
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

  const generatePdfBlob = async (): Promise<Blob> => {
    if (!scanResult || !user) throw new Error('Missing scan result or user profile');

    const doc = new jsPDF('p', 'mm', 'a4') as any;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // --- COVER PAGE ---
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
    drawDetail('Security Score', `${scanResult.securityScore}/100`);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text('CONFIDENTIAL SECURITY DOCUMENT - GENERATED VIA SBOM V3 SYSTEM', pageWidth / 2, pageHeight - 15, { align: 'center' });

    // --- EXECUTIVE SUMMARY ---
    doc.addPage();
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('1. Executive Summary', 15, 25);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const summaryText = `This report provides a detailed Software Bill of Materials (SBOM) and security analysis for the project "${scanResult.projectName}". The analysis engine identified ${scanResult.internal.length} internal modules, ${scanResult.external.length} external modules, and ${scanResult.thirdParty.length} third-party libraries. A total of ${scanResult.codeErrors.length} security findings were detected. The overall security score is ${scanResult.securityScore}/100, indicating a ${scanResult.securityScore > 80 ? 'Low' : scanResult.securityScore > 50 ? 'Medium' : 'High'} risk profile.`;
    doc.text(doc.splitTextToSize(summaryText, pageWidth - 30), 15, 35);

    doc.autoTable({
      startY: 55,
      head: [['Metric Identifier', 'Analysis Result']],
      body: [
        ['Security Score', `${scanResult.securityScore}/100`],
        ['Internal Modules', scanResult.internal.length],
        ['External Modules', scanResult.external.length],
        ['Third-Party Libraries', scanResult.thirdParty.length],
        ['Security Findings', scanResult.codeErrors.length],
        ['Critical Vulnerabilities', scanResult.vulnerabilities.critical],
        ['High Risk Findings', scanResult.vulnerabilities.high],
        ['Analysis Engine', scanResult.metadata.engine]
      ],
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] }
    });

    // --- MODULE INVENTORIES ---
    doc.addPage();
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('2. Module Inventories', 15, 25);

    doc.setFontSize(14);
    doc.text('2.1 Internal Modules', 15, 35);
    if (scanResult.internal.length > 0) {
      doc.autoTable({
        startY: 40,
        head: [['Name', 'Version', 'Risk', 'License', 'Reason']],
        body: scanResult.internal.map(m => [m.name, m.version, m.risk, m.license, m.reason]),
        theme: 'striped',
        headStyles: { fillColor: [30, 41, 59] }
      });
    } else {
      doc.setFontSize(10);
      doc.text('No internal modules found.', 15, 40);
      doc.lastAutoTable = { finalY: 45 };
    }

    doc.setFontSize(14);
    doc.text('2.2 External Modules', 15, doc.lastAutoTable.finalY + 15);
    if (scanResult.external.length > 0) {
      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 20,
        head: [['Name', 'Version', 'Risk', 'License', 'Reason']],
        body: scanResult.external.map(m => [m.name, m.version, m.risk, m.license, m.reason]),
        theme: 'striped',
        headStyles: { fillColor: [30, 41, 59] }
      });
    } else {
      doc.setFontSize(10);
      doc.text('No external modules found.', 15, doc.lastAutoTable.finalY + 20);
      doc.lastAutoTable = { finalY: doc.lastAutoTable.finalY + 25 };
    }

    doc.addPage();
    doc.setFontSize(14);
    doc.text('2.3 Third-Party Libraries', 15, 25);
    if (scanResult.thirdParty.length > 0) {
      doc.autoTable({
        startY: 30,
        head: [['Name', 'Version', 'Risk', 'License', 'Reason']],
        body: scanResult.thirdParty.map(m => [m.name, m.version, m.risk, m.license, m.reason]),
        theme: 'striped',
        headStyles: { fillColor: [30, 41, 59] }
      });
    } else {
      doc.setFontSize(10);
      doc.text('No third-party libraries found.', 15, 30);
      doc.lastAutoTable = { finalY: 35 };
    }

    // --- AI FIX SUGGESTIONS ---
    doc.addPage();
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('3. AI Fix Suggestions', 15, 25);

    if (scanResult.aiSuggestions && scanResult.aiSuggestions.length > 0) {
      doc.autoTable({
        startY: 35,
        head: [['Dependency', 'Current', 'Suggested', 'Severity', 'Action', 'Reason']],
        body: scanResult.aiSuggestions.map(s => [s.dependencyName, s.currentVersion, s.suggestedVersion, s.severity, s.action, s.reason]),
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129] }
      });
    } else {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('No AI fix suggestions available.', 15, 35);
      doc.lastAutoTable = { finalY: 40 };
    }

    // --- SECURITY FINDINGS ---
    doc.addPage();
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('4. Security Findings', 15, 25);

    if (scanResult.codeErrors.length > 0) {
      doc.autoTable({
        startY: 35,
        head: [['Type', 'File', 'Severity', 'Impact', 'Suggested Fix']],
        body: scanResult.codeErrors.map(e => [e.errorType, e.filePath, e.severity, e.impact, e.suggestedFix]),
        theme: 'grid',
        headStyles: { fillColor: [220, 38, 38] }
      });
    } else {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('No security findings detected in the analyzed codebase.', 15, 35);
      doc.lastAutoTable = { finalY: 40 };
    }

    // --- RECOMMENDATIONS ---
    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 40;
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('5. Recommendations', 15, finalY + 20);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const recommendations = [
      '1. Remove all hardcoded secrets and API keys from the source code immediately.',
      '2. Use environment variables or a secure secret management service (e.g., AWS Secrets Manager).',
      '3. Update all third-party libraries to their latest stable versions to mitigate known vulnerabilities.',
      '4. Implement automated SBOM scanning in your CI/CD pipeline for continuous security monitoring.',
      '5. Conduct a thorough manual code review of modules flagged with High or Critical risk.'
    ];
    recommendations.forEach((rec, i) => {
      doc.text(rec, 15, finalY + 30 + (i * 8));
    });

    return doc.output('blob');
  };

  const generateProfessionalPdf = async () => {
    try {
      setIsExporting(true);
      const blob = await generatePdfBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${scanResult.projectName}_Professional_SBOM.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF Generation Error:', error);
    } finally {
      setIsExporting(false);
    }
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
    URL.revokeObjectURL(url);
  };

  const filteredDeps = (() => {
    console.log(`Filtering dependencies for tab: ${activeTab}`);
    if (!scanResult) return [];
    
    let deps: Dependency[] = [];
    if (activeTab === 'internal') deps = scanResult.internal || [];
    else if (activeTab === 'external') deps = scanResult.external || [];
    else if (activeTab === 'third-party') deps = scanResult.thirdParty || [];
    
    console.log(`Found ${deps.length} entries in ${activeTab}`);
    return deps.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));
  })();

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
          {scanResult.metadata.repoInfo && (
            <div className="flex items-center gap-2 mt-2 text-[10px] font-mono text-emerald-500 font-bold uppercase">
              <Globe size={12} />
              <span>{scanResult.metadata.repoInfo.owner} / {scanResult.metadata.repoInfo.name} ({scanResult.metadata.repoInfo.branch})</span>
            </div>
          )}
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

      <div className="grid grid-cols-1 gap-8">
        <SecurityScore score={scanResult.securityScore} />
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-center justify-between border-b border-[var(--border)] pb-6">
        <div className="flex flex-wrap gap-2 p-1 bg-[var(--border)] rounded-[2.5rem] w-fit">
          <TabBtn id="internal" active={activeTab === 'internal'} icon={Layers} label="Internal" onClick={setActiveTab} />
          <TabBtn id="third-party" active={activeTab === 'third-party'} icon={Package} label="Third-Party" onClick={setActiveTab} />
          <TabBtn id="external" active={activeTab === 'external'} icon={Globe} label="External" onClick={setActiveTab} />
          <TabBtn id="code" active={activeTab === 'code'} icon={ShieldCheck} label="Findings" onClick={setActiveTab} />
          <TabBtn id="graph" active={activeTab === 'graph'} icon={Activity} label="Graph" onClick={setActiveTab} />
          <TabBtn id="ai" active={activeTab === 'ai'} icon={Zap} label="AI Fixes" onClick={setActiveTab} />
          <TabBtn id="compliance" active={activeTab === 'compliance'} icon={CheckCircle} label="Compliance" onClick={setActiveTab} />
          <TabBtn id="risk" active={activeTab === 'risk'} icon={ShieldAlert} label="Risks" onClick={setActiveTab} />
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
          ) : activeTab === 'ai' ? (
            <div className="space-y-6">
              {scanResult.aiSuggestions?.length === 0 ? (
                <div className="p-20 text-center opacity-30 text-xs font-mono">No AI suggestions available.</div>
              ) : scanResult.aiSuggestions?.map(sug => (
                <AISuggestionCard key={sug.id} suggestion={sug} onApply={handleApplyFix} />
              ))}
            </div>
          ) : activeTab === 'compliance' ? (
            <div className="space-y-6">
              {scanResult.licenseWarnings?.length === 0 ? (
                <div className="p-20 text-center opacity-30 text-xs font-mono">No license compliance issues detected.</div>
              ) : scanResult.licenseWarnings?.map(warn => (
                <LicenseWarningCard key={warn.id} warning={warn} />
              ))}
            </div>
          ) : activeTab === 'risk' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {scanResult.riskPredictions?.length === 0 ? (
                <div className="col-span-2 p-20 text-center opacity-30 text-xs font-mono">No risk predictions available.</div>
              ) : scanResult.riskPredictions?.map((risk, idx) => (
                <RiskPredictionCard key={idx} prediction={risk} />
              ))}
            </div>
          ) : activeTab === 'graph' ? (
            <div className="glass rounded-[3rem] p-10 h-[600px] flex flex-col items-center justify-center border-[var(--border)]">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-black uppercase tracking-tighter italic">Dependency Tree Visualization</h3>
                <p className="text-xs text-[var(--text-muted)] font-mono mt-2">Interactive D3.js powered graph of your supply chain</p>
              </div>
              <DependencyGraph data={scanResult.dependencyGraph} />
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
                    <tr><td colSpan={5} className="p-20 text-center opacity-30 text-xs font-mono">No data found</td></tr>
                  ) : filteredDeps.map(dep => (
                    <tr key={dep.id} className="hover:bg-emerald-500/5 group transition-colors">
                      <td className="p-6 font-bold text-sm text-[var(--text-main)]">{dep.name}</td>
                      <td className="p-6 text-xs font-mono text-[var(--text-muted)]">{dep.version === 'remote' ? 'REMOTE' : `v${dep.version}`}</td>
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
