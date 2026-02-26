
import React from 'react';
import { Info, Shield, Zap, Cpu, Server, History, CheckCircle2, Lock } from 'lucide-react';

// Fixed: Added interface for props to include translation function
interface AboutProps {
  t: (key: any) => string;
}

const About: React.FC<AboutProps> = ({ t }) => {
  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-500 pb-20">
      <header>
        <h1 className="text-6xl font-black tracking-tighter italic uppercase mb-2 text-[var(--text-main)]">{t('system_info')}</h1>
        <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-[0.4em] font-mono">Platform Specifications & Compliance</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass p-12 rounded-[4rem] space-y-12 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 p-8">
             <Shield className="text-emerald-500 opacity-10 w-40 h-40" />
          </div>

          <section className="space-y-6">
            <h2 className="text-2xl font-black text-[var(--text-main)] uppercase tracking-tighter flex items-center gap-4">
              <Cpu className="text-emerald-500" /> Core_Platform
            </h2>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed max-w-2xl font-medium">
              SBOM Manager V3 is a next-generation supply chain intelligence platform designed for deep node inspection and automated vulnerability mapping. It utilizes heuristic analysis and real-time threat database syncing to ensure zero-day protection for distributed software inventories.
            </p>
          </section>

          <div className="grid grid-cols-2 gap-8">
             <SpecItem label="Build Version" value="3.4.1-ALPHA" />
             <SpecItem label="Kernel Architecture" value="V3-CORE-HYDRA" />
             <SpecItem label="Analysis Engine" value="SBOM_DYNAMIC_V1.2" />
             <SpecItem label="Signature DB" value="2025.03.14-REV" />
          </div>
        </div>

        <div className="glass p-12 rounded-[4rem] space-y-10 shadow-xl">
           <h2 className="text-2xl font-black text-[var(--text-main)] uppercase tracking-tighter flex items-center gap-4">
            <CheckCircle2 className="text-blue-500" /> Compliance
          </h2>
          <div className="space-y-6">
            <ComplianceItem label="SPDX Compliant" status="Verified" />
            <ComplianceItem label="CycloneDX Sync" status="Active" />
            <ComplianceItem label="NIST-800 Standard" status="Audit Pass" />
            <ComplianceItem label="OWASP SCVS" status="Level 3" />
            <ComplianceItem label="FIPS-140-2" status="Enabled" />
          </div>
        </div>
      </div>

      <div className="glass p-12 rounded-[4rem] shadow-xl">
        <h2 className="text-2xl font-black text-[var(--text-main)] uppercase tracking-tighter mb-8 flex items-center gap-4">
          <History className="text-amber-500" /> System_Logs
        </h2>
        <div className="space-y-4 font-mono">
           <LogLine time="2025-05-10 08:00" event="PLATFORM_BOOT" status="SUCCESS" />
           <LogLine time="2025-05-10 09:15" event="THREAT_DB_UPDATE" status="SYNCED" />
           <LogLine time="2025-05-10 12:30" event="FIREWALL_RELOAD" status="STABLE" />
           <LogLine time="2025-05-10 15:45" event="AI_REASONING_ENGINE" status="OPTIMIZED" />
        </div>
      </div>
    </div>
  );
};

const SpecItem = ({ label, value }: any) => (
  <div>
    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">{label}</p>
    <p className="text-lg font-black text-[var(--text-main)] tracking-tight">{value}</p>
  </div>
);

const ComplianceItem = ({ label, status }: any) => (
  <div className="flex justify-between items-center border-b border-[var(--border)] pb-4 last:border-0">
    <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">{label}</span>
    <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">{status}</span>
  </div>
);

const LogLine = ({ time, event, status }: any) => (
  <div className="flex items-center gap-4 text-[10px] text-[var(--text-muted)] border-l-2 border-[var(--border)] pl-4 py-1 hover:bg-[var(--border)] transition-colors">
    <span className="shrink-0">{time}</span>
    <span className="font-bold text-[var(--text-main)] w-48 shrink-0">{event}</span>
    <span className="font-black text-emerald-500">{status}</span>
  </div>
);

export default About;
