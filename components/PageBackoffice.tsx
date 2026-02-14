
import React, { useState, useEffect, useRef } from 'react';
import { storage } from '../lib/storage';
import { Work, Signal, SignalBlock, SignalBlockType, AboutData, ConnectConfig, ViewState } from '../types';
import NeobrutalistButton from './NeobrutalistButton';
import SignalRenderer from './SignalRenderer';

interface PageBackofficeProps {
  onLogout: () => void;
}

const PageBackoffice: React.FC<PageBackofficeProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<ViewState | 'sincronizar'>(ViewState.MATERIA);
  const [works, setWorks] = useState<Work[]>([]);
  const [editingWork, setEditingWork] = useState<Work | null>(null);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [editingSignal, setEditingSignal] = useState<Signal | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [profile, setProfile] = useState<AboutData>({ id: 'profile', text: '', imageUrl: '' });
  const [connect, setConnect] = useState<ConnectConfig>({ id: 'connect_config', email: '', sobreText: '', links: [] });
  const [isSaving, setIsSaving] = useState(false);
  const [exportCode, setExportCode] = useState('');
  
  const isSlugPristine = useRef(true);

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
        connect_config: connect,
        sensor_metrics: { id: 'sensor_metrics', clicks: 0 }
      }
    };

    const code = `import { Work, Signal, AboutData, ConnectConfig, SensorData } from './types';

export const INITIAL_DATA: {
  lastUpdated: number;
  works: Work[];
  signals: Signal[];
  about: {
    profile: AboutData | null;
    connect_config: ConnectConfig | null;
    sensor_metrics: SensorData | null;
  };
} = ${JSON.stringify(data, null, 2)};`;

    setExportCode(code);
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
      blocks: [{ id: `b-${Date.now()}`, type: 'text', content: 'comece a escrever...' }]
    };
    setEditingSignal(newSignal);
    setIsPreviewMode(false);
  };

  const handleTitleChange = (val: string) => {
    if (!editingSignal) return;
    const updates: Partial<Signal> = { title: val };
    if (isSlugPristine.current) updates.slug = createSlug(val);
    setEditingSignal({ ...editingSignal, ...updates });
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
      await storage.save('works', editingWork);
      setEditingWork(null);
      fetchData();
    } finally { setIsSaving(false); }
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
            {tab}
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
                  <NeobrutalistButton variant="matrix" onClick={() => setEditingWork({
                    id: `work-${Date.now()}`, title: 'sem título', year: new Date().getFullYear().toString(),
                    month: (new Date().getMonth() + 1).toString().padStart(2, '0'), technique: 'acrílica',
                    date: new Date().toISOString().split('T')[0], dimensions: '00x00cm', imageUrl: '',
                    status: 'disponível', isVisible: true, views: 0
                  })} className="text-xs py-2 px-6">adicionar_materia</NeobrutalistButton>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {works.map(w => (
                    <div key={w.id} onClick={() => setEditingWork(w)} className="bg-white/5 border border-white/5 p-4 rounded-xl cursor-pointer hover:border-[var(--accent)]/30 transition-all group">
                      <div className="aspect-square bg-neutral-900 rounded-md overflow-hidden mb-4">
                        {w.imageUrl ? <img src={w.imageUrl} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" /> : <div className="w-full h-full flex items-center justify-center opacity-10">void</div>}
                      </div>
                      <h4 className="text-sm truncate">{w.title}</h4>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <form onSubmit={handleSaveWork} className="bg-white/5 p-8 rounded-xl border border-white/10 space-y-6 animate-in slide-in-from-bottom-4">
                <input type="text" value={editingWork.title} onChange={e => setEditingWork({...editingWork, title: e.target.value})} className="w-full bg-black border border-white/10 p-4 rounded-md outline-none text-xl focus:border-[var(--accent)]" placeholder="título" />
                <input type="text" value={editingWork.imageUrl} onChange={e => setEditingWork({...editingWork, imageUrl: e.target.value})} className="w-full bg-black border border-white/10 p-4 rounded-md outline-none text-sm focus:border-[var(--accent)]" placeholder="url da imagem" />
                <div className="flex gap-4">
                  <NeobrutalistButton variant="matrix" type="submit" className="flex-grow">salvar</NeobrutalistButton>
                  <button type="button" onClick={() => setEditingWork(null)} className="px-8 border border-white/10 rounded-full text-xs">voltar</button>
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
                    <div key={s.id} onClick={() => { setEditingSignal(s); isSlugPristine.current = false; setIsPreviewMode(false); }} className="p-6 bg-white/5 border border-white/5 rounded-xl cursor-pointer hover:border-[var(--accent)]/30 transition-all flex justify-between items-center group">
                      <div><h4 className="text-lg group-hover:text-[var(--accent)]">{s.title}</h4><p className="text-[10px] opacity-40">/{s.slug}</p></div>
                      <span className="text-[9px] uppercase tracking-widest border border-white/20 px-2 py-1 rounded opacity-50">{s.status}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <form onSubmit={handleSaveSignal} className="animate-in fade-in duration-500 pb-20">
                <div className="bg-white/5 p-8 rounded-t-2xl border-x border-t border-white/10 space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-[var(--accent)] tracking-widest uppercase">fluxo de emissão</span>
                    <div className="flex gap-4 items-center">
                       <button type="button" onClick={() => setIsPreviewMode(!isPreviewMode)} className={`text-[10px] uppercase border px-3 py-1 rounded transition-all ${isPreviewMode ? 'bg-[var(--accent)] text-black border-[var(--accent)]' : 'border-white/20 opacity-60'}`}>
                         {isPreviewMode ? 'voltar_ao_editor' : 'visualizar_previa'}
                       </button>
                       <select value={editingSignal.status} onChange={e => setEditingSignal({...editingSignal, status: e.target.value as any})} className="bg-black border border-white/20 rounded px-2 py-1 text-[10px] outline-none">
                          <option value="rascunho">rascunho</option><option value="publicado">publicado</option>
                       </select>
                       <button type="button" onClick={() => {if(confirm('apagar sinal?')) { storage.delete('signals', editingSignal.id); setEditingSignal(null); fetchData(); }}} className="text-[10px] text-red-500">excluir()</button>
                    </div>
                  </div>

                  {!isPreviewMode ? (
                    <>
                      <input type="text" value={editingSignal.title} onChange={e => handleTitleChange(e.target.value)} className="w-full bg-transparent border-none outline-none text-4xl md:text-5xl font-electrolize placeholder:opacity-20" placeholder="título..." required />
                      <div className="flex flex-col md:flex-row gap-6 pt-6 border-t border-white/5">
                        <div className="flex-grow space-y-1">
                          <label className="text-[8px] opacity-30 uppercase">slug_url</label>
                          <input type="text" value={editingSignal.slug || ''} onChange={e => { isSlugPristine.current = false; setEditingSignal({...editingSignal, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')}); }} className="bg-white/5 border-b border-white/20 outline-none px-2 py-1 text-[var(--accent)] w-full" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="border-b border-white/10 pb-6">
                      <h1 className="text-4xl md:text-6xl font-electrolize lowercase">{editingSignal.title}</h1>
                      <p className="text-[10px] opacity-40 mt-2 tracking-widest lowercase">prévia ativa /// data: {editingSignal.date}</p>
                    </div>
                  )}
                </div>

                <div className="bg-black/50 border-x border-b border-white/10 p-6 md:p-12 space-y-12 rounded-b-xl min-h-[500px]">
                  {isPreviewMode ? (
                    <div className="max-w-4xl mx-auto">
                      <SignalRenderer signal={editingSignal} />
                    </div>
                  ) : (
                    <>
                      {editingSignal.blocks.map((block, index) => (
                        <div key={block.id} className="group relative">
                          <div className="absolute -left-10 top-0 flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button type="button" onClick={() => handleAddBlock('text', index)} className="hover:text-[var(--accent)]">+</button>
                             <button type="button" onClick={() => { const b = [...editingSignal.blocks]; b.splice(index, 1); setEditingSignal({...editingSignal, blocks: b})}} className="text-red-500">×</button>
                          </div>
                          {block.type === 'text' && (
                            <div className="space-y-4">
                              <div className="flex gap-4 border-b border-white/5 pb-2 opacity-40 group-focus-within:opacity-100 transition-opacity">
                                <button type="button" onClick={() => applyFormatting(block.id, '# ', '')} className="text-[10px] font-bold">H1</button>
                                <button type="button" onClick={() => applyFormatting(block.id, '## ', '')} className="text-[10px] font-bold">H2</button>
                                <button type="button" onClick={() => applyFormatting(block.id, '**', '**')} className="text-[10px] border px-2">B</button>
                                <button type="button" onClick={() => applyFormatting(block.id, '*', '*')} className="text-[10px] border px-2 italic">I</button>
                              </div>
                              <textarea id={`textarea-${block.id}`} value={block.content} onChange={e => handleUpdateBlock(block.id, e.target.value)} className="w-full bg-transparent border-none outline-none text-lg leading-relaxed min-h-[100px] resize-none overflow-hidden" onInput={e => { e.currentTarget.style.height = 'auto'; e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px'; }} />
                            </div>
                          )}
                          {block.type === 'image' && (
                            <div className="bg-white/5 p-6 rounded-md border border-white/10 group-hover:border-[var(--accent)]/30 flex gap-6">
                               <input type="text" value={block.content} onChange={e => handleUpdateBlock(block.id, e.target.value, block.caption)} className="w-full bg-black border border-white/10 p-3 rounded text-xs" placeholder="url da imagem" />
                               <input type="text" value={block.caption || ''} onChange={e => handleUpdateBlock(block.id, block.content, e.target.value)} className="w-full bg-transparent border-b border-white/10 p-2 text-[10px]" placeholder="legenda..." />
                            </div>
                          )}
                          {block.type === 'embed' && (
                            <div className="bg-white/5 p-8 border border-white/10 rounded-md">
                               <input type="text" value={block.content} onChange={e => handleUpdateBlock(block.id, e.target.value)} className="w-full bg-black border border-white/10 p-4 text-sm" placeholder="link spotify/youtube" />
                            </div>
                          )}
                        </div>
                      ))}
                      <div className="flex justify-center gap-6 pt-16">
                        {['text', 'image', 'embed'].map(type => (
                          <button key={type} type="button" onClick={() => handleAddBlock(type as any)} className="text-[10px] border border-white/10 px-4 py-2 rounded-full hover:bg-white/10 uppercase tracking-widest">+{type}</button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-12 flex gap-4 sticky bottom-8 z-50 px-4">
                   <NeobrutalistButton variant="matrix" type="submit" className="flex-grow py-4">{isSaving ? 'sincronizando...' : 'sincronizar_sinal()'}</NeobrutalistButton>
                   <button type="button" onClick={() => setEditingSignal(null)} className="px-10 border border-white/20 bg-black/80 backdrop-blur rounded-full text-xs">cancelar</button>
                </div>
              </form>
            )}
          </div>
        )}

        {activeTab === ViewState.ABOUT && (
          <form onSubmit={handleSaveProfile} className="space-y-8 animate-in fade-in">
            <textarea value={profile.text} onChange={e => setProfile({...profile, text: e.target.value})} className="w-full bg-white/5 border border-white/10 p-8 h-80 outline-none rounded-xl text-lg focus:border-[var(--accent)]" placeholder="manifesto..." />
            <input type="text" value={profile.imageUrl} onChange={e => setProfile({...profile, imageUrl: e.target.value})} className="w-full bg-white/5 border border-white/10 p-4 rounded-md focus:border-[var(--accent)] outline-none" placeholder="url avatar" />
            <NeobrutalistButton variant="matrix" type="submit" className="w-full py-4">sincronizar_perfil</NeobrutalistButton>
          </form>
        )}

        {activeTab === ViewState.CONNECT && (
          <form onSubmit={handleSaveConnect} className="space-y-8 animate-in fade-in max-w-4xl mx-auto">
            <div className="space-y-6">
              <div>
                <label className="text-[10px] opacity-40 uppercase tracking-widest block mb-2">e-mail de contato</label>
                <input type="email" value={connect.email} onChange={e => setConnect({...connect, email: e.target.value})} className="w-full bg-white/5 border border-white/10 p-6 rounded-xl focus:border-[var(--accent)] outline-none text-xl" placeholder="contato@..." />
              </div>
              
              <div>
                <label className="text-[10px] opacity-40 uppercase tracking-widest block mb-2">texto 'sobre' (terminal)</label>
                <input type="text" value={connect.sobreText || ''} onChange={e => setConnect({...connect, sobreText: e.target.value})} className="w-full bg-white/5 border border-white/10 p-6 rounded-xl focus:border-[var(--accent)] outline-none text-sm" placeholder="ruídos atmosféricos // v3.1 // ..." />
              </div>

              <div className="space-y-4 pt-6">
                <div className="flex justify-between items-center">
                   <label className="text-[10px] opacity-40 uppercase tracking-widest block">links externos (terminal 'outros')</label>
                   <button type="button" onClick={handleAddLink} className="text-[10px] text-[var(--accent)] border border-[var(--accent)]/30 px-3 py-1 rounded-full">+ link</button>
                </div>
                
                <div className="space-y-3">
                  {connect.links.map(link => (
                    <div key={link.id} className="flex gap-3 bg-white/5 p-4 rounded-xl border border-white/5 items-center group">
                       <input type="text" value={link.label} onChange={e => handleUpdateLink(link.id, 'label', e.target.value)} className="w-32 bg-black/50 border border-white/10 p-2 rounded text-xs outline-none focus:border-[var(--accent)]" placeholder="rótulo" />
                       <input type="text" value={link.url} onChange={e => handleUpdateLink(link.id, 'url', e.target.value)} className="flex-grow bg-black/50 border border-white/10 p-2 rounded text-xs outline-none focus:border-[var(--accent)]" placeholder="url" />
                       <button type="button" onClick={() => handleRemoveLink(link.id)} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity px-2">×</button>
                    </div>
                  ))}
                  {connect.links.length === 0 && <p className="text-[10px] opacity-20 italic">nenhum link configurado.</p>}
                </div>
              </div>
            </div>
            
            <NeobrutalistButton variant="matrix" type="submit" className="w-full py-4 mt-12">sincronizar_conexao</NeobrutalistButton>
          </form>
        )}

        {activeTab === 'sincronizar' && (
          <div className="space-y-8 animate-in fade-in max-w-4xl mx-auto text-center py-12">
            <header className="space-y-4 mb-12">
               <h2 className="font-electrolize text-3xl text-[var(--accent)] lowercase">sincronização global</h2>
               <p className="font-mono text-sm opacity-60 lowercase leading-relaxed">
                  para tornar as alterações permanentes no github, gere o código abaixo e substitua o conteúdo do arquivo <code className="text-[var(--accent)]">initialData.ts</code>.
               </p>
            </header>

            {!exportCode ? (
              <NeobrutalistButton 
                variant="matrix" 
                onClick={generateExportCode}
                className="px-12 py-6 text-xl"
              >
                gerar_nucleo_de_dados()
              </NeobrutalistButton>
            ) : (
              <div className="space-y-6 animate-in slide-in-from-bottom-4">
                <div className="relative group">
                   <textarea 
                     readOnly
                     value={exportCode}
                     className="w-full h-[400px] bg-black border border-white/10 p-6 rounded-md font-mono text-[10px] text-neutral-400 focus:border-[var(--accent)] outline-none overflow-y-auto"
                   />
                   <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] bg-[var(--accent)] text-black px-2 py-1 rounded">ts code</span>
                   </div>
                </div>
                
                <div className="flex flex-col md:flex-row gap-4">
                  <NeobrutalistButton 
                    variant="matrix" 
                    onClick={copyToClipboard}
                    className="flex-grow py-5"
                  >
                    copiar_nucleo_para_area_de_transferencia()
                  </NeobrutalistButton>
                  <button 
                    onClick={() => setExportCode('')}
                    className="px-8 border border-white/10 rounded-full text-xs uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity"
                  >
                    limpar
                  </button>
                </div>
              </div>
            )}

            <div className="pt-12 border-t border-white/5 mt-12">
               <div className="flex items-center justify-center gap-4 text-[10px] font-mono opacity-20 uppercase tracking-[0.3em]">
                  <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse"></div>
                  pronto para uplink
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PageBackoffice;
