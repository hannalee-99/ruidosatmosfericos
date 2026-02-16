
import React, { useState, useEffect, useRef } from 'react';
import { storage } from '../lib/storage';
import { Work, Signal, SignalBlock, SignalBlockType, AboutData, ConnectConfig, ViewState } from '../types';
import NeobrutalistButton from './NeobrutalistButton';
import SignalRenderer from './SignalRenderer';
import { MONTH_NAMES } from '../constants';

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
  const [exportCode, setExportCode] = useState('');
  
  const isSlugPristine = useRef(true);
  const isWorkSlugPristine = useRef(true);

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

  const generateExportCode = () => {
    const data = {
      lastUpdated: Date.now(),
      works,
      signals,
      about: {
        profile,
        connect_config: connect
      }
    };

    const code = `import { Work, Signal, AboutData, ConnectConfig } from './types';

export const INITIAL_DATA: {
  lastUpdated: number;
  works: Work[];
  signals: Signal[];
  about: {
    profile: AboutData | null;
    connect_config: ConnectConfig | null;
  };
} = ${JSON.stringify(data, null, 2)};`;

    setExportCode(code);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(exportCode);
    alert("código copiado! substitua o conteúdo do arquivo initialData.ts no github.");
  };

  // Função robusta para criar slugs limpos: sem acentos, sem pontos, sem espaços extras
  const createSlug = (text: string) => 
    text.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^\w\s-]/g, '') // Remove tudo que não for letra, número, espaço ou hífen (incluindo pontos)
      .replace(/[\s_-]+/g, '-') // Converte espaços e underscores em hífens
      .replace(/^-+|-+$/g, ''); // Limpa hífens no início e no fim

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
      blocks: [{ id: `b-${Date.now()}`, type: 'text', content: 'comece a escrever...' }]
    };
    setEditingSignal(newSignal);
    setIsPreviewMode(false);
  };

  const handleCreateNewWork = () => {
    isWorkSlugPristine.current = true;
    setEditingWork({
      id: `work-${Date.now()}`, 
      title: '', 
      slug: '',
      year: new Date().getFullYear().toString(),
      month: (new Date().getMonth() + 1).toString().padStart(2, '0'), 
      technique: '',
      date: new Date().toISOString().split('T')[0], 
      dimensions: '', 
      imageUrl: '',
      status: 'disponível', 
      isVisible: true, 
      isFeatured: false,
      views: 0,
      description: ''
    });
  };

  const handleSignalTitleChange = (val: string) => {
    if (!editingSignal) return;
    const updates: Partial<Signal> = { title: val };
    if (isSlugPristine.current) updates.slug = createSlug(val);
    setEditingSignal({ ...editingSignal, ...updates });
  };

  const handleWorkTitleChange = (val: string) => {
    if (!editingWork) return;
    const updates: Partial<Work> = { title: val };
    if (isWorkSlugPristine.current) updates.slug = createSlug(val);
    setEditingWork({ ...editingWork, ...updates });
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

  const handleSaveSignal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSignal) return;
    setIsSaving(true);
    try {
      const finalSlug = editingSignal.slug || createSlug(editingSignal.title);
      const signalToSave = { ...editingSignal, slug: finalSlug };
      await storage.save('signals', signalToSave);
      setEditingSignal(null);
      setIsPreviewMode(false);
      fetchData();
    } finally { setIsSaving(false); }
  };

  const handleSaveWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWork) return;
    setIsSaving(true);
    try {
      const finalSlug = editingWork.slug || createSlug(editingWork.title);
      const workDate = `${editingWork.year}-${editingWork.month.padStart(2, '0')}-01`;
      const finalWork = { ...editingWork, slug: finalSlug, date: workDate };
      await storage.save('works', finalWork);
      setEditingWork(null);
      fetchData();
    } finally { setIsSaving(false); }
  };

  const handleDeleteWork = async (id: string) => {
    if (!confirm('deseja eliminar esta matéria permanentemente?')) return;
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
      alert('perfil sincronizado localmente.');
    } finally { setIsSaving(false); }
  };

  const handleSaveConnect = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      await storage.save('about', connect);
      fetchData();
      alert('conexão sincronizada localmente.');
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

  const applyFormatting = (blockId: string, prefix: string, suffix: string = '') => {
    const textarea = document.getElementById(`textarea-${blockId}`) as HTMLTextAreaElement;
    if (!textarea || !editingSignal) return;
    const start = textarea.selectionStart, end = textarea.selectionEnd, text = textarea.value;
    const selectedText = text.substring(start, end);
    const before = text.substring(0, start), after = text.substring(end);
    const insertion = selectedText || (prefix.startsWith('#') ? "título" : "texto");
    const newText = before + prefix + insertion + suffix + after;
    handleUpdateBlock(blockId, newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + insertion.length);
    }, 10);
  };

  const tabs = [ViewState.MATERIA, ViewState.SINAIS, ViewState.ABOUT, ViewState.CONNECT, 'sincronizar'];

  return (
    <div className="min-h-screen bg-[#050505] text-white font-mono p-4 md:p-8 pt-24 selection:bg-[var(--accent)] selection:text-black">
      <header className="flex justify-between items-center mb-12 border-b border-white/10 pb-8 max-w-6xl mx-auto">
        <h1 className="text-xl font-electrolize text-[var(--accent)]">backoffice /// controle_de_fluxo</h1>
        <button onClick={onLogout} className="text-[10px] opacity-50 hover:opacity-100 border border-white/20 px-4 py-2 rounded-full transition-all">encerrar_sessao()</button>
      </header>

      <div className="flex gap-6 mb-12 overflow-x-auto no-scrollbar max-w-6xl mx-auto">
        {tabs.map(tab => (
          <button 
            key={tab}
            onClick={() => { setActiveTab(tab as any); setEditingWork(null); setEditingSignal(null); setIsPreviewMode(false); setExportCode(''); }}
            className={`text-xs uppercase tracking-[0.3em] pb-2 border-b-2 transition-all ${activeTab === tab ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-transparent opacity-30 hover:opacity-100'}`}
          >
            {tab === 'sincronizar' ? tab : tab}
          </button>
        ))}
      </div>

      <div className="max-w-6xl mx-auto">
        {activeTab === ViewState.MATERIA && (
          <div className="space-y-6">
            {!editingWork ? (
              <>
                <div className="flex justify-between items-center mb-8">
                  <p className="text-[10px] opacity-40 uppercase tracking-widest">{works.length} itens captados</p>
                  <NeobrutalistButton variant="matrix" onClick={handleCreateNewWork} className="text-xs py-2 px-6">adicionar_materia</NeobrutalistButton>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {works.map(w => (
                    <div key={w.id} onClick={() => { setEditingWork(w); isWorkSlugPristine.current = false; }} className="bg-white/5 border border-white/5 p-4 rounded-xl cursor-pointer hover:border-[var(--accent)]/30 transition-all group">
                      <div className="aspect-square bg-neutral-900 rounded-md overflow-hidden mb-4">
                        {w.imageUrl ? <img src={w.imageUrl} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" /> : <div className="w-full h-full flex items-center justify-center opacity-10">void</div>}
                      </div>
                      <h4 className="text-sm truncate">{w.title}</h4>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <form onSubmit={handleSaveWork} className="bg-white/5 p-8 rounded-xl border border-white/10 space-y-8 animate-in slide-in-from-bottom-4 pb-24">
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                   <span className="text-[10px] text-[var(--accent)] tracking-widest uppercase">edição de matéria /// {editingWork.id}</span>
                </div>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[9px] opacity-40 uppercase tracking-widest">título da obra</label>
                      <input type="text" value={editingWork.title} onChange={e => handleWorkTitleChange(e.target.value)} className="w-full bg-black border border-white/10 p-4 rounded-md outline-none text-xl focus:border-[var(--accent)]" placeholder="título" required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] opacity-40 uppercase tracking-widest">slug_url (materia/slug/)</label>
                      <input type="text" value={editingWork.slug || ''} onChange={e => { isWorkSlugPristine.current = false; setEditingWork({...editingWork, slug: createSlug(e.target.value)})}} className="w-full bg-black border border-white/10 p-4 rounded-md outline-none text-sm focus:border-[var(--accent)] text-[var(--accent)]" placeholder="slug-da-obra" />
                    </div>
                  </div>

                  {/* SEÇÃO SEO OBRAS */}
                  <div className="bg-white/[0.02] p-6 rounded-xl border border-white/5 space-y-6">
                    <h5 className="text-[10px] text-[var(--accent)] uppercase tracking-widest border-b border-white/5 pb-3">Marketing Digital & SEO Optimization</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[9px] opacity-60 uppercase tracking-widest">título og (compartilhamento)</label>
                        <input type="text" value={editingWork.seoTitle || ''} onChange={e => setEditingWork({...editingWork, seoTitle: e.target.value})} className="w-full bg-black border border-white/10 p-3 rounded text-xs focus:border-[var(--accent)]" placeholder="ex: Essência na Ionosfera | ruídos atmosféricos" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] opacity-60 uppercase tracking-widest">imagem og (url específica)</label>
                        <input type="text" value={editingWork.seoImage || ''} onChange={e => setEditingWork({...editingWork, seoImage: e.target.value})} className="w-full bg-black border border-white/10 p-3 rounded text-xs focus:border-[var(--accent)]" placeholder="https://... (vazio usa imagem principal)" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] opacity-60 uppercase tracking-widest">descrição meta/og (resumo comercial)</label>
                      <textarea value={editingWork.seoDescription || ''} onChange={e => setEditingWork({...editingWork, seoDescription: e.target.value})} className="w-full bg-black border border-white/10 p-3 rounded text-xs focus:border-[var(--accent)] h-20 resize-none" placeholder="uma frase impactante para captar cliques em redes sociais..." />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] opacity-40 uppercase tracking-widest">url da imagem principal</label>
                    <input type="text" value={editingWork.imageUrl} onChange={e => setEditingWork({...editingWork, imageUrl: e.target.value})} className="w-full bg-black border border-white/10 p-4 rounded-md outline-none text-sm focus:border-[var(--accent)]" placeholder="https://..." required />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[9px] opacity-40 uppercase tracking-widest">técnica</label>
                      <input type="text" value={editingWork.technique} onChange={e => setEditingWork({...editingWork, technique: e.target.value})} className="w-full bg-black border border-white/10 p-4 rounded-md outline-none text-sm" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] opacity-40 uppercase tracking-widest">dimensões</label>
                      <input type="text" value={editingWork.dimensions} onChange={e => setEditingWork({...editingWork, dimensions: e.target.value})} className="w-full bg-black border border-white/10 p-4 rounded-md outline-none text-sm" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <label className="text-[9px] opacity-40 uppercase tracking-widest">ano</label>
                      <input type="text" value={editingWork.year} onChange={e => setEditingWork({...editingWork, year: e.target.value})} className="w-full bg-black border border-white/10 p-4 rounded-md text-sm" />
                    </div>
                    <div className="space-y-2 flex flex-col justify-end pb-2">
                       <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" checked={editingWork.isVisible} onChange={e => setEditingWork({...editingWork, isVisible: e.target.checked})} className="w-4 h-4 accent-[var(--accent)]" />
                          <span className="text-[9px] opacity-40 uppercase tracking-widest">visível no site</span>
                       </label>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-8 sticky bottom-0 bg-[#0a0a0a] py-4 border-t border-white/5">
                  <NeobrutalistButton variant="matrix" type="submit" className="flex-grow">sincronizar_materia()</NeobrutalistButton>
                  <button type="button" onClick={() => setEditingWork(null)} className="px-12 border border-white/10 rounded-full text-xs">voltar</button>
                  <button type="button" onClick={() => handleDeleteWork(editingWork.id)} className="px-4 text-red-500 opacity-50 hover:opacity-100 transition-opacity">excluir</button>
                </div>
              </form>
            )}
          </div>
        )}

        {activeTab === ViewState.SINAIS && (
          <div className="space-y-6">
            {!editingSignal ? (
              <>
                <div className="flex justify-between items-center mb-8">
                  <p className="text-[10px] opacity-40 uppercase tracking-widest">{signals.length} sinais transmitidos</p>
                  <NeobrutalistButton variant="matrix" onClick={handleCreateNewSignal} className="text-xs py-2 px-6">emitir_sinal</NeobrutalistButton>
                </div>
                <div className="space-y-4">
                  {signals.map(s => (
                    <div key={s.id} onClick={() => { setEditingSignal(s); isSlugPristine.current = false; }} className="p-6 bg-white/5 border border-white/5 rounded-xl cursor-pointer hover:border-[var(--accent)]/30 transition-all flex justify-between items-center group">
                      <div><h4 className="text-lg group-hover:text-[var(--accent)]">{s.title}</h4><p className="text-[10px] opacity-40">/{s.slug}/</p></div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <form onSubmit={handleSaveSignal} className="animate-in fade-in duration-500 pb-20">
                <div className="bg-white/5 p-8 rounded-t-2xl border-x border-t border-white/10 space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-[var(--accent)] tracking-widest uppercase">fluxo de emissão</span>
                    <div className="flex gap-4">
                       <button type="button" onClick={() => setIsPreviewMode(!isPreviewMode)} className={`text-[10px] border px-3 py-1 rounded ${isPreviewMode ? 'bg-[var(--accent)] text-black' : 'opacity-60'}`}>prev_view</button>
                       <select value={editingSignal.status} onChange={e => setEditingSignal({...editingSignal, status: e.target.value as any})} className="bg-black border border-white/20 rounded px-2 text-[10px]">
                          <option value="rascunho">rascunho</option><option value="publicado">publicado</option>
                       </select>
                    </div>
                  </div>

                  {!isPreviewMode ? (
                    <>
                      <input type="text" value={editingSignal.title} onChange={e => handleSignalTitleChange(e.target.value)} className="w-full bg-transparent border-none outline-none text-4xl font-electrolize placeholder:opacity-20" placeholder="título..." required />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-white/5">
                        <div className="space-y-1">
                          <label className="text-[8px] opacity-30 uppercase">slug_url (sinais/slug/)</label>
                          <input type="text" value={editingSignal.slug || ''} onChange={e => { isSlugPristine.current = false; setEditingSignal({...editingSignal, slug: createSlug(e.target.value)}); }} className="bg-white/5 border-b border-white/20 outline-none px-2 py-1 text-[var(--accent)] w-full text-xs" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] opacity-30 uppercase">resumo curto</label>
                          <input type="text" value={editingSignal.subtitle || ''} onChange={e => setEditingSignal({...editingSignal, subtitle: e.target.value})} className="bg-white/5 border-b border-white/20 outline-none px-2 py-1 w-full text-xs" />
                        </div>
                      </div>

                      {/* SEÇÃO SEO SINAIS */}
                      <div className="bg-white/[0.02] p-6 rounded-xl border border-white/5 space-y-6 mt-6">
                        <h5 className="text-[10px] text-[var(--accent)] uppercase tracking-widest border-b border-white/5 pb-3">Marketing Digital & SEO Optimization</h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-1">
                            <label className="text-[8px] text-[var(--accent)] uppercase">título og</label>
                            <input type="text" value={editingSignal.seoTitle || ''} onChange={e => setEditingSignal({...editingSignal, seoTitle: e.target.value})} className="bg-black border border-white/10 p-2 rounded text-[10px] w-full focus:border-[var(--accent)]" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] text-[var(--accent)] uppercase">descrição og</label>
                            <input type="text" value={editingSignal.seoDescription || ''} onChange={e => setEditingSignal({...editingSignal, seoDescription: e.target.value})} className="bg-black border border-white/10 p-2 rounded text-[10px] w-full focus:border-[var(--accent)]" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] text-[var(--accent)] uppercase">imagem og url</label>
                            <input type="text" value={editingSignal.seoImage || ''} onChange={e => setEditingSignal({...editingSignal, seoImage: e.target.value})} className="bg-black border border-white/10 p-2 rounded text-[10px] w-full focus:border-[var(--accent)]" />
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="border-b border-white/10 pb-6">
                      <h1 className="text-4xl font-electrolize">{editingSignal.title}</h1>
                    </div>
                  )}
                </div>

                <div className="bg-black/50 border-x border-b border-white/10 p-6 md:p-12 space-y-12 rounded-b-xl min-h-[500px]">
                  {isPreviewMode ? (
                    <div className="max-w-4xl mx-auto"><SignalRenderer signal={editingSignal} /></div>
                  ) : (
                    <>
                      {editingSignal.blocks.map((block, index) => (
                        <div key={block.id} className="group relative">
                          <div className="absolute -left-10 top-0 flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button type="button" onClick={() => { const b = [...editingSignal.blocks]; b.splice(index, 1); setEditingSignal({...editingSignal, blocks: b})}} className="text-red-500">×</button>
                          </div>
                          {block.type === 'text' && (
                            <div className="space-y-4">
                              <textarea id={`textarea-${block.id}`} value={block.content} onChange={e => handleUpdateBlock(block.id, e.target.value)} className="w-full bg-transparent border-none outline-none text-lg leading-relaxed min-h-[100px] resize-none overflow-hidden" onInput={e => { e.currentTarget.style.height = 'auto'; e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px'; }} />
                            </div>
                          )}
                          {block.type === 'image' && (
                            <div className="bg-white/5 p-6 rounded-md border border-white/10 flex gap-6">
                               <input type="text" value={block.content} onChange={e => handleUpdateBlock(block.id, e.target.value, block.caption)} className="w-full bg-black border border-white/10 p-3 rounded text-xs" placeholder="url da imagem" />
                               <input type="text" value={block.caption || ''} onChange={e => handleUpdateBlock(block.id, block.content, e.target.value)} className="w-full bg-transparent border-b border-white/10 p-2 text-[10px]" placeholder="legenda..." />
                            </div>
                          )}
                        </div>
                      ))}
                      <div className="flex justify-center gap-6 pt-16">
                        {['text', 'image'].map(type => (
                          <button key={type} type="button" onClick={() => handleAddBlock(type as any)} className="text-[10px] border border-white/10 px-4 py-2 rounded-full hover:bg-white/10 uppercase tracking-widest">+{type}</button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-12 flex gap-4 sticky bottom-8 z-50 px-4">
                   <NeobrutalistButton variant="matrix" type="submit" className="flex-grow py-4">sincronizar_sinal()</NeobrutalistButton>
                   <button type="button" onClick={() => setEditingSignal(null)} className="px-10 border border-white/20 bg-black/80 backdrop-blur rounded-full text-xs">cancelar</button>
                </div>
              </form>
            )}
          </div>
        )}

        {activeTab === ViewState.ABOUT && (
          <form onSubmit={handleSaveProfile} className="space-y-8 animate-in fade-in max-w-4xl mx-auto">
            <div className="space-y-6">
              <div>
                <label className="text-[10px] opacity-40 uppercase tracking-widest block mb-2">manifesto / biografia</label>
                <textarea value={profile.text} onChange={e => setProfile({...profile, text: e.target.value})} className="w-full bg-white/5 border border-white/10 p-8 h-80 outline-none rounded-xl text-lg focus:border-[var(--accent)] resize-none" placeholder="manifesto..." />
              </div>
            </div>
            <NeobrutalistButton variant="matrix" type="submit" className="w-full py-4">sincronizar_perfil</NeobrutalistButton>
          </form>
        )}

        {activeTab === 'sincronizar' && (
          <div className="space-y-8 animate-in fade-in max-w-4xl mx-auto text-center py-12">
            <header className="space-y-4 mb-12">
               <h2 className="font-electrolize text-3xl text-[var(--accent)] lowercase">sincronização global</h2>
               <p className="font-mono text-sm opacity-60 lowercase leading-relaxed">gere o código e substitua no arquivo initialData.ts</p>
            </header>

            {!exportCode ? (
              <NeobrutalistButton variant="matrix" onClick={generateExportCode} className="px-12 py-6 text-xl">gerar_nucleo_de_dados()</NeobrutalistButton>
            ) : (
              <div className="space-y-6">
                <textarea readOnly value={exportCode} className="w-full h-[300px] bg-black border border-white/10 p-6 rounded-md font-mono text-[10px] text-neutral-400" />
                <NeobrutalistButton variant="matrix" onClick={copyToClipboard} className="w-full py-5">copiar_nucleo()</NeobrutalistButton>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageBackoffice;
