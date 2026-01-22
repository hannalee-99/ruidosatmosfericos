
import React, { useState, useEffect, useRef } from 'react';
import { COLORS } from '../constants';
import { storage } from './storage';
import { ConnectConfig, ViewState } from '../types';
import { Analytics } from './analytics';

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

// Helper para ícones SVG
const getSocialIcon = (label: string) => {
  if (!label) return null;
  const l = label.toLowerCase().trim();
  const cls = "w-4 h-4";

  if (l.includes('instagram') || l.includes('insta')) {
    return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cls}><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>;
  }
  if (l.includes('bluesky') || l.includes('bsky')) {
    return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="none" className={cls}><path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565-.139 2.038.025 3.536.025 3.536c.21 2.923 1.933 6.953 4.316 8.973-1.895-.232-4.06-.575-4.286-3.05 0 0-.25-1.425-.075-1.85.35-1.025.25-1.125.075-1.125-.175 0-1.25.775-1.25 2.1s1.375 7.725 7.625 9.175c-4.35-1.2-5.7-4.2-5.7-4.2.35 3.6 3.85 7.725 8.92 8.775V24C7.75 23.3 2.1 18.25 12 10.8zM12 10.8c1.087-2.114 4.046-6.053 6.798-7.995 2.636-1.861 3.641-1.539 4.3-1.24 1.041.473.877 1.971.877 1.971-.21 2.923-1.933 6.953-4.316 8.973 1.895-.232 4.06-.575 4.286-3.05 0 0 .25-1.425.075-1.85-.35-1.025-.25-1.125-.075-1.125.175 0 1.25.775 1.25 2.1s-1.375 7.725-7.625 9.175c4.35-1.2 5.7-4.2 5.7-4.2-.35 3.6-3.85 7.725-8.92 8.775V24C16.25 23.3 21.9 18.25 12 10.8z"/></svg>;
  }
  if (l.includes('youtube') || l.includes('yt')) {
    return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cls}><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.25z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>;
  }
  if (l.includes('vimeo')) {
    return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cls}><path d="M3 8.5l4 2 2.5-4 4.5 11 5-13 4 1.5-6.5 16h-4L7.5 8.5z" /></svg>; // Simplified Vimeo-ish poly
  }
  if (l.includes('twitter') || l.includes(' x')) {
    return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cls}><path d="M4 4l11.733 16h4.267l-11.733 -16z"></path><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"></path></svg>;
  }
  if (l.includes('linkedin')) {
    return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cls}><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>;
  }
  if (l.includes('github') || l.includes('git')) {
    return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cls}><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>;
  }
  if (l.includes('spotify')) {
    return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cls}><circle cx="12" cy="12" r="10"></circle><path d="M8 11.5c2.5-1 5.5-1 8 0"></path><path d="M7 14.5c3-1.5 7-1.5 10 0"></path><path d="M6 8.5c3.5-1.5 8.5-1.5 12 0"></path></svg>;
  }
  if (l.includes('email') || l.includes('mail')) {
    return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cls}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>;
  }

  // Genérico Link
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cls}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>;
};

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
              onClick={() => Analytics.track('Contact Link Clicked', { type: 'email' })}
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

    // COMANDO OUTROS (LINKS DINÂMICOS COM ÍCONES)
    if (cleanCmd === 'outros') {
      setTimeout(() => {
        if (connectConfig.links && connectConfig.links.length > 0) {
            addLine(
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                {connectConfig.links.map((link) => (
                    <a 
                        key={link.id}
                        href={link.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        onClick={() => Analytics.track('Contact Link Clicked', { type: 'social', label: link.label })}
                        className="flex items-center gap-3 p-3 border border-white/10 [.light-mode_&]:border-black/10 rounded-lg hover:bg-white/10 [.light-mode_&]:hover:bg-black/5 hover:border-white/30 [.light-mode_&]:hover:border-black/30 transition-all group"
                    >
                        <div className="text-white/60 [.light-mode_&]:text-black/60 group-hover:text-[var(--accent)] transition-colors">
                           {getSocialIcon(link.label)}
                        </div>
                        <span className="lowercase font-bold group-hover:text-white [.light-mode_&]:group-hover:text-black transition-colors">{link.label}</span>
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto text-[var(--accent)]">→</span>
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
