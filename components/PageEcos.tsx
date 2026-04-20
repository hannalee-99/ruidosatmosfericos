
import React from 'react';
import { motion } from 'motion/react';
import { ViewState } from '../types';
import NeobrutalistButton from './NeobrutalistButton';

interface PageEcosProps {
  onNavigate: (view: ViewState) => void;
  isDarkMode: boolean;
}

const PageEcos: React.FC<PageEcosProps> = ({ onNavigate, isDarkMode }) => {
  const items = [
    { 
      id: '01', 
      title: 'colab55', 
      description: 'impressões e objetos de ritos',
      url: 'https://www.colab55.com/@ruidosatmosfericos',
      status: 'ativo'
    },
    { 
      id: '02', 
      title: 'instagram', 
      description: 'fragmentos de processo e ruídos',
      url: 'https://www.instagram.com/ruidosatmosfericos/',
      status: 'ativo'
    },
    { 
      id: '03', 
      title: 'redbubble', 
      status: 'mapeando'
    },
  ];

  return (
    <div className="relative w-full min-h-screen flex flex-col pt-32 pb-24 px-6 md:px-12 selection:bg-[var(--accent)] selection:text-black">
      {/* Immersive Background Layers */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
        <div 
          className="absolute inset-0 opacity-[0.1] [.light-mode_&]:opacity-[0.05]" 
          style={{ 
            backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        ></div>
      </div>
      
      <div className="relative z-10 max-w-6xl mx-auto w-full">
        <header className="mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className={`font-nabla text-7xl md:text-9xl lowercase tracking-tighter leading-[0.85] ${isDarkMode ? 'palette-matrix' : 'palette-matrix-blue'}`}
          >
            ecos
          </motion.h1>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 * index }}
              className="group relative flex flex-col p-8 bg-[var(--bg)] border border-current/10 hover:border-[var(--accent)]/30 transition-all duration-700 min-h-[300px] overflow-hidden rounded-xl"
            >
              {/* Scanline Hover Effect */}
              <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-[0.03] transition-opacity duration-700 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px]"></div>
              
              {/* Content */}
              <div className={`flex-grow flex flex-col ${item.status === 'mapeando' ? 'items-center justify-center text-center' : 'space-y-6 pt-6'}`}>
                {item.status === 'mapeando' ? (
                   <div className="space-y-4">
                      <h3 className="font-electrolize text-3xl md:text-4xl tracking-tighter lowercase opacity-40">
                        {item.title}
                      </h3>
                      <div className="flex items-center justify-center gap-2">
                         <div className="w-1 h-1 rounded-full bg-current opacity-20"></div>
                         <span className="font-mono text-[9px] uppercase tracking-[0.3em] opacity-30 italic">{item.status}</span>
                      </div>
                   </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2">
                         <div className={`w-1.5 h-1.5 rounded-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent)] animate-pulse`}></div>
                         <span className="font-mono text-[9px] uppercase tracking-tighter opacity-30">{item.status}</span>
                      </div>
                    </div>

                    <h3 className="font-electrolize text-3xl md:text-4xl tracking-tighter lowercase group-hover:text-[var(--accent)] transition-colors duration-700 leading-none">
                      {item.title}
                    </h3>
                    <p className="font-mono text-xs opacity-40 leading-relaxed lowercase text-left relative max-w-[240px]">
                      {item.description}
                    </p>
                  </>
                )}
              </div>

              {/* Action */}
              {item.status === 'ativo' && item.url && (
                <div className="mt-8 flex justify-start">
                  <a 
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <NeobrutalistButton
                      variant="matrix"
                      className="text-xs md:text-sm tracking-[0.3em] px-12 py-4 font-mono lowercase"
                    >
                      acessar
                    </NeobrutalistButton>
                  </a>
                </div>
              )}

              {/* Brutalist Corner Accents */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-current/20 group-hover:border-[var(--accent)]/40 transition-colors"></div>
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-current/20 group-hover:border-[var(--accent)]/40 transition-colors"></div>
            </motion.div>
          ))}
        </section>
      </div>
    </div>
  );
};

export default PageEcos;
