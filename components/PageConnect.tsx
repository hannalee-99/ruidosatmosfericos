
import React, { useState, useEffect, useRef } from 'react';
import { storage } from '../lib/storage';
import { ConnectConfig, ViewState } from '../types';
import { trackTerminalCommand, trackSocialLinkClicked } from './analytics';

interface TerminalLine {
  id: string;
  type: 'system' | 'input' | 'output' | 'error' | 'success';
  content: React.ReactNode;
}

interface BootStep {
  text: string;
  delay: number;
  type?: TerminalLine['type'];
}

interface PageConnectProps {
  onNavigate: (view: ViewState) => void;
}

const PageConnect: React.FC<PageConnectProps> = ({ onNavigate }) => {
  const [history, setHistory] = useState<TerminalLine[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isBooting, setIsBooting] = useState(true);
  
  const [connectConfig, setConnectConfig] = useState<ConnectConfig>({
    id: 'connect_config',
    email: 'contato@ruidos.atmosfericos',
    sobreText: "ruídos atmosféricos // v3.1 // sistema de gestão existencial",
    links: []
  });
  
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const COMMANDS = {
    ajuda: "comandos disponíveis: sinal, outros, limpar, sair",
    sinal: "iniciando protocolo de contato...",
    outros: "buscando redes externas...",
    limpar: "limpando buffer de memória...",
    sair: "encerrando conexão."
  };

  const addLine = (content: React.ReactNode, type: TerminalLine['type'] = 'system') => {
    setHistory(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), type, content }]);
  };

  useEffect(() => {
    // Carregar config
    const loadData = async () => {
      try {
        const stored = await storage.get('about', 'connect_config');
        if (stored) setConnectConfig(stored);
      } catch (e) {
        console.error("Erro ao carregar conexões", e);
      }
    };
    loadData();

    // Sequência de boot
    let active = true;
    
    const boot = async () => {
      const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      
      setHistory([]); 
      await wait(500);
      if (!active) return;
      
      addLine("acordando terminal...", 'system');
      await wait(600);
      if (!active) return;
      
      addLine("link estabelecido: 10^-33_cm_tecido", 'success');
      await wait(700);
      if (!active) return;
      
      addLine("transmissão iniciada.", 'output');
      await wait(800);
      if (!active) return;
      
      addLine("digite 'ajuda' para comandos.", 'system');
      setIsBooting(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    };

    boot();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleCommand = (cmd: string) => {
    const cleanCmd = cmd.trim().toLowerCase();
    addLine(`visitante@ruidos:~$ ${cmd}`, 'input');

    if (cleanCmd === 'limpar') {
      setHistory([]);
      trackTerminalCommand(cleanCmd, 'system');
      return;
    }

    if (cleanCmd === 'sinal') {
      trackTerminalCommand(cleanCmd, 'success');
      setTimeout(() => {
        addLine(
          <div className="p-4 border border-white/20 [.light-mode_&]:border-black/20 rounded bg-white/5 [.light-mode_&]:bg-black/5 mt-2">
            <span className="opacity-60 block text-xs mb-2 uppercase tracking-widest">canal de voz ativo:</span>
            <a href={`mailto:${connectConfig.email}`} onClick={() => trackSocialLinkClicked('Email', `mailto:${connectConfig.email}`, 'email')} className="text-xl md:text-2xl text-[var(--accent)] underline hover:no-underline">
              {connectConfig.email}
            </a>
          </div>, 
          'success'
        );
      }, 300);
      return;
    }

    if (cleanCmd === 'outros') {
      trackTerminalCommand(cleanCmd, 'output');
      setTimeout(() => {
        if (connectConfig.links && connectConfig.links.length > 0) {
          addLine(
            <div className="flex flex-wrap gap-4 mt-2">
              {connectConfig.links.map((link) => (
                <a key={link.id} href={link.url} onClick={() => trackSocialLinkClicked(link.label, link.url, link.label.toLowerCase())} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] underline hover:no-underline font-vt text-lg">
                  {link.label}
                </a>
              ))}
            </div>,
            'output'
          );
        } else {
          addLine("nenhum link externo configurado.", 'output');
        }
      }, 300);
      return;
    }

    if (cleanCmd === 'sair') {
      trackTerminalCommand(cleanCmd, 'system');
      onNavigate(ViewState.LANDING);
      return;
    }

    // @ts-ignore
    const response = COMMANDS[cleanCmd];
    if (response) {
      trackTerminalCommand(cleanCmd, 'output');
      setTimeout(() => addLine(response, 'output'), 200);
    } else if (cleanCmd !== '') {
      trackTerminalCommand(cleanCmd, 'error');
      setTimeout(() => addLine(`comando desconhecido: ${cleanCmd}. digite 'ajuda'.`, 'error'), 200);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-[#050505] text-[#9ff85d] pt-44 md:pt-48 pb-20 px-6 md:px-20 font-mono text-sm md:text-base flex flex-col relative" onClick={() => inputRef.current?.focus()}>
      {/* Efeito de scanline consistente com o Manifesto */}
      <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.05] [.light-mode_&]:hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]"></div>
      </div>

      <div className="max-w-4xl w-full mx-auto relative z-10">
        <div className="space-y-3">
          {history.map((line) => (
            <div key={line.id} className={`${
              line.type === 'input' ? 'text-white [.light-mode_&]:text-black' : 
              line.type === 'error' ? 'text-red-400' : 
              line.type === 'success' ? 'text-[var(--accent)] font-bold' : 
              line.type === 'system' ? 'text-white' :
              line.type === 'output' ? 'opacity-50 italic' :
              'opacity-70'
            }`}>
              {line.content}
            </div>
          ))}
        </div>
        {!isBooting && (
          <div className="flex items-center gap-3 mt-8">
            <span className="text-[var(--accent)] whitespace-nowrap">visitante@ruidos:~$</span>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { handleCommand(inputValue); setInputValue(''); } }}
              className="flex-grow bg-transparent outline-none border-none text-white [.light-mode_&]:text-black caret-[var(--accent)]"
              autoComplete="off"
              spellCheck="false"
            />
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      
      <style>{`
        body { background-color: #050505 !important; }
        ::selection {
          background-color: #9ff85d;
          color: #000;
        }
      `}</style>
    </div>
  );
};

export default PageConnect;
