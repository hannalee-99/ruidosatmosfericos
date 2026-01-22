
import React, { useState, useEffect } from 'react';
import { storage } from './storage';
import { SensorData } from '../types';

const PageSensor: React.FC = () => {
  const [presence, setPresence] = useState(0);
  const [synced, setSynced] = useState(false);
  const [clicks, setClicks] = useState(0);

  // Carrega dados iniciais do banco
  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const data: SensorData = await storage.get('about', 'sensor_metrics');
        if (data && typeof data.clicks === 'number') {
          setClicks(data.clicks);
        }
      } catch (e) {
        console.error("Erro ao carregar métricas do sensor", e);
      }
    };
    loadMetrics();

    const interval = setInterval(() => {
      setPresence(prev => Math.max(0, prev - 0.005));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const handleSync = async () => {
    if (synced) return;
    
    const newCount = clicks + 1;
    setClicks(newCount);
    
    // Salva no IndexedDB
    try {
        await storage.save('about', { id: 'sensor_metrics', clicks: newCount });
    } catch (e) {
        console.error("Erro ao salvar métrica", e);
    }
    
    setSynced(true);
    setTimeout(() => setSynced(false), 2000); 
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center space-y-16 px-6 md:px-12 text-left md:text-center py-24">
      <div 
        className="text-[8rem] md:text-[12rem] select-none transition-all duration-1000 ease-out cursor-pointer [.light-mode_&]:text-black"
        style={{ 
          opacity: 0.05 + (presence * 0.4),
          transform: `scale(${1 + presence * 0.2})`,
          filter: `blur(${10 - presence * 10}px)`
        }}
        onClick={() => setPresence(prev => Math.min(1, prev + 0.2))}
      >
        👁👁
      </div>
      
      <div className="space-y-8 max-w-md w-full flex flex-col items-start md:items-center">
        <p className="font-vt text-sm tracking-[0.4em] opacity-40 [.light-mode_&]:text-black">medindo pulsação de presença...</p>
        
        <div 
          className="w-full h-[2px] bg-neutral-800 relative cursor-none overflow-hidden rounded-full [.light-mode_&]:bg-neutral-300"
          onMouseMove={(e) => {
            setPresence(prev => Math.min(1, prev + 0.02));
          }}
        >
          <div 
            className="absolute top-0 left-0 h-full transition-all duration-300 rounded-full"
            style={{ 
              width: `${presence * 100}%`, 
              backgroundColor: 'var(--accent)',
              boxShadow: `0 0 20px var(--accent)`
            }}
          ></div>
        </div>

        <div className="font-vt text-[10px] opacity-30 h-4 [.light-mode_&]:text-black w-full text-left md:text-center">
          {presence > 0.8 ? "limiar de intenção atingido." : 
           presence > 0.3 ? "interferência detectada." : ""}
        </div>

        {/* Botão de Registro de Métrica */}
        <div className="opacity-100 translate-y-0 transition-all duration-500">
          <button
            onClick={handleSync}
            disabled={synced}
            className="border border-white/20 px-8 py-3 font-electrolize text-xs tracking-widest hover:bg-white/10 hover:border-white transition-all active:scale-95 rounded-full [.light-mode_&]:border-black/20 [.light-mode_&]:hover:bg-black/10 [.light-mode_&]:hover:border-black [.light-mode_&]:text-black"
            style={{ 
              color: synced ? 'var(--accent)' : 'inherit',
              borderColor: synced ? 'var(--accent)' : undefined
            }}
          >
            {synced ? `[ sinal ${clicks} ]` : 'registrar clique (métrica)'}
          </button>
        </div>
      </div>

      <div className="max-w-xs space-y-4 pt-12">
        <p className="font-vt text-[9px] opacity-20 leading-loose italic [.light-mode_&]:text-black">
          esta não é uma loja. este é um registro de quem ousou observar o ruído por tempo suficiente.
        </p>
      </div>
    </div>
  );
};

export default PageSensor;
