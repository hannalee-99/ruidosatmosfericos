
import React, { useState, useEffect, useRef, useMemo } from 'react';
import mixpanel from 'mixpanel-browser';
import { storage } from '../lib/storage';
import { Work, Signal, SignalBlock, SignalBlockType, AboutData, ConnectConfig, ViewState, ManifestoConfig, EcosConfig, EcoLink, SeoConfig } from '../types';
import { DEFAULT_LAYERS as OFFICIAL_LAYERS } from './PageManifestoV2';
import NeobrutalistButton from './NeobrutalistButton';
import SignalRenderer from './SignalRenderer';
import Toast from './Toast';
import { useMeta } from '../lib/hooks';

interface PageBackofficeProps {
  onLogout: () => void;
}

const getTemplateQuestions = (): string[] => {
  try {
    const saved = localStorage.getItem('custom_metadata_questions');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Erro ao ler custom_metadata_questions', e);
  }
  return ['ouvindo', 'humor', 'lugar', 'clima', 'suporte'];
};

const PageBackoffice: React.FC<PageBackofficeProps> = ({ onLogout }) => {
  const { updateMeta } = useMeta();
  const [activeTab, setActiveTab] = useState<ViewState | 'sincronizar' | 'questions' | 'seo'>(ViewState.LANDING);
  const [customQuestions, setCustomQuestions] = useState<string[]>([]);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [works, setWorks] = useState<Work[]>([]);
  const [editingWork, setEditingWork] = useState<Work | null>(null);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [editingSignal, setEditingSignal] = useState<Signal | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [editorMode, setEditorMode] = useState<'edit' | 'preview' | 'split'>('edit');
  const [syncStatus, setSyncStatus] = useState<'synced' | 'saving' | 'error'>('synced');
  const [testEventStatus, setTestEventStatus] = useState<string>('');
  const [isTestingMixpanel, setIsTestingMixpanel] = useState(false);
  const [profile, setProfile] = useState<AboutData>({ id: 'profile', text: '', imageUrl: '', faviconUrl: '' });
  const [connect, setConnect] = useState<ConnectConfig>({ id: 'connect_config', email: '', sobreText: '', links: [] });
  const [ecosConfig, setEcosConfig] = useState<EcosConfig>({ id: 'ecos_config', links: [] });
  const [ecosSavedSuccess, setEcosSavedSuccess] = useState(false);
  const [seoConfig, setSeoConfig] = useState<SeoConfig>({ id: 'seo_config', title: 'ruídos atmosféricos', description: '', image: '' });
  const [seoSavedSuccess, setSeoSavedSuccess] = useState(false);
  const [manifesto, setManifesto] = useState<ManifestoConfig>({ id: 'landing_manifesto', text: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [exportCode, setExportCode] = useState('');
  const [importCode, setImportCode] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [showToast, setShowToast] = useState<boolean>(false);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
  };
  
  const isSlugPristine = useRef(true);
  const isWorkSlugPristine = useRef(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastSavedSignalRef = useRef<string>('');

  useEffect(() => {
    if (!editingSignal) {
      setIsFocusMode(false);
    }
  }, [editingSignal]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [w, s, p, c, m, ec, seo] = await Promise.all([
      storage.getAll('works'),
      storage.getAll('signals'),
      storage.get('about', 'profile'),
      storage.get('about', 'connect_config'),
      storage.get('about', 'landing_manifesto'),
      storage.get('about', 'ecos_config'),
      storage.get('about', 'seo_config')
    ]);
    setWorks(w.sort((a, b) => b.date.localeCompare(a.date)));
    setSignals(s.sort((a, b) => {
        const dateA = a.date.split('/').reverse().join('-');
        const dateB = b.date.split('/').reverse().join('-');
        return dateB.localeCompare(dateA);
    }));
    if (p) setProfile(p);
    if (c) setConnect(c);
    if (seo) setSeoConfig(seo);
    if (ec) {
      setEcosConfig(ec);
    } else {
      setEcosConfig({
        id: 'ecos_config',
        links: [
          { 
            id: '01', 
            title: 'colab55', 
            description: 'impressões e objetos de ritos',
            url: 'https://www.colab55.com/@ruidosatmosfericos',
            status: 'ativo'
          },
          { 
            id: '02', 
            title: 'pinterest', 
            description: 'fragmentos de processo e ruídos',
            url: 'https://br.pinterest.com/ruidosatmosfericos01/',
            status: 'ativo'
          },
          { 
            id: '03', 
            title: 'redbubble', 
            description: 'suportes e artefatos globais',
            url: 'https://www.redbubble.com/people/rdsatmosfericos/',
            status: 'ativo'
          }
        ]
      });
    }
    if (m) {
      if (!m.layers || m.layers.length === 0) {
        setManifesto({ ...m, layers: OFFICIAL_LAYERS });
      } else {
        setManifesto(m);
      }
    } else {
      // If manifesto doesn't exist in storage yet, initialize with official layers
      setManifesto({ id: 'landing_manifesto', text: '', layers: OFFICIAL_LAYERS });
    }
    setCustomQuestions(getTemplateQuestions());
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
      try {
        const base64 = event.target?.result as string;
        const optimized = await compressAndResizeImage(base64);
        setEditingWork({ ...editingWork, imageUrl: optimized });
        triggerToast('mídia carregada e otimizada');
      } catch (err) {
        console.error(err);
        triggerToast('erro ao processar mídia');
      } finally {
        setIsProcessingImage(false);
      }
    };
    reader.onerror = () => {
      triggerToast('erro ao carregar arquivo de mídia');
      setIsProcessingImage(false);
    };
    reader.readAsDataURL(file);
  };

  const generateExportCode = () => {
    const data = {
      lastUpdated: Date.now(),
      works,
      signals,
      about: { 
        profile, 
        connect_config: connect, 
        landing_manifesto: manifesto, 
        ecos_config: ecosConfig,
        seo_config: seoConfig 
      }
    };

    setExportCode(`import { Work, Signal, AboutData, ConnectConfig, ManifestoConfig, EcosConfig, SeoConfig } from './types';

export const INITIAL_DATA: {
  lastUpdated: number;
  works: Work[];
  signals: Signal[];
  about: {
    profile: AboutData | null;
    connect_config: ConnectConfig | null;
    landing_manifesto: ManifestoConfig | null;
    ecos_config: EcosConfig | null;
    seo_config: SeoConfig | null;
  };
} = ${JSON.stringify(data, null, 2)};`);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(exportCode);
    triggerToast("código copiado! substitua no initialData.ts");
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
      blocks: [{ id: `b-${Date.now()}`, type: 'text', content: 'digite sua mensagem aqui...' }],
      metadata: (customQuestions.length > 0 ? customQuestions : getTemplateQuestions()).map(q => ({
        question: q,
        answer: ''
      }))
    };
    lastSavedSignalRef.current = JSON.stringify(newSignal);
    setEditingSignal(newSignal);
    setEditorMode('edit');
    setIsPreviewMode(false);
  };

  const handleStartEditSignal = (s: Signal) => {
    lastSavedSignalRef.current = JSON.stringify(s);
    setEditingSignal(s);
    setEditorMode('edit');
    setIsPreviewMode(false);
    isSlugPristine.current = false;
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
      triggerToast('matéria e mídias salvas com sucesso');
    } catch (err) {
      console.error(err);
      triggerToast('erro ao atualizar banco de dados da matéria');
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

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    if (!editingSignal) return;
    const newBlocks = [...editingSignal.blocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newBlocks.length) return;
    
    // Swap
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[targetIndex];
    newBlocks[targetIndex] = temp;
    
    setEditingSignal({ ...editingSignal, blocks: newBlocks });
  };

  // Sincronização automática em segundo plano com Debounce (1.2 segundos)
  useEffect(() => {
    if (!editingSignal) {
      setSyncStatus('synced');
      return;
    }

    // Compara se o conteúdo realmente mudou em relação ao último save para evitar loops
    const currentSerialized = JSON.stringify(editingSignal);
    if (lastSavedSignalRef.current === currentSerialized) {
      return;
    }

    setSyncStatus('saving');
    
    const delayDebounce = setTimeout(async () => {
      try {
        const finalSlug = editingSignal.slug || createSlug(editingSignal.title);
        const signalToSave = { ...editingSignal, slug: finalSlug };
        await storage.save('signals', signalToSave);
        lastSavedSignalRef.current = JSON.stringify(signalToSave);
        setSyncStatus('synced');
        
        // Atualiza a lista de sinais em background para manter sincronizado
        const updatedSignals = await storage.getAll('signals');
        setSignals(updatedSignals.sort((a, b) => {
          const dateA = a.date.split('/').reverse().join('-');
          const dateB = b.date.split('/').reverse().join('-');
          return dateB.localeCompare(dateA);
        }));
      } catch (err) {
        console.error('Erro no salvamento automático:', err);
        setSyncStatus('error');
        triggerToast('erro na sincronização automática do sinal');
      }
    }, 1200);

    return () => clearTimeout(delayDebounce);
  }, [editingSignal]);

  // Ajustar altura de todos os textareas automaticamente na montagem ou quando muda o modo
  useEffect(() => {
    if (editingSignal && editorMode !== 'preview') {
      const resizeTextareas = () => {
        editingSignal.blocks.forEach(block => {
          const textarea = document.getElementById(`textarea-${block.id}`) as HTMLTextAreaElement;
          if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
          }
        });
      };
      
      const timer = setTimeout(resizeTextareas, 50);
      return () => clearTimeout(timer);
    }
  }, [editingSignal?.id, editorMode, editingSignal?.blocks.length]);

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
      // Não insere "texto" para br e separador
      if (prefix === '<br/>' || prefix === '\n---\n') {
        insertion = "";
      } else {
        insertion = "texto";
      }
    }

    const newText = before + finalPrefix + insertion + finalSuffix + after;
    const block = editingSignal?.blocks.find(b => b.id === blockId);
    if (block) {
       handleUpdateBlock(blockId, newText);
    }

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
      triggerToast('sinal e mídias salvos com sucesso');
    } catch (err) {
      console.error(err);
      triggerToast('erro ao atualizar banco de dados do sinal');
    } finally { setIsSaving(false); }
  };

  const handleDeleteWork = async (id: string) => {
    if (!confirm('eliminar esta matéria permanentemente?')) return;
    await storage.delete('works', id);
    setEditingWork(null);
    fetchData();
  };

  const handleDeleteSignal = async (id: string) => {
    if (!confirm('eliminar esta transmissão permanentemente?')) return;
    await storage.delete('signals', id);
    setEditingSignal(null);
    fetchData();
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      await storage.save('about', profile);
      fetchData();
      triggerToast('perfil salvo com sucesso');
    } catch (err) {
      console.error(err);
      triggerToast('erro ao atualizar perfil');
    } finally { setIsSaving(false); }
  };

  const handleSaveConnect = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      await storage.save('about', connect);
      fetchData();
      triggerToast('configurações salvas com sucesso');
    } catch (err) {
      console.error(err);
      triggerToast('erro ao salvar conexões');
    } finally { setIsSaving(false); }
  };

  const handleSaveManifesto = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      await storage.save('about', { ...manifesto, isCustomized: true });
      fetchData();
      triggerToast('sistema de manifesto atualizado');
    } catch (err) {
      console.error(err);
      triggerToast('erro ao salvar manifesto');
    } finally { setIsSaving(false); }
  };

  const handleSaveEcos = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      await storage.save('about', ecosConfig);
      fetchData();
      setEcosSavedSuccess(true);
      setTimeout(() => setEcosSavedSuccess(false), 3000);
      triggerToast('links do ecos salvos com sucesso');
    } catch (err) {
      console.error(err);
      triggerToast('erro ao salvar links do ecos');
    } finally { setIsSaving(false); }
  };

  const handleSaveSeo = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      await storage.save('about', seoConfig);

      // Manipulação direta de DOM para atualizar as tags <meta> do index.html em tempo real
      if (typeof document !== 'undefined') {
        const titleVal = seoConfig.title || 'ruídos atmosféricos';
        const descVal = seoConfig.description || '';
        const firstFeaturedWork = works.find(w => w.isFeatured);
        const imageVal = seoConfig.image || (firstFeaturedWork ? firstFeaturedWork.imageUrl : "https://64.media.tumblr.com/2469fc83feaecaf0b7a97fa55f6793d6/670f92e2b0934e32-bb/s2048x3072/3b1cf9f39410af90a8d0607d572f83c0024b2472.jpg");

        // Atualiza título do browser
        document.title = titleVal.toLowerCase();

        // Helper para atualizar ou criar meta tag
        const setMetaTag = (selector: string, attrName: 'name' | 'property', attrValue: string, contentValue: string) => {
          let element = document.querySelector(selector);
          if (!element) {
            element = document.createElement('meta');
            element.setAttribute(attrName, attrValue);
            document.head.appendChild(element);
          }
          element.setAttribute('content', contentValue);
        };

        // Atualização direta das tags no Head
        setMetaTag('meta[name="description"]', 'name', 'description', descVal);
        setMetaTag('meta[property="og:title"]', 'property', 'og:title', titleVal);
        setMetaTag('meta[property="og:description"]', 'property', 'og:description', descVal);
        setMetaTag('meta[property="og:image"]', 'property', 'og:image', imageVal);
        setMetaTag('meta[property="og:url"]', 'property', 'og:url', window.location.origin);
        setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', titleVal);
        setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', descVal);
        setMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', imageVal);
      }

      fetchData();
      setSeoSavedSuccess(true);
      setTimeout(() => setSeoSavedSuccess(false), 3000);
      triggerToast('configuração de SEO salva e atualizada em tempo real');
    } catch (err) {
      console.error(err);
      triggerToast('erro ao salvar configuração de SEO');
    } finally { setIsSaving(false); }
  };

  const handleAddManifestoLayer = () => {
    const newLayer = {
      n: (manifesto.layers?.length || 0) + 1,
      scale: "∅",
      name: "nova camada",
      lines: [[{ t: "nova linha de pensamento" }]]
    };
    setManifesto({
      ...manifesto,
      layers: [...(manifesto.layers || []), newLayer]
    });
  };

  const handleUpdateManifestoLayer = (index: number, updates: any) => {
    const newLayers = [...(manifesto.layers || [])];
    newLayers[index] = { ...newLayers[index], ...updates };
    setManifesto({ ...manifesto, layers: newLayers });
  };

  const handleRemoveManifestoLayer = (index: number) => {
    const newLayers = manifesto.layers?.filter((_, i) => i !== index);
    setManifesto({ ...manifesto, layers: newLayers });
  };

  const handleAddManifestoLine = (layerIndex: number) => {
    const newLayers = [...(manifesto.layers || [])];
    newLayers[layerIndex].lines.push([{ t: "nova linha" }]);
    setManifesto({ ...manifesto, layers: newLayers });
  };

  const handleUpdateManifestoLineSegment = (layerIndex: number, lineIndex: number, segmentIndex: number, text: string, accent: boolean) => {
    const newLayers = [...(manifesto.layers || [])];
    const segment = { t: text };
    if (accent) (segment as any).accent = true;
    newLayers[layerIndex].lines[lineIndex][segmentIndex] = segment;
    setManifesto({ ...manifesto, layers: newLayers });
  };

  const handleAddManifestoSegment = (layerIndex: number, lineIndex: number) => {
    const newLayers = [...(manifesto.layers || [])];
    newLayers[layerIndex].lines[lineIndex].push({ t: " " });
    setManifesto({ ...manifesto, layers: newLayers });
  };

  const handleRemoveManifestoSegment = (layerIndex: number, lineIndex: number, segmentIndex: number) => {
    const newLayers = [...(manifesto.layers || [])];
    newLayers[layerIndex].lines[lineIndex] = newLayers[layerIndex].lines[lineIndex].filter((_: any, i: number) => i !== segmentIndex);
    setManifesto({ ...manifesto, layers: newLayers });
  };

  const handleRemoveManifestoLine = (layerIndex: number, lineIndex: number) => {
    const newLayers = [...(manifesto.layers || [])];
    newLayers[layerIndex].lines = newLayers[layerIndex].lines.filter((_: any, i: number) => i !== lineIndex);
    setManifesto({ ...manifesto, layers: newLayers });
  };

  const handleImportData = async () => {
    if (!importCode.trim()) return;
    setIsImporting(true);
    try {
      let content = importCode.trim();
      
      // Se for o arquivo completo, precisamos pegar o objeto de DADOS, não a definição de TIPOS
      if (content.includes('= {')) {
        // Procuramos o '=' e pegamos o '{' que vem depois dele
        const equalIndex = content.indexOf('=');
        const start = content.indexOf('{', equalIndex);
        const end = content.lastIndexOf('};');
        
        if (start !== -1 && end !== -1) {
          content = content.substring(start, end + 1);
        } else if (start !== -1) {
          content = content.substring(start);
        }
      }

      // Limpeza para tornar o JSON válido
      let cleanJson = content
        .replace(/\/\/.*$/gm, '') // Remove comentários de linha única
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comentários de múltiplas linhas
        .replace(/,\s*([\]}])/g, '$1') // Remove vírgulas antes de ] ou }
        .trim();

      // Se o JSON começar com algo que não seja {, tentamos encontrar o primeiro {
      if (!cleanJson.startsWith('{')) {
        const firstBrace = cleanJson.indexOf('{');
        if (firstBrace !== -1) {
          cleanJson = cleanJson.substring(firstBrace);
        }
      }

      // Tenta converter chaves não aspeadas (comum em JS/TS manual) para JSON válido
      cleanJson = cleanJson.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');

      // Escapa quebras de linha literais dentro de strings (comum em arquivos .ts manuais)
      // O JSON.parse não aceita quebras de linha reais dentro de aspas, apenas \n
      cleanJson = cleanJson.replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, (match) => {
        return match.replace(/\n/g, '\\n').replace(/\r/g, '\\r');
      });
      
      const data = JSON.parse(cleanJson);
      
      if (!data.works || !data.signals || !data.about) {
        throw new Error('formato de dados inválido. certifique-se de colar o conteúdo do initialData.ts ou o json exportado.');
      }

      // Limpa e salva novos dados
      const confirmImport = confirm('isso irá sobrescrever todos os dados locais atuais. continuar?');
      if (!confirmImport) return;

      // Limpeza (opcional, mas recomendada para evitar lixo)
      const currentWorks = await storage.getAll('works');
      const currentSignals = await storage.getAll('signals');
      for (const w of currentWorks) await storage.delete('works', w.id);
      for (const s of currentSignals) await storage.delete('signals', s.id);

      // Salva novos dados
      for (const w of data.works) await storage.save('works', w);
      for (const s of data.signals) await storage.save('signals', s);
      if (data.about.profile) await storage.save('about', data.about.profile);
      if (data.about.connect_config) await storage.save('about', data.about.connect_config);
      if (data.about.landing_manifesto) await storage.save('about', data.about.landing_manifesto);
      if (data.about.ecos_config) await storage.save('about', data.about.ecos_config);
      if (data.about.seo_config) await storage.save('about', data.about.seo_config);

      // Atualiza timestamp de sincronização para evitar que o seed antigo do código rode
      localStorage.setItem('ra_last_sync', (data.lastUpdated || Date.now()).toString());

      alert('dados importados com sucesso! a página será recarregada.');
      window.location.reload();
    } catch (e) {
      console.error(e);
      alert('erro ao importar: ' + (e instanceof Error ? e.message : 'formato inválido'));
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadEventsCsv = () => {
    const csvContent = `Event,Display Name,Description
Page Viewed,Visualização de Página,Disparado quando um usuário visita qualquer página do site.
Artwork Opened,Obra de Arte Aberta,Disparado quando um usuário abre o modal ou visualizador de uma obra de arte na galeria.
Artwork Zoomed,Obra de Arte Ampliada,Disparado quando um usuário utiliza a ferramenta de zoom interativo em uma obra de arte.
Signal Opened,Transmissão de Sinal Aberta,Disparado quando um usuário abre e lê uma transmissão de sinal.
Link Shared,Link Compartilhado,Disparado quando o usuário copia ou compartilha o link de uma obra de arte ou sinal.
Outbound Link Clicked,Link Externo Clicado,Disparado quando o usuário clica em um link de destino fora do site.
Terminal Command Run,Comando do Terminal Executado,Disparado quando o usuário digita e executa com sucesso um comando no terminal.`;
    
    downloadCsvFile('mixpanel_lexicon_events.csv', csvContent);
  };

  const handleDownloadPropertiesCsv = () => {
    const csvContent = `Property,Display Name,Description,Data Type
Page Name,Nome da Página,O nome identificador da seção do site visualizada (ex: landing, materia).,String
Page Path,Caminho da Página,O caminho relativo da página visualizada no navegador (ex: /backoffice).,String
Has Slug,Possui Slug?,Indica se a página visualizada possui um parâmetro de slug na URL.,Boolean
View Slug,Slug da Visualização,O valor do parâmetro slug associado à página visualizada.,String
Artwork Title,Título da Obra de Arte,O título amigável e oficial da obra de arte na galeria.,String
Artwork Slug,Slug da Obra de Arte,O link permanente da obra de arte visualizada.,String
Engagement Type,Tipo de Engajamento,O tipo de interação com os detalhes da obra.,String
Action,Ação Realizada,O tipo de ação executada na interface.,String
Signal Title,Título do Sinal,O título da transmissão de sinal aberta pelo usuário.,String
Signal Slug,Slug do Sinal,O link amigável permanente da transmissão (ex: ruidos-cosmicos).,String
Share Type,Tipo de Compartilhamento,O método utilizado para compartilhar o link (ex: copy, whatsapp, email).,String
Content Identifier,Identificador do Conteúdo,O valor ou título do conteúdo compartilhado pelo usuário.,String
Destination Channel,Canal de Destino,O nome da rede social ou canal de destino do link externo clicado.,String
Destination URL,URL de Destino,O link externo completo clicado pelo usuário.,String
Command Typed,Comando Digitado,O comando de texto exato digitado no terminal interativo.,String
Response Type,Tipo de Resposta,A classificação da resposta do terminal (ex: success, error).,String
Funnel Step,Passo do Funil,O nome unificado do passo dentro do funil de conversão principal.,String
Step Order,Ordem do Passo,O número de ordenação sequencial do passo dentro do funil.,Number
Slug,Slug Associado,O identificador amigável associado à ação do funil.,String
Acquisition Channel,Canal de Aquisição,O canal de marketing ou rede social que trouxe o tráfego do usuário.,String
Referrer URL,Página de Origem,A URL externa de onde o usuário navegou antes de chegar ao site.,String
Screen Width,Largura da Tela,A largura em pixels da janela do navegador.,Number
Screen Height,Altura da Tela,A altura em pixels da janela do navegador.,Number
Device Orientation,Orientação do Dispositivo,A orientação da tela (Landscape/Portrait) no momento do evento.,String`;
    
    downloadCsvFile('mixpanel_lexicon_properties.csv', csvContent);
  };

  const handleDownloadProfilePropertiesCsv = () => {
    const csvContent = `Property,Display Name,Description,Data Type
$created,Data de Criação,A data e hora em que o perfil do usuário foi registrado no site pela primeira vez.,DateTime
$last_seen,Última Visualização,A data e hora da última atividade registrada para este usuário.,DateTime
First Acquisition Channel,Primeiro Canal de Origem,O primeiro canal de marketing ou rede social que trouxe o usuário.,String
First Referrer,Primeira Página de Origem,A URL da página de origem da primeira sessão do usuário.,String
User Language,Idioma do Navegador,O idioma configurado no navegador do usuário (ex: pt-BR).,String
Initial Screen Resolution,Resolução Inicial da Tela,A largura e altura em pixels da tela na primeira sessão do usuário.,String
Current Screen Resolution,Resolução Atual da Tela,A largura e altura em pixels da tela na sessão atual do usuário.,String
Total Page Views,Total de Páginas Visualizadas,O número total de páginas visualizadas pelo usuário.,Number
Last Viewed Page,Última Página Visualizada,O nome da última página/seção visitada pelo usuário.,String
Artworks Opened Count,Total de Obras de Arte Abertas,A quantidade acumulada de obras de arte que o usuário abriu na galeria.,Number
Last Viewed Artwork,Última Obra de Arte Visualizada,O título da última obra de arte aberta pelo usuário.,String
Artworks Zoomed Count,Total de Obras de Arte Ampliadas,A quantidade de vezes que o usuário deu zoom em obras de arte.,Number
Signals Read Count,Total de Sinais Lidos,A quantidade de vezes que o usuário abriu transmissões de sinais.,Number
Last Read Signal,Último Sinal Lido,O título do último sinal lido pelo usuário.,String
Links Shared Count,Total de Compartilhamentos,O número de vezes que o usuário copiou ou compartilhou links do site.,Number
Last Shared Content,Último Conteúdo Compartilhado,O identificador do último conteúdo cujo link foi compartilhado pelo usuário.,String
Outbound Clicks Count,Cliques em Links Externos,O número total de links externos de destino clicados pelo usuário.,Number
Last Outbound URL,Último Link Externo Clicado,A URL do último link externo fora do site clicado pelo usuário.,String
Last Outbound Channel,Último Canal Externo Acessado,O nome do canal de destino do último link externo clicado (ex: Bandcamp).,String
Terminal Commands Run,Comandos do Terminal Executados,O número total de comandos executados pelo usuário no terminal interativo.,Number
Last Typed Command,Último Comando do Terminal,O texto exato do último comando digitado no terminal interativo.,String`;

    downloadCsvFile('mixpanel_lexicon_profile_properties.csv', csvContent);
  };

  const downloadCsvFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSendTestEvent = () => {
    setIsTestingMixpanel(true);
    setTestEventStatus('enviando evento de teste para o mixpanel...');
    
    const token = import.meta.env.VITE_MIXPANEL_TOKEN;
    if (!token) {
      setTestEventStatus('erro: você não configurou a variável VITE_MIXPANEL_TOKEN no seu arquivo .env ou no painel de controle do AI Studio. configure-a primeiro para enviar dados reais!');
      setIsTestingMixpanel(false);
      return;
    }

    try {
      const region = import.meta.env.VITE_MIXPANEL_REGION || 'US';
      const isEU = region.toUpperCase() === 'EU';
      const apiHost = isEU ? 'https://api-eu.mixpanel.com' : 'https://api-js.mixpanel.com';
      
      console.log('📊 [Mixpanel Diagnostics] Inicializando teste com Token:', token, 'na região:', region, `(host: ${apiHost})`);
      
      mixpanel.init(token, {
        debug: true,
        track_pageview: false,
        persistence: 'localStorage',
        ignore_dnt: true,
        api_host: apiHost,
        batch_requests: false
      });

      const testPayload = {
        'Page Name': 'Backoffice Diagnostics',
        'Page Path': '/backoffice/diagnostics-test',
        'Has Slug': false,
        'View Slug': 'none',
        'Test Event Run': true,
        'Region Used': region,
        'Device Orientation': window.innerWidth > window.innerHeight ? 'Landscape' : 'Portrait',
        'Screen Width': window.innerWidth,
        'Screen Height': window.innerHeight,
        'Timestamp': new Date().toISOString()
      };

      mixpanel.track('Page Viewed', testPayload, (response) => {
        console.log('📊 [Mixpanel Diagnostics Response] Código de retorno do servidor:', response);
        if (response === 1) {
          setTestEventStatus('sucesso! evento "Page Viewed" enviado e aceito pelo servidor do mixpanel. se os eventos ainda não aparecerem, confira se está visualizando o projeto correto com o token correspondente.');
        } else {
          setTestEventStatus(`erro: o servidor do mixpanel recusou o envio (retornou código ${response}). verifique se seu token é válido e se a região "${region}" (${apiHost}) é realmente a mesma do seu projeto mixpanel (verifique as configurações de residência de dados no mixpanel).`);
        }
        setIsTestingMixpanel(false);
      });
      
      // Fallback
      setTimeout(() => {
        setIsTestingMixpanel((current) => {
          if (current) {
            setTestEventStatus('aviso: o disparo foi efetuado, mas o servidor não retornou resposta a tempo. se você estiver usando um bloqueador de anúncios (AdBlock), ele pode estar barrando as requisições para o mixpanel. tente desativá-lo temporariamente!');
          }
          return false;
        });
      }, 5000);

    } catch (err: any) {
      console.error('📊 [Mixpanel Diagnostics Error]:', err);
      setTestEventStatus(`erro inesperado ao disparar: ${err.message || err}`);
      setIsTestingMixpanel(false);
    }
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

  // Cálculo de palavras em tempo real para o sinal sendo editado
  const signalWordCount = useMemo(() => {
    if (!editingSignal) return 0;
    const textContent = editingSignal.blocks
      .filter(b => b.type === 'text')
      .map(b => b.content)
      .join(' ')
      .trim();
    
    if (!textContent) return 0;
    return textContent.split(/\s+/).filter(word => word.length > 0).length;
  }, [editingSignal]);

  const tabs = [ViewState.MATERIA, ViewState.SINAIS, 'questions', ViewState.ECOS, ViewState.MANIFESTO, ViewState.ABOUT, ViewState.CONNECT, 'seo', 'sincronizar'];
  
  // Mapeamento de ViewState para Label amigável (consistente com Navigation.tsx)
  const tabLabels: Record<string, string> = {
    [ViewState.MATERIA]: 'matéria',
    [ViewState.SINAIS]: 'sinais',
    'questions': 'perguntas',
    [ViewState.ECOS]: 'ecos',
    [ViewState.MANIFESTO]: 'manifesto',
    [ViewState.ABOUT]: 'esse eu',
    [ViewState.CONNECT]: 'contato',
    'seo': 'seo',
    'sincronizar': 'sincronizar'
  };

  const featuredWorks = works.filter(w => w.isFeatured).sort((a, b) => (a.featuredOrder ?? 999) - (b.featuredOrder ?? 999));

  return (
    <div className={`min-h-screen bg-[#050505] text-white font-mono p-4 md:p-8 transition-all duration-300 selection:bg-[var(--accent)] selection:text-black ${isFocusMode ? 'pt-8 md:pt-12' : 'pt-24'}`}>
      {!isFocusMode && (
        <header className="flex justify-between items-center mb-12 border-b border-white/10 pb-8 max-w-6xl mx-auto">
          <h1 className="text-xl font-electrolize text-[var(--accent)] lowercase">fluxo /// painel de gestão</h1>
          <button onClick={onLogout} className="text-[10px] opacity-50 hover:opacity-100 border border-white/20 px-4 py-2 rounded-full transition-all lowercase">encerrar sessão</button>
        </header>
      )}

      {!isFocusMode && (
        <div className="flex gap-6 mb-12 overflow-x-auto no-scrollbar max-w-6xl mx-auto">
          {tabs.map(tab => {
            const isSelected = activeTab === tab;
            return (
              <button 
                key={tab}
                onClick={() => { setActiveTab(tab as any); setEditingWork(null); setEditingSignal(null); setIsPreviewMode(false); setExportCode(''); fetchData(); }}
                className={`text-xs uppercase tracking-[0.3em] pb-2 border-b-2 transition-all ${isSelected ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-transparent opacity-30 hover:opacity-100'}`}
              >
                {tabLabels[tab] || tab}
              </button>
            );
          })}
        </div>
      )}

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
                        <h3 className="text-sm font-electrolize text-[var(--accent)] uppercase tracking-widest">Organizar Destaques (Início)</h3>
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
                          <img src={w.imageUrl || 'https://via.placeholder.com/300'} className="w-full h-full object-cover transition-transform duration-700" alt={w.title} />
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
                      <div className="p-3 bg-white/[0.02] border border-white/5 rounded-lg space-y-1 text-[10px] text-neutral-400 font-mono leading-relaxed mt-2">
                        <div className="flex items-center gap-1.5 text-[var(--accent)] text-[9px] uppercase tracking-wider font-bold">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          tamanho recomendado para matérias
                        </div>
                        <p className="lowercase">as matérias na galeria usam um layout dinâmico vertical (estilo bento/mosaico). qualquer proporção de imagem é aceita (vertical, horizontal ou quadrada) e será exibida por completo sem cortes automáticos.</p>
                        <p className="opacity-60 lowercase mt-1"><strong className="text-white">resolução ideal:</strong> entre 1000px e 2000px de largura. prefira formatos leves (.webp, .jpg) para carregamento rápido.</p>
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
                               <span className="text-xs opacity-60 group-hover:opacity-100">Destaque na Capa</span>
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

        {/* Outras abas */}
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
                    <div key={s.id} onClick={() => handleStartEditSignal(s)} className="p-6 bg-white/5 border border-white/5 rounded-xl cursor-pointer hover:border-[var(--accent)]/30 transition-all flex justify-between items-center group">
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
                <div className={editorMode === 'split' ? "grid grid-cols-1 xl:grid-cols-12 gap-8" : isFocusMode ? "block" : "grid grid-cols-1 lg:grid-cols-12 gap-8"}>
                  
                  {/* Editor Principal */}
                  <div className={
                    editorMode === 'preview' || (isFocusMode && editorMode !== 'split')
                      ? "col-span-12 space-y-6" 
                      : editorMode === 'split'
                        ? "xl:col-span-6 space-y-6"
                        : "lg:col-span-8 space-y-6"
                  }>
                    <div className="bg-white/5 p-8 rounded-xl border border-white/10 space-y-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/5 pb-4 gap-4">
                        <div className="flex flex-wrap items-center gap-3">
                           <span className="text-[10px] text-[var(--accent)] tracking-widest uppercase font-bold">conteúdo da transmissão</span>
                           <span className="text-[9px] opacity-40 font-mono lowercase pt-0.5">({signalWordCount} palavras)</span>
                           
                           {/* Status de Sincronização */}
                           {syncStatus === 'saving' && (
                             <div className="flex items-center gap-1.5 text-[9px] text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 font-mono animate-pulse">
                               <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                               salvando...
                             </div>
                           )}
                           {syncStatus === 'synced' && (
                             <div className="flex items-center gap-1.5 text-[9px] text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-mono">
                               <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                               sincronizado
                             </div>
                           )}
                           {syncStatus === 'error' && (
                             <div className="flex items-center gap-1.5 text-[9px] text-red-400 bg-red-500/10 px-2.5 py-0.5 rounded-full border border-red-500/20 font-mono">
                               <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                               erro de rede
                             </div>
                           )}
                        </div>
                        
                        {/* Seletor de Modo e Modo de Foco */}
                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setIsFocusMode(!isFocusMode)}
                            className={`text-[9px] px-3.5 py-1.5 rounded-full uppercase tracking-wider font-bold border transition-all flex items-center gap-1.5 ${
                              isFocusMode
                                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 hover:bg-amber-500/30'
                                : 'border-white/10 hover:border-white/30 text-white/75 hover:text-white'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isFocusMode ? 'bg-amber-400 animate-pulse' : 'bg-white/40'}`} />
                            {isFocusMode ? 'modo foco: ativo' : 'modo foco'}
                          </button>

                          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-full border border-white/10">
                            <button
                              type="button"
                              onClick={() => setEditorMode('edit')}
                              className={`text-[9px] px-3 py-1 rounded-full uppercase tracking-wider transition-all ${
                                editorMode === 'edit'
                                  ? 'bg-[var(--accent)] text-black font-bold'
                                  : 'opacity-50 hover:opacity-100'
                              }`}
                            >
                              código
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditorMode('split')}
                              className={`text-[9px] px-3 py-1 rounded-full uppercase tracking-wider transition-all hidden lg:inline-block ${
                                editorMode === 'split'
                                  ? 'bg-[var(--accent)] text-black font-bold'
                                  : 'opacity-50 hover:opacity-100'
                              }`}
                            >
                              lado a lado
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditorMode('preview')}
                              className={`text-[9px] px-3 py-1 rounded-full uppercase tracking-wider transition-all ${
                                editorMode === 'preview'
                                  ? 'bg-[var(--accent)] text-black font-bold'
                                  : 'opacity-50 hover:opacity-100'
                              }`}
                            >
                              visualizar
                            </button>
                          </div>
                        </div>
                      </div>

                      {editorMode !== 'preview' ? (
                        <div className="max-w-3xl mx-auto w-full space-y-8 animate-in fade-in duration-300">
                          {/* Top Heading Inputs */}
                          <div className="space-y-4 px-1">
                            <input 
                              type="text" 
                              value={editingSignal.title} 
                              onChange={e => {
                                if (!editingSignal) return;
                                const val = e.target.value;
                                const updates: Partial<Signal> = { title: val };
                                if (isSlugPristine.current) updates.slug = createSlug(val);
                                setEditingSignal({ ...editingSignal, ...updates });
                              }} 
                              className="w-full bg-transparent border-none outline-none text-3xl md:text-5xl font-electrolize placeholder:opacity-20 lowercase tracking-wide text-white focus:text-[var(--accent)] transition-colors" 
                              placeholder="título da transmissão" 
                              required 
                            />
                            
                            <textarea 
                              value={editingSignal.subtitle || ''} 
                              onChange={e => setEditingSignal({...editingSignal, subtitle: e.target.value})} 
                              className="w-full bg-transparent border-none outline-none text-sm md:text-base opacity-50 italic resize-none h-auto font-mono tracking-wide lowercase focus:opacity-90 transition-opacity" 
                              placeholder="subtítulo ou introdução curta..."
                            />
                          </div>

                          <div className="bg-black/40 p-4 md:p-8 space-y-8 rounded-2xl border border-white/5">
                            {editingSignal.blocks.map((block, index) => (
                              <React.Fragment key={block.id}>
                                {/* Inseridor de bloco entre elementos */}
                                {index > 0 && (
                                  <div className="relative group/insert h-6 flex items-center justify-center -my-3">
                                    <div className="absolute inset-x-0 h-px bg-white/5 group-hover/insert:bg-[var(--accent)]/30 transition-colors" />
                                    <div className="relative opacity-0 group-hover/insert:opacity-100 transition-all duration-200 flex gap-1 bg-[#050505] px-3 py-1 rounded-full border border-white/10 scale-90 group-hover/insert:scale-100 z-10 shadow-lg">
                                      <button
                                        type="button"
                                        onClick={() => handleAddBlock('text', index - 1)}
                                        className="text-[8px] text-neutral-400 hover:text-[var(--accent)] px-2 py-0.5 rounded hover:bg-white/5 font-mono uppercase tracking-wider transition-all"
                                      >
                                        + texto
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleAddBlock('image', index - 1)}
                                        className="text-[8px] text-neutral-400 hover:text-[var(--accent)] px-2 py-0.5 rounded hover:bg-white/5 font-mono uppercase tracking-wider transition-all"
                                      >
                                        + imagem
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleAddBlock('embed', index - 1)}
                                        className="text-[8px] text-neutral-400 hover:text-[var(--accent)] px-2 py-0.5 rounded hover:bg-white/5 font-mono uppercase tracking-wider transition-all"
                                      >
                                        + embed
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {/* Bloco Renderizado */}
                                <div className="group relative bg-[#070707]/60 p-4 md:p-6 rounded-2xl border border-white/5 hover:border-[var(--accent)]/20 focus-within:border-[var(--accent)]/30 focus-within:ring-1 focus-within:ring-[var(--accent)]/5 transition-all space-y-5 max-w-2xl mx-auto w-full">
                                  {/* Bloco Header com controles */}
                                  <div className="flex justify-between items-center text-[9px] text-neutral-500 font-mono border-b border-white/5 pb-2">
                                    <span className="uppercase tracking-widest text-[var(--accent)]/70 font-bold">bloco #{index + 1} // {block.type}</span>
                                    <div className="flex items-center gap-3">
                                      <button
                                        type="button"
                                        disabled={index === 0}
                                        onClick={() => moveBlock(index, 'up')}
                                        className="hover:text-[var(--accent)] disabled:opacity-25 transition-opacity"
                                        title="subir bloco"
                                      >
                                        ▲ subir
                                      </button>
                                      <button
                                        type="button"
                                        disabled={index === editingSignal.blocks.length - 1}
                                        onClick={() => moveBlock(index, 'down')}
                                        className="hover:text-[var(--accent)] disabled:opacity-25 transition-opacity"
                                        title="descer bloco"
                                      >
                                        ▼ descer
                                      </button>
                                      <div className="w-px h-3 bg-white/10" />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const b = [...editingSignal.blocks];
                                          b.splice(index, 1);
                                          setEditingSignal({ ...editingSignal, blocks: b });
                                        }}
                                        className="hover:text-red-400 transition-colors"
                                        title="apagar bloco"
                                      >
                                        excluir
                                      </button>
                                    </div>
                                  </div>

                                  {block.type === 'text' && (
                                    <div className="space-y-4 relative">
                                      <div className="flex flex-wrap gap-0.5 p-1 bg-[#121212]/90 backdrop-blur-md rounded border border-white/10 w-fit shadow-md transition-opacity">
                                        <button type="button" onClick={() => applyFormatting(block.id, '**', '**')} className="p-1 px-2 text-[10px] text-neutral-400 hover:text-white hover:bg-white/5 rounded font-bold font-mono transition-colors" title="negrito">B</button>
                                        <button type="button" onClick={() => applyFormatting(block.id, '*', '*')} className="p-1 px-2 text-[10px] text-neutral-400 hover:text-white hover:bg-white/5 rounded italic font-mono transition-colors" title="itálico">I</button>
                                        <button type="button" onClick={() => applyFormatting(block.id, '~~', '~~')} className="p-1 px-2 text-[10px] text-neutral-400 hover:text-white hover:bg-white/5 rounded line-through font-mono transition-colors" title="tachado">S</button>
                                        <div className="w-px h-4 bg-white/10 mx-1 self-center" />
                                        <button type="button" onClick={() => applyFormatting(block.id, '# ', '')} className="p-1 px-2 text-[10px] text-neutral-400 hover:text-white hover:bg-white/5 rounded font-mono transition-colors" title="título 1">H1</button>
                                        <button type="button" onClick={() => applyFormatting(block.id, '## ', '')} className="p-1 px-2 text-[10px] text-neutral-400 hover:text-white hover:bg-white/5 rounded font-mono transition-colors" title="título 2">H2</button>
                                        <button type="button" onClick={() => applyFormatting(block.id, '### ', '')} className="p-1 px-2 text-[10px] text-neutral-400 hover:text-white hover:bg-white/5 rounded font-mono transition-colors" title="título 3">H3</button>
                                        <div className="w-px h-4 bg-white/10 mx-1 self-center" />
                                        <button type="button" onClick={() => applyFormatting(block.id, '[', ']')} className="p-1 px-2 text-[10px] text-neutral-400 hover:text-white hover:bg-white/5 rounded font-mono transition-colors" title="link">link</button>
                                        <button type="button" onClick={() => applyFormatting(block.id, '<br/>', '')} className="p-1 px-2 text-[10px] text-neutral-400 hover:text-white hover:bg-white/5 rounded font-mono transition-colors" title="quebra de linha">br</button>
                                        <button type="button" onClick={() => applyFormatting(block.id, '\n---\n', '')} className="p-1 px-2 text-[10px] text-neutral-400 hover:text-white hover:bg-white/5 rounded font-mono transition-colors" title="separador">---</button>
                                        <button type="button" onClick={() => applyFormatting(block.id, '1) ', '')} className="p-1 px-2 text-[10px] text-neutral-400 hover:text-white hover:bg-white/5 rounded font-mono transition-colors" title="lista numerada">1)</button>
                                        <button type="button" onClick={() => applyFormatting(block.id, '• ', '')} className="p-1 px-2 text-[10px] text-neutral-400 hover:text-white hover:bg-white/5 rounded font-mono transition-colors" title="lista bullet">•</button>
                                      </div>
                                      <textarea id={`textarea-${block.id}`} value={block.content} onChange={e => handleUpdateBlock(block.id, e.target.value)} className="w-full bg-transparent border-none outline-none font-mono text-base md:text-[17px] leading-[1.9] tracking-wide text-neutral-200 focus:text-white min-h-[180px] resize-none placeholder:opacity-15 lowercase focus:ring-0 p-1" placeholder="escreva seu sinal..." onInput={e => { e.currentTarget.style.height = 'auto'; e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px'; }} />
                                    </div>
                                  )}

                                  {block.type === 'image' && (
                                    <div className="space-y-2 w-full">
                                      <div className="bg-white/5 p-4 rounded-md border border-white/10 flex flex-col md:flex-row gap-4">
                                         <div className="flex-grow space-y-1">
                                            <label className="text-[8px] opacity-30 uppercase font-mono">link da imagem</label>
                                            <input type="text" value={block.content} onChange={e => handleUpdateBlock(block.id, e.target.value, block.caption)} className="w-full bg-black border border-white/10 p-3 rounded text-xs outline-none focus:border-[var(--accent)]" placeholder="https://..." />
                                         </div>
                                         <div className="w-full md:w-1/3 space-y-1">
                                            <label className="text-[8px] opacity-30 uppercase font-mono">legenda</label>
                                            <input type="text" value={block.caption || ''} onChange={e => handleUpdateBlock(block.id, block.content, e.target.value)} className="w-full bg-transparent border-b border-white/10 p-2 text-[10px] outline-none focus:border-[var(--accent)]" placeholder="opcional..." />
                                         </div>
                                      </div>
                                      <p className="text-[9px] opacity-40 lowercase px-1 font-mono leading-normal">
                                        <span className="text-[var(--accent)]">💡 bloco de galeria:</span> exibido em 1 coluna (se único) ou em 2 colunas com altura automática (<span className="text-white">h-auto</span>). qualquer proporção funciona perfeitamente. largura recomendada: ~1000px.
                                      </p>
                                    </div>
                                  )}

                                  {block.type === 'embed' && (
                                    <div className="bg-white/5 p-4 rounded-md border border-white/10 space-y-3">
                                      <label className="text-[8px] opacity-30 uppercase font-mono">link embedded / código iframe</label>
                                      <textarea 
                                        value={block.content} 
                                        onChange={e => handleUpdateBlock(block.id, e.target.value)} 
                                        className="w-full bg-black border border-white/10 p-3 rounded text-xs min-h-[80px] font-mono outline-none focus:border-[var(--accent)]" 
                                        placeholder="link spotify, youtube ou <iframe />"
                                      />
                                    </div>
                                  )}
                                </div>
                              </React.Fragment>
                            ))}
                            <div className="flex flex-wrap justify-center gap-4 pt-10 border-t border-white/5">
                              <button type="button" onClick={() => handleAddBlock('text')} className="text-[10px] border border-white/10 px-6 py-2 rounded-full hover:bg-[var(--accent)] hover:text-black hover:border-[var(--accent)] transition-all uppercase tracking-widest">+ texto</button>
                              <button type="button" onClick={() => handleAddBlock('image')} className="text-[10px] border border-white/10 px-6 py-2 rounded-full hover:bg-[var(--accent)] hover:text-black hover:border-[var(--accent)] transition-all uppercase tracking-widest">+ imagem</button>
                              <button type="button" onClick={() => handleAddBlock('embed')} className="text-[10px] border border-white/10 px-6 py-2 rounded-full hover:bg-[var(--accent)] hover:text-black hover:border-[var(--accent)] transition-all uppercase tracking-widest">+ embed</button>
                            </div>

                            {isFocusMode && (
                              <div className="pt-12 border-t border-white/5 flex flex-col sm:flex-row justify-center items-center gap-4 max-w-2xl mx-auto w-full">
                                <NeobrutalistButton variant="matrix" type="submit" className="w-full sm:w-auto px-8 py-4 text-xs uppercase tracking-widest font-bold">concluir e fechar</NeobrutalistButton>
                                <button type="button" onClick={() => setEditingSignal(null)} className="w-full sm:w-auto px-8 py-4 border border-white/10 rounded-full text-[10px] uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity">cancelar</button>
                                <button type="button" onClick={() => setIsFocusMode(false)} className="w-full sm:w-auto px-6 py-4 border border-amber-500/30 text-amber-400 bg-amber-500/5 hover:bg-amber-500/15 rounded-full text-[10px] uppercase tracking-widest transition-all">sair do foco</button>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="max-w-4xl mx-auto py-10 bg-black/20 rounded-xl p-8 border border-white/5">
                          <SignalRenderer signal={editingSignal} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Lado Direito: Preview Stickado se Split */}
                  {editorMode === 'split' && (
                    <div className="xl:col-span-6 space-y-6">
                      <div className="sticky top-24 bg-white/5 p-8 rounded-xl border border-white/10 space-y-6 max-h-[85vh] overflow-y-auto no-scrollbar">
                        <header className="border-b border-white/5 pb-4 flex justify-between items-center">
                          <span className="text-[10px] text-[var(--accent)] tracking-widest uppercase font-bold">transmissão ao vivo // visualização real-time</span>
                          <span className="text-[8px] opacity-40 font-mono">atualiza a cada tecla</span>
                        </header>
                        <div className="bg-black/20 rounded-xl p-6 border border-white/5 min-h-[300px]">
                          <SignalRenderer signal={editingSignal} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Sidebar de Configurações do Sinal */}
                  {!isFocusMode && (
                    <div className={
                      editorMode === 'split' 
                        ? "xl:col-span-12 space-y-6" 
                        : "lg:col-span-4 space-y-6"
                    }>
                      <div className="bg-white/5 p-6 rounded-xl border border-white/10 space-y-8">
                         <header className="border-b border-white/10 pb-4">
                           <h3 className="text-[10px] text-[var(--accent)] tracking-[0.3em] uppercase font-bold">configurações do sinal</h3>
                         </header>

                         <div className={editorMode === 'split' ? "grid grid-cols-1 md:grid-cols-4 gap-6" : "space-y-4"}>
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
                               <div className="p-3 bg-white/[0.02] border border-white/5 rounded-lg space-y-1 text-[10px] text-neutral-400 font-mono leading-relaxed mt-1 mb-2">
                                 <div className="flex items-center gap-1.5 text-[var(--accent)] text-[9px] uppercase tracking-wider font-bold">
                                   <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                   tamanho recomendado para capa
                                  </div>
                                 <p className="lowercase">a miniatura na listagem de sinais usa proporção <strong className="text-white">4:3</strong>. dentro do sinal, a imagem vira um banner horizontal de altura fixa (<strong className="text-white">object-cover</strong>).</p>
                                 <p className="opacity-60 lowercase mt-1"><strong className="text-white">orientação:</strong> prefira imagens em paisagem (landscape, ex: 4:3 ou 16:9). <strong className="text-white">resolução ideal:</strong> 1200x900px ou 1920x1080px.</p>
                               </div>
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
                                 className="w-full bg-black border border-white/10 p-3 rounded text-xs outline-none focus:border-[var(--accent)] h-11 resize-none" 
                                 placeholder="resumo curto para compartilhamento..."
                               />
                             </div>
                          </div>

                          {/* Metadados de Campo (Estilo DeviantArt) */}
                          <div className="pt-6 border-t border-white/10 space-y-4 text-left">
                             <div className="flex justify-between items-center">
                               <h4 className="text-[9px] text-[var(--accent)] tracking-[0.2em] uppercase font-bold">metadados de campo (estilo deviantart)</h4>
                               <button 
                                 type="button"
                                 onClick={() => {
                                   const currentMeta = editingSignal.metadata || [];
                                   setEditingSignal({
                                     ...editingSignal,
                                     metadata: [...currentMeta, { question: 'novo campo', answer: '' }]
                                   });
                                 }}
                                 className="text-[9px] text-[var(--accent)] hover:underline opacity-80 hover:opacity-100 font-mono tracking-wider lowercase"
                               >
                                 + novo campo
                               </button>
                             </div>
                             
                             <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                               {((editingSignal.metadata && editingSignal.metadata.length > 0) ? editingSignal.metadata : [
                                 { question: 'ouvindo', answer: '' },
                                 { question: 'humor', answer: '' },
                                 { question: 'lugar', answer: '' },
                                 { question: 'clima', answer: '' },
                                 { question: 'suporte', answer: '' }
                               ]).map((item, idx) => (
                                 <div key={idx} className="flex gap-2 items-center bg-black/40 p-2 rounded border border-white/5">
                                   <input 
                                     type="text" 
                                     value={item.question}
                                     onChange={e => {
                                       const currentMeta = [...(editingSignal.metadata || [
                                         { question: 'ouvindo', answer: '' },
                                         { question: 'humor', answer: '' },
                                         { question: 'lugar', answer: '' },
                                         { question: 'clima', answer: '' },
                                         { question: 'suporte', answer: '' }
                                       ])];
                                       currentMeta[idx] = { ...currentMeta[idx], question: e.target.value };
                                       setEditingSignal({ ...editingSignal, metadata: currentMeta });
                                     }}
                                     className="w-1/3 bg-transparent border-r border-white/10 pr-2 text-xs font-mono text-[var(--accent)] outline-none lowercase"
                                     placeholder="pergunta"
                                   />
                                   <input 
                                     type="text" 
                                     value={item.answer}
                                     onChange={e => {
                                       const currentMeta = [...(editingSignal.metadata || [
                                         { question: 'ouvindo', answer: '' },
                                         { question: 'humor', answer: '' },
                                         { question: 'lugar', answer: '' },
                                         { question: 'clima', answer: '' },
                                         { question: 'suporte', answer: '' }
                                       ])];
                                       currentMeta[idx] = { ...currentMeta[idx], answer: e.target.value };
                                       setEditingSignal({ ...editingSignal, metadata: currentMeta });
                                     }}
                                     className="flex-grow bg-transparent text-xs outline-none text-white/80 lowercase"
                                     placeholder="resposta..."
                                   />
                                   <button 
                                     type="button"
                                     onClick={() => {
                                       const currentMeta = [...(editingSignal.metadata || [
                                         { question: 'ouvindo', answer: '' },
                                         { question: 'humor', answer: '' },
                                         { question: 'lugar', answer: '' },
                                         { question: 'clima', answer: '' },
                                         { question: 'suporte', answer: '' }
                                       ])];
                                       const filtered = currentMeta.filter((_, i) => i !== idx);
                                       setEditingSignal({ ...editingSignal, metadata: filtered });
                                     }}
                                     className="text-red-500/50 hover:text-red-500 font-mono text-xs px-2"
                                     title="remover campo"
                                   >
                                     ×
                                   </button>
                                 </div>
                               ))}
                             </div>
                          </div>

                         <div className={`pt-6 border-t border-white/10 flex flex-col gap-3 ${editorMode === 'split' ? 'md:flex-row md:items-center' : ''}`}>
                            <NeobrutalistButton variant="matrix" type="submit" className={`${editorMode === 'split' ? 'md:w-auto md:px-8' : 'w-full'} py-4 text-sm uppercase tracking-widest`}>concluir e fechar</NeobrutalistButton>
                            <button type="button" onClick={() => setEditingSignal(null)} className={`${editorMode === 'split' ? 'md:w-auto md:px-8' : 'w-full'} py-4 border border-white/10 rounded-full text-[10px] uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity`}>cancelar</button>
                            <button type="button" onClick={() => handleDeleteSignal(editingSignal.id)} className={`${editorMode === 'split' ? 'md:w-auto md:ml-auto md:px-6' : 'w-full'} py-4 text-red-500/40 hover:text-red-500 text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center gap-2`}>
                               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012 2v2"></path></svg>
                               excluir permanentemente
                            </button>
                         </div>
                      </div>
                    </div>
                  )}
                </div>
              </form>
            )}
          </div>
        )}

         {activeTab === 'questions' && (
          <div className="space-y-8 animate-in fade-in max-w-3xl mx-auto pb-32">
            <div className="bg-white/5 p-8 rounded-2xl border border-white/10 space-y-6">
              <header className="border-b border-white/10 pb-4">
                 <h2 className="text-sm font-electrolize text-[var(--accent)] tracking-[0.2em] uppercase">editor de questions /// metadados de transmissão</h2>
                 <p className="text-[10px] opacity-40 mt-1">Configure perguntas e metadados que serão pré-carregados automaticamente ao criar qualquer nova transmissão em "sinais".</p>
              </header>

              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2">
                  <span className="text-[10px] uppercase tracking-widest text-white/40">perguntas padrão configuradas</span>
                  <button 
                    type="button"
                    onClick={() => setCustomQuestions([...customQuestions, ''])}
                    className="text-[10px] text-[var(--accent)] hover:underline flex items-center gap-1.5 lowercase"
                  >
                    + adicionar nova pergunta
                  </button>
                </div>

                <div className="space-y-3">
                  {customQuestions.map((q, idx) => (
                    <div key={idx} className="flex gap-3 items-center bg-black/40 p-3 rounded-lg border border-white/5">
                      <span className="font-mono text-white/30 text-xs w-6">{String(idx + 1).padStart(2, '0')}.</span>
                      <input 
                        type="text" 
                        value={q}
                        onChange={e => {
                          const updated = [...customQuestions];
                          updated[idx] = e.target.value;
                          setCustomQuestions(updated);
                        }}
                        className="flex-grow bg-transparent text-xs text-white/80 outline-none border-b border-white/10 focus:border-[var(--accent)] pb-1 lowercase"
                        placeholder="ex: música ouvindo, humor atual..."
                      />
                      <div className="flex gap-1">
                        <button 
                          type="button"
                          disabled={idx === 0}
                          onClick={() => {
                            const updated = [...customQuestions];
                            const temp = updated[idx];
                            updated[idx] = updated[idx - 1];
                            updated[idx - 1] = temp;
                            setCustomQuestions(updated);
                          }}
                          className="text-white/40 hover:text-white disabled:opacity-20 text-xs px-1.5 py-1"
                          title="subir"
                        >
                          ↑
                        </button>
                        <button 
                          type="button"
                          disabled={idx === customQuestions.length - 1}
                          onClick={() => {
                            const updated = [...customQuestions];
                            const temp = updated[idx];
                            updated[idx] = updated[idx + 1];
                            updated[idx + 1] = temp;
                            setCustomQuestions(updated);
                          }}
                          className="text-white/40 hover:text-white disabled:opacity-20 text-xs px-1.5 py-1"
                          title="descer"
                        >
                          ↓
                        </button>
                        <button 
                          type="button"
                          onClick={() => {
                            const updated = customQuestions.filter((_, i) => i !== idx);
                            setCustomQuestions(updated);
                          }}
                          className="text-red-500/40 hover:text-red-500 text-xs px-2 py-1"
                          title="excluir"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}

                  {customQuestions.length === 0 && (
                    <div className="text-center py-8 border border-dashed border-white/10 rounded-lg opacity-40 text-xs lowercase">
                      nenhuma pergunta padrão cadastrada. adicione uma nova pergunta acima.
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <p className="text-[10px] opacity-40 text-center sm:text-left">as alterações só terão efeito nos novos posts criados a partir de agora.</p>
                <div className="flex gap-4 items-center">
                  {savedSuccess && (
                    <span className="text-[10px] text-[var(--accent)] font-mono tracking-wider animate-pulse">[salvo com sucesso!]</span>
                  )}
                  <button 
                    type="button"
                    onClick={() => {
                      const cleaned = customQuestions.filter(q => q.trim());
                      localStorage.setItem('custom_metadata_questions', JSON.stringify(cleaned));
                      setCustomQuestions(cleaned);
                      setSavedSuccess(true);
                      setTimeout(() => setSavedSuccess(false), 3000);
                    }}
                    className="bg-[var(--accent)] text-black px-6 py-2.5 rounded-full hover:scale-105 transition-all text-xs font-mono tracking-wider uppercase font-bold"
                  >
                    salvar perguntas padrão
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

         {activeTab === ViewState.ECOS && (
          <div className="space-y-8 animate-in fade-in max-w-4xl mx-auto pb-32">
            <form onSubmit={handleSaveEcos} className="bg-white/5 p-8 rounded-2xl border border-white/10 space-y-6">
              <header className="border-b border-white/10 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                 <div>
                   <h2 className="text-sm font-electrolize text-[var(--accent)] tracking-[0.2em] uppercase">gerenciar botões /// ecos</h2>
                   <p className="text-[10px] opacity-40 mt-1">configure os links de transmissão, objetos e UTMs exibidos na página "ecos".</p>
                 </div>
                 <button 
                   type="button"
                   onClick={() => {
                     const newLink: EcoLink = {
                       id: `eco-${Date.now()}`,
                       title: 'novo canal',
                       description: 'descrição curta do canal ou rede...',
                       url: '',
                       status: 'ativo'
                     };
                     setEcosConfig({
                       ...ecosConfig,
                       links: [...(ecosConfig.links || []), newLink]
                     });
                   }}
                   className="text-[10px] bg-white/10 hover:bg-white/20 border border-white/10 px-4 py-2 rounded-full transition-all lowercase flex items-center gap-2 text-white"
                 >
                   + novo link
                 </button>
              </header>

              <div className="space-y-6">
                {(ecosConfig.links || []).map((link, idx) => (
                  <div key={link.id} className="p-6 bg-black/40 border border-white/5 rounded-xl space-y-4 relative group">
                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-white/20 text-xs font-bold">#{String(idx + 1).padStart(2, '0')}</span>
                        <span className="text-[10px] uppercase tracking-widest bg-[var(--accent)]/10 text-[var(--accent)] px-2 py-0.5 rounded">
                          {link.status}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => {
                            const updated = [...ecosConfig.links];
                            const temp = updated[idx];
                            updated[idx] = updated[idx - 1];
                            updated[idx - 1] = temp;
                            setEcosConfig({ ...ecosConfig, links: updated });
                          }}
                          className="p-1 text-white/40 hover:text-white disabled:opacity-20 text-xs"
                          title="subir"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          disabled={idx === (ecosConfig.links || []).length - 1}
                          onClick={() => {
                            const updated = [...ecosConfig.links];
                            const temp = updated[idx];
                            updated[idx] = updated[idx + 1];
                            updated[idx + 1] = temp;
                            setEcosConfig({ ...ecosConfig, links: updated });
                          }}
                          className="p-1 text-white/40 hover:text-white disabled:opacity-20 text-xs"
                          title="descer"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = ecosConfig.links.filter(l => l.id !== link.id);
                            setEcosConfig({ ...ecosConfig, links: updated });
                          }}
                          className="p-1 text-red-500/50 hover:text-red-500 text-xs ml-2"
                          title="remover"
                        >
                          remover
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-wider text-white/40">título</label>
                        <input 
                          type="text"
                          value={link.title}
                          onChange={e => {
                            const updated = ecosConfig.links.map(l => l.id === link.id ? { ...l, title: e.target.value } : l);
                            setEcosConfig({ ...ecosConfig, links: updated });
                          }}
                          className="w-full bg-black/60 border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-[var(--accent)] lowercase"
                          placeholder="ex: colab55, pinterest..."
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-wider text-white/40">status</label>
                        <select
                          value={link.status}
                          onChange={e => {
                            const updated = ecosConfig.links.map(l => l.id === link.id ? { ...l, status: e.target.value } : l);
                            setEcosConfig({ ...ecosConfig, links: updated });
                          }}
                          className="w-full bg-black/60 border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-[var(--accent)] lowercase"
                        >
                          <option value="ativo">ativo (botão visível e funcional)</option>
                          <option value="mapeando">mapeando (placeholder esmaecido)</option>
                        </select>
                      </div>

                      <div className="space-y-1 md:col-span-2">
                        <label className="text-[10px] uppercase tracking-wider text-white/40">descrição do canal / artefato</label>
                        <input 
                          type="text"
                          value={link.description}
                          onChange={e => {
                            const updated = ecosConfig.links.map(l => l.id === link.id ? { ...l, description: e.target.value } : l);
                            setEcosConfig({ ...ecosConfig, links: updated });
                          }}
                          className="w-full bg-black/60 border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-[var(--accent)] lowercase"
                          placeholder="ex: impressões, suportes e fragmentos de processo..."
                        />
                      </div>

                      <div className="space-y-1 md:col-span-2">
                        <label className="text-[10px] uppercase tracking-wider text-white/40">url de destino (adicione seus links utm aqui)</label>
                        <input 
                          type="text"
                          value={link.url}
                          onChange={e => {
                            const updated = ecosConfig.links.map(l => l.id === link.id ? { ...l, url: e.target.value } : l);
                            setEcosConfig({ ...ecosConfig, links: updated });
                          }}
                          className="w-full bg-black/60 border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-[var(--accent)]"
                          placeholder="ex: https://site.com/?utm_source=ecos&utm_medium=click"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {(ecosConfig.links || []).length === 0 && (
                  <div className="text-center py-12 border border-dashed border-white/10 rounded-xl opacity-30 text-xs lowercase">
                    nenhum link cadastrado. clique em "+ novo link" acima para iniciar.
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <p className="text-[10px] opacity-40 text-center sm:text-left">
                  as alterações salvas se refletirão diretamente na aba pública de ecos do site.
                </p>
                <div className="flex gap-4 items-center">
                  {ecosSavedSuccess && (
                    <span className="text-[10px] text-[var(--accent)] font-mono tracking-wider animate-pulse">[configurações de ecos salvas!]</span>
                  )}
                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="bg-[var(--accent)] text-black px-6 py-2.5 rounded-full hover:scale-105 transition-all text-xs font-mono tracking-wider uppercase font-bold disabled:opacity-50"
                  >
                    {isSaving ? 'salvando...' : 'salvar botões do ecos'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {activeTab === ViewState.MANIFESTO && (
          <div className="space-y-16 animate-in fade-in max-w-5xl mx-auto pb-32">
            
            {/* Editor de Landing Manifesto */}
            <form onSubmit={handleSaveManifesto} className="space-y-8 bg-white/5 p-8 rounded-2xl border border-white/10">
              <header className="border-b border-white/10 pb-4">
                 <h2 className="text-sm font-electrolize text-[var(--accent)] tracking-[0.2em] uppercase">01. editor de manifesto /// landing page</h2>
                 <p className="text-[10px] opacity-40 mt-1">Este é o texto que aparece na página inicial com efeito de escrita.</p>
              </header>
              <div className="space-y-6">
                <div className="space-y-2">
                  <textarea 
                    value={manifesto.text} 
                    onChange={e => setManifesto({...manifesto, text: e.target.value})} 
                    className="w-full bg-black border border-white/10 p-8 h-48 outline-none rounded-xl text-lg focus:border-[var(--accent)] resize-none lowercase leading-relaxed" 
                    placeholder="escreva o manifesto curto para a landing page..." 
                  />
                </div>
              </div>
              <NeobrutalistButton variant="matrix" type="submit" className="w-full py-4 text-xs uppercase tracking-widest">salvar manifesto landing</NeobrutalistButton>
            </form>


          </div>
        )}

        {activeTab === ViewState.ABOUT && (
          <form onSubmit={handleSaveProfile} className="space-y-8 animate-in fade-in max-w-4xl mx-auto">
            <header className="border-b border-white/10 pb-4">
               <h2 className="text-sm font-electrolize text-[var(--accent)] tracking-[0.2em] uppercase">gestão de perfil /// esse eu</h2>
            </header>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] opacity-40 uppercase tracking-widest block">imagem de perfil (url)</label>
                  <input type="text" value={profile.imageUrl} onChange={e => setProfile({...profile, imageUrl: e.target.value})} className="w-full bg-black border border-white/10 p-4 rounded-md outline-none text-sm focus:border(--accent)]" placeholder="https://..." />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] opacity-40 uppercase tracking-widest block">favicon (ícone do site)</label>
                  <input type="text" value={profile.faviconUrl || ''} onChange={e => setProfile({...profile, faviconUrl: e.target.value})} className="w-full bg-black border border-white/10 p-4 rounded-md outline-none text-sm focus:border-[var(--accent)]" placeholder="https://... ou data:image/..." />
                </div>
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

        {activeTab === 'seo' && (() => {
          const firstFeaturedWork = works.find(w => w.isFeatured);
          const seoPreviewImage = seoConfig.image || (firstFeaturedWork ? firstFeaturedWork.imageUrl : "https://64.media.tumblr.com/2469fc83feaecaf0b7a97fa55f6793d6/670f92e2b0934e32-bb/s2048x3072/3b1cf9f39410af90a8d0607d572f83c0024b2472.jpg");

          return (
            <form onSubmit={handleSaveSeo} className="space-y-12 animate-in fade-in max-w-4xl mx-auto">
              <header className="border-b border-white/10 pb-4">
                <h2 className="text-sm font-electrolize text-[var(--accent)] tracking-[0.2em] uppercase">otimização de busca e compartilhamento /// SEO</h2>
              </header>
              
              <div className="space-y-8">
                <div className="bg-white/5 p-6 rounded-xl border border-white/10 space-y-4">
                  <h3 className="text-xs font-electrolize text-[var(--accent)] uppercase tracking-wider">Como funciona?</h3>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    As configurações abaixo definem como o seu site é apresentado nos motores de busca (como o Google) e em prévias de compartilhamento nas redes sociais (WhatsApp, Telegram, Twitter, LinkedIn, etc.).
                  </p>
                  <p className="text-[10px] text-neutral-400">
                    * Nota: Os motores de busca podem levar alguns dias para re-indexar o site após a atualização dos metadados. No entanto, a sincronização atualiza as tags HTML do site em tempo real para os visitantes.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] opacity-40 uppercase tracking-widest block">Título SEO do Site (Aparece na aba e nos resultados de busca)</label>
                  <input 
                    type="text" 
                    value={seoConfig.title} 
                    onChange={e => setSeoConfig({...seoConfig, title: e.target.value})} 
                    className="w-full bg-black border border-white/10 p-4 rounded-md outline-none text-sm focus:border-[var(--accent)]" 
                    placeholder="ruídos atmosféricos" 
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] opacity-40 uppercase tracking-widest block">Descrição Meta (SEO) do Site (Aparece no Google e em compartilhamentos)</label>
                  <textarea 
                    value={seoConfig.description} 
                    onChange={e => setSeoConfig({...seoConfig, description: e.target.value})} 
                    className="w-full bg-black border border-white/10 p-4 h-32 outline-none rounded-md text-sm focus:border-[var(--accent)] resize-none" 
                    placeholder="uma descrição objetiva e atraente sobre seu manifesto artístico e suas obras..." 
                    required
                  />
                  <div className="flex justify-between text-[10px] opacity-40">
                    <span>Recomendado: 120-160 caracteres</span>
                    <span>{seoConfig.description?.length || 0} caracteres</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] opacity-40 uppercase tracking-widest block">URL da Imagem de Compartilhamento (og:image) (Opcional)</label>
                  <input 
                    type="text" 
                    value={seoConfig.image || ''} 
                    onChange={e => setSeoConfig({...seoConfig, image: e.target.value})} 
                    className="w-full bg-black border border-white/10 p-4 rounded-md outline-none text-sm focus:border-[var(--accent)]" 
                    placeholder="Deixe em branco para usar automaticamente a imagem da primeira obra em destaque." 
                  />
                  <p className="text-[10px] text-neutral-400">
                    * Se deixado em branco, usará o fundo do quadro ou a imagem da sua primeira obra em destaque. Você pode colar o link direto de qualquer imagem do site.
                  </p>
                </div>

                {/* Pré-visualização Google & Social */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  <div className="border border-white/10 bg-black/40 p-6 rounded-xl space-y-3">
                    <span className="text-[10px] opacity-40 uppercase tracking-wider block font-electrolize">Prévia de Busca (Google)</span>
                    <div className="font-sans text-left space-y-1">
                      <span className="text-[#8ab4f8] text-lg hover:underline cursor-pointer block truncate font-medium">
                        {seoConfig.title || 'ruídos atmosféricos'}
                      </span>
                      <span className="text-[#34a853] text-xs block truncate">
                        https://ruidosatmosfericos.online
                      </span>
                      <p className="text-neutral-400 text-xs leading-relaxed line-clamp-2">
                        {seoConfig.description || 'Nenhuma descrição meta configurada.'}
                      </p>
                    </div>
                  </div>

                  <div className="border border-white/10 bg-black/40 p-6 rounded-xl space-y-3">
                    <span className="text-[10px] opacity-40 uppercase tracking-wider block font-electrolize">Prévia de Compartilhamento (Card Social)</span>
                    <div className="border border-white/10 rounded-lg overflow-hidden bg-[#151515] text-left">
                      <div className="h-28 bg-neutral-900 flex items-center justify-center text-xs text-neutral-500 overflow-hidden relative">
                        <span className="relative z-10 font-electrolize text-[var(--accent)] tracking-widest">ruídos atmosféricos</span>
                        <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: `url(${seoPreviewImage})` }} />
                      </div>
                      <div className="p-3 space-y-1 font-sans">
                        <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">ruidosatmosfericos.online</span>
                        <h4 className="text-sm font-semibold text-neutral-200 line-clamp-1">
                          {seoConfig.title || 'ruídos atmosféricos'}
                        </h4>
                        <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                          {seoConfig.description || 'Nenhuma descrição meta configurada.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <NeobrutalistButton variant="matrix" type="submit" className="w-full py-4">salvar configuração de seo</NeobrutalistButton>
            </form>
          );
        })()}

        {activeTab === 'sincronizar' && (
          <div className="space-y-16 animate-in fade-in max-w-4xl mx-auto py-12">
            
            {/* Seção de Exportação */}
            <section className="space-y-8 text-center border-b border-white/10 pb-16">
              <div className="space-y-2">
                <h2 className="font-electrolize text-3xl text-[var(--accent)] lowercase">exportar base de dados</h2>
                <p className="font-mono text-sm opacity-60 lowercase max-w-md mx-auto">extraia o conteúdo atual para persistência manual ou backup no repositório github.</p>
              </div>
              
              {!exportCode ? (
                <NeobrutalistButton variant="matrix" onClick={generateExportCode} className="px-12 py-6 text-xl">gerar código de extração</NeobrutalistButton>
              ) : (
                <div className="space-y-6">
                  <textarea readOnly value={exportCode} className="w-full h-[300px] bg-black border border-white/10 p-6 rounded-md font-mono text-[10px] text-neutral-400 no-scrollbar" />
                  <NeobrutalistButton variant="matrix" onClick={copyToClipboard} className="w-full py-5">copiar código para clipboard</NeobrutalistButton>
                </div>
              )}
            </section>

            {/* Seção de Importação */}
            <section className="space-y-8 text-center">
              <div className="space-y-2">
                <h2 className="font-electrolize text-3xl text-[var(--accent)] lowercase">importar base de dados</h2>
                <p className="font-mono text-sm opacity-60 lowercase max-w-md mx-auto">cole o conteúdo do seu arquivo initialData.ts do github abaixo para atualizar este ambiente.</p>
              </div>

              <div className="space-y-6">
                <textarea 
                  value={importCode} 
                  onChange={e => setImportCode(e.target.value)}
                  placeholder="cole o código aqui..."
                  className="w-full h-[200px] bg-black border border-white/10 p-6 rounded-md font-mono text-[10px] text-neutral-400 no-scrollbar focus:border-[var(--accent)] outline-none" 
                />
                <NeobrutalistButton 
                  variant="matrix" 
                  onClick={handleImportData} 
                  disabled={!importCode.trim() || isImporting}
                  className="w-full py-5"
                >
                  {isImporting ? 'processando...' : 'importar e sobrescrever dados locais'}
                </NeobrutalistButton>
              </div>
            </section>

            {/* Seção Mixpanel Diagnostics & Lexicon */}
            <section className="space-y-8 border-t border-white/10 pt-16 text-left">
              <div className="space-y-2 text-center">
                <h2 className="font-electrolize text-3xl text-[var(--accent)] lowercase">diagnóstico & dicionário mixpanel (lexicon)</h2>
                <p className="font-mono text-sm opacity-60 lowercase max-w-2xl mx-auto">
                  baixe os esquemas de dados corrigidos para importação perfeita no mixpanel lexicon e teste a conectividade em tempo real do seu ambiente.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                {/* Download do Dicionário (Lexicon) */}
                <div className="bg-white/5 border border-white/10 p-6 rounded-lg space-y-6">
                  <div className="space-y-2">
                    <h3 className="font-electrolize text-xl text-neutral-200 lowercase">1. importação de dicionário (lexicon)</h3>
                    <p className="font-mono text-xs text-neutral-400 leading-relaxed lowercase">
                      o mixpanel rejeita o esquema de dados se os cabeçalhos de coluna não forem exatos. baixe os arquivos abaixo e envie-os nas seções respectivas do painel <strong>lexicon</strong> ("events" e "event properties").
                    </p>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <button 
                        type="button" 
                        onClick={handleDownloadEventsCsv} 
                        className="flex-1 font-mono text-xs uppercase tracking-wider py-3 bg-neutral-900 border border-neutral-700 text-neutral-300 hover:bg-neutral-800 hover:border-neutral-500 rounded transition-all text-center"
                      >
                        ↓ csv de eventos
                      </button>
                      <button 
                        type="button" 
                        onClick={handleDownloadPropertiesCsv} 
                        className="flex-1 font-mono text-xs uppercase tracking-wider py-3 bg-neutral-900 border border-neutral-700 text-neutral-300 hover:bg-neutral-800 hover:border-neutral-500 rounded transition-all text-center"
                      >
                        ↓ csv de propriedades
                      </button>
                    </div>
                    <button 
                      type="button" 
                      onClick={handleDownloadProfilePropertiesCsv} 
                      className="w-full font-mono text-xs uppercase tracking-wider py-3 bg-[#0d1c08] border border-emerald-800 text-emerald-300 hover:bg-emerald-950 hover:border-emerald-700 rounded transition-all text-center"
                    >
                      ↓ csv de propriedades de perfil (people/user)
                    </button>
                  </div>
                  
                  <div className="bg-black/30 p-4 rounded border border-white/5">
                    <h4 className="font-mono text-[10px] text-[var(--accent)] uppercase mb-1">como importar no mixpanel:</h4>
                    <ol className="list-decimal list-inside font-mono text-[10px] text-neutral-400 space-y-1 lowercase">
                      <li>acesse seu projeto no mixpanel.</li>
                      <li>vá para <strong>data management</strong> &gt; <strong>lexicon</strong>.</li>
                      <li>clique em <strong>import</strong> no canto superior direito.</li>
                      <li>escolha <strong>events</strong> e faça o upload do arquivo <code className="text-neutral-200">mixpanel_lexicon_events.csv</code>.</li>
                      <li>repita o processo escolhendo <strong>event properties</strong> para o arquivo <code className="text-neutral-200">mixpanel_lexicon_properties.csv</code>.</li>
                      <li>por fim, escolha <strong>user properties</strong> (ou profile properties) e envie o arquivo <code className="text-neutral-200">mixpanel_lexicon_profile_properties.csv</code>.</li>
                    </ol>
                  </div>
                </div>

                {/* Status e Teste de Eventos */}
                <div className="bg-white/5 border border-white/10 p-6 rounded-lg space-y-6 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-electrolize text-xl text-neutral-200 lowercase">2. diagnóstico de conexão em tempo real</h3>
                      <p className="font-mono text-xs text-neutral-400 leading-relaxed lowercase">
                        se os eventos não estiverem aparecendo no seu mixpanel dashboard (aba "live view"), verifique as credenciais abaixo e dispare um evento de teste direto da interface.
                      </p>
                    </div>

                    <div className="space-y-2 font-mono text-xs bg-black/40 p-4 rounded border border-white/5">
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-neutral-500">token:</span>
                        <span className="text-neutral-300 truncate max-w-[200px]" title={import.meta.env.VITE_MIXPANEL_TOKEN || 'Não configurado'}>
                          {import.meta.env.VITE_MIXPANEL_TOKEN ? `${import.meta.env.VITE_MIXPANEL_TOKEN.substring(0, 8)}...` : 'NÃO CONFIGURADO'}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 py-2">
                        <span className="text-neutral-500">região (servidor):</span>
                        <span className="text-neutral-300 uppercase font-semibold">
                          {import.meta.env.VITE_MIXPANEL_REGION || 'US (padrão)'}
                        </span>
                      </div>
                      <div className="flex justify-between pt-2">
                        <span className="text-neutral-500">api host:</span>
                        <span className="text-neutral-400 text-[10px]">
                          {(import.meta.env.VITE_MIXPANEL_REGION || 'US').toUpperCase() === 'EU' ? 'https://api-eu.mixpanel.com' : 'https://api-js.mixpanel.com'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={handleSendTestEvent}
                      disabled={isTestingMixpanel}
                      className="w-full font-mono text-xs uppercase tracking-wider py-3 bg-[var(--accent)] text-black font-semibold hover:opacity-90 rounded transition-all disabled:opacity-50"
                    >
                      {isTestingMixpanel ? 'enviando...' : '⚡ disparar evento de teste'}
                    </button>

                    {testEventStatus && (
                      <div className={`p-3 rounded font-mono text-[10px] border ${
                        testEventStatus.startsWith('sucesso') 
                          ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' 
                          : testEventStatus.startsWith('erro')
                            ? 'bg-red-950/40 border-red-500/30 text-red-300'
                            : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
                      }`}>
                        {testEventStatus}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

          </div>
        )}
      </div>
      <Toast message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} isDarkMode={true} />
    </div>
  );
};

export default PageBackoffice;
