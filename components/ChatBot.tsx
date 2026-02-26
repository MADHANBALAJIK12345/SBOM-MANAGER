
import React, { useState, useRef, useEffect } from 'react';
import { Send, Trash2, BrainCircuit, Activity, X, ShieldAlert, Loader2 } from 'lucide-react';
import { getGeminiChatResponse } from '../services/geminiService';

interface Message {
  role: 'user' | 'bot';
  text: string;
}

interface ChatBotProps {
  isDarkTheme: boolean;
}

const ChatBot: React.FC<ChatBotProps> = ({ isDarkTheme }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: 'TERMINAL_READY. I am your SBOM Intelligence Liaison. Ask me about inventory risks or vulnerability resolution.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Functional scroll logic to handle dynamic content height
  const scrollToBottom = () => {
    if (scrollRef.current) {
      const { scrollHeight, clientHeight } = scrollRef.current;
      scrollRef.current.scrollTo({
        top: scrollHeight - clientHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isLoading, isOpen]);

  // Handle ESC key and Outside Click
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (chatWindowRef.current && !chatWindowRef.current.contains(e.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSend = async (e?: React.FormEvent, customText?: string) => {
    e?.preventDefault();
    const textToSend = customText || input;
    
    if (!textToSend.trim() || isLoading) return;

    setError(null);
    setInput('');
    
    // Use functional updates to ensure state consistency
    setMessages(prev => [...prev, { role: 'user', text: textToSend }]);
    setIsLoading(true);

    try {
      // Format history for the Gemini Service (SDK turn-based format)
      // Note: We ignore the very first intro message if it wasn't a model turn in the history
      const history = messages
        .filter(msg => msg.text !== 'LOG_PURGED. Waiting for query...') // Ignore purge messages
        .map(msg => ({
          role: msg.role === 'bot' ? 'model' as const : 'user' as const,
          parts: [{ text: msg.text }]
        }));

      const botResponse = await getGeminiChatResponse(textToSend, history);
      
      setMessages(prev => [...prev, { role: 'bot', text: botResponse }]);
    } catch (err) {
      setError("SIGNAL_LOST: Protocol interrupted.");
      setMessages(prev => [...prev, { role: 'bot', text: 'COMM_FAILURE: Check your uplink status.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{ role: 'bot', text: 'LOG_PURGED. Waiting for query...' }]);
    setError(null);
  };

  return (
    <div className="fixed bottom-8 right-8 z-[9999] flex flex-col items-end">
      {isOpen && (
        <div 
          ref={chatWindowRef}
          className={`w-[420px] h-[640px] border rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in fade-in slide-in-from-bottom-10 duration-300 mb-6 backdrop-blur-3xl ${
            isDarkTheme ? 'bg-slate-950/95 border-white/10 ring-1 ring-white/10' : 'bg-white/98 border-slate-200 shadow-slate-200/50'
          }`}
        >
          {/* Header */}
          <div className={`p-8 border-b flex justify-between items-center ${isDarkTheme ? 'border-white/5 bg-black/20' : 'border-slate-100 bg-slate-50'}`}>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl border ${isDarkTheme ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-100'}`}>
                <BrainCircuit className="text-emerald-500" size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest italic">SBOM_AI_LIAISON</h3>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${isLoading ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                  <span className="text-[9px] font-bold opacity-40 uppercase tracking-widest">
                    {isLoading ? 'Reasoning...' : 'Active_Link'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={clearChat} 
                className={`p-2 rounded-xl transition-all ${isDarkTheme ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-500'}`}
                title="Clear Logs"
              >
                <Trash2 size={16} />
              </button>
              <button 
                onClick={() => setIsOpen(false)} 
                className={`p-2 rounded-xl transition-all ${isDarkTheme ? 'hover:bg-rose-500/10 text-rose-500' : 'hover:bg-rose-50 text-rose-600'}`}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div 
            ref={scrollRef} 
            className="flex-1 overflow-y-auto p-8 space-y-6 scroll-smooth"
          >
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                <div className={`max-w-[85%] p-6 rounded-[2rem] text-[12px] leading-relaxed shadow-sm ${
                  msg.role === 'user' 
                    ? (isDarkTheme ? 'bg-emerald-600 text-white rounded-br-none' : 'bg-indigo-600 text-white rounded-br-none') 
                    : (isDarkTheme ? 'bg-white/5 border border-white/5 rounded-bl-none text-slate-300' : 'bg-slate-100 border border-slate-200 rounded-bl-none text-slate-800')
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            
            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex justify-start animate-in fade-in duration-300">
                <div className={`p-4 rounded-3xl flex items-center gap-3 ${isDarkTheme ? 'bg-white/5' : 'bg-slate-100'}`}>
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest opacity-40 italic">Liaison is reasoning</span>
                </div>
              </div>
            )}

            {error && (
              <div className="flex justify-center p-2">
                <div className="flex items-center gap-2 text-rose-500 text-[10px] font-black uppercase tracking-widest bg-rose-500/10 px-4 py-2 rounded-full border border-rose-500/20">
                  <ShieldAlert size={12} /> {error}
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className={`p-6 space-y-4 border-t ${isDarkTheme ? 'border-white/5' : 'border-slate-100'}`}>
             <div className="flex flex-wrap gap-2">
                <PromptChip text="Vulnerability Impact?" onClick={() => handleSend(undefined, "How do I assess vulnerability impact?")} isDark={isDarkTheme} />
                <PromptChip text="Best remediation?" onClick={() => handleSend(undefined, "What are the best remediation steps for a critical dependency?")} isDark={isDarkTheme} />
             </div>
             <form onSubmit={handleSend} className="flex gap-4">
               <input 
                value={input} 
                disabled={isLoading}
                onChange={(e) => setInput(e.target.value)}
                className={`flex-1 rounded-2xl px-6 py-4 text-xs font-mono outline-none border transition-all ${
                  isDarkTheme 
                    ? 'bg-black/40 border-white/5 focus:border-emerald-500 text-white' 
                    : 'bg-slate-50 border-slate-200 focus:border-indigo-600 text-slate-900'
                } disabled:opacity-50`} 
                placeholder={isLoading ? "Liaison is busy..." : "Query the core terminal..."}
               />
               <button 
                type="submit" 
                disabled={isLoading || !input.trim()} 
                className={`p-4 rounded-full text-white transition-all shadow-lg active:scale-90 ${
                  isDarkTheme ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-indigo-600 hover:bg-indigo-500'
                } disabled:opacity-30 disabled:grayscale disabled:scale-95`}
               >
                 {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
               </button>
             </form>
          </div>
        </div>
      )}

      {/* Trigger Button */}
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-2xl group relative ${
          isDarkTheme ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20'
        } ${isOpen ? 'rotate-90' : 'hover:scale-105'}`}
        aria-label={isOpen ? "Close chatbot" : "Open chatbot"}
      >
        <div className={`absolute inset-0 rounded-full blur-[40px] opacity-10 group-hover:opacity-30 transition-all ${isLoading ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
        {isOpen ? (
          <X className="text-white relative z-10" size={32} />
        ) : (
          <div className="relative z-10">
            {isLoading ? <Activity className="text-white animate-pulse" size={32} /> : <BrainCircuit className="text-white" size={32} />}
          </div>
        )}
        {!isOpen && !isLoading && <div className="absolute -top-1 -right-1 w-6 h-6 bg-rose-500 border-4 border-slate-950 rounded-full flex items-center justify-center text-[10px] font-black text-white">!</div>}
      </button>
    </div>
  );
};

const PromptChip = ({ text, onClick, isDark }: any) => (
  <button 
    onClick={onClick}
    className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${
      isDark 
        ? 'bg-white/5 border-white/10 hover:border-emerald-500/50 text-slate-400 hover:text-emerald-400' 
        : 'bg-slate-50 border-slate-200 hover:border-indigo-600 text-slate-500 hover:text-indigo-600'
    }`}
  >
    {text}
  </button>
);

export default ChatBot;
