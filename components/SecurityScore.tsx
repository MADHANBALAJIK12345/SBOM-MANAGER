
import React from 'react';
import { motion } from 'motion/react';
import { Shield, ShieldAlert, ShieldCheck } from 'lucide-react';

interface SecurityScoreProps {
  score: number;
}

const SecurityScore: React.FC<SecurityScoreProps> = ({ score }) => {
  const getScoreInfo = (s: number) => {
    if (s >= 80) return { label: 'Very Secure', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: ShieldCheck };
    if (s >= 60) return { label: 'Moderate Risk', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: Shield };
    if (s >= 40) return { label: 'High Risk', color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20', icon: ShieldAlert };
    return { label: 'Critical Risk', color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20', icon: ShieldAlert };
  };

  const info = getScoreInfo(score);
  const Icon = info.icon;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass p-8 rounded-[3rem] border ${info.border} flex flex-col items-center justify-center text-center space-y-4 shadow-xl relative overflow-hidden`}
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full ${info.color.replace('text', 'bg')}`}
        />
      </div>

      <div className={`p-4 rounded-2xl ${info.bg} ${info.color}`}>
        <Icon size={32} />
      </div>

      <div>
        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 mb-1">Security Score</h3>
        <div className="flex items-baseline justify-center gap-1">
          <span className={`text-6xl font-black tracking-tighter ${info.color}`}>{score}</span>
          <span className="text-xl font-bold opacity-20">/100</span>
        </div>
      </div>

      <div className={`px-4 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${info.color} ${info.border}`}>
        {info.label}
      </div>

      <div className="w-full h-2 bg-black/20 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, delay: 0.5 }}
          className={`h-full ${info.color.replace('text', 'bg')}`}
        />
      </div>
    </motion.div>
  );
};

export default SecurityScore;
