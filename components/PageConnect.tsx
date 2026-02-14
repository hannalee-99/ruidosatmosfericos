
import React, { useState, useEffect, useRef } from 'react';
import { storage } from '../lib/storage';
import { ConnectConfig, ViewState } from '../types';

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
    ajuda: "comandos disponíveis: sinal, outros, sobre, limpar, sair",
    sinal: "iniciando protocolo de contato...",
    outros: "buscando redes externas...",
    limpar: "limpando buffer de memória...",
    sair: "encerrando conexão."
  };

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const stored = await storage.get('about', 'connect_config');
        if (stored) setConnectConfig(stored);
      } catch (e) {
        console.error("Erro ao carregar conexões", e);
      }
    };
    fetchConfig();
  }, []);

  const addLine = (content: React.ReactNode, type: TerminalLine['type'] = 'system') => {
    setHistory(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), type, content }]);
  };

  useEffect(() => {
    let timeouts: number[] = [];
    
    const bootSequence: BootStep[] = [
      { text: "inicializando interface de conexão...", delay: 200 },
      { text: "link seguro estabelecido.", delay: 800, type: 'success' },
      { text: "digite 'ajuda' para comandos.", delay: 1400, type: 'output' }
    ];

    bootSequence.forEach((step) => {
      const t = window.setTimeout(() => {
        addLine(step.text, step.type || 'system');
        if (step === bootSequence[bootSequence.length - 1]) {
          setIsBooting(false);
          setTimeout(() => inputRef.current?.focus(), 100);
        }
      }, step.delay);
      timeouts.push(t);
    });

    return () => timeouts.forEach(t => clearTimeout(t));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleCommand = (cmd: string) => {
    const cleanCmd = cmd.trim().toLowerCase();
    addLine(`visitor@ruidos:~$ ${cmd}`, 'input');

    if (cleanCmd === 'limpar') {
      setHistory([]);
      return;
    }

    if (cleanCmd === 'sinal') {
      setTimeout(() => {
        addLine(
          <div className="p-4 border border-white/20 rounded bg-white/5 mt-2">
            <span className="opacity-60 block text-xs mb-2 uppercase tracking-widest">canal de voz ativo:</span>
            <a href={`mailto:${connectConfig.email}`} className="text-xl md:text-2xl text-[var(--accent)] underline hover:no-underline">
              {connectConfig.email}
            </a>
          </div>, 
          'success'
        );
      }, 300);
      return;
    }

    if (cleanCmd === 'outros') {
      setTimeout(() => {
        if (connectConfig.links && connectConfig.links.length > 0) {
          addLine(
            <div className="flex flex-wrap gap-4 mt-2">
              {connectConfig.links.map((link) => (
                <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] underline hover:no-underline font-vt text-lg">
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

    if (cleanCmd === 'sobre') {
      setTimeout(() => {
        addLine(connectConfig.sobreText || "ruídos atmosféricos // v3.1", 'output');
      }, 200);
      return;
    }

    if (cleanCmd === 'sair') {
      onNavigate(ViewState.LANDING);
      return;
    }

    // @ts-ignore
    const response = COMMANDS[cleanCmd];
    if (response) {
      setTimeout(() => addLine(response, 'output'), 200);
    } else if (cleanCmd !== '') {
      setTimeout(() => addLine(`comando desconhecido: ${cleanCmd}. digite 'ajuda'.`, 'error'), 200);
    }
  };

  return (
    <div className="min-h-screen w-full pt-32 pb-20 px-6 md:px-20 font-mono text-sm md:text-base flex flex-col" onClick={() => inputRef.current?.focus()}>
      <div className="max-w-4xl w-full mx-auto relative z-10">
        <div className="mb-8 opacity-40 text-[10px] uppercase tracking-widest border-b border-white/10 pb-4">
          terminal_uplink /// status: conectado
        </div>
        <div className="space-y-3">
          {history.map((line) => (
            <div key={line.id} className={`${line.type === 'input' ? 'text-white' : line.type === 'error' ? 'text-red-400' : line.type === 'success' ? 'text-[var(--accent)]' : 'opacity-70'}`}>
              {line.content}
            </div>
          ))}
        </div>
        {!isBooting && (
          <div className="flex items-center gap-3 mt-6">
            <span className="text-[var(--accent)] whitespace-nowrap">visitor@ruidos:~$</span>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { handleCommand(inputValue); setInputValue(''); } }}
              className="flex-grow bg-transparent outline-none border-none text-white caret-[var(--accent)]"
              autoComplete="off"
              spellCheck="false"
            />
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default PageConnect;
