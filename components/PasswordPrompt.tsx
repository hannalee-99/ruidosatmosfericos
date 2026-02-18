
import React, { useState, useEffect, useRef } from 'react';
import { ViewState } from '../types';

interface PasswordPromptProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const PasswordPrompt: React.FC<PasswordPromptProps> = ({ onSuccess, onCancel }) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // SHA-256 de "Gengibre26#"
  const CORRECT_HASH = "4668f9a23c33973950672e4827f8a7e37136006e8851410f9226500857390974";

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const verifyPassword = async (password: string) => {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex === CORRECT_HASH;
    } catch (e) {
      // Fallback para caso o ambiente não suporte crypto (muito raro em browsers modernos)
      return password === "Gengibre26#";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isVerifying) return;
    
    setIsVerifying(true);
    setError(false);
    
    const isValid = await verifyPassword(input);
    
    if (isValid) {
      onSuccess();
    } else {
      setError(true);
      setInput('');
      setIsVerifying(false);
      setTimeout(() => setError(false), 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center p-6 font-mono overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
      
      <div className={`max-w-md w-full transition-all duration-500 ${error ? 'translate-x-2' : ''}`}>
        <div className="mb-12 space-y-2 opacity-40">
           <div className="text-[10px] tracking-[0.4em] uppercase">acesso restrito</div>
           <div className="h-px bg-[var(--accent)] w-full opacity-20"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="relative">
            <label className="block text-[var(--accent)] text-xs tracking-widest uppercase mb-4 opacity-60">
              {error ? "frequência incorreta." : "insira o sinal de acesso:"}
            </label>
            <div className="flex items-center gap-3">
              <span className="text-[var(--accent)] animate-pulse">{">"}</span>
              <input
                ref={inputRef}
                type="password"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-grow bg-transparent border-none outline-none text-[var(--accent)] text-2xl tracking-[0.5em] caret-transparent"
                style={{ textTransform: 'none' }}
                autoComplete="off"
                disabled={isVerifying}
              />
              <div className="w-3 h-6 bg-[var(--accent)] animate-pulse"></div>
            </div>
          </div>
          
          <div className="pt-12 flex justify-between items-center">
            <button 
              type="button" 
              onClick={onCancel}
              className="text-[9px] uppercase tracking-widest opacity-30 hover:opacity-100 transition-opacity"
            >
              [ cancelar ]
            </button>
            <button 
              type="submit"
              className="text-[9px] uppercase tracking-widest text-[var(--accent)] opacity-60 hover:opacity-100 transition-opacity border-b border-[var(--accent)]/30 pb-1"
            >
              {isVerifying ? "verificando..." : "validar"}
            </button>
          </div>
        </form>
      </div>

      <div className="absolute bottom-12 text-[8px] opacity-10 tracking-[0.5em] uppercase">
        ruídos atmosféricos // v.2.6.auth
      </div>

      <style>{`
        input::selection { background: var(--accent); color: black; }
      `}</style>
    </div>
  );
};

export default PasswordPrompt;
