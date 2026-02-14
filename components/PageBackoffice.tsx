
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { storage } from './storage';
import { Work, Signal, SignalBlock, AboutData, ConnectConfig, LinkItem, GalleryItem, SensorData, GalleryItemType } from '../types';
import { MONTH_NAMES, DEFAULT_IMAGE, COLORS } from '../constants';

const formatImageUrl = (url: string): string => {
  if (!url || url.trim() === '') return DEFAULT_IMAGE;
  if (url.startsWith('data:image')) return url;
  if (url.includes('drive.google.com')) {
    const match = url.match(/\/d\/(.+?)\/(view|edit)?/) || url.match(/[?&]id=(.+?)(&|$)/);
    if (match && match[1]) {
      return `https://drive.google.com/uc?export=view&id=${match[1]}`;
    }
  }
  return url;
};

// --- ICONS (SVG) ---
const Icons = {
  Back: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>,
  Undo: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"/></svg>,
  Redo: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 019-9 9 9 0 016 2.3l3 2.7"/></svg>,
  Bold: () => <span className="font-serif font-bold text-lg">B</span>,
  Italic: () => <span className="font-serif italic text-lg">I</span>,
  Strike: () => <span className="font-serif line-through text-lg">S</span>,
  Code: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
  Link: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>,
  Image: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  Quote: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/></svg>,
  List: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  Video: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>,
  Audio: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>,
  More: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
};

const ToolbarDivider = () => <div className="w-px h-5 bg-white/10 mx-2"></div>;

const ToolbarButton: React.FC<{ 
  onClick: (e: React.MouseEvent) => void; 
  title: string; 
  children: React.ReactNode;
  active?: boolean;
}> = ({ onClick, title, children, active }) => (
  <button 
    onClick={onClick}
    className={`
      p-1.5 rounded hover:bg-white/10 transition-colors text-gray-400 hover:text-white relative
      ${active ? 'text-white bg-white/10' : ''}
    `}
    title={title}
  >
    {children}
  </button>
);

const LinkDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (text: string, url: string) => void;
  initialText: string;
  positionRef: React.RefObject<HTMLButtonElement | null>;
}> = ({ isOpen, onClose, onConfirm, initialText, positionRef }) => {
  const [text, setText] = useState(initialText);
  const [url, setUrl] = useState('');
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isOpen) {
      setText(initialText);
      setUrl('');
      if (positionRef.current) {
        const rect = positionRef.current.getBoundingClientRect();
        setCoords({ top: rect.bottom + 10, left: rect.left - 100 });
      }
    }
  }, [isOpen, initialText, positionRef]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200]" onClick={onClose}>
      <div 
        className="absolute w-[300px] bg-[#1a1a1a] border border-white/10 rounded-lg shadow-2xl p-4 flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-200"
        style={{ top: coords.top, left: Math.max(20, coords.left) }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-1"><span className="text-white font-bold text-sm">Criar um link</span></div>
        <div className="flex flex-col gap-3">
          <input autoFocus className="w-full bg-[#111] border border-white/10 rounded-md px-3 py-2 text-white placeholder:text-gray-600 focus:border-white/30 outline-none text-sm" placeholder="Insira o texto..." value={text} onChange={(e) => setText(e.target.value)} />
          <input className="w-full bg-[#111] border border-white/10 rounded-md px-3 py-2 text-white placeholder:text-gray-600 focus:border-white/30 outline-none text-sm" placeholder="Insira o URL..." value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onConfirm(text, url)} />
        </div>
        <div className="flex gap-2 mt-1">
          <button onClick={() => onConfirm(text, url)} disabled={!url} className={`px-4 py-1.5 rounded text-sm font-bold text-black transition-colors ${url ? 'bg-[#9ff85d] hover:brightness-110' : 'bg-gray-600 cursor-not-allowed'}`}>Link</button>
          <button onClick={onClose} className="px-4 py-1.5 rounded text-sm font-medium text-gray-300 hover:bg-white/10 transition-colors bg-[#262626]">Cancelar</button>
        </div>
      </div>
    </div>
  );
};

const EmbedDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (url: string) => void;
  positionRef: React.RefObject<HTMLButtonElement | null>;
}> = ({ isOpen, onClose, onConfirm, positionRef }) => {
  const [url, setUrl] = useState('');
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isOpen) {
      setUrl('');
      if (positionRef.current) {
        const rect = positionRef.current.getBoundingClientRect();
        setCoords({ top: rect.bottom + 10, left: rect.left - 150 });
      }
    }
  }, [isOpen, positionRef]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200]" onClick={onClose}>
      <div 
        className="absolute w-[350px] bg-[#1a1a1a] border border-white/10 rounded-lg shadow-2xl p-4 flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-200"
        style={{ top: coords.top, left: Math.max(20, coords.left) }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-1"><span className="text-white font-bold text-sm">Inserir Vídeo/Áudio</span></div>
        <p className="text-xs text-gray-500">Cole o link do YouTube, Spotify ou código de incorporação (iframe).</p>
        <textarea autoFocus className="w-full bg-[#111] border border-white/10 rounded-md px-3 py-2 text-white placeholder:text-gray-600 focus:border-white/30 outline-none text-sm resize-none h-24" placeholder='Ex: https://youtube.com/... ou <iframe src="..."></iframe>' value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && onConfirm(url)} />
        <div className="flex gap-2 mt-1">
          <button onClick={() => onConfirm(url)} disabled={!url} className={`px-4 py-1.5 rounded text-sm font-bold text-black transition-colors ${url ? 'bg-[#9ff85d] hover:brightness-110' : 'bg-gray-600 cursor-not-allowed'}`}>Inserir</button>
          <button onClick={onClose} className="px-4 py-1.5 rounded text-sm font-medium text-gray-300 hover:bg-white/10 transition-colors bg-[#262626]">Cancelar</button>
        </div>
      </div>
    </div>
  );
};

const getEmbedUrl = (input: string): string | null => {
  if (!input) return null;
  const cleanInput = input.trim();

  if (cleanInput.startsWith('<iframe')) {
      const srcMatch = cleanInput.match(/src=["']([^"']+)["']/);
      if (srcMatch && srcMatch[1]) {
          let url = srcMatch[1];
          if (url.includes('open.spotify.com') && !url.includes('/embed/')) {
              url = url.replace('spotify.com/', 'spotify.com/embed/');
          }
          return url;
      }
      return null;
  }

  if (cleanInput.includes('youtube.com') || cleanInput.includes('youtu.be')) {
    const videoId = cleanInput.match(/(?:youtu\.be\/|youtube\.com\/(?:.*v=|.*\/|shorts\/|embed\/)([\w-]{11}))/)?.[1];
    if (videoId) return `https://www.youtube.com/embed/${videoId}`;
  }

  if (cleanInput.includes('spotify.com')) {
    if (!cleanInput.includes('/embed/')) {
        const baseUrl = cleanInput.split('?')[0];
        return baseUrl.replace('spotify.com/', 'spotify.com/embed/');
    }
    return cleanInput;
  }

  if (cleanInput.includes('vimeo.com')) {
      const videoId = cleanInput.match(/(?:vimeo\.com\/|video\/)(\d+)/)?.[1];
      if (videoId) return `https://player.vimeo.com/video/${videoId}`;
  }

  return null;
};

const PublishSettingsModal: React.FC<{
  signal: Signal;
  onClose: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
}> = ({ signal, onClose, onSaveDraft, onPublish }) => {
  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-300">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-xl w-full max-w-md p-8 shadow-2xl relative flex flex-col gap-6">
        <button onClick={onClose} className="absolute top-6 right-6 text-2xl opacity-40 hover:opacity-100 transition-opacity">×</button>
        <div>
            <h2 className="font-sans text-xl font-bold mb-2">Publicar sinal</h2>
            <p className="text-sm opacity-60 font-mono leading-relaxed">{signal.status === 'publicado' ? 'este sinal já está visível publicamente.' : 'o sinal ficará visível na frequência pública.'}</p>
        </div>
        <div className="flex flex-col gap-3 mt-2">
             <button onClick={onSaveDraft} className="w-full bg-white/5 border border-white/10 text-white px-6 py-3 rounded-lg font-medium text-sm hover:bg-white/10 transition-all uppercase tracking-wide">salvar rascunho</button>
             <button onClick={onPublish} className="w-full bg-[#9ff85d] text-black px-6 py-3 rounded-lg font-bold text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_15px_rgba(159,248,93,0.3)] uppercase tracking-wide">{signal.status === 'publicado' ? 'atualizar publicação' : 'publicar agora'}</button>
        </div>
      </div>
    </div>
  );
}

const parseInlineMarkdown = (text: string) => {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;
  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push({ type: 'text', content: text.substring(lastIndex, match.index) });
    parts.push({ type: 'link', content: match[1], url: match[2] });
    lastIndex = linkRegex.lastIndex;
  }
  if (lastIndex < text.length) parts.push({ type: 'text', content: text.substring(lastIndex) });

  return parts.map((part, i) => {
    if (part.type === 'link') return <a key={i} href={part.url} target="_blank" rel="noopener noreferrer" className="text-[#9ff85d] underline hover:no-underline font-mono text-[0.9em]">{part.content}</a>;
    const subParts = part.content.split(/(\*\*.*?\*\*|\*.*?\*|~~.*?~~)/g);
    return subParts.map((sub, j) => {
      if (sub.startsWith('**') && sub.endsWith('**')) return <strong key={`${i}-${j}`} className="font-bold text-[#9ff85d]">{sub.slice(2, -2)}</strong>;
      if (sub.startsWith('*') && sub.endsWith('*')) return <em key={`${i}-${j}`} className="italic opacity-80">{sub.slice(1, -1)}</em>;
      if (sub.startsWith('~~') && sub.endsWith('~~')) return <s key={`${i}-${j}`} className="opacity-50 decoration-white/50">{sub.slice(2, -2)}</s>;
      return sub;
    });
  });
};

const PreviewMarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  const lines = content.split('\n');
  return (
    <div className="space-y-4 text-left font-sans text-lg leading-[1.8] opacity-80 text-gray-300">
      {lines.map((line, index) => {
        const trimmed = line.trim();
        if (/^#\s+/.test(trimmed)) return <h2 key={index} className="font-bold text-4xl text-white mt-8 mb-4">{parseInlineMarkdown(trimmed.replace(/^#\s+/, ''))}</h2>;
        if (/^##\s+/.test(trimmed)) return <h3 key={index} className="font-bold text-3xl text-white mt-6 mb-3">{parseInlineMarkdown(trimmed.replace(/^##\s+/, ''))}</h3>;
        if (/^###\s+/.test(trimmed)) return <h4 key={index} className="font-bold text-2xl text-white mt-5 mb-2">{parseInlineMarkdown(trimmed.replace(/^###\s+/, ''))}</h4>;
        if (trimmed.startsWith('> ')) return <blockquote key={index} className="border-l-4 border-[#9ff85d] pl-6 py-2 my-6 italic opacity-70 bg-white/5">{parseInlineMarkdown(trimmed.substring(2))}</blockquote>;
        if (trimmed === '---') return <hr key={index} className="border-t border-white/10 my-8" />;
        if (trimmed === '') return <div key={index} className="h-4"></div>;
        return <p key={index}>{parseInlineMarkdown(line)}</p>;
      })}
    </div>
  );
};

const PreviewModal: React.FC<{ signal: Signal; onClose: () => void }> = ({ signal, onClose }) => {
  return (
    <div className="fixed inset-0 z-[200] bg-black text-white overflow-y-auto animate-in fade-in duration-300">
      <div className="fixed top-0 left-0 w-full p-6 flex justify-between items-center bg-black/80 backdrop-blur z-50">
         <div className="text-xs font-mono opacity-50 uppercase tracking-widest">Pré-visualização</div>
         <button onClick={onClose} className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-colors">Fechar</button>
      </div>
      <div className="max-w-4xl mx-auto pt-32 px-6 pb-40">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 lowercase leading-tight">{signal.title || 'Sem título'}</h1>
          {signal.subtitle && <p className="text-xl opacity-60 mb-12 border-l-2 border-[#9ff85d] pl-6 py-2">{signal.subtitle}</p>}
          <div className="space-y-12">
            {signal.blocks.map(block => (
               <div key={block.id}>
                  {block.type === 'text' && <PreviewMarkdownRenderer content={block.content} />}
                  {block.type === 'image' && (<div className="my-8"><img src={formatImageUrl(block.content)} className="w-full h-auto rounded-lg border border-white/10" />{block.caption && <div className="text-center mt-2 text-sm opacity-50 font-mono">{block.caption}</div>}</div>)}
                  {block.type === 'embed' && (<div className="my-8 aspect-video bg-black border border-white/10 rounded-lg overflow-hidden"><iframe src={block.content} className="w-full h-full" frameBorder="0" allowFullScreen></iframe></div>)}
               </div>
            ))}
          </div>
      </div>
    </div>
  );
};

interface PageBackofficeProps {
  onLogout: () => void;
}

const PageBackoffice: React.FC<PageBackofficeProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'painel' | 'materia' | 'sinais' | 'perfil' | 'sync'>('painel');
  const [works, setWorks] = useState<Work[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [aboutData, setAboutData] = useState<AboutData | null>(null);
  const [connectConfig, setConnectConfig] = useState<ConnectConfig>({ id: 'connect_config', email: '', links: [] });
  const [editingWork, setEditingWork] = useState<Work | null>(null);
  const [editingSignal, setEditingSignal] = useState<Signal | null>(null);
  const [galleryInputType, setGalleryInputType] = useState<GalleryItemType>('image');
  const [galleryUrl, setGalleryUrl] = useState('');
  const [galleryCoverUrl, setGalleryCoverUrl] = useState('');
  const [history, setHistory] = useState<Signal[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const historyDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [editorStatus, setEditorStatus] = useState<'saved' | 'saving' | 'dirty'>('saved');
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false); 
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null); 
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showEmbedDialog, setShowEmbedDialog] = useState(false);
  const linkButtonRef = useRef<HTMLButtonElement | null>(null);
  const embedButtonRef = useRef<HTMLButtonElement | null>(null);
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const styleButtonRef = useRef<HTMLButtonElement>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'backoffice-style';
    style.innerHTML = `* { cursor: auto !important; } .custom-cursor-container { display: none !important; }`;
    document.head.appendChild(style);
    loadAllData();
    return () => { const el = document.getElementById('backoffice-style'); if (el) el.remove(); };
  }, []);

  useEffect(() => {
    if (editingSignal && history.length === 0) {
      setHistory([editingSignal]);
      setHistoryStep(0);
    }
  }, [editingSignal?.id]);

  useEffect(() => {
    if (editingSignal && editorStatus === 'dirty') {
        if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
        setEditorStatus('saving');
        autoSaveTimerRef.current = setTimeout(async () => {
            await storage.save('signals', editingSignal);
            await loadAllData(); 
            setEditorStatus('saved');
        }, 1500);
    }
  }, [editingSignal, editorStatus]);

  const loadAllData = async () => {
    try {
      const w = await storage.getAll('works');
      const s = await storage.getAll('signals');
      const a = await storage.get('about', 'profile');
      const conf = await storage.get('about', 'connect_config');
      setWorks(w);
      setSignals(s);
      if (a) setAboutData(a);
      if (conf) setConnectConfig(conf);
    } catch (e) { console.error(e); }
  };

  const showStatus = (msg: string) => {
    setSaveStatus(msg);
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const pushToHistory = (signal: Signal) => {
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(signal);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyStep > 0) {
      const prevStep = historyStep - 1;
      setHistoryStep(prevStep);
      setEditingSignal(history[prevStep]);
      setEditorStatus('dirty');
    }
  };

  const handleRedo = () => {
    if (historyStep < history.length - 1) {
      const nextStep = historyStep + 1;
      setHistoryStep(nextStep);
      setEditingSignal(history[nextStep]);
      setEditorStatus('dirty');
    }
  };

  const updateSignalState = (newSignal: Signal, immediateHistory = false) => {
    setEditingSignal(newSignal);
    setEditorStatus('dirty');
    if (immediateHistory) {
      if (historyDebounceRef.current) clearTimeout(historyDebounceRef.current);
      pushToHistory(newSignal);
    } else {
      if (historyDebounceRef.current) clearTimeout(historyDebounceRef.current);
      historyDebounceRef.current = setTimeout(() => { pushToHistory(newSignal); }, 1000);
    }
  };

  const handleSignalChange = (field: keyof Signal, value: any) => {
      if (!editingSignal) return;
      const newSignal = { ...editingSignal, [field]: value };
      updateSignalState(newSignal, false);
  };

  const updateBlock = (blockId: string, content: string, caption?: string) => {
    if (!editingSignal) return;
    const newBlocks = editingSignal.blocks.map(b => b.id === blockId ? { ...b, content, caption: caption ?? b.caption } : b);
    const newSignal = { ...editingSignal, blocks: newBlocks };
    updateSignalState(newSignal, false);
  };

  const addBlock = (type: 'text' | 'image' | 'embed' = 'text', content: string = '') => {
    if (!editingSignal) return;
    const newBlock: SignalBlock = { id: Math.random().toString(36).substr(2, 9), type, content, caption: '' };
    const newSignal = { ...editingSignal, blocks: [...editingSignal.blocks, newBlock] };
    updateSignalState(newSignal, true);
  };

  const removeBlock = (blockId: string) => {
    if (!editingSignal) return;
    const newSignal = { ...editingSignal, blocks: editingSignal.blocks.filter(b => b.id !== blockId) };
    updateSignalState(newSignal, true);
  };

  const insertFormatting = (prefix: string, suffix: string = '') => {
    const targetBlockId = activeBlockId || editingSignal?.blocks[editingSignal.blocks.length - 1]?.id;
    if (!targetBlockId || !editingSignal) return;
    const block = editingSignal.blocks.find(b => b.id === targetBlockId);
    if (!block || block.type !== 'text') return;
    const textArea = document.getElementById(`textarea-${targetBlockId}`) as HTMLTextAreaElement;
    if (!textArea) return;
    const start = textArea.selectionStart;
    const end = textArea.selectionEnd;
    const text = textArea.value;
    const newText = `${text.substring(0, start)}${prefix}${text.substring(start, end)}${suffix}${text.substring(end)}`;
    const newBlocks = editingSignal.blocks.map(b => b.id === targetBlockId ? { ...b, content: newText } : b);
    const newSignal = { ...editingSignal, blocks: newBlocks };
    updateSignalState(newSignal, true);
    setTimeout(() => { textArea.focus(); textArea.setSelectionRange(start + prefix.length, end + prefix.length); }, 0);
  };

  const handleTextStyle = (level: number) => {
    let targetBlockId = activeBlockId;
    if (!targetBlockId && editingSignal) {
        const textBlocks = editingSignal.blocks.filter(b => b.type === 'text');
        if (textBlocks.length > 0) targetBlockId = textBlocks[textBlocks.length - 1].id;
    }
    if (!targetBlockId || !editingSignal) return;
    const block = editingSignal.blocks.find(b => b.id === targetBlockId);
    if (!block || block.type !== 'text') return;
    let content = block.content.replace(/^#{1,6}\s+/, '');
    if (level > 0) content = `${'#'.repeat(level)} ${content}`;
    const newBlocks = editingSignal.blocks.map(b => b.id === targetBlockId ? { ...b, content } : b);
    const newSignal = { ...editingSignal, blocks: newBlocks };
    updateSignalState(newSignal, true);
    setShowStyleMenu(false);
  };

  const handleCreateLink = (text: string, url: string) => { insertFormatting(`[${text}](${url})`, ''); setShowLinkDialog(false); };
  
  const handleConfirmEmbed = (input: string) => {
      const embedUrl = getEmbedUrl(input);
      if (embedUrl) {
          addBlock('embed', embedUrl);
          setShowEmbedDialog(false);
      } else {
          showStatus("link não suportado (youtube/spotify/vimeo)");
      }
  };

  const autoResizeTextarea = (e: React.FormEvent<HTMLTextAreaElement>) => {
    e.currentTarget.style.height = 'auto';
    e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
  };

  const handlePublish = async () => {
      if (!editingSignal) return;
      const date = editingSignal.date || new Date().toLocaleDateString('pt-BR');
      const updated = { ...editingSignal, status: 'publicado' as const, date };
      await storage.save('signals', updated);
      setEditingSignal(updated);
      setEditorStatus('saved');
      setShowPublishModal(false);
      await loadAllData();
      showStatus("sinal publicado");
  };

  const handleSaveDraft = async () => {
      if (!editingSignal) return;
      const updated = { ...editingSignal, status: 'rascunho' as const };
      await storage.save('signals', updated);
      setEditingSignal(updated);
      setEditorStatus('saved');
      setShowPublishModal(false);
      await loadAllData();
      showStatus("rascunho salvo");
  };

  const handleDeleteSignal = async (id: string) => {
      if (window.confirm('deletar permanentemente?')) {
          await storage.delete('signals', id);
          await loadAllData();
          setEditingSignal(null);
      }
  };

  const handleSaveWork = async () => {
    if (!editingWork) return;
    await storage.save('works', editingWork);
    setEditingWork(null);
    await loadAllData();
    showStatus("obra salva");
  };

  const handleDeleteWork = async (id: string) => {
    if (window.confirm('deletar obra?')) {
      await storage.delete('works', id);
      await loadAllData();
    }
  };

  const addGalleryItem = () => {
    if (!editingWork || !galleryUrl) return;
    const newItem: GalleryItem = { type: galleryInputType, url: galleryUrl, coverUrl: galleryInputType === 'video' ? galleryCoverUrl : undefined };
    const currentGallery = editingWork.gallery || [];
    setEditingWork({ ...editingWork, gallery: [...currentGallery, newItem] });
    setGalleryUrl(''); setGalleryCoverUrl('');
  };

  const removeGalleryItem = (index: number) => {
      if (!editingWork || !editingWork.gallery) return;
      const newGallery = [...editingWork.gallery];
      newGallery.splice(index, 1);
      setEditingWork({ ...editingWork, gallery: newGallery });
  };

  const handleSaveProfile = async () => {
    if (aboutData) await storage.save('about', aboutData);
    await storage.save('about', connectConfig);
    showStatus("perfil atualizado");
  };

  const updateConnectLink = (id: string, field: keyof LinkItem, value: string) => {
      setConnectConfig(prev => ({ ...prev, links: prev.links.map(l => l.id === id ? { ...l, [field]: value } : l) }));
  };
  const addConnectLink = () => { setConnectConfig(prev => ({ ...prev, links: [...prev.links, { id: Math.random().toString(36).substr(2,9), label: '', url: '' }] })); };
  const removeConnectLink = (id: string) => { setConnectConfig(prev => ({ ...prev, links: prev.links.filter(l => l.id !== id) })); };

  const exportData = async () => {
    try {
      const worksData = await storage.getAll('works');
      const signalsData = await storage.getAll('signals');
      const profileData = await storage.get('about', 'profile');
      const connectData = await storage.get('about', 'connect_config');
      const sensorData = await storage.get('about', 'sensor_metrics');

      const exportObj = {
        works: worksData,
        signals: signalsData,
        about: {
            profile: profileData,
            connect_config: connectData,
            sensor_metrics: sensorData || null
        }
      };

      const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ruidos-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showStatus("backup exportado");
    } catch (e) {
      console.error(e);
      alert('erro ao exportar dados');
    }
  };

  const handleImportData = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (event) => {
          try {
              const json = JSON.parse(event.target?.result as string);
              if (json.works) for (const work of json.works) await storage.save('works', work);
              if (json.signals) for (const sig of json.signals) await storage.save('signals', sig);
              if (json.about) {
                  if (json.about.profile) await storage.save('about', json.about.profile);
                  if (json.about.connect_config) await storage.save('about', json.about.connect_config);
                  if (json.about.sensor_metrics) await storage.save('about', json.about.sensor_metrics);
              }
              await loadAllData();
              showStatus("dados importados");
          } catch (err) { alert("erro ao importar"); }
      };
      reader.readAsText(file);
  };

  const handleWorkDateChange = (dateValue: string) => {
      if (!editingWork) return;
      const parts = dateValue.split('-');
      if (parts.length === 3) {
          const year = parts[0];
          const monthIndex = (parseInt(parts[1]) - 1).toString();
          setEditingWork({
              ...editingWork,
              date: dateValue,
              year: year,
              month: monthIndex
          });
      }
  };

  if (editingSignal) {
      return (
          <div className="fixed inset-0 z-[100] bg-[#191919] text-white flex flex-col font-sans overflow-hidden">
              <div className="h-16 flex justify-between items-center px-4 border-b border-white/5 bg-[#191919] z-50 select-none">
                  <div className="flex items-center gap-4 min-w-[200px]">
                      <button onClick={() => setEditingSignal(null)} className="opacity-60 hover:opacity-100 p-2 rounded hover:bg-white/5 transition-all text-gray-400"><Icons.Back /></button>
                      <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5">
                          <div className={`w-1.5 h-1.5 rounded-full ${editorStatus === 'saved' ? 'bg-[#9ff85d]' : 'bg-yellow-500 animate-pulse'}`}></div>
                          <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">{editorStatus === 'saved' ? 'Salvo' : 'Salvando...'}</span>
                      </div>
                  </div>
                  <div className="flex items-center justify-center gap-1 flex-1">
                      <ToolbarButton onClick={handleUndo} title="Desfazer" active={false}><span className={historyStep > 0 ? "opacity-100" : "opacity-30"}><Icons.Undo /></span></ToolbarButton>
                      <ToolbarButton onClick={handleRedo} title="Refazer" active={false}><span className={historyStep < history.length - 1 ? "opacity-100" : "opacity-30"}><Icons.Redo /></span></ToolbarButton>
                      <ToolbarDivider />
                      <div className="relative">
                        <button ref={styleButtonRef} onClick={() => setShowStyleMenu(!showStyleMenu)} className="flex items-center gap-1 px-2 py-1.5 rounded hover:bg-white/10 text-sm font-medium text-gray-300">Estilo <span className="text-[10px] ml-1">▼</span></button>
                        {showStyleMenu && (<div className="absolute top-full left-0 mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl overflow-hidden flex flex-col z-[60] max-h-[300px] overflow-y-auto"><button onClick={() => handleTextStyle(0)} className="px-4 py-3 text-left hover:bg-white/5 text-sm text-gray-300">Texto normal</button><button onClick={() => handleTextStyle(1)} className="px-4 py-3 text-left hover:bg-white/5 text-xl font-bold text-white">Título 1</button><button onClick={() => handleTextStyle(2)} className="px-4 py-3 text-left hover:bg-white/5 text-lg font-bold text-white">Título 2</button><button onClick={() => handleTextStyle(3)} className="px-4 py-3 text-left hover:bg-white/5 text-base font-bold text-white">Título 3</button></div>)}
                      </div>
                      <ToolbarDivider />
                      <ToolbarButton onClick={() => insertFormatting('**', '**')} title="Negrito"><Icons.Bold /></ToolbarButton>
                      <ToolbarButton onClick={() => insertFormatting('*', '*')} title="Itálico"><Icons.Italic /></ToolbarButton>
                      <ToolbarButton onClick={() => insertFormatting('~~', '~~')} title="Tachado"><Icons.Strike /></ToolbarButton>
                      <ToolbarButton onClick={() => insertFormatting('`', '`')} title="Código"><Icons.Code /></ToolbarButton>
                      <ToolbarDivider />
                      <button ref={linkButtonRef} onClick={() => setShowLinkDialog(!showLinkDialog)} className={`p-1.5 rounded hover:bg-white/10 transition-colors text-gray-400 hover:text-white ${showLinkDialog ? 'bg-white/10 text-white' : ''}`} title="Link"><Icons.Link /></button>
                      <ToolbarButton onClick={() => addBlock('image')} title="Imagem"><Icons.Image /></ToolbarButton>
                      <ToolbarButton onClick={() => insertFormatting('> ', '')} title="Citação"><Icons.Quote /></ToolbarButton>
                      <ToolbarDivider />
                      <button ref={embedButtonRef} onClick={() => setShowEmbedDialog(!showEmbedDialog)} className={`p-1.5 rounded hover:bg-white/10 transition-colors text-gray-400 hover:text-white ${showEmbedDialog ? 'bg-white/10 text-white' : ''}`} title="Embed"><Icons.Video /></button>
                  </div>
                  <div className="flex items-center justify-end gap-3 min-w-[200px]">
                      <button onClick={() => setShowPreview(true)} className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-white/5 rounded hover:bg-white/10 transition-colors">Pré-visualização</button>
                      <button onClick={() => setShowPublishModal(true)} disabled={!editingSignal.title} className={`bg-[#9ff85d] text-black px-6 py-2 rounded font-bold text-sm hover:brightness-110 transition-all ${!editingSignal.title ? 'opacity-50 cursor-not-allowed' : ''}`}>Continuar</button>
                  </div>
              </div>
              <LinkDialog isOpen={showLinkDialog} onClose={() => setShowLinkDialog(false)} onConfirm={handleCreateLink} initialText="" positionRef={linkButtonRef} />
              <EmbedDialog isOpen={showEmbedDialog} onClose={() => setShowEmbedDialog(false)} onConfirm={handleConfirmEmbed} positionRef={embedButtonRef} />
              <div className="flex-grow overflow-y-auto custom-scrollbar bg-[#191919]" onClick={() => { setShowLinkDialog(false); setShowEmbedDialog(false); setShowStyleMenu(false); }}>
                  <div className="w-full max-w-[720px] mx-auto px-6 py-12 flex flex-col min-h-full">
                      <div className="flex items-center gap-2 text-gray-500 mb-8 select-none"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/></svg><span className="text-xs font-medium tracking-wide">Cabeçalho e rodapé de e-mail</span></div>
                      <textarea placeholder="Título" value={editingSignal.title} onChange={(e) => { handleSignalChange('title', e.target.value); autoResizeTextarea(e); }} onInput={autoResizeTextarea} className="w-full bg-transparent outline-none text-5xl font-bold placeholder:text-gray-600 text-white resize-none overflow-hidden leading-tight mb-4 tracking-tight font-sans" rows={1} />
                      <textarea placeholder="Adicione um subtítulo..." value={editingSignal.subtitle || ''} onChange={(e) => { handleSignalChange('subtitle', e.target.value); autoResizeTextarea(e); }} onInput={autoResizeTextarea} className="w-full bg-transparent outline-none text-xl text-gray-400 placeholder:text-gray-600 resize-none overflow-hidden leading-relaxed mb-12 font-sans" rows={1} />
                      <div className="space-y-4 pb-40">
                          {editingSignal.blocks.map((block, idx) => (
                              <div key={block.id} className="relative group/block">
                                  <div className="absolute -left-12 top-1.5 opacity-0 group-hover/block:opacity-100 transition-opacity"><button onClick={() => removeBlock(block.id)} className="p-1 text-gray-600 hover:text-red-500"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button></div>
                                  {block.type === 'text' && (<textarea id={`textarea-${block.id}`} value={block.content} onChange={(e) => { updateBlock(block.id, e.target.value); autoResizeTextarea(e); }} onInput={autoResizeTextarea} onFocus={(e) => { autoResizeTextarea(e); setActiveBlockId(block.id); }} placeholder="Comece a escrever..." className="w-full bg-transparent outline-none text-[19px] leading-[1.6] font-serif text-gray-200 placeholder:text-gray-600 resize-none overflow-hidden min-h-[1.6em]" />)}
                                  {block.type === 'image' && (
                                    <div className="relative my-4">
                                      {block.content ? (
                                        <div className="relative rounded bg-black/30 border border-white/5 overflow-hidden group/img">
                                          <img src={formatImageUrl(block.content)} className="w-full h-auto" />
                                          <button onClick={() => updateBlock(block.id, '')} className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded hover:bg-red-500/50 opacity-0 group-hover/img:opacity-100 transition-opacity">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                                          </button>
                                          <input type="text" placeholder="Adicionar legenda..." value={block.caption || ''} onChange={(e) => updateBlock(block.id, block.content, e.target.value)} className="w-full bg-transparent p-3 text-sm text-center text-gray-400 outline-none placeholder:text-gray-700" />
                                        </div>
                                      ) : (
                                        <div className="p-12 border-2 border-dashed border-white/10 rounded-lg flex flex-col items-center gap-4 bg-white/5">
                                          <Icons.Image />
                                          <input 
                                            type="text" 
                                            placeholder="Cole o link da imagem..." 
                                            className="w-full max-w-sm bg-black/40 border border-white/10 rounded px-4 py-2 text-sm outline-none focus:border-white/30"
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') {
                                                updateBlock(block.id, (e.target as HTMLInputElement).value);
                                              }
                                            }}
                                          />
                                          <span className="text-[10px] opacity-40 uppercase tracking-widest">Pressione Enter para inserir</span>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  {block.type === 'embed' && (
                                    <div className="my-4 relative group/embed">
                                      <div className="aspect-video bg-black rounded overflow-hidden border border-white/5">
                                        <iframe src={block.content} className="w-full h-full" frameBorder="0" allowFullScreen></iframe>
                                      </div>
                                      <button onClick={() => removeBlock(block.id)} className="absolute -right-10 top-0 opacity-0 group-hover/embed:opacity-100 p-2 text-gray-500 hover:text-red-500 transition-opacity">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                                      </button>
                                    </div>
                                  )}
                              </div>
                          ))}
                      </div>
                      <div className="mt-12 border-t border-white/5 pt-12 flex items-center justify-center gap-4">
                        <button onClick={() => addBlock('text')} className="flex items-center gap-2 px-4 py-2 rounded bg-white/5 hover:bg-white/10 text-sm font-medium transition-colors">
                          <span className="text-xl">+</span> Texto
                        </button>
                        <button onClick={() => addBlock('image')} className="flex items-center gap-2 px-4 py-2 rounded bg-white/5 hover:bg-white/10 text-sm font-medium transition-colors">
                          <span className="text-xl">+</span> Imagem
                        </button>
                      </div>
                  </div>
              </div>
              {showPublishModal && (
                <PublishSettingsModal 
                  signal={editingSignal} 
                  onClose={() => setShowPublishModal(false)}
                  onSaveDraft={handleSaveDraft}
                  onPublish={handlePublish}
                />
              )}
              {showPreview && <PreviewModal signal={editingSignal} onClose={() => setShowPreview(false)} />}
          </div>
      );
  }

  // Main Backoffice View
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8 font-sans">
      <header className="flex justify-between items-center mb-12 max-w-7xl mx-auto">
        <div className="flex items-center gap-8">
          <h1 className="text-2xl font-bold tracking-tighter">Backoffice</h1>
          <nav className="flex gap-6">
            {(['painel', 'materia', 'sinais', 'perfil', 'sync'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-sm font-mono tracking-widest uppercase pb-1 border-b-2 transition-all ${activeTab === tab ? 'border-[#9ff85d] text-[#9ff85d]' : 'border-transparent opacity-40 hover:opacity-100'}`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
        <button onClick={onLogout} className="text-xs font-mono opacity-40 hover:opacity-100 uppercase tracking-widest">Sair</button>
      </header>

      <main className="max-w-7xl mx-auto">
        {activeTab === 'painel' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/5 p-8 rounded-2xl border border-white/5">
              <span className="text-[10px] font-mono opacity-40 uppercase tracking-widest mb-4 block">Obras</span>
              <div className="text-4xl font-electrolize">{works.length}</div>
            </div>
            <div className="bg-white/5 p-8 rounded-2xl border border-white/5">
              <span className="text-[10px] font-mono opacity-40 uppercase tracking-widest mb-4 block">Sinais</span>
              <div className="text-4xl font-electrolize">{signals.length}</div>
            </div>
            <div className="bg-white/5 p-8 rounded-2xl border border-white/5">
              <span className="text-[10px] font-mono opacity-40 uppercase tracking-widest mb-4 block">Visualizações Totais</span>
              <div className="text-4xl font-electrolize">
                {works.reduce((acc, curr) => acc + (curr.views || 0), 0) + signals.reduce((acc, curr) => acc + (curr.views || 0), 0)}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'materia' && (
          <div className="space-y-8">
            <button 
              onClick={() => setEditingWork({ id: `work-${Date.now()}`, title: '', year: new Date().getFullYear().toString(), month: '0', technique: '', dimensions: '', imageUrl: '', isVisible: true, views: 0, status: 'disponível', date: new Date().toISOString().split('T')[0] })}
              className="bg-[#9ff85d] text-black px-8 py-3 rounded-full font-bold text-sm uppercase tracking-widest hover:scale-105 transition-all"
            >
              Nova Obra
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {works.map(work => (
                <div key={work.id} className="bg-white/5 border border-white/5 rounded-2xl p-4 group">
                  <div className="aspect-square rounded-xl overflow-hidden mb-4 bg-black">
                    <img src={formatImageUrl(work.imageUrl)} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <h3 className="font-electrolize text-lg mb-2">{work.title}</h3>
                  <div className="flex justify-between items-center">
                    <button onClick={() => setEditingWork(work)} className="text-xs font-mono text-[#9ff85d] uppercase tracking-widest">Editar</button>
                    <button onClick={() => handleDeleteWork(work.id)} className="text-xs font-mono text-red-500/60 hover:text-red-500 uppercase tracking-widest">Deletar</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'sinais' && (
          <div className="space-y-8">
            <button 
              onClick={() => setEditingSignal({ id: `signal-${Date.now()}`, title: '', subtitle: '', date: new Date().toLocaleDateString('pt-BR'), blocks: [{ id: 'b1', type: 'text', content: '' }], status: 'rascunho', views: 0 })}
              className="bg-[#9ff85d] text-black px-8 py-3 rounded-full font-bold text-sm uppercase tracking-widest hover:scale-105 transition-all"
            >
              Novo Sinal
            </button>
            <div className="space-y-4">
              {signals.map(signal => (
                <div key={signal.id} className="bg-white/5 border border-white/5 p-6 rounded-2xl flex items-center justify-between group">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className={`w-2 h-2 rounded-full ${signal.status === 'publicado' ? 'bg-[#9ff85d]' : 'bg-yellow-500'}`}></span>
                      <h3 className="font-electrolize text-xl">{signal.title || '(Sem título)'}</h3>
                    </div>
                    <div className="font-mono text-[10px] opacity-40 uppercase tracking-widest">{signal.date} • {signal.status}</div>
                  </div>
                  <div className="flex gap-6 items-center">
                    <button onClick={() => setEditingSignal(signal)} className="text-xs font-mono text-[#9ff85d] uppercase tracking-widest">Abrir Editor</button>
                    <button onClick={() => handleDeleteSignal(signal.id)} className="text-xs font-mono text-red-500/60 hover:text-red-500 uppercase tracking-widest">Deletar</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'perfil' && (
          <div className="max-w-2xl space-y-12">
            <section className="space-y-6">
              <h2 className="text-xl font-bold font-electrolize">Dados de Perfil</h2>
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-mono opacity-40 uppercase tracking-widest">Texto da Bio</label>
                  <textarea 
                    value={aboutData?.text || ''} 
                    onChange={e => setAboutData(prev => prev ? { ...prev, text: e.target.value } : { id: 'profile', text: e.target.value, imageUrl: '' })}
                    className="bg-white/5 border border-white/10 rounded-xl p-4 min-h-[200px] outline-none focus:border-[#9ff85d]/50 transition-colors font-mono text-sm leading-relaxed"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-mono opacity-40 uppercase tracking-widest">Imagem de Perfil (URL)</label>
                  <input 
                    type="text" 
                    value={aboutData?.imageUrl || ''} 
                    onChange={e => setAboutData(prev => prev ? { ...prev, imageUrl: e.target.value } : { id: 'profile', text: '', imageUrl: e.target.value })}
                    className="bg-white/5 border border-white/10 rounded-xl p-4 outline-none focus:border-[#9ff85d]/50 transition-colors font-mono text-sm"
                  />
                </div>
              </div>
            </section>
            <section className="space-y-6">
              <h2 className="text-xl font-bold font-electrolize">Conexões</h2>
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-mono opacity-40 uppercase tracking-widest">E-mail de Contato</label>
                  <input 
                    type="email" 
                    value={connectConfig.email} 
                    onChange={e => setConnectConfig({ ...connectConfig, email: e.target.value })}
                    className="bg-white/5 border border-white/10 rounded-xl p-4 outline-none focus:border-[#9ff85d]/50 transition-colors font-mono text-sm"
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-mono opacity-40 uppercase tracking-widest">Links Externos</label>
                  {connectConfig.links.map(link => (
                    <div key={link.id} className="flex gap-4">
                      <input 
                        placeholder="Label" 
                        value={link.label} 
                        onChange={e => updateConnectLink(link.id, 'label', e.target.value)}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl p-4 outline-none focus:border-[#9ff85d]/50 transition-colors font-mono text-sm"
                      />
                      <input 
                        placeholder="URL" 
                        value={link.url} 
                        onChange={e => updateConnectLink(link.id, 'url', e.target.value)}
                        className="flex-2 bg-white/5 border border-white/10 rounded-xl p-4 outline-none focus:border-[#9ff85d]/50 transition-colors font-mono text-sm"
                      />
                      <button onClick={() => removeConnectLink(link.id)} className="p-4 text-red-500/60 hover:text-red-500">×</button>
                    </div>
                  ))}
                  <button onClick={addConnectLink} className="text-xs font-mono text-[#9ff85d] uppercase tracking-widest">+ Adicionar Link</button>
                </div>
              </div>
            </section>
            <button 
              onClick={handleSaveProfile}
              className="bg-[#9ff85d] text-black px-12 py-4 rounded-full font-bold text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_20px_rgba(159,248,93,0.3)]"
            >
              Salvar Alterações
            </button>
          </div>
        )}

        {activeTab === 'sync' && (
          <div className="max-w-md space-y-8">
            <div className="bg-white/5 p-8 rounded-2xl border border-white/5">
              <h2 className="text-xl font-bold font-electrolize mb-4">Gestão de Dados</h2>
              <p className="text-sm opacity-60 font-mono leading-relaxed mb-8">Baixe um backup completo dos seus dados ou restaure a partir de um arquivo JSON anterior.</p>
              <div className="flex flex-col gap-4">
                <button onClick={exportData} className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg font-bold text-xs uppercase tracking-widest transition-all">Exportar Backup</button>
                <label className="bg-white/5 border border-white/10 hover:bg-white/10 text-white px-6 py-3 rounded-lg font-bold text-xs uppercase tracking-widest text-center cursor-pointer transition-all">
                  Importar Backup
                  <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
                </label>
              </div>
            </div>
          </div>
        )}
      </main>

      {editingWork && (
        <div className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 overflow-y-auto">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-3xl w-full max-w-4xl p-12 relative my-12">
            <button onClick={() => setEditingWork(null)} className="absolute top-8 right-8 text-3xl opacity-40 hover:opacity-100">×</button>
            <h2 className="text-3xl font-bold font-electrolize mb-12">Editor de Obra</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-mono opacity-40 uppercase tracking-widest">Título</label>
                  <input type="text" value={editingWork.title} onChange={e => setEditingWork({ ...editingWork, title: e.target.value })} className="bg-white/5 border border-white/10 rounded-xl p-4 outline-none focus:border-[#9ff85d]/50" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-mono opacity-40 uppercase tracking-widest">Data / Ordem</label>
                  <input type="date" value={editingWork.date || ''} onChange={e => handleWorkDateChange(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl p-4 outline-none focus:border-[#9ff85d]/50" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-mono opacity-40 uppercase tracking-widest">Técnica</label>
                  <input type="text" value={editingWork.technique} onChange={e => setEditingWork({ ...editingWork, technique: e.target.value })} className="bg-white/5 border border-white/10 rounded-xl p-4 outline-none focus:border-[#9ff85d]/50" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-mono opacity-40 uppercase tracking-widest">Dimensões</label>
                  <input type="text" value={editingWork.dimensions} onChange={e => setEditingWork({ ...editingWork, dimensions: e.target.value })} className="bg-white/5 border border-white/10 rounded-xl p-4 outline-none focus:border-[#9ff85d]/50" />
                </div>
              </div>
              <div className="space-y-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-mono opacity-40 uppercase tracking-widest">Imagem Principal (URL)</label>
                  <input type="text" value={editingWork.imageUrl} onChange={e => setEditingWork({ ...editingWork, imageUrl: e.target.value })} className="bg-white/5 border border-white/10 rounded-xl p-4 outline-none focus:border-[#9ff85d]/50" />
                </div>
                <div className="flex items-center gap-4 py-4">
                  <input type="checkbox" checked={editingWork.isFeatured} onChange={e => setEditingWork({ ...editingWork, isFeatured: e.target.checked })} id="featured-check" className="w-5 h-5 accent-[#9ff85d]" />
                  <label htmlFor="featured-check" className="text-sm font-mono opacity-60 uppercase tracking-widest cursor-pointer">Obra em Destaque</label>
                </div>
                <div className="flex items-center gap-4 py-4">
                  <input type="checkbox" checked={editingWork.isVisible} onChange={e => setEditingWork({ ...editingWork, isVisible: e.target.checked })} id="visible-check" className="w-5 h-5 accent-[#9ff85d]" />
                  <label htmlFor="visible-check" className="text-sm font-mono opacity-60 uppercase tracking-widest cursor-pointer">Visível no Site</label>
                </div>
              </div>
            </div>
            <div className="mt-12 pt-12 border-t border-white/5">
                <h3 className="text-lg font-bold font-electrolize mb-6">Galeria Adicional</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                   {(editingWork.gallery || []).map((item, i) => (
                      <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-white/10">
                         {typeof item === 'string' ? (
                            <img src={formatImageUrl(item)} className="w-full h-full object-cover" />
                         ) : (
                            <div className="w-full h-full bg-black flex items-center justify-center font-mono text-[10px] opacity-40">
                                {item.type === 'video' ? 'VIDEO EMBED' : 'IMAGE'}
                            </div>
                         )}
                         <button onClick={() => removeGalleryItem(i)} className="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                      </div>
                   ))}
                </div>
                <div className="flex gap-4">
                   <select value={galleryInputType} onChange={e => setGalleryInputType(e.target.value as GalleryItemType)} className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 outline-none text-sm font-mono">
                      <option value="image">Imagem</option>
                      <option value="video">Vídeo (Embed)</option>
                   </select>
                   <input type="text" placeholder="URL do item..." value={galleryUrl} onChange={e => setGalleryUrl(e.target.value)} className="flex-grow bg-white/5 border border-white/10 rounded-lg px-4 py-2 outline-none text-sm" />
                   <button onClick={addGalleryItem} className="bg-white/10 hover:bg-white/20 px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest">Adicionar</button>
                </div>
            </div>
            <div className="mt-12 flex justify-end gap-4">
               <button onClick={() => setEditingWork(null)} className="px-8 py-3 text-sm font-bold uppercase tracking-widest opacity-40 hover:opacity-100">Cancelar</button>
               <button onClick={handleSaveWork} className="bg-[#9ff85d] text-black px-12 py-3 rounded-full font-bold text-sm uppercase tracking-widest hover:scale-105 transition-all">Salvar Obra</button>
            </div>
          </div>
        </div>
      )}

      {saveStatus && (
        <div className="fixed bottom-8 right-8 bg-[#9ff85d] text-black px-6 py-3 rounded-full font-bold text-xs uppercase tracking-[0.2em] shadow-2xl animate-in slide-in-from-right-12 duration-500 z-[300]">
          {saveStatus}
        </div>
      )}
    </div>
  );
};

export default PageBackoffice;
