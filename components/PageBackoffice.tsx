
import React, { useState, useEffect, useRef } from 'react';
import { storage } from '../lib/storage';
import { Work, Signal, SignalBlock, SignalBlockType, AboutData, ConnectConfig, ViewState } from '../types';
import NeobrutalistButton from './NeobrutalistButton';
import SignalRenderer from './SignalRenderer';

interface PageBackofficeProps {
  onLogout: () => void;
}

const PageBackoffice: React.FC<PageBackofficeProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<ViewState | 'sincronizar'>(ViewState.LANDING);
  const [works, setWorks] = useState<Work[]>([]);
  const [editingWork, setEditingWork] = useState<Work | null>(null);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [editingSignal, setEditingSignal] = useState<Signal | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [profile, setProfile] = useState<AboutData>({ id: 'profile', text: '', imageUrl: '', faviconUrl: '' });
  const [connect, setConnect] = useState<ConnectConfig>({ id: 'connect_config', email: '', sobreText: '', links: [] });
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [exportCode, setExportCode] = useState('');
  
  const isSlugPristine = useRef(true);
  const isWorkSlugPristine = useRef(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [w, s, p, c] = await Promise.all([
      storage.getAll('works'),
      storage.getAll('signals'),
      storage.get('about', 'profile'),
      storage.get('about', 'connect_config')
    ]);
    setWorks(w.sort((a, b) => b.date.localeCompare(a.date)));
    setSignals(s.sort((a, b) => {
        const dateA = a.date.split('/').reverse().join('-');
        const dateB = b.date.split('/').reverse().join('-');
        return dateB.localeCompare(dateA);
    }));
    if (p) setProfile(p);
    if (c) setConnect(c);
  };

  const compressAndResizeImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1920;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(base64Str); return; }
        
        ctx.drawImage(img, 0, 0, width, height);
        // Tenta converter para WebP (fallback para JPEG)
        let compressed = canvas.toDataURL('image/webp', 0.82);
        if (compressed.length < 100) {
           compressed = canvas.toDataURL('image/jpeg', 0.82);
        }
        resolve(compressed);
      };
      img.onerror = () => resolve(base64Str);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingWork) return;

    setIsProcessingImage(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      const optimized = await compressAndResizeImage(base64);
      setEditingWork({ ...editingWork, imageUrl: optimized });
      setIsProcessingImage(false);
    };
    reader.readAsDataURL(file);
  };

  const generateExportCode = () => {
    const data = {
      lastUpdated: Date.now(),
      works,
      signals,
      about: { profile, connect_config: connect }
    };

    setExportCode(`import { Work, Signal, AboutData, ConnectConfig } from './types';

export const INITIAL_DATA: {
  lastUpdated: number;
  works: Work[];
  signals: Signal[];
  about: {
    profile: AboutData | null;
    connect_config: ConnectConfig | null;
  };
} = ${JSON.stringify(data, null, 2)};`);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(exportCode);
    alert("código copiado! substitua o conteúdo do arquivo initialData.ts no github.");
  };

  const createSlug = (text: string) => 
    text.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const handleCreateNewSignal = () => {
    const today = new Date();
    const formattedDate = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
    isSlugPristine.current = true;
    const newSignal: Signal = {
      id: `signal-${Date.now()}`,
      slug: '',
      title: 'nova transmissão',
      subtitle: '',
      date: formattedDate,
      status: 'rascunho',
      views: 0,
      coverImageUrl: '',
      seoDescription: '',
      blocks: [{ id: `b-${Date.now()}`, type: 'text', content: 'digite sua mensagem aqui...' }]
    };
    setEditingSignal(newSignal);
    setIsPreviewMode(false);
  };

  const handleCreateNewWork = () => {
    isWorkSlugPristine.current = true;
    const now = new Date();
    const currentYear = now.getFullYear().toString();
    const currentMonth = (now.getMonth() + 1).toString().padStart(2, '0');
    setEditingWork({
      id: `work-${Date.now()}`, 
      title: '', 
      slug: '',
      year: currentYear,
      month: currentMonth, 
      date: `${currentYear}-${currentMonth}-01`, 
      technique: '',
      dimensions: '', 
      imageUrl: '',
      status: 'disponível', 
      isVisible: true, 
      isFeatured: false,
      featuredOrder: 999,
      views: 0,
      description: '',
      seoDescription: ''
    });
  };

  const handleWorkTitleChange = (val: string) => {
    if (!editingWork) return;
    const updates: Partial<Work> = { title: val };
    if (isWorkSlugPristine.current) updates.slug = createSlug(val);
    setEditingWork({ ...editingWork, ...updates });
  };

  const handleWorkMonthYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingWork) return;
    const [year, month] = e.target.value.split('-');
    setEditingWork({
      ...editingWork,
      year,
      month,
      date: `${year}-${month}-01`
    });
  };

  const handleSaveWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWork) return;
    setIsSaving(true);
    try {
      const finalSlug = editingWork.slug || createSlug(editingWork.title);
      // Se a descrição SEO estiver vazia, usa a descrição da obra
      const finalSeoDescription = editingWork.seoDescription || editingWork.description?.substring(0, 160) || '';
      await storage.save('works', { 
        ...editingWork, 
        slug: finalSlug, 
        seoDescription: finalSeoDescription 
      });
      setEditingWork(null);
      fetchData();
    } finally { setIsSaving(false); }
  };

  const handleMoveFeatured = async (work: Work, direction: 'up' | 'down') => {
    const featured = works
      .filter(w => w.isFeatured)
      .sort((a, b) => (a.featuredOrder ?? 999) - (b.featuredOrder ?? 999));
    
    const index = featured.findIndex(w => w.id === work.id);
    if (index === -1) return;

    const newFeatured = [...featured];
    if (direction === 'up' && index > 0) {
      [newFeatured[index], newFeatured[index - 1]] = [newFeatured[index - 1], newFeatured[index]];
    } else if (direction === 'down' && index < newFeatured.length - 1) {
      [newFeatured[index], newFeatured[index + 1]] = [newFeatured[index + 1], newFeatured[index]];
    } else {
      return;
    }

    // Atualiza featuredOrder para todos
    setIsSaving(true);
    try {
      for (let i = 0; i < newFeatured.length; i++) {
        const item = newFeatured[i];
        await storage.save('works', { ...item, featuredOrder: i });
      }
      fetchData();
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddBlock = (type: SignalBlockType, index?: number) => {
    if (!editingSignal) return;
    const newBlock: SignalBlock = {
      id: `b-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      type,
      content: '',
      caption: type === 'image' ? 'legenda opcional' : undefined
    };
    const newBlocks = [...editingSignal.blocks];
    if (typeof index === 'number') newBlocks.splice(index + 1, 0, newBlock);
    else newBlocks.push(newBlock);
    setEditingSignal({ ...editingSignal, blocks: newBlocks });
  };

  const handleUpdateBlock = (blockId: string, content: string, caption?: string) => {
    if (!editingSignal) return;
    setEditingSignal({
      ...editingSignal,
      blocks: editingSignal.blocks.map(b => b.id === blockId ? { ...b, content, caption } : b)
    });
  };

  const applyFormatting = (blockId: string, prefix: string, suffix: string = '') => {
    const textarea = document.getElementById(`textarea-${blockId}`) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    const before = text.substring(0, start);
    const after = text.substring(end);

    let finalPrefix = prefix;
    let finalSuffix = suffix;
    let insertion = selectedText;

    if (prefix === '[') {
      const url = window.prompt("insira o endereço (url) do link:", "https://");
      if (url === null) return;
      if (!insertion) insertion = "texto do link";
      finalSuffix = `](${url})`;
    } else if (!insertion) {
      insertion = "texto";
    }

    const newText = before + finalPrefix + insertion + finalSuffix + after;
    handleUpdateBlock(blockId, newText);

    requestAnimationFrame(() => {
      const updatedTextarea = document.getElementById(`textarea-${blockId}`) as HTMLTextAreaElement;
      if (updatedTextarea) {
        updatedTextarea.focus();
        const newStart = start + finalPrefix.length;
        const newEnd = newStart + insertion.length;
        updatedTextarea.setSelectionRange(newStart, newEnd);
      }
    });
  };

  const handleSaveSignal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSignal) return;
    setIsSaving(true);
    try {
      const finalSlug = editingSignal.slug || createSlug(editingSignal.title);
      await storage.save('signals', { ...editingSignal, slug: finalSlug });
      setEditingSignal(null);
      fetchData();
    } finally { setIsSaving(false); }
  };

  const handleDeleteWork = async (id: string) => {
    if (!confirm('eliminar esta matéria permanentemente?')) return;
    await storage.delete('works', id);
    setEditingWork(null);
    fetchData();
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      await storage.save('about', profile);
      fetchData();
      alert('perfil salvo.');
    } finally { setIsSaving(false); }
  };

  const handleSaveConnect = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      await storage.save('about', connect);
      fetchData();
      alert('configurações salvas.');
    } finally { setIsSaving(false); }
  };

  const handleAddLink = () => {
    setConnect({
      ...connect,
      links: [...connect.links, { id: Date.now().toString(), label: '', url: '' }]
    });
  };

  const handleRemoveLink = (id: string) => {
    setConnect({
      ...connect,
      links: connect.links.filter(l => l.id !== id)
    });
  };

  const handleUpdateLink = (id: string, field: 'label' | 'url', value: string) => {
    setConnect({
      ...connect,
      links: connect.links.map(l => l.id === id ? { ...l, [field]: value } : l)
    });
  };

  const countWords = (text: string) => {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  };

  const tabs = [ViewState.MATERIA, ViewState.SINAIS, ViewState.ABOUT, ViewState.CONNECT, 'sincronizar'];

  const featuredWorks = works.filter(w => w.isFeatured).sort((a, b) => (a.featuredOrder ?? 999) - (b.featuredOrder ?? 999));

  return (
    <div className="min-h-screen bg-[#050505] text-white font-mono p-4 md:p-8 pt-24 selection:bg-[var(--accent)] selection:text-black">
      <header className="flex justify-between items-center mb-12 border-b border-white/10 pb-8 max-w-6xl mx-auto">
        <h1 className="text-xl font-electrolize text-[var(--accent)] lowercase">fluxo /// painel de gestão</h1>
        <button onClick={onLogout} className="text-[10px] opacity-50 hover:opacity-100 border border-white/20 px-4 py-2 rounded-full transition-all lowercase">encerrar sessão</button>
      </header>

      <div className="flex gap-6 mb-12 overflow-x-auto no-scrollbar max-w-6xl mx-auto">
        {tabs.map(tab => (
          <button 
            key={tab}
            onClick={() => { setActiveTab(tab as any); setEditingWork(null); setEditingSignal(null); setIsPreviewMode(false); setExportCode(''); fetchData(); }}
            className={`text-xs uppercase tracking-[0.3em] pb-2 border-b-2 transition-all ${activeTab === tab ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-transparent opacity-30 hover:opacity-100'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="max-w-6xl mx-auto">
        {activeTab === ViewState.MATERIA && (
          <div className="space-y-12">
            {!editingWork ? (
              <>
                {/* Seção de Ordenação de Destaques */}
                {featuredWorks.length > 0 && (
                  <section className="bg-white/5 p-6 rounded-2xl border border-white/10 animate-in fade-in">
                    <header className="mb-6 flex justify-between items-center">
                      <div className="space-y-1">
                        <h3 className="text-sm font-electrolize text-[var(--accent)] uppercase tracking-widest">Organizar Destaques (Home)</h3>
                        <p className="text-[10px] opacity-40 lowercase">As primeiras 2 obras desta lista aparecem na página inicial.</p>
                      </div>
                    </header>
                    <div className="space-y-2">
                      {featuredWorks.map((w, i) => (
                        <div key={w.id} className="flex items-center gap-4 bg-black/40 p-3 rounded-lg border border-white/5 group">
                          <div className="font-vt text-lg opacity-30 w-8">{i + 1}º</div>
                          <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0">
                            <img src={w.imageUrl} className="w-full h-full object-cover" alt={w.title} />
                          </div>
                          <div className="flex-grow truncate">
                            <span className="text-xs">{w.title}</span>
                          </div>
                          <div className="flex gap-1">
                            <button 
                              disabled={i === 0 || isSaving}
                              onClick={() => handleMoveFeatured(w, 'up')}
                              className="w-8 h-8 flex items-center justify-center rounded border border-white/10 hover:bg-white/5 disabled:opacity-20 transition-all"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 15l-6-6-6 6"/></svg>
                            </button>
                            <button 
                              disabled={i === featuredWorks.length - 1 || isSaving}
                              onClick={() => handleMoveFeatured(w, 'down')}
                              className="w-8 h-8 flex items-center justify-center rounded border border-white/10 hover:bg-white/5 disabled:opacity-20 transition-all"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                <div className="space-y-6">
                  <div className="flex justify-between items-center mb-8">
                    <p className="text-[10px] opacity-40 uppercase tracking-widest">{works.length} matérias registradas</p>
                    <NeobrutalistButton variant="matrix" onClick={handleCreateNewWork} className="text-xs py-2 px-6">nova matéria</NeobrutalistButton>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {works.map(w => (
                      <div key={w.id} onClick={() => { setEditingWork(w); isWorkSlugPristine.current = false; }} className="bg-white/5 border border-white/5 p-4 rounded-xl cursor-pointer hover:border-[var(--accent)]/30 transition-all group">
                        <div className="aspect-square bg-neutral-900 rounded-md overflow-hidden mb-4 relative">
                          <img src={w.imageUrl || 'https://via.placeholder.com/300'} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={w.title} />
                          {w.isFeatured && (
                            <div className="absolute top-2 right-2 bg-[var(--accent)] text-black text-[8px] uppercase font-bold px-2 py-1 rounded">Destaque</div>
                          )}
                        </div>
                        <h4 className="text-sm truncate">{w.title || 'sem título'}</h4>
                        <p className="text-[9px] opacity-30 mt-1 uppercase tracking-widest">{w.year}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <form onSubmit={handleSaveWork} className="animate-in slide-in-from-bottom-4 pb-32">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  
                  {/* Lado Esquerdo: Imagem e Preview */}
                  <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white/5 p-6 rounded-xl border border-white/10 space-y-4">
                      <label className="text-[10px] opacity-40 uppercase tracking-widest block">preview da imagem</label>
                      <div 
                        className="aspect-square bg-black border-2 border-dashed border-white/10 rounded-2xl flex items-center justify-center overflow-hidden relative group cursor-pointer transition-all hover:border-[var(--accent)]/50"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {editingWork.imageUrl ? (
                          <img src={editingWork.imageUrl} className={`w-full h-full object-cover transition-opacity duration-500 ${isProcessingImage ? 'opacity-30' : 'opacity-100'}`} alt="preview" />
                        ) : (
                          <div className="text-center opacity-20 group-hover:opacity-100 transition-opacity">
                            <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                            <span className="text-[10px] uppercase tracking-widest">clique ou arraste o ficheiro</span>
                          </div>
                        )}
                        {isProcessingImage && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          onChange={handleFileUpload} 
                          accept="image/*" 
                          className="hidden" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] opacity-40 uppercase tracking-widest block">url da imagem (opcional)</label>
                        <input type="text" value={editingWork.imageUrl} onChange={e => setEditingWork({...editingWork, imageUrl: e.target.value})} className="w-full bg-black border border-white/10 p-3 rounded-md outline-none text-[10px] focus:border-[var(--accent)] font-mono" placeholder="https://..." />
                      </div>
                    </div>

                    <div className="bg-white/5 p-6 rounded-xl border border-white/10 space-y-4">
                       <header className="border-b border-white/10 pb-2">
                         <h3 className="text-[10px] text-[var(--accent)] tracking-[0.3em] uppercase font-bold">SEO & Marketing</h3>
                       </header>
                       <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-[9px] opacity-40 uppercase tracking-widest block">meta description (resumo google)</label>
                            <textarea 
                              value={editingWork.seoDescription || ''} 
                              onChange={e => setEditingWork({...editingWork, seoDescription: e.target.value.substring(0, 160)})} 
                              className="w-full bg-black border border-white/10 p-3 h-24 rounded-md outline-none text-xs resize-none focus:border-[var(--accent)]" 
                              placeholder="resumo para aparecer no google (160 caracteres)..." 
                            />
                            <div className="flex justify-end">
                               <span className={`text-[9px] font-mono ${ (editingWork.seoDescription?.length || 0) > 150 ? 'text-yellow-500' : 'opacity-30'}`}>
                                 {editingWork.seoDescription?.length || 0}/160
                               </span>
                            </div>
                          </div>
                       </div>
                    </div>
                  </div>

                  {/* Lado Direito: Dados e Metadados */}
                  <div className="lg:col-span-7 space-y-6">
                    <div className="bg-white/5 p-8 rounded-xl border border-white/10 space-y-8">
                       <header className="border-b border-white/10 pb-4">
                         <h3 className="text-[10px] text-[var(--accent)] tracking-[0.3em] uppercase font-bold">informação & contexto</h3>
                       </header>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[9px] opacity-40 uppercase tracking-widest block">título da obra</label>
                            <input type="text" value={editingWork.title} onChange={e => handleWorkTitleChange(e.target.value)} className="w-full bg-black border border-white/10 p-4 rounded-md outline-none text-xl focus:border-[var(--accent)]" placeholder="título" required />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[9px] opacity-40 uppercase tracking-widest block">slug (url amigável)</label>
                            <input type="text" value={editingWork.slug || ''} onChange={e => { isWorkSlugPristine.current = false; setEditingWork({...editingWork, slug: createSlug(e.target.value)})}} className="w-full bg-black border border-white/10 p-4 rounded-md outline-none text-sm focus:border-[var(--accent)] text-[var(--accent)]" placeholder="slug-da-obra" />
                          </div>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-2">
                            <label className="text-[9px] opacity-40 uppercase tracking-widest block">data (mês/ano)</label>
                            <input 
                              type="month" 
                              value={`${editingWork.year}-${editingWork.month}`} 
                              onChange={handleWorkMonthYearChange} 
                              className="w-full bg-black border border-white/10 p-3 rounded-md outline-none text-sm focus:border-[var(--accent)] [color-scheme:dark]" 
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[9px] opacity-40 uppercase tracking-widest block">técnica / meio</label>
                            <input type="text" value={editingWork.technique} onChange={e => setEditingWork({...editingWork, technique: e.target.value})} className="w-full bg-black border border-white/10 p-3 rounded-md outline-none text-sm focus:border-[var(--accent)]" placeholder="ex: acrílica sobre tela" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[9px] opacity-40 uppercase tracking-widest block">dimensões (opcional)</label>
                            <input type="text" value={editingWork.dimensions} onChange={e => setEditingWork({...editingWork, dimensions: e.target.value})} className="w-full bg-black border border-white/10 p-3 rounded-md outline-none text-sm focus:border-[var(--accent)]" placeholder="ex: 80x60 cm" />
                          </div>
                       </div>

                       <div className="space-y-4">
                          <label className="text-[9px] opacity-40 uppercase tracking-widest block">visibilidade & destaque</label>
                          <div className="flex gap-6">
                            <label className="flex items-center gap-2 cursor-pointer group">
                               <input type="checkbox" checked={editingWork.isVisible} onChange={e => setEditingWork({...editingWork, isVisible: e.target.checked})} className="w-4 h-4 accent-[var(--accent)]" />
                               <span className="text-xs opacity-60 group-hover:opacity-100">Visível no site</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group">
                               <input type="checkbox" checked={editingWork.isFeatured} onChange={e => setEditingWork({...editingWork, isFeatured: e.target.checked})} className="w-4 h-4 accent-[var(--accent)]" />
                               <span className="text-xs opacity-60 group-hover:opacity-100">Destaque na Home</span>
                            </label>
                          </div>
                       </div>

                       <div className="space-y-2">
                          <label className="text-[9px] opacity-40 uppercase tracking-widest block">descrição da obra</label>
                          <textarea 
                            value={editingWork.description || ''} 
                            onChange={e => setEditingWork({...editingWork, description: e.target.value})} 
                            className="w-full bg-black border border-white/10 p-4 h-48 rounded-md outline-none text-sm focus:border-[var(--accent)] resize-none leading-relaxed" 
                            placeholder="escreva sobre o processo, conceito ou história..." 
                          />
                       </div>

                       <div className="flex gap-4 pt-6 border-t border-white/5">
                          <NeobrutalistButton variant="matrix" type="submit" className="flex-grow py-4 text-sm uppercase tracking-widest">salvar matéria</NeobrutalistButton>
                          <button type="button" onClick={() => setEditingWork(null)} className="px-10 border border-white/20 rounded-full text-[10px] uppercase tracking-widest opacity-60 hover:opacity-100 transition-all">cancelar</button>
                          <button type="button" onClick={() => handleDeleteWork(editingWork.id)} className="px-4 text-red-500/40 hover:text-red-500 transition-colors">
                             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path></svg>
                          </button>
                       </div>
                    </div>
                  </div>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Manteve as outras abas inalteradas */}
        {activeTab === ViewState.SINAIS && (
          <div className="space-y-6">
            {!editingSignal ? (
              <>
                <div className="flex justify-between items-center mb-8">
                  <p className="text-[10px] opacity-40 uppercase tracking-widest">{signals.length} transmissões registradas</p>
                  <NeobrutalistButton variant="matrix" onClick={handleCreateNewSignal} className="text-xs py-2 px-6">novo sinal</NeobrutalistButton>
                </div>
                <div className="space-y-4">
                  {signals.map(s => (
                    <div key={s.id} onClick={() => { setEditingSignal(s); isSlugPristine.current = false; }} className="p-6 bg-white/5 border border-white/5 rounded-xl cursor-pointer hover:border-[var(--accent)]/30 transition-all flex justify-between items-center group">
                      <div className="flex items-center gap-4">
                        {s.coverImageUrl && <img src={s.coverImageUrl} className="w-12 h-12 rounded object-cover border border-white/10" />}
                        <div>
                          <h4 className="text-lg group-hover:text-[var(--accent)]">{s.title || 'sem título'}</h4>
                          <p className="text-[10px] opacity-40">/{s.slug || '...'}/</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`text-[9px] uppercase tracking-widest px-2 py-1 rounded border ${s.status === 'publicado' ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-white/20 opacity-30'}`}>{s.status}</span>
                        <span className="text-[10px] opacity-30">{s.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <form onSubmit={handleSaveSignal} className="animate-in fade-in duration-500 pb-24">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  
                  {/* Editor Principal */}
                  <div className="lg:col-span-8 space-y-6">
                    <div className="bg-white/5 p-8 rounded-xl border border-white/10 space-y-6">
                      <div className="flex justify-between items-center border-b border-white/5 pb-4">
                        <span className="text-[10px] text-[var(--accent)] tracking-widest uppercase font-bold">conteúdo da transmissão</span>
                        <div className="flex gap-4">
                           <button type="button" onClick={() => setIsPreviewMode(!isPreviewMode)} className={`text-[10px] border px-4 py-1.5 rounded-full transition-all ${isPreviewMode ? 'bg-[var(--accent)] text-black border-[var(--accent)]' : 'opacity-60 border-white/20 hover:border-white'}`}>
                             {isPreviewMode ? 'editar' : 'visualizar'}
                           </button>
                        </div>
                      </div>

                      {!isPreviewMode ? (
                        <>
                          <input type="text" value={editingSignal.title} onChange={e => {
                            if (!editingSignal) return;
                            const val = e.target.value;
                            const updates: Partial<Signal> = { title: val };
                            if (isSlugPristine.current) updates.slug = createSlug(val);
                            setEditingSignal({ ...editingSignal, ...updates });
                          }} className="w-full bg-transparent border-none outline-none text-4xl font-electrolize placeholder:opacity-20 lowercase" placeholder="título da transmissão" required />
                          <textarea 
                            value={editingSignal.subtitle || ''} 
                            onChange={e => setEditingSignal({...editingSignal, subtitle: e.target.value})} 
                            className="w-full bg-transparent border-none outline-none text-sm opacity-60 italic resize-none h-12" 
                            placeholder="subtítulo ou introdução curta..."
                          />

                          <div className="bg-black/40 p-6 md:p-10 space-y-10 rounded-xl mt-8 border border-white/5">
                            {editingSignal.blocks.map((block, index) => (
                              <div key={block.id} className="group relative">
                                <div className="absolute -left-12 top-0 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                   <button type="button" onClick={() => { const b = [...editingSignal.blocks]; b.splice(index, 1); setEditingSignal({...editingSignal, blocks: b})}} className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">×</button>
                                </div>
                                {block.type === 'text' && (
                                  <div className="space-y-3 relative">
                                    <div className="flex flex-wrap gap-1 p-1 bg-white/5 rounded border border-white/10 w-fit">
                                      <button type="button" onClick={() => applyFormatting(block.id, '**', '**')} className="p-1 px-2 text-[10px] hover:bg-white/10 rounded font-bold" title="negrito">B</button>
                                      <button type="button" onClick={() => applyFormatting(block.id, '*', '*')} className="p-1 px-2 text-[10px] hover:bg-white/10 rounded italic" title="itálico">I</button>
                                      <button type="button" onClick={() => applyFormatting(block.id, '~~', '~~')} className="p-1 px-2 text-[10px] hover:bg-white/10 rounded line-through" title="tachado">S</button>
                                      <button type="button" onClick={() => applyFormatting(block.id, '# ', '')} className="p-1 px-2 text-[10px] hover:bg-white/10 rounded uppercase" title="título 1">H1</button>
                                      <button type="button" onClick={() => applyFormatting(block.id, '## ', '')} className="p-1 px-2 text-[10px] hover:bg-white/10 rounded uppercase" title="título 2">H2</button>
                                      <button type="button" onClick={() => applyFormatting(block.id, '### ', '')} className="p-1 px-2 text-[10px] hover:bg-white/10 rounded uppercase" title="título 3">H3</button>
                                      <button type="button" onClick={() => applyFormatting(block.id, '[', ']')} className="p-1 px-2 text-[10px] hover:bg-white/10 rounded lowercase" title="link">link</button>
                                    </div>
                                    <textarea id={`textarea-${block.id}`} value={block.content} onChange={e => handleUpdateBlock(block.id, e.target.value)} className="w-full bg-transparent border-none outline-none text-lg leading-relaxed min-h-[150px] resize-none placeholder:opacity-10 lowercase" placeholder="escreva seu sinal..." onInput={e => { e.currentTarget.style.height = 'auto'; e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px'; }} />
                                  </div>
                                )}
                                {block.type === 'image' && (
                                  <div className="bg-white/5 p-6 rounded-md border border-white/10 flex flex-col md:flex-row gap-4">
                                     <div className="flex-grow space-y-1">
                                        <label className="text-[8px] opacity-30 uppercase">link da imagem</label>
                                        <input type="text" value={block.content} onChange={e => handleUpdateBlock(block.id, e.target.value, block.caption)} className="w-full bg-black border border-white/10 p-3 rounded text-xs" placeholder="https://..." />
                                     </div>
                                     <div className="w-full md:w-1/3 space-y-1">
                                        <label className="text-[8px] opacity-30 uppercase">legenda</label>
                                        <input type="text" value={block.caption || ''} onChange={e => handleUpdateBlock(block.id, block.content, e.target.value)} className="w-full bg-transparent border-b border-white/10 p-2 text-[10px] outline-none" placeholder="opcional..." />
                                     </div>
                                  </div>
                                )}
                                {block.type === 'embed' && (
                                  <div className="bg-white/5 p-6 rounded-md border border-white/10 space-y-3">
                                    <label className="text-[8px] opacity-30 uppercase">link embedded / código iframe</label>
                                    <textarea 
                                      value={block.content} 
                                      onChange={e => handleUpdateBlock(block.id, e.target.value)} 
                                      className="w-full bg-black border border-white/10 p-3 rounded text-xs min-h-[80px] font-mono" 
                                      placeholder="link spotify, youtube ou <iframe />"
                                    />
                                  </div>
                                )}
                              </div>
                            ))}
                            <div className="flex flex-wrap justify-center gap-4 pt-10 border-t border-white/5">
                              <button type="button" onClick={() => handleAddBlock('text')} className="text-[10px] border border-white/10 px-6 py-2 rounded-full hover:bg-[var(--accent)] hover:text-black hover:border-[var(--accent)] transition-all uppercase tracking-widest">+ texto</button>
                              <button type="button" onClick={() => handleAddBlock('image')} className="text-[10px] border border-white/10 px-6 py-2 rounded-full hover:bg-[var(--accent)] hover:text-black hover:border-[var(--accent)] transition-all uppercase tracking-widest">+ imagem</button>
                              <button type="button" onClick={() => handleAddBlock('embed')} className="text-[10px] border border-white/10 px-6 py-2 rounded-full hover:bg-[var(--accent)] hover:text-black hover:border-[var(--accent)] transition-all uppercase tracking-widest">+ embed</button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="max-w-4xl mx-auto py-10 bg-black/20 rounded-xl p-8">
                          <SignalRenderer signal={editingSignal} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sidebar de Configurações do Sinal */}
                  <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white/5 p-6 rounded-xl border border-white/10 space-y-8">
                       <header className="border-b border-white/10 pb-4">
                         <h3 className="text-[10px] text-[var(--accent)] tracking-[0.3em] uppercase font-bold">configurações do sinal</h3>
                       </header>

                       <div className="space-y-4">
                          <div className="space-y-2">
                             <label className="text-[9px] opacity-40 uppercase tracking-widest">status da transmissão</label>
                             <select 
                               value={editingSignal.status} 
                               onChange={e => setEditingSignal({...editingSignal, status: e.target.value as any})} 
                               className="w-full bg-black border border-white/10 p-3 rounded text-xs outline-none focus:border-[var(--accent)]"
                             >
                                <option value="rascunho">rascunho (oculto)</option>
                                <option value="publicado">publicado (na rede)</option>
                             </select>
                          </div>

                          <div className="space-y-2">
                             <label className="text-[9px] opacity-40 uppercase tracking-widest">link permanente (slug)</label>
                             <input 
                               type="text" 
                               value={editingSignal.slug || ''} 
                               onChange={e => { isSlugPristine.current = false; setEditingSignal({...editingSignal, slug: createSlug(e.target.value)}); }} 
                               className="w-full bg-black border border-white/10 p-3 rounded text-xs outline-none focus:border-[var(--accent)] text-[var(--accent)]" 
                               placeholder="slug-da-transmissao"
                             />
                          </div>

                          <div className="space-y-2">
                             <label className="text-[9px] opacity-40 uppercase tracking-widest">imagem de capa (hero)</label>
                             <input 
                               type="text" 
                               value={editingSignal.coverImageUrl || ''} 
                               onChange={e => setEditingSignal({...editingSignal, coverImageUrl: e.target.value})} 
                               className="w-full bg-black border border-white/10 p-3 rounded text-xs outline-none focus:border-[var(--accent)]" 
                               placeholder="https://..."
                             />
                          </div>

                          <div className="space-y-2">
                             <label className="text-[9px] opacity-40 uppercase tracking-widest">descrição para redes (seo)</label>
                             <textarea 
                               value={editingSignal.seoDescription || ''} 
                               onChange={e => setEditingSignal({...editingSignal, seoDescription: e.target.value})} 
                               className="w-full bg-black border border-white/10 p-3 rounded text-xs outline-none focus:border-[var(--accent)] h-24 resize-none" 
                               placeholder="resumo curto para compartilhamento..."
                             />
                          </div>
                       </div>

                       <div className="pt-6 border-t border-white/10 space-y-4">
                          <NeobrutalistButton variant="matrix" type="submit" className="w-full py-4 text-sm uppercase tracking-widest">salvar transmissão</NeobrutalistButton>
                          <button type="button" onClick={() => setEditingSignal(null)} className="w-full py-2 border border-white/10 rounded-full text-[10px] uppercase tracking-widest opacity-40 hover:opacity-100">cancelar</button>
                       </div>
                    </div>
                  </div>
                </div>
              </form>
            )}
          </div>
        )}

        {activeTab === ViewState.ABOUT && (
          <form onSubmit={handleSaveProfile} className="space-y-8 animate-in fade-in max-w-4xl mx-auto">
            <header className="border-b border-white/10 pb-4">
               <h2 className="text-sm font-electrolize text-[var(--accent)] tracking-[0.2em] uppercase">gestão de perfil /// esse eu</h2>
            </header>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] opacity-40 uppercase tracking-widest block">imagem de perfil (url)</label>
                <input type="text" value={profile.imageUrl} onChange={e => setProfile({...profile, imageUrl: e.target.value})} className="w-full bg-black border border-white/10 p-4 rounded-md outline-none text-sm focus:border-[var(--accent)]" placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] opacity-40 uppercase tracking-widest block">biografia / manifesto pessoal</label>
                <textarea value={profile.text} onChange={e => setProfile({...profile, text: e.target.value})} className="w-full bg-black border border-white/10 p-8 h-80 outline-none rounded-xl text-lg focus:border-[var(--accent)] resize-none lowercase" placeholder="escreva sobre sua trajetória..." />
              </div>
            </div>
            <NeobrutalistButton variant="matrix" type="submit" className="w-full py-4">salvar perfil</NeobrutalistButton>
          </form>
        )}

        {activeTab === ViewState.CONNECT && (
          <form onSubmit={handleSaveConnect} className="space-y-12 animate-in fade-in max-w-4xl mx-auto">
            <header className="border-b border-white/10 pb-4">
               <h2 className="text-sm font-electrolize text-[var(--accent)] tracking-[0.2em] uppercase">gestão de conexões /// conectar</h2>
            </header>
            <div className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] opacity-40 uppercase tracking-widest block">sinal / e-mail principal</label>
                <input type="email" value={connect.email} onChange={e => setConnect({...connect, email: e.target.value})} className="w-full bg-black border border-white/10 p-4 rounded-md outline-none text-sm focus:border-[var(--accent)]" placeholder="contato@ruidos.com" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] opacity-40 uppercase tracking-widest block">sobre o sistema (terminal)</label>
                <textarea value={connect.sobreText || ''} onChange={e => setConnect({...connect, sobreText: e.target.value})} className="w-full bg-black border border-white/10 p-4 h-32 outline-none rounded-md text-sm focus:border-[var(--accent)] resize-none" placeholder="informações que aparecem no comando 'sobre'..." />
              </div>
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <label className="text-[10px] opacity-40 uppercase tracking-widest">outros links externos</label>
                  <button type="button" onClick={handleAddLink} className="text-[10px] text-[var(--accent)] border border-[var(--accent)]/30 px-4 py-1 rounded hover:bg-[var(--accent)]/10">+ novo link</button>
                </div>
                <div className="space-y-4">
                  {connect.links.map((link) => (
                    <div key={link.id} className="flex gap-4 items-start bg-white/5 p-4 rounded-lg border border-white/5 group">
                      <input type="text" value={link.label} onChange={e => handleUpdateLink(link.id, 'label', e.target.value)} className="w-1/3 bg-black border border-white/10 p-2 rounded text-xs focus:border-[var(--accent)]" placeholder="rótulo (ex: instagram)" />
                      <input type="text" value={link.url} onChange={e => handleUpdateLink(link.id, 'url', e.target.value)} className="flex-grow bg-black border border-white/10 p-2 rounded text-xs focus:border-[var(--accent)]" placeholder="endereço url" />
                      <button type="button" onClick={() => handleRemoveLink(link.id)} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <NeobrutalistButton variant="matrix" type="submit" className="w-full py-4">salvar conexões</NeobrutalistButton>
          </form>
        )}

        {activeTab === 'sincronizar' && (
          <div className="space-y-8 animate-in fade-in max-w-4xl mx-auto text-center py-12">
            <h2 className="font-electrolize text-3xl text-[var(--accent)] lowercase">exportar base de dados</h2>
            <p className="font-mono text-sm opacity-60 lowercase max-w-md mx-auto">extraia o conteúdo atual para persistência manual ou backup no repositório github.</p>
            {!exportCode ? (
              <NeobrutalistButton variant="matrix" onClick={generateExportCode} className="px-12 py-6 text-xl">gerar código de extração</NeobrutalistButton>
            ) : (
              <div className="space-y-6">
                <textarea readOnly value={exportCode} className="w-full h-[300px] bg-black border border-white/10 p-6 rounded-md font-mono text-[10px] text-neutral-400 no-scrollbar" />
                <NeobrutalistButton variant="matrix" onClick={copyToClipboard} className="w-full py-5">copiar código para clipboard</NeobrutalistButton>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageBackoffice;
