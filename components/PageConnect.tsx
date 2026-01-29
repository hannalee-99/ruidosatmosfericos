
import React, { useState, useEffect, useRef } from 'react';
import { COLORS } from '../constants';
import { storage } from './storage';
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
  
  // Novo estado usando ConnectConfig
  const [connectConfig, setConnectConfig] = useState<ConnectConfig>({
    id: 'connect_config',
    email: 'email@exemplo.com',
    links: []
  });
  
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Comandos disponíveis traduzidos
  const COMMANDS = {
    ajuda: "comandos disponíveis: sinal, outros, sobre, limpar, sair",
    sinal: "iniciando protocolo de contato...",
    outros: "buscando redes externas...",
    sobre: "ruídos atmosféricos // v3.1 // sistema de gestão existencial",
    limpar: "limpando buffer de memória...",
    sudo: "acesso negado. você não é administrador deste campo.",
    hello: "olá, visitante.",
    hi: "olá, visitante.",
    oi: "olá. digite 'sinal' para estabelecer contato."
  };

  useEffect(() => {
    // Carregar configurações do banco de dados
    const fetchConfig = async () => {
      try {
        const stored = await storage.get('about', 'connect_config');
        if (stored) {
          setConnectConfig(stored);
        } else {
            // Tenta fallback para antigo apenas se necessário
            const oldSocial = await storage.get('about', 'social_links');
            if (oldSocial) {
                 const migratedLinks = [];
                 if (oldSocial.instagram) migratedLinks.push({ id: 'inst', label: 'instagram', url: oldSocial.instagram });
                 if (oldSocial.bluesky) migratedLinks.push({ id: 'bsky', label: 'bluesky', url: oldSocial.bluesky });
                 if (oldSocial.vimeo) migratedLinks.push({ id: 'vim', label: 'vimeo', url: oldSocial.vimeo });
                 setConnectConfig({
                     id: 'connect_config',
                     email: oldSocial.email || '',
                     links: migratedLinks
                 });
            }
        }
      } catch (e) {
        console.error("Erro ao carregar conexões", e);
      }
    };
    fetchConfig();
  }, []);

  const addLine = (content: React.ReactNode, type: TerminalLine['type'] = 'system') => {
    setHistory(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), type, content }]);
  };

  // Sequência de Boot
  useEffect(() => {
    let timeouts: ReturnType<typeof setTimeout>[] = [];
    
    const bootSequence: BootStep[] = [
      { text: "inicializando interface de conexão...", delay: 500 },
      { text: "carregando módulos de linguagem...", delay: 1200 },
      { text: "estabelecendo link seguro...", delay: 2000 },
      { text: "conectado.", delay: 2800, type: 'success' },
      { text: "digite 'ajuda' para ver os comandos ou 'sinal' para contato direto.", delay: 3500, type: 'output' }
    ];

    bootSequence.forEach((step) => {
      const t = setTimeout(() => {
        addLine(step.text, step.type || 'system');
        if (step.text === bootSequence[bootSequence.length - 1].text) {
          setIsBooting(false);
          // Foca no input após o boot
          setTimeout(() => inputRef.current?.focus(), 100);
        }
      }, step.delay);
      timeouts.push(t);
    });

    return () => timeouts.forEach(clearTimeout);
  }, []);

  // Mantém o scroll no final
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  // Mantém o foco no input
  const handleContainerClick = () => {
    if (!isBooting) {
      inputRef.current?.focus();
    }
  };

  const handleCommand = (cmd: string) => {
    const cleanCmd = cmd.trim().toLowerCase();
    
    // Adiciona a linha do usuário
    addLine(`visitor@ruidos:~$ ${cmd}`, 'input');

    if (cleanCmd === '') return;

    // COMANDO LIMPAR
    if (cleanCmd === 'limpar' || cleanCmd === 'clear') {
      setHistory([]);
      return;
    }

    // COMANDO SINAL (EMAIL)
    if (cleanCmd === 'sinal') {
      setTimeout(() => {
        addLine(
          <div className="flex flex-col gap-2 p-4 border border-dashed border-white/20 [.light-mode_&]:border-black/20 rounded-lg bg-white/5 [.light-mode_&]:bg-black/5 mt-2">
            <span className="opacity-60">canal de comunicação aberto:</span>
            <a 
              href={`mailto:${connectConfig.email}`}
              className="text-xl md:text-2xl font-bold hover:bg-[var(--accent)] hover:text-black [.light-mode_&]:hover:text-white transition-colors px-2 py-1 -ml-2 w-fit"
            >
              {connectConfig.email}
            </a>
            <span className="text-[10px] opacity-40 mt-2">[clique para enviar ou copie o endereço]</span>
          </div>, 
          'success'
        );
      }, 300);
      return;
    }

    // COMANDO OUTROS (LINKS DINÂMICOS)
    if (cleanCmd === 'outros') {
      setTimeout(() => {
        if (connectConfig.links && connectConfig.links.length > 0) {
            addLine(
              <div className="flex flex-wrap gap-6 mt-2">
                {connectConfig.links.map((link) => (
                    <a 
                        key={link.id}
                        href={link.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="underline hover:text-[var(--accent)] hover:no-underline transition-colors lowercase"
                    >
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

    // COMANDO SAIR
    if (cleanCmd === 'sair' || cleanCmd === 'exit') {
        addLine("encerrando sessão...", 'system');
        setTimeout(() => {
            onNavigate(ViewState.LANDING);
        }, 1000);
        return;
    }

    // Processamento genérico (Ajuda, Sobre, etc)
    if (cleanCmd in COMMANDS) {
      // @ts-ignore
      setTimeout(() => addLine(COMMANDS[cleanCmd], 'output'), 200);
    } else {
      setTimeout(() => addLine(`comando não reconhecido: ${cleanCmd}. digite 'ajuda'.`, 'error'), 200);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCommand(inputValue);
      setInputValue('');
    }
  };

  return (
    <div 
      className="min-h-screen w-full pt-32 pb-20 px-6 md:px-20 font-mono text-sm md:text-base flex flex-col"
      onClick={handleContainerClick}
    >
      {/* Overlay de Scanline */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.05] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] bg-repeat"></div>
      
      <div className="max-w-4xl w-full mx-auto relative z-10">
        
        {/* Cabeçalho do Terminal */}
        <div className="mb-8 opacity-40 text-xs border-b border-white/10 pb-4 [.light-mode_&]:border-black/10">
          <div>ruídos_atmosfericos terminal_uplink v3.1</div>
          <div>login: visitor via web_socket</div>
          <div>server time: {new Date().toLocaleTimeString()}</div>
        </div>

        {/* Área de Histórico */}
        <div className="space-y-3 mb-4">
          {history.map((line) => (
            <div 
              key={line.id} 
              className={`leading-relaxed break-words
                ${line.type === 'input' ? 'opacity-100 font-bold' : ''}
                ${line.type === 'system' ? 'opacity-60 italic' : ''}
                ${line.type === 'error' ? 'text-red-500 opacity-90' : ''}
                ${line.type === 'success' ? 'text-[var(--accent)]' : ''}
                ${line.type === 'output' ? 'opacity-90 pl-4 border-l border-white/10 [.light-mode_&]:border-black/10' : ''}
              `}
            >
              {line.type === 'system' && <span className="mr-2 opacity-50">{'>'}</span>}
              {line.content}
            </div>
          ))}
        </div>

        {/* Linha de Input Atual */}
        {!isBooting && (
          <div className="flex items-center gap-3 mt-4 group">
            <span className="text-[var(--accent)] font-bold whitespace-nowrap">visitor@ruidos:~$</span>
            <div className="relative flex-grow">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-transparent outline-none border-none text-white [.light-mode_&]:text-black caret-[var(--accent)]"
                autoFocus
                autoComplete="off"
                spellCheck="false"
              />
            </div>
          </div>
        )}

        {/* Cursor fantasma se não estiver focado (opcional, para estética) */}
        {!isBooting && inputValue === '' && (
            <div className="fixed bottom-10 right-10 text-[10px] opacity-20 animate-pulse hidden md:block">
                [ terminal active ]
            </div>
        )}

        <div ref={bottomRef} className="h-10"></div>
      </div>
    </div>
  );
};

export default PageConnect;
