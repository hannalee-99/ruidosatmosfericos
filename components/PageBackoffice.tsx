
import React, { useState, useEffect } from 'react';
import { storage } from '../lib/storage';
import { Work, Signal, AboutData, ConnectConfig } from '../types';
import { MONTH_NAMES, DEFAULT_IMAGE } from '../constants';
import NeobrutalistButton from './NeobrutalistButton';

interface PageBackofficeProps {
  onLogout: () => void;
}

// Componente Administrativo para gestão de conteúdo
const PageBackoffice: React.FC<PageBackofficeProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'works' | 'signals' | 'profile' | 'connect'>('works');
  const [works, setWorks] = useState<Work[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [profile, setProfile] = useState<AboutData | null>(null);
  const [connect, setConnect] = useState<ConnectConfig | null>(null);

  // Carrega todos os dados necessários para o gerenciamento
  useEffect(() => {
    const fetchData = async () => {
      try {
        const w = await storage.getAll('works');
        const s = await storage.getAll('signals');
        const p = await storage.get('about', 'profile');
        const c = await storage.get('about', 'connect_config');
        setWorks(w);
        setSignals(s);
        setProfile(p);
        setConnect(c);
      } catch (e) {
        console.error("Erro ao carregar dados do backoffice:", e);
      }
    };
    fetchData();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (profile) {
      await storage.save('about', profile);
      alert('perfil atualizado com sucesso');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono p-8 pt-24 selection:bg-[var(--accent)] selection:text-black">
      <header className="flex justify-between items-center mb-12 border-b border-white/10 pb-8">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold tracking-tighter uppercase">fluxo /// backoffice</h1>
          <span className="text-[10px] opacity-30 lowercase">sistema de gestão existencial v3.1</span>
        </div>
        <button 
          onClick={onLogout} 
          className="text-xs opacity-50 hover:opacity-100 hover:text-red-500 transition-colors uppercase tracking-widest px-4 py-2 border border-white/10 rounded-full"
        >
          encerrar sessão [x]
        </button>
      </header>

      {/* Tabs de Navegação */}
      <div className="flex gap-8 mb-12 overflow-x-auto pb-2">
        {(['works', 'signals', 'profile', 'connect'] as const).map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-sm uppercase tracking-[0.3em] pb-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === tab ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-transparent opacity-40 hover:opacity-100'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Gestão de Obras */}
        {activeTab === 'works' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl text-[var(--accent)] lowercase font-electrolize">gestão de matéria</h2>
            </div>
            {works.length > 0 ? works.map(w => (
              <div key={w.id} className="p-4 border border-white/10 flex justify-between items-center hover:bg-white/5 transition-colors rounded-lg group">
                <div className="flex flex-col">
                  <span className="text-sm">{w.title}</span>
                  <span className="text-[10px] opacity-30">{w.year} — {w.technique}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-[10px] uppercase tracking-widest ${w.status === 'disponível' ? 'text-green-500' : 'text-yellow-500'}`}>{w.status}</span>
                  <button className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] border border-white/20 px-2 py-1 rounded">editar</button>
                </div>
              </div>
            )) : <p className="opacity-40 italic">nenhuma obra catalogada.</p>}
          </div>
        )}

        {/* Gestão de Sinais (Blog) */}
        {activeTab === 'signals' && (
          <div className="space-y-4">
             <h2 className="text-xl mb-6 text-[var(--accent)] lowercase font-electrolize">captura de sinais</h2>
             {signals.length > 0 ? signals.map(s => (
               <div key={s.id} className="p-4 border border-white/10 flex justify-between items-center hover:bg-white/5 transition-colors rounded-lg group">
                 <div className="flex flex-col">
                    <span className="text-sm">{s.title}</span>
                    <span className="text-[10px] opacity-30">{s.date}</span>
                 </div>
                 <span className={`text-[10px] uppercase tracking-widest ${s.status === 'publicado' ? 'text-green-500' : 'text-yellow-500'}`}>{s.status}</span>
               </div>
             )) : <p className="opacity-40 italic">nenhum sinal captado.</p>}
          </div>
        )}

        {/* Perfil (About) */}
        {activeTab === 'profile' && profile && (
          <form onSubmit={handleSaveProfile} className="space-y-8">
            <h2 className="text-xl text-[var(--accent)] lowercase font-electrolize">configuração de essência</h2>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase opacity-40 tracking-widest">manifesto pessoal</label>
              <textarea 
                value={profile.text}
                onChange={e => setProfile({...profile, text: e.target.value})}
                className="bg-neutral-900 border border-white/10 p-4 h-64 focus:border-[var(--accent)] outline-none transition-colors rounded-lg text-sm leading-relaxed"
                placeholder="descreva sua trajetória..."
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase opacity-40 tracking-widest">url da imagem de perfil</label>
              <input 
                type="text"
                value={profile.imageUrl}
                onChange={e => setProfile({...profile, imageUrl: e.target.value})}
                className="bg-neutral-900 border border-white/10 p-4 focus:border-[var(--accent)] outline-none transition-colors rounded-lg text-sm"
              />
            </div>
            <NeobrutalistButton variant="matrix" type="submit" className="w-full md:w-auto">salvar alterações de sistema</NeobrutalistButton>
          </form>
        )}

        {/* Canais de Conexão */}
        {activeTab === 'connect' && (
          <div className="space-y-8">
             <h2 className="text-xl text-[var(--accent)] lowercase font-electrolize">terminais de rede</h2>
             <div className="p-6 border border-white/10 bg-neutral-900/50 rounded-xl">
                <p className="text-[10px] opacity-40 uppercase tracking-widest mb-4">email de contato seguro</p>
                <p className="text-lg font-bold">{connect?.email || "não configurado"}</p>
             </div>
             
             <div className="space-y-4">
                <p className="text-[10px] opacity-40 uppercase tracking-widest">links externos ativos</p>
                {connect?.links && connect.links.length > 0 ? connect.links.map(l => (
                   <div key={l.id} className="p-4 border border-white/5 bg-neutral-900/20 flex justify-between items-center rounded-lg">
                      <span className="text-sm font-electrolize">{l.label}</span>
                      <span className="text-[10px] opacity-30 truncate ml-4">{l.url}</span>
                   </div>
                )) : <p className="opacity-20 italic text-xs">nenhum uplink disponível.</p>}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PageBackoffice;
