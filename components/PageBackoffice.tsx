
// ... (imports mantidos)
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { storage } from './storage';
import { Work, Signal, SignalBlock, AboutData, ConnectConfig, LinkItem, GalleryItem, SensorData, SiteConfig } from '../types';
import { MONTH_NAMES, DEFAULT_IMAGE, BACKOFFICE_PASSWORD } from '../constants';

// ... (helpers e componentes auxiliares mantidos até PageBackoffice)
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

// --- HELPER DE UPLOAD ---
const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Limite de segurança simples (ex: 4MB) para evitar travar o navegador ao converter strings gigantes
    if (file.size > 4 * 1024 * 1024) {
        alert('A imagem é muito grande (>4MB). Por favor, otimize antes de enviar para manter a performance.');
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        if (event.target?.result) {
            callback(event.target.result as string);
        }
    };
    reader.readAsDataURL(file);
    // Limpa o input para permitir selecionar o mesmo arquivo novamente se necessário
    e.target.value = '';
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
  More: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>,
  Upload: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
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

// ... (restante dos dialogs e helpers de preview mantidos)
// ... (código do modal de preview mantido)
const LinkDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (text: string, url: string) => void;
  initialText: string;
  positionRef: React.RefObject<HTMLButtonElement>;
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
  positionRef: React.RefObject<HTMLButtonElement>;
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
  onUpdateSignal: (field: string, value: any) => void;
}> = ({ signal, onClose, onSaveDraft, onPublish, onUpdateSignal }) => {
  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-300 overflow-y-auto p-4">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-xl w-full max-w-lg p-8 shadow-2xl relative flex flex-col gap-6">
        <button onClick={onClose} className="absolute top-6 right-6 text-2xl opacity-40 hover:opacity-100 transition-opacity">×</button>
        <div>
            <h2 className="font-sans text-xl font-bold mb-2">Publicar sinal</h2>
            <p className="text-sm opacity-60 font-mono leading-relaxed">{signal.status === 'publicado' ? 'este sinal já está visível publicamente.' : 'o sinal ficará visível na frequência pública.'}</p>
        </div>

        {/* SEO & URL Settings - Moved here */}
        <div className="bg-black/20 rounded-lg p-4 border border-white/5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#9ff85d] opacity-80 mb-2">Configurações de SEO & URL</h3>
            
            <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">slug (url amigável)</label>
                <input 
                    value={signal.slug || ''} 
                    onChange={(e) => onUpdateSignal('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                    placeholder="ex: meu-post-incrivel" 
                    className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-xs text-white font-mono outline-none focus:border-[#9ff85d]" 
                />
                <div className="text-[9px] opacity-30 mt-1">se vazio, usa o id. usado na url ao compartilhar.</div>
            </div>
            
            <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">título seo (meta title)</label>
                <input 
                    value={signal.seoTitle || ''} 
                    onChange={(e) => onUpdateSignal('seoTitle', e.target.value)}
                    placeholder={signal.title || "Título para Google/Social..."} 
                    className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm text-white outline-none focus:border-[#9ff85d]" 
                />
            </div>
            
            <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">descrição seo (meta description)</label>
                <textarea 
                    value={signal.seoDescription || ''} 
                    onChange={(e) => onUpdateSignal('seoDescription', e.target.value)}
                    placeholder="Breve resumo que aparece no Google e compartilhamentos..." 
                    className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm text-white outline-none focus:border-[#9ff85d] resize-none h-20" 
                />
            </div>
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
  // Estado de Autenticação
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState(false);

  // Estados do Backoffice
  const [activeTab, setActiveTab] = useState<'materia' | 'sinais' | 'perfil' | 'painel' | 'sync' | 'config'>('painel');
  const [works, setWorks] = useState<Work[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [aboutData, setAboutData] = useState<AboutData | null>(null);
  const [connectConfig, setConnectConfig] = useState<ConnectConfig>({ id: 'connect_config', email: '', links: [] });
  const [siteConfig, setSiteConfig] = useState<SiteConfig>({ 
      id: 'site_config', 
      siteTitle: 'ruídos atmosféricos', 
      siteDescription: 'sistemas vivos operam em desequilíbrio controlado.',
      siteName: '',
      siteKeywords: ''
  });
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  
  const [editingWork, setEditingWork] = useState<Work | null>(null);
  const [editingSignal, setEditingSignal] = useState<Signal | null>(null);
  const [galleryInputType, setGalleryInputType] = useState<'image' | 'video'>('image');
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
  const linkButtonRef = useRef<HTMLButtonElement>(null);
  const embedButtonRef = useRef<HTMLButtonElement>(null);
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const styleButtonRef = useRef<HTMLButtonElement>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [showSeoSettings, setShowSeoSettings] = useState(false);

  useEffect(() => {
    // Check session storage
    if (sessionStorage.getItem('ra_auth') === 'true') {
        setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
        const style = document.createElement('style');
        style.id = 'backoffice-style';
        style.innerHTML = `* { cursor: auto !important; } .custom-cursor-container { display: none !important; }`;
        document.head.appendChild(style);
        loadAllData();
        return () => { const el = document.getElementById('backoffice-style'); if (el) el.remove(); };
    }
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
      e.preventDefault();
      // Comparação simples de string
      if (passwordInput === BACKOFFICE_PASSWORD) {
          setIsAuthenticated(true);
          sessionStorage.setItem('ra_auth', 'true');
          setAuthError(false);
      } else {
          setAuthError(true);
          setPasswordInput('');
      }
  };

  if (!isAuthenticated) {
      return (
          <div className="fixed inset-0 bg-[#050505] flex items-center justify-center z-[200]">
              <form onSubmit={handleLogin} className="flex flex-col items-center gap-6 w-full max-w-xs animate-in fade-in duration-500">
                  <div className="text-[var(--accent)] font-mono text-4xl mb-4">///</div>
                  <input 
                    type="password" 
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="senha de acesso"
                    className="w-full bg-transparent border-b border-white/20 text-center py-2 outline-none text-white focus:border-[var(--accent)] transition-colors font-mono"
                    autoFocus
                  />
                  {authError && <div className="text-red-500 text-xs font-mono">acesso negado</div>}
                  <button type="submit" className="opacity-0 w-0 h-0">login</button>
              </form>
          </div>
      );
  }

  // ... (Restante das funções: loadAllData, showStatus, pushToHistory... mantidas até o return principal)
  const loadAllData = async () => {
    try {
      const w = await storage.getAll('works');
      const s = await storage.getAll('signals');
      const a = await storage.get('about', 'profile');
      const conf = await storage.get('about', 'connect_config');
      const site = await storage.get('about', 'site_config');
      const sensors = await storage.get('about', 'sensor_metrics');
      setWorks(w);
      setSignals(s);
      
      // Default fallback for profile
      if (a) setAboutData(a);
      else setAboutData({ id: 'profile', text: '', imageUrl: '' });

      if (conf) setConnectConfig(conf);
      if (site) setSiteConfig(site);
      if (sensors) setSensorData(sensors);
    } catch (e) { console.error(e); }
  };

  const showStatus = (msg: string) => {
    setSaveStatus(msg);
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleResetSensor = async () => {
      if (window.confirm("Zerar contador de cliques do sensor?")) {
          const newData = { id: 'sensor_metrics', clicks: 0 };
          await storage.save('about', newData);
          setSensorData(newData);
          showStatus("sensor resetado");
      }
  };

  // Funções Recriadas para contexto
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

  const handleSaveSiteConfig = async () => {
    await storage.save('about', siteConfig);
    showStatus("configurações atualizadas");
    // Opcional: Recarregar a página para ver mudanças no título/favicon imediatamente
    // window.location.reload(); 
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
      const siteData = await storage.get('about', 'site_config');

      const exportObj = {
        works: worksData,
        signals: signalsData,
        about: {
            profile: profileData,
            connect_config: connectData,
            sensor_metrics: sensorData || null,
            site_config: siteData || null
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

  const handleCopyInitialData = async () => {
    try {
      const worksData = await storage.getAll('works');
      const signalsData = await storage.getAll('signals');
      const profileData = await storage.get('about', 'profile');
      const connectData = await storage.get('about', 'connect_config');
      const sensorData = await storage.get('about', 'sensor_metrics');
      const siteData = await storage.get('about', 'site_config');

      const exportObj = {
        works: worksData,
        signals: signalsData,
        about: {
            profile: profileData,
            connect_config: connectData,
            sensor_metrics: sensorData || null,
            site_config: siteData || null
        }
      };

      const codeString = `
import { Work, Signal, AboutData, ConnectConfig, SensorData, SiteConfig } from './types';

export const INITIAL_DATA: {
  works: Work[];
  signals: Signal[];
  about: {
    profile: AboutData | null;
    connect_config: ConnectConfig | null;
    sensor_metrics: SensorData | null;
    site_config: SiteConfig | null;
  };
} = ${JSON.stringify(exportObj, null, 2)};
`;

      await navigator.clipboard.writeText(codeString);
      showStatus("código copiado!");
      alert("Código copiado! Agora vá até o arquivo 'initialData.ts' no seu projeto e cole o conteúdo, substituindo tudo.");
    } catch (e) {
      console.error(e);
      alert('erro ao gerar código');
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
                  if (json.about.site_config) await storage.save('about', json.about.site_config);
              }
              await loadAllData();
              showStatus("dados importados");
          } catch (err) { alert("erro ao importar"); }
      };
      reader.readAsText(file);
  };

  // ... (Edição de Signal e Work mantidos)
  if (editingSignal) {
      // (mesmo código do bloco de edição de sinais)
      return (
          <div className="fixed inset-0 z-[100] bg-[#191919] text-white flex flex-col font-sans overflow-hidden">
              <div className="h-16 flex justify-between items-center px-4 border-b border-white/5 bg-[#191919] z-50 select-none">
                  {/* ... Header Signal Edit */}
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
                      {/* Título e Subtítulo */}
                      <textarea placeholder="Título" value={editingSignal.title} onChange={(e) => { handleSignalChange('title', e.target.value); autoResizeTextarea(e); }} onInput={autoResizeTextarea} className="w-full bg-transparent outline-none text-5xl font-bold placeholder:text-gray-600 text-[#9ff85d] resize-none overflow-hidden leading-tight mb-4 tracking-tight font-sans" rows={1} />
                      <textarea placeholder="Adicione um subtítulo..." value={editingSignal.subtitle || ''} onChange={(e) => { handleSignalChange('subtitle', e.target.value); autoResizeTextarea(e); }} onInput={autoResizeTextarea} className="w-full bg-transparent outline-none text-xl text-gray-400 placeholder:text-gray-600 resize-none overflow-hidden leading-relaxed mb-4 font-sans" rows={1} />
                      
                      {/* Blocks Loop */}
                      <div className="space-y-4 pb-40">
                          {editingSignal.blocks.map((block, idx) => (
                              <div key={block.id} className="relative group/block">
                                  <div className="absolute -left-12 top-1.5 opacity-0 group-hover/block:opacity-100 transition-opacity"><button onClick={() => removeBlock(block.id)} className="p-1 text-gray-600 hover:text-red-500"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button></div>
                                  {block.type === 'text' && (<textarea id={`textarea-${block.id}`} value={block.content} onChange={(e) => { updateBlock(block.id, e.target.value); autoResizeTextarea(e); }} onInput={autoResizeTextarea} onFocus={(e) => { autoResizeTextarea(e); setActiveBlockId(block.id); }} placeholder="Comece a escrever..." className="w-full bg-transparent outline-none text-[19px] leading-[1.6] font-serif text-[#9ff85d] placeholder:text-gray-600 resize-none overflow-hidden min-h-[1.6em]" />)}
                                  {block.type === 'image' && (
                                    <div className="relative my-4">
                                        {block.content ? (
                                            <div className="relative rounded bg-black/30 border border-white/5 overflow-hidden group/img">
                                                <img src={formatImageUrl(block.content)} className="w-full h-auto opacity-100" />
                                                <button onClick={() => updateBlock(block.id, '')} className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded hover:bg-red-500/50 opacity-0 group-hover/img:opacity-100 transition-opacity"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
                                                <input type="text" placeholder="Adicionar legenda..." value={block.caption || ''} onChange={(e) => updateBlock(block.id, block.content, e.target.value)} className="w-full bg-transparent p-3 text-sm text-center text-gray-400 outline-none placeholder:text-gray-700" />
                                            </div>
                                        ) : (
                                            <div className="border-2 border-dashed border-white/10 rounded-lg p-8 text-center hover:bg-white/5 transition-colors relative group/upload flex flex-col gap-4 items-center justify-center">
                                                <input type="text" placeholder="Colar URL da imagem..." className="bg-black/20 border border-white/10 rounded px-3 py-1 text-xs w-2/3 text-center outline-none focus:border-[var(--accent)] text-white" onKeyDown={(e) => { if (e.key === 'Enter') { updateBlock(block.id, e.currentTarget.value); } }} onBlur={(e) => { if (e.target.value) updateBlock(block.id, e.target.value); }} />
                                                <div className="text-[10px] opacity-40">ou</div>
                                                <label className="cursor-pointer bg-white/10 hover:bg-white/20 px-4 py-2 rounded text-xs transition-colors flex items-center gap-2">
                                                    <Icons.Upload />
                                                    <span>Upload do Computador</span>
                                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, (b64) => updateBlock(block.id, b64))} />
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                  )}
                                  {block.type === 'embed' && (<div className="relative my-6 bg-black/30 border border-white/5 rounded-lg overflow-hidden p-2 flex flex-col gap-2"><div className="w-full aspect-video rounded bg-black"><iframe src={block.content} className="w-full h-full" frameBorder="0" allowFullScreen></iframe></div><div className="text-[10px] font-mono text-gray-500 text-center break-all px-4">{block.content}</div></div>)}
                              </div>
                          ))}
                          <div className="h-32 cursor-text" onClick={() => { const lastBlock = editingSignal.blocks[editingSignal.blocks.length - 1]; if (!lastBlock || (lastBlock.type === 'text' && lastBlock.content.trim() !== '') || lastBlock.type !== 'text') { addBlock('text'); } }}></div>
                      </div>
                  </div>
              </div>
              {showPublishModal && (
                  <PublishSettingsModal 
                      signal={editingSignal} 
                      onClose={() => setShowPublishModal(false)} 
                      onSaveDraft={handleSaveDraft} 
                      onPublish={handlePublish}
                      onUpdateSignal={handleSignalChange} 
                  />
              )}
              {showPreview && (<PreviewModal signal={editingSignal} onClose={() => setShowPreview(false)} />)}
          </div>
      );
  }

  // (Renderização do editor de Obras - mantido sem alterações lógicas profundas, apenas a parte SEO já existente)
  if (editingWork) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#0a0a0a] text-white flex flex-col animate-in fade-in duration-300 overflow-y-auto">
        <header className="p-6 border-b border-white/10 flex justify-between items-center sticky top-0 bg-[#0a0a0a]/90 backdrop-blur z-50">
          <h2 className="font-bold lowercase tracking-widest text-sm">editando: {editingWork.title || 'nova obra'}</h2>
          <div className="flex gap-4">
            <button onClick={() => setEditingWork(null)} className="opacity-60 hover:opacity-100 text-xs lowercase">cancelar</button>
            <button onClick={handleSaveWork} className="bg-[var(--accent)] text-black px-6 py-2 rounded-full font-bold lowercase text-xs hover:brightness-110">salvar obra</button>
          </div>
        </header>
        <div className="max-w-2xl mx-auto w-full p-8 space-y-8 pb-32">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Form Fields for Work... */}
             <div className="md:col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">título</label>
                <input value={editingWork.title} onChange={e => setEditingWork({...editingWork, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:border-[var(--accent)]" />
             </div>

             <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">ano</label>
                <input value={editingWork.year} onChange={e => setEditingWork({...editingWork, year: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:border-[var(--accent)]" />
             </div>

             <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">mês</label>
                <select value={editingWork.month} onChange={e => setEditingWork({...editingWork, month: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:border-[var(--accent)] appearance-none">
                    {MONTH_NAMES.map((m, i) => <option key={i} value={i.toString()} className="bg-black">{m}</option>)}
                </select>
             </div>

             <div className="md:col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">técnica</label>
                <input value={editingWork.technique} onChange={e => setEditingWork({...editingWork, technique: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:border-[var(--accent)]" />
             </div>

             <div className="md:col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">dimensões</label>
                <input value={editingWork.dimensions} onChange={e => setEditingWork({...editingWork, dimensions: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:border-[var(--accent)]" />
             </div>

             <div className="md:col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">descrição (opcional)</label>
                <textarea value={editingWork.description || ''} onChange={e => setEditingWork({...editingWork, description: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:border-[var(--accent)] h-32 resize-none" />
             </div>

             <div className="md:col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">imagem de capa (url)</label>
                <div className="flex gap-4">
                    <input value={editingWork.imageUrl} onChange={e => setEditingWork({...editingWork, imageUrl: e.target.value})} className="flex-grow bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:border-[var(--accent)]" placeholder="https://..." />
                    <label className="cursor-pointer bg-white/10 hover:bg-white/20 px-4 rounded-lg flex items-center justify-center transition-colors">
                        <Icons.Upload />
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, (b64) => setEditingWork({...editingWork, imageUrl: b64}))} />
                    </label>
                </div>
                {editingWork.imageUrl && <img src={formatImageUrl(editingWork.imageUrl)} className="mt-4 w-32 h-32 object-cover rounded-lg border border-white/10" />}
             </div>
             
             {/* Slug / SEO */}
             <div className="md:col-span-2 border-t border-white/10 pt-6 mt-2">
                 <button onClick={() => setShowSeoSettings(!showSeoSettings)} className="text-xs font-mono opacity-40 hover:opacity-100 flex items-center gap-2 mb-4">
                     <span>{showSeoSettings ? '[-]' : '[+]'}</span> configurações avançadas (url/slug)
                 </button>
                 {showSeoSettings && (
                     <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">slug (url amigável)</label>
                        <input value={editingWork.slug || ''} onChange={e => setEditingWork({...editingWork, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')})} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:border-[var(--accent)] font-mono text-sm" placeholder="ex: minha-obra-incrivel" />
                     </div>
                 )}
             </div>

             {/* Galeria Multimídia */}
             <div className="md:col-span-2 border-t border-white/10 pt-6 mt-2">
                <label className="block text-[10px] font-bold uppercase tracking-widest opacity-40 mb-4">galeria multimídia</label>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 space-y-4">
                    <div className="flex gap-4"><button onClick={() => setGalleryInputType('image')} className={`flex-1 py-2 text-xs font-bold rounded ${galleryInputType === 'image' ? 'bg-[var(--accent)] text-black' : 'bg-black/20 text-gray-400'}`}>Imagem</button><button onClick={() => setGalleryInputType('video')} className={`flex-1 py-2 text-xs font-bold rounded ${galleryInputType === 'video' ? 'bg-[var(--accent)] text-black' : 'bg-black/20 text-gray-400'}`}>Vídeo (URL/Embed)</button></div>
                    <div className="flex gap-2 items-center">
                        <input value={galleryUrl} onChange={(e) => setGalleryUrl(e.target.value)} placeholder={galleryInputType === 'image' ? "URL da Imagem..." : "URL do Vídeo (YouTube, Vimeo, MP4)..."} className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-xs outline-none focus:border-[var(--accent)]" />
                        {galleryInputType === 'image' && (
                            <label className="cursor-pointer bg-white/10 hover:bg-white/20 p-3 rounded-lg text-white" title="Upload do Computador">
                                <Icons.Upload />
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, (b64) => setGalleryUrl(b64))} />
                            </label>
                        )}
                    </div>
                    {galleryInputType === 'video' && (<input value={galleryCoverUrl} onChange={(e) => setGalleryCoverUrl(e.target.value)} placeholder="URL da Capa do Vídeo (Opcional)..." className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-xs outline-none focus:border-[var(--accent)]" />)}
                    <button onClick={addGalleryItem} disabled={!galleryUrl} className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-2 rounded text-xs uppercase tracking-widest transition-colors disabled:opacity-50">+ Adicionar à Galeria</button>
                </div>
                <div className="space-y-2">{editingWork.gallery?.map((item, idx) => { const isObj = typeof item === 'object'; const url = isObj ? (item as GalleryItem).url : (item as string); const type = isObj ? (item as GalleryItem).type : 'image'; const cover = isObj ? (item as GalleryItem).coverUrl : null; return (<div key={idx} className="flex items-center gap-4 bg-white/5 p-3 rounded-lg group"><div className="w-12 h-12 bg-black/30 rounded overflow-hidden flex-shrink-0 flex items-center justify-center">{type === 'image' ? (<img src={formatImageUrl(url)} className="w-full h-full object-cover opacity-100" />) : (<div className="text-[var(--accent)]">{cover ? <img src={formatImageUrl(cover)} className="w-full h-full object-cover opacity-50" /> : <Icons.Video />}</div>)}</div><div className="flex-grow min-w-0"><div className="text-xs truncate opacity-80">{url}</div><div className="text-[10px] opacity-40 uppercase tracking-wider flex gap-2"><span>{type}</span>{cover && <span className="text-[var(--accent)]">• capa definida</span>}</div></div><button onClick={() => removeGalleryItem(idx)} className="opacity-40 hover:opacity-100 hover:text-red-500 p-2">×</button></div>); })} {(!editingWork.gallery || editingWork.gallery.length === 0) && (<div className="text-center opacity-20 text-xs py-4">galeria vazia</div>)}</div>
             </div>

             <div className="md:col-span-2 flex gap-8 pt-4 border-t border-white/10">
                <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={editingWork.isVisible} onChange={e => setEditingWork({...editingWork, isVisible: e.target.checked})} className="accent-[var(--accent)]" /><span className="text-sm">visível no site</span></label>
                <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={editingWork.isFeatured} onChange={e => setEditingWork({...editingWork, isFeatured: e.target.checked})} className="accent-[var(--accent)]" /><span className="text-sm">destaque (home)</span></label>
             </div>
          </div>
        </div>
      </div>
    );
  }

  // --- PAINEL PRINCIPAL ---
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white [.light-mode_&]:bg-[#e5e5e5] [.light-mode_&]:text-[#1a1a1a] font-mono text-xs flex flex-col transition-colors duration-500">
      <div className="bg-red-900/20 text-red-400 border-b border-red-500/20 px-4 py-2 text-center text-[10px] tracking-widest uppercase font-bold">atenção: ambiente local (indexeddb). para produção, use a aba "sincronia".</div>
      {saveStatus && (<div className="fixed bottom-6 right-6 bg-[var(--accent)] text-black [.light-mode_&]:text-white px-6 py-3 rounded-full font-bold z-[100] animate-bounce shadow-[0_0_15px_var(--accent)] lowercase text-sm">{saveStatus}</div>)}
      <header className="p-6 border-b border-white/5 [.light-mode_&]:border-black/5 flex justify-between items-center bg-black/40 [.light-mode_&]:bg-[#f0f0f0]/90 backdrop-blur-xl sticky top-0 z-50 transition-colors">
        <div className="flex items-center gap-4"><div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse shadow-[0_0_8px_var(--accent)]"></div><div className="font-bold opacity-60 lowercase tracking-widest text-sm">ruídos / backoffice</div></div>
        <nav className="flex gap-8 text-sm">
          <button onClick={() => {setActiveTab('painel'); setEditingWork(null); setEditingSignal(null);}} className={`lowercase tracking-widest transition-colors ${activeTab === 'painel' ? 'text-[var(--accent)] font-bold' : 'opacity-40 hover:opacity-100'}`}>painel</button>
          <button onClick={() => {setActiveTab('materia'); setEditingWork(null); setEditingSignal(null);}} className={`lowercase tracking-widest transition-colors ${activeTab === 'materia' ? 'text-[var(--accent)] font-bold' : 'opacity-40 hover:opacity-100'}`}>matéria</button>
          <button onClick={() => {setActiveTab('sinais'); setEditingWork(null); setEditingSignal(null);}} className={`lowercase tracking-widest transition-colors ${activeTab === 'sinais' ? 'text-[var(--accent)] font-bold' : 'opacity-40 hover:opacity-100'}`}>sinais</button>
          <button onClick={() => {setActiveTab('perfil'); setEditingWork(null); setEditingSignal(null);}} className={`lowercase tracking-widest transition-colors ${activeTab === 'perfil' ? 'text-[var(--accent)] font-bold' : 'opacity-40 hover:opacity-100'}`}>👁👁</button>
          <button onClick={() => {setActiveTab('config'); setEditingWork(null); setEditingSignal(null);}} className={`lowercase tracking-widest transition-colors ${activeTab === 'config' ? 'text-[var(--accent)] font-bold' : 'opacity-40 hover:opacity-100'}`}>configurações</button>
          <button onClick={() => {setActiveTab('sync'); setEditingWork(null); setEditingSignal(null);}} className={`lowercase tracking-widest transition-colors ${activeTab === 'sync' ? 'text-[var(--accent)] font-bold' : 'opacity-40 hover:opacity-100'}`}>sincronia</button>
        </nav>
        <button onClick={onLogout} className="text-red-500/60 hover:text-red-500 lowercase tracking-widest text-xs border border-red-500/20 px-4 py-1 rounded-full hover:bg-red-500/10 transition-colors">sair</button>
      </header>
      <main className="p-8 max-w-[1400px] mx-auto w-full flex-grow">
        {activeTab === 'painel' && (
          <div className="flex flex-col gap-12 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-8 bg-black/40 [.light-mode_&]:bg-white border border-white/5 [.light-mode_&]:border-black/5 rounded-3xl backdrop-blur-sm transition-colors shadow-sm"><div className="opacity-40 mb-2 lowercase tracking-tighter text-sm">obras no acervo</div><div className="text-6xl font-light tracking-tighter">{works.length}</div></div>
              <div className="p-8 bg-black/40 [.light-mode_&]:bg-white border border-white/5 [.light-mode_&]:border-black/5 rounded-3xl backdrop-blur-sm transition-colors shadow-sm"><div className="opacity-40 mb-2 lowercase tracking-tighter text-sm">sinais captados</div><div className="text-6xl font-light tracking-tighter">{signals.length}</div></div>
              
              {/* CONFIGURAÇÃO DA PÁGINA DE OLHOS (SENSOR) */}
              <div className="p-8 bg-black/40 [.light-mode_&]:bg-white border border-white/5 [.light-mode_&]:border-black/5 rounded-3xl backdrop-blur-sm transition-colors shadow-sm group">
                  <div className="flex justify-between items-start">
                      <div className="opacity-40 mb-2 lowercase tracking-tighter text-sm">cliques no sensor (olhos)</div>
                      <button onClick={handleResetSensor} className="opacity-20 hover:opacity-100 transition-opacity text-xs border border-white/20 px-2 rounded">zerar</button>
                  </div>
                  <div className="text-6xl font-light tracking-tighter flex items-center gap-2">
                      {sensorData?.clicks || 0}
                      <span className="text-lg opacity-20">pulsos</span>
                  </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'materia' && (<div className="space-y-6"><div className="flex justify-between items-center mb-8 animate-in fade-in slide-in-from-bottom-2 duration-500"><h2 className="text-base opacity-40 lowercase tracking-widest">acervo de obras</h2><button onClick={() => { const newWork: Work = { id: Date.now().toString(), title: '', year: '2025', month: '0', technique: '', dimensions: '', imageUrl: '', gallery: [], status: 'disponível', isVisible: true, isFeatured: false, views: 0 }; setEditingWork(newWork); }} className="bg-white [.light-mode_&]:bg-black text-black [.light-mode_&]:text-white px-6 py-2 rounded-full font-bold lowercase tracking-widest hover:bg-[var(--accent)] [.light-mode_&]:hover:bg-[var(--accent)] hover:text-black transition-colors shadow-lg active:scale-95 flex items-center gap-2">+ nova obra</button></div><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{works.map(work => (<div key={work.id} className="group relative bg-black/20 [.light-mode_&]:bg-white border border-white/5 [.light-mode_&]:border-black/5 rounded-2xl overflow-hidden hover:border-white/20 [.light-mode_&]:hover:border-black/20 transition-all shadow-sm"><div className="aspect-square bg-black relative">{work.imageUrl ? <img src={formatImageUrl(work.imageUrl)} className="w-full h-full object-cover opacity-100" /> : <div className="w-full h-full flex items-center justify-center opacity-20">sem imagem</div>}<div className="absolute top-2 right-2 flex gap-1">{work.isVisible && <div className="bg-green-500/20 text-green-500 px-2 py-1 rounded text-[10px] font-bold">visível</div>}{work.isFeatured && <div className="bg-[var(--accent)] text-black px-2 py-1 rounded text-[10px] font-bold">destaque</div>}</div></div><div className="p-4"><div className="font-bold text-lg mb-1 truncate">{work.title || 'sem título'}</div><div className="text-xs opacity-40 mb-4">{work.year} // {work.technique}</div><div className="flex gap-2"><button onClick={() => handleDeleteWork(work.id)} className="flex-1 border border-white/10 [.light-mode_&]:border-black/10 py-2 rounded hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50 transition-colors text-xs lowercase">excluir</button><button onClick={() => setEditingWork(work)} className="flex-1 bg-white/10 [.light-mode_&]:bg-black/10 py-2 rounded hover:bg-white/20 [.light-mode_&]:hover:bg-black/20 transition-colors text-xs font-bold lowercase">editar</button></div></div></div>))}</div></div>)}
        {activeTab === 'perfil' && aboutData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-20">
                <div className="space-y-8">
                    <h2 className="text-base opacity-40 lowercase tracking-widest mb-4">dados de identidade (esse eu)</h2>
                    <div className="p-6 bg-black/20 [.light-mode_&]:bg-white border border-white/5 [.light-mode_&]:border-black/5 rounded-3xl space-y-6">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">imagem de perfil</label>
                            <div className="flex flex-col gap-4">
                                <div className="flex gap-4 items-start">
                                    <img src={formatImageUrl(aboutData.imageUrl)} className="w-20 h-24 object-cover rounded bg-white/5" />
                                    <input value={aboutData.imageUrl} onChange={e => setAboutData({...aboutData, imageUrl: e.target.value})} className="flex-grow bg-black/20 border border-white/10 rounded p-2 text-xs outline-none focus:border-[var(--accent)]" placeholder="url da imagem..." />
                                </div>
                                <label className="flex items-center gap-2 cursor-pointer bg-white/5 hover:bg-white/10 p-2 rounded text-xs w-fit">
                                    <Icons.Upload />
                                    <span>Upload do Computador</span>
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, (b64) => setAboutData({...aboutData, imageUrl: b64}))} />
                                </label>
                            </div>
                        </div>
                        <div><label className="block text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">bio / manifesto</label><textarea value={aboutData.text} onChange={e => setAboutData({...aboutData, text: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl p-4 outline-none focus:border-[var(--accent)] h-64 text-sm leading-relaxed resize-none" placeholder="escreva sobre você..."/></div>
                    </div>
                    <button onClick={handleSaveProfile} className="w-full bg-[var(--accent)] text-black px-6 py-4 rounded-xl font-bold lowercase tracking-widest hover:brightness-110 shadow-lg active:scale-[0.98] transition-all">salvar alterações</button>
                </div>
                <div className="space-y-8"><h2 className="text-base opacity-40 lowercase tracking-widest mb-4">pontos de conexão</h2><div className="p-6 bg-black/20 [.light-mode_&]:bg-white border border-white/5 [.light-mode_&]:border-black/5 rounded-3xl space-y-6"><div><label className="block text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">e-mail de contato</label><input value={connectConfig.email} onChange={e => setConnectConfig({...connectConfig, email: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-lg p-3 outline-none focus:border-[var(--accent)]" /></div><div className="border-t border-white/5 pt-6"><label className="block text-[10px] font-bold uppercase tracking-widest opacity-40 mb-4">links externos (terminal)</label><div className="space-y-3">{connectConfig.links.map(link => (<div key={link.id} className="flex gap-2 items-center"><input value={link.label} onChange={e => updateConnectLink(link.id, 'label', e.target.value)} placeholder="nome (ex: instagram)" className="w-1/3 bg-black/20 border border-white/10 rounded-lg p-2 text-xs outline-none focus:border-[var(--accent)]" /><input value={link.url} onChange={e => updateConnectLink(link.id, 'url', e.target.value)} placeholder="url (https://...)" className="flex-grow bg-black/20 border border-white/10 rounded-lg p-2 text-xs outline-none focus:border-[var(--accent)]" /><button onClick={() => removeConnectLink(link.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded">×</button></div>))}</div><button onClick={addConnectLink} className="mt-4 text-xs font-bold text-[var(--accent)] hover:underline">+ adicionar link</button></div></div></div>
            </div>
        )}
        
        {/* NOVA ABA: CONFIGURAÇÕES (SEO & IDENTIDADE) */}
        {activeTab === 'config' && (
            <div className="grid grid-cols-1 gap-12 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-20 max-w-2xl mx-auto">
                <div className="space-y-8">
                    <h2 className="text-base opacity-40 lowercase tracking-widest mb-4">identidade visual & seo</h2>
                    
                    <div className="p-8 bg-black/20 [.light-mode_&]:bg-white border border-white/5 [.light-mode_&]:border-black/5 rounded-3xl space-y-8">
                        {/* IDENTIDADE DO SITE */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-bold text-[var(--accent)] lowercase tracking-wide border-b border-white/10 pb-2">Informações Principais</h3>
                            
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">Título do Site (Browser Tab)</label>
                                <input 
                                    value={siteConfig.siteTitle} 
                                    onChange={e => setSiteConfig({...siteConfig, siteTitle: e.target.value})} 
                                    placeholder="Ex: ruídos atmosféricos"
                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-4 text-sm outline-none focus:border-[var(--accent)]" 
                                />
                                <p className="text-[10px] opacity-30 mt-2">título que aparece na aba do navegador e nos resultados do google.</p>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">Descrição (Meta Description)</label>
                                <textarea 
                                    value={siteConfig.siteDescription} 
                                    onChange={e => setSiteConfig({...siteConfig, siteDescription: e.target.value})} 
                                    placeholder="Ex: sistemas vivos operam em desequilíbrio controlado..."
                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-4 text-sm outline-none focus:border-[var(--accent)] h-24 resize-none leading-relaxed" 
                                />
                                <p className="text-[10px] opacity-30 mt-2">breve resumo do site (até 160 caracteres) para aparecer abaixo do título no google.</p>
                            </div>
                        </div>

                        {/* OPEN GRAPH PROTOCOL */}
                        <div className="space-y-6 pt-6">
                            <h3 className="text-sm font-bold text-[var(--accent)] lowercase tracking-wide border-b border-white/10 pb-2">Protocolo Open Graph (Social Cards)</h3>
                            
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">Nome do Site (og:site_name)</label>
                                <input 
                                    value={siteConfig.siteName || ''} 
                                    onChange={e => setSiteConfig({...siteConfig, siteName: e.target.value})} 
                                    placeholder="Ex: ruídos.art"
                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-4 text-sm outline-none focus:border-[var(--accent)]" 
                                />
                                <p className="text-[10px] opacity-30 mt-2">nome da marca que aparece nos cards do facebook/linkedin.</p>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">Palavras-chave (Meta Keywords)</label>
                                <textarea 
                                    value={siteConfig.siteKeywords || ''} 
                                    onChange={e => setSiteConfig({...siteConfig, siteKeywords: e.target.value})} 
                                    placeholder="arte generativa, design, ruídos, atmosfera..."
                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-4 text-sm outline-none focus:border-[var(--accent)] h-20 resize-none" 
                                />
                                <p className="text-[10px] opacity-30 mt-2">palavras separadas por vírgula para indexação secundária.</p>
                            </div>
                        </div>

                        {/* FAVICON */}
                        <div className="space-y-6 pt-6">
                            <h3 className="text-sm font-bold text-[var(--accent)] lowercase tracking-wide border-b border-white/10 pb-2">Favicon (Ícone da Aba)</h3>
                            
                            <div className="flex gap-6 items-start">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-16 h-16 bg-black border border-white/10 rounded-lg flex items-center justify-center overflow-hidden">
                                        {siteConfig.faviconUrl ? (
                                            <img src={siteConfig.faviconUrl} className="w-full h-full object-contain" />
                                        ) : (
                                            <div className="text-[10px] text-center px-1 opacity-50">olho generativo</div>
                                        )}
                                    </div>
                                    <div className="text-[9px] opacity-40">preview 64px</div>
                                </div>

                                <div className="flex-grow space-y-4">
                                    <p className="text-[11px] opacity-60 leading-relaxed">
                                        Se vazio, o site usa o <span className="text-[var(--accent)]">olho generativo</span> (padrão).
                                        Para usar sua própria marca, faça upload de uma imagem quadrada.
                                    </p>
                                    <div className="flex flex-col gap-2">
                                        <div className="flex gap-2">
                                            <input 
                                                value={siteConfig.faviconUrl || ''} 
                                                onChange={e => setSiteConfig({...siteConfig, faviconUrl: e.target.value})} 
                                                className="flex-grow bg-black/20 border border-white/10 rounded-lg p-2 text-xs outline-none focus:border-[var(--accent)]" 
                                                placeholder="url do ícone..." 
                                            />
                                            {siteConfig.faviconUrl && (
                                                <button onClick={() => setSiteConfig({...siteConfig, faviconUrl: ''})} className="px-3 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20">×</button>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <label className="cursor-pointer bg-white/5 hover:bg-white/10 px-4 py-2 rounded text-[10px] uppercase tracking-wider transition-colors flex items-center gap-2 w-fit">
                                                <Icons.Upload />
                                                <span>Upload (PNG/ICO)</span>
                                                <input type="file" className="hidden" accept="image/png, image/x-icon, image/svg+xml" onChange={(e) => handleFileUpload(e, (b64) => setSiteConfig({...siteConfig, faviconUrl: b64}))} />
                                            </label>
                                            <span className="text-[9px] opacity-30">recomendado: 64x64 ou 32x32</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SOCIAL SHARE IMAGE */}
                        <div className="space-y-6 pt-6">
                            <h3 className="text-sm font-bold text-[var(--accent)] lowercase tracking-wide border-b border-white/10 pb-2">Imagem de Compartilhamento (og:image)</h3>
                            
                            <div className="flex gap-6 items-start">
                                <div className="w-32 aspect-video bg-black border border-white/10 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                                    {siteConfig.ogImageUrl ? (
                                        <img src={siteConfig.ogImageUrl} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-[10px] text-center px-1 opacity-20">sem imagem</div>
                                    )}
                                </div>

                                <div className="flex-grow space-y-4">
                                    <p className="text-[11px] opacity-60 leading-relaxed">
                                        Imagem padrão que aparece ao compartilhar o link principal do site no WhatsApp, Twitter, etc.
                                    </p>
                                    <div className="flex gap-2">
                                        <input 
                                            value={siteConfig.ogImageUrl || ''} 
                                            onChange={e => setSiteConfig({...siteConfig, ogImageUrl: e.target.value})} 
                                            className="flex-grow bg-black/20 border border-white/10 rounded-lg p-2 text-xs outline-none focus:border-[var(--accent)]" 
                                            placeholder="url da imagem..." 
                                        />
                                        <label className="cursor-pointer bg-white/5 hover:bg-white/10 px-3 py-2 rounded-lg text-white" title="Upload">
                                            <Icons.Upload />
                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, (b64) => setSiteConfig({...siteConfig, ogImageUrl: b64}))} />
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                    
                    <button onClick={handleSaveSiteConfig} className="w-full bg-[var(--accent)] text-black px-6 py-4 rounded-xl font-bold lowercase tracking-widest hover:brightness-110 shadow-lg active:scale-[0.98] transition-all">salvar configurações</button>
                </div>
            </div>
        )}

        {/* ... (Resto do conteúdo da aba Sinais, Sync, etc. mantido) */}
        {activeTab === 'sinais' && (<div className="space-y-6"><div className="animate-in fade-in slide-in-from-bottom-2 duration-500"><div className="flex justify-between items-center mb-8"><h2 className="text-base opacity-40 lowercase tracking-widest">fluxo de sinais</h2><button onClick={() => { const newSignal: Signal = { id: Date.now().toString(), title: '', subtitle: '', date: new Date().toLocaleDateString('pt-BR'), blocks: [{ id: 'init-1', type: 'text', content: '' }], status: 'rascunho', views: 0 }; setEditingSignal(newSignal); }} className="bg-white [.light-mode_&]:bg-black text-black [.light-mode_&]:text-white px-6 py-2 rounded-full font-bold lowercase tracking-widest hover:bg-[var(--accent)] [.light-mode_&]:hover:bg-[var(--accent)] hover:text-black transition-colors shadow-lg active:scale-95 flex items-center gap-2">+ novo sinal</button></div><div className="grid gap-2">{signals.map(s => (<div key={s.id} className="p-5 bg-black/20 [.light-mode_&]:bg-white border border-white/5 [.light-mode_&]:border-black/5 rounded-3xl flex items-center gap-6 group hover:border-white/20 [.light-mode_&]:hover:border-black/20 transition-all shadow-sm"><div className="flex-grow"><div className="font-bold opacity-80 text-base">{s.title || 'sem título'}</div><div className="opacity-30 text-xs lowercase tracking-widest mt-1">{s.date} // {s.blocks.length} blocos</div></div><div className={`text-[10px] lowercase px-3 py-1 border rounded-full ${s.status === 'publicado' ? 'border-green-900 text-green-500 bg-green-500/5' : 'border-yellow-900 text-yellow-500 bg-yellow-500/5'}`}>{s.status}</div><div className="flex gap-2"><button onClick={() => handleDeleteSignal(s.id)} className="opacity-40 hover:opacity-100 hover:text-red-500 px-4 py-2 transition-all lowercase text-xs">apagar</button><button onClick={() => setEditingSignal(s)} className="opacity-40 group-hover:opacity-100 px-4 py-2 hover:bg-white/5 [.light-mode_&]:hover:bg-black/5 rounded-full transition-all lowercase text-xs">editar</button></div></div>))}</div></div></div>)}
        {activeTab === 'sync' && (
             <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 py-12">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Exportar JSON */}
              <div className="p-10 bg-black/40 [.light-mode_&]:bg-white border border-dashed border-white/10 [.light-mode_&]:border-black/10 rounded-3xl flex flex-col items-center gap-6 group hover:border-white/30 transition-all shadow-sm">
                <div className="text-center"><div className="font-bold lowercase tracking-widest mb-1 text-sm">backup manual (json)</div><div className="text-xs opacity-40 lowercase">salvar arquivo localmente</div></div>
                <button onClick={exportData} className="w-full bg-white [.light-mode_&]:bg-black text-black [.light-mode_&]:text-white py-3 rounded-xl font-bold lowercase tracking-tighter hover:bg-[var(--accent)] [.light-mode_&]:hover:bg-[var(--accent)] hover:text-black transition-colors">baixar backup</button>
              </div>
              
              {/* Gerar Código para Git */}
              <div className="p-10 bg-black/40 [.light-mode_&]:bg-white border border-dashed border-[var(--accent)]/30 rounded-3xl flex flex-col items-center gap-6 group hover:border-[var(--accent)] transition-all shadow-[0_0_20px_rgba(0,0,0,0.2)]">
                <div className="text-center">
                    <div className="font-bold lowercase tracking-widest mb-1 text-sm text-[var(--accent)]">sincronizar com github</div>
                    <div className="text-xs opacity-40 lowercase">gerar código para initialData.ts</div>
                </div>
                <button onClick={handleCopyInitialData} className="w-full bg-[var(--accent)] text-black py-3 rounded-xl font-bold lowercase tracking-tighter hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg">copiar código</button>
                <div className="text-[9px] opacity-30 text-center max-w-[200px]">copia o conteúdo formatado para você colar no arquivo do projeto.</div>
              </div>

              {/* Importar */}
              <div className="md:col-span-2 p-10 bg-black/40 [.light-mode_&]:bg-white border border-dashed border-white/10 [.light-mode_&]:border-black/10 rounded-3xl flex flex-col items-center gap-6 group hover:border-white/30 transition-all shadow-sm">
                <div className="text-center"><div className="font-bold lowercase tracking-widest mb-1 text-sm">restaurar backup</div><div className="text-xs opacity-40 lowercase">subir arquivo .json salvo anteriormente</div></div>
                <label className="w-full max-w-xs bg-white/10 [.light-mode_&]:bg-black/10 text-white [.light-mode_&]:text-black py-3 rounded-xl font-bold lowercase tracking-tighter text-center cursor-pointer hover:bg-white/20 transition-all">selecionar arquivo<input type="file" accept=".json" onChange={handleImportData} className="hidden" /></label>
              </div>
            </div>
          </div>
        )}
      </main>
      <footer className="p-6 text-center opacity-10 lowercase tracking-[0.4em] text-[10px] border-t border-white/5 [.light-mode_&]:border-black/5">ruídos atmosféricos // sistema de gestão existencial // v.1</footer>
    </div>
  );
};

export default PageBackoffice;