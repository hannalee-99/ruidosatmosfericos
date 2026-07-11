import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ViewState, EcoLink, BioConfig, AboutData } from '../types';
import { trackExternalClicked, trackSocialLinkClicked } from './analytics';
import { storage } from '../lib/storage';
import { DEFAULT_IMAGE } from '../constants';
import { ArrowUpRight, Sparkles, Copy, Check, Share2 } from 'lucide-react';

interface PageBioProps {
  onNavigate: (view: ViewState) => void;
  isDarkMode: boolean;
}

const PageBio: React.FC<PageBioProps> = ({ onNavigate, isDarkMode }) => {
  const [bioConfig, setBioConfig] = useState<BioConfig>({ id: 'bio_config', links: [] });
  const [profile, setProfile] = useState<AboutData | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Carrega as configurações dos links do Bio
        const config = await storage.get('about', 'bio_config') as BioConfig | null;
        if (config) {
          setBioConfig(config);
        } else {
          setBioConfig({
            id: 'bio_config',
            bio: 'fragmentos, ruídos e ritos atmosféricos. objetos de estudo e presença.',
            links: [
              { 
                id: '01', 
                title: 'site oficial', 
                description: 'portfólio, manifesto e sinais atmosféricos',
                url: 'https://ruidosatmosfericos.com',
                status: 'ativo',
                emoji: '⚡'
              },
              { 
                id: '02', 
                title: 'colab55', 
                description: 'impressões e objetos de ritos',
                url: 'https://www.colab55.com/@ruidosatmosfericos',
                status: 'ativo',
                emoji: '🎨'
              },
              { 
                id: '03', 
                title: 'pinterest', 
                description: 'fragmentos de processo e ruídos',
                url: 'https://br.pinterest.com/ruidosatmosfericos01/',
                status: 'ativo',
                emoji: '📌'
              },
            ]
          });
        }

        // Carrega a foto de perfil do about
        const profileData = await storage.get('about', 'profile') as AboutData | null;
        if (profileData) {
          setProfile(profileData);
        }
      } catch (e) {
        console.error("Erro ao carregar dados do bio", e);
      }
    };
    loadData();
  }, []);

  const handleCopyPageLink = () => {
    const pageUrl = `${window.location.origin}/#${ViewState.BIO}`;
    navigator.clipboard.writeText(pageUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyIndividualLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(id);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const formatImageUrl = (url: string) => {
    if (!url || url.trim() === '') return DEFAULT_IMAGE;
    return url;
  };

  const visibleLinks = (bioConfig.links || []).filter(l => l.visible !== false);
  const activeLinks = visibleLinks.filter(l => l.status === 'ativo');
  const inactiveLinks = visibleLinks.filter(l => l.status !== 'ativo');

  return (
    <div className="relative w-full min-h-screen flex flex-col bg-[var(--bg)] text-white [.light-mode_&]:text-[#111] pt-24 pb-20 md:pt-32 md:pb-24 px-4 md:px-8 selection:bg-[var(--accent)] selection:text-black overflow-x-hidden">
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

      <div className="relative z-10 max-w-lg w-full mx-auto flex flex-col items-center animate-in fade-in duration-700">
        
        {/* Floating Share Button at top right of the container */}
        <div className="w-full flex justify-end mb-6">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleCopyPageLink}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-mono uppercase tracking-wider text-white/60 hover:text-[var(--accent)] hover:border-[var(--accent)]/30 transition-all shadow-lg backdrop-blur-md [.light-mode_&]:bg-black/5 [.light-mode_&]:border-black/10 [.light-mode_&]:text-black/60 [.light-mode_&]:hover:text-black [.light-mode_&]:hover:border-black"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>link copiado!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>compartilhar bio</span>
              </>
            )}
          </motion.button>
        </div>

        {/* Profile Card Header */}
        <header className="flex flex-col items-center text-center mb-10 w-full">
          {/* Avatar frame */}
          <div className="relative mb-6 group">
            {/* Spinning/pulsing aura */}
            <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-[var(--accent)]/40 to-yellow-500/20 opacity-70 blur-md group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
            
            <div className="relative w-28 h-28 rounded-full overflow-hidden border-2 border-[var(--accent)]/80 shadow-[0_0_20px_rgba(var(--accent-rgb),0.25)] bg-black flex-shrink-0">
              <img 
                src={profile ? formatImageUrl(profile.imageUrl) : DEFAULT_IMAGE} 
                alt="ruídos atmosféricos" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          <h1 className="font-electrolize text-2xl tracking-tighter lowercase text-white [.light-mode_&]:text-black font-semibold flex items-center gap-2">
            {bioConfig.profileTitle || 'ruídos atmosféricos'}
            <div className="w-2 h-2 rounded-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent)] animate-pulse"></div>
          </h1>

          <p className="font-mono text-[10px] uppercase tracking-[0.3em] opacity-40 mt-1 hover:opacity-100 transition-opacity cursor-pointer lowercase">
            {bioConfig.profileHandle || '@ruidosatmosfericos'}
          </p>

          <p className="font-mono text-xs opacity-60 mt-4 leading-relaxed max-w-sm lowercase">
            {bioConfig.bio || 'fragmentos, ruídos e ritos atmosféricos. objetos de estudo e presença.'}
          </p>
        </header>

        {/* Button Stack */}
        <div className="w-full space-y-4 flex flex-col">
          
          {/* MAIN WEBSITE LINK (SPECIAL REDIRECT - GETS THE WHOLE EXPERIENCE) */}
          {(bioConfig.premiumLinkVisible !== false) && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              {/* Background neon pulse for premium link */}
              <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-[var(--accent)] to-teal-500 opacity-20 blur-sm"></div>
              
              <button
                onClick={() => onNavigate(ViewState.LANDING)}
                className="relative w-full flex items-center justify-between p-5 bg-black/80 hover:bg-black/90 border-2 border-[var(--accent)] rounded-2xl transition-all duration-300 shadow-[0_0_15px_rgba(var(--accent-rgb),0.15)] group/btn"
              >
                <div className="flex items-center gap-4 text-left">
                  <span className="text-2xl">{bioConfig.premiumLinkEmoji ?? '⚡'}</span>
                  <div>
                    <h3 className="font-electrolize text-base text-[var(--accent)] tracking-tight lowercase leading-tight font-bold group-hover/btn:translate-x-1 transition-transform">
                      {bioConfig.premiumLinkText ?? 'entrar no site (experiência completa)'}
                    </h3>
                    <p className="font-mono text-[10px] text-white/50 lowercase mt-0.5">
                      {bioConfig.premiumLinkDesc ?? 'acesso completo com splash screen e portfólio imersivo'}
                    </p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-[var(--accent)] opacity-60 group-hover/btn:opacity-100 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-all flex-shrink-0" />
              </button>
            </motion.div>
          )}

          {/* DYNAMIC USER-ADDED LINKS */}
          <AnimatePresence mode="popLayout">
            {activeLinks.map((link, idx) => {
              const isFeatured = link.isFeatured;
              return (
                <motion.div
                  key={link.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.05 * (idx + 1) }}
                  className="relative group/wrapper"
                >
                  {isFeatured && (
                    <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[var(--accent)] via-yellow-500 to-[var(--accent)] opacity-30 blur-md animate-pulse"></div>
                  )}

                  <div className={`relative w-full flex items-center justify-between p-5 bg-white/5 border rounded-2xl transition-all duration-500 group/btn hover:bg-white/10 ${
                    isFeatured 
                      ? 'border-[var(--accent)]/60 shadow-[0_0_15px_rgba(var(--accent-rgb),0.1)]' 
                      : 'border-white/10 hover:border-[var(--accent)]/30'
                  } [.light-mode_&]:bg-black/5 [.light-mode_&]:border-black/10 [.light-mode_&]:hover:bg-black/10`}>
                    
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-grow flex items-center gap-4 text-left cursor-pointer"
                      onClick={() => {
                        trackExternalClicked(link.title, link.url);
                        trackSocialLinkClicked(link.title, link.url, link.title.toLowerCase());
                      }}
                    >
                      {link.emoji ? (
                        <span className="text-2xl select-none">{link.emoji}</span>
                      ) : (
                        <span className="text-xl select-none text-[var(--accent)]">🔗</span>
                      )}
                      
                      <div>
                        <h3 className="font-electrolize text-base text-white [.light-mode_&]:text-black tracking-tight lowercase leading-tight group-hover/btn:text-[var(--accent)] transition-colors flex items-center gap-2">
                          {link.title}
                          {isFeatured && (
                            <span className="text-[9px] uppercase tracking-wider font-mono text-black bg-[var(--accent)] px-1.5 py-0.5 rounded flex items-center gap-0.5 font-bold shadow-sm animate-bounce">
                              <Sparkles className="w-2 h-2 fill-current" />
                              destaque
                            </span>
                          )}
                        </h3>
                        {link.description && (
                          <p className="font-mono text-[10px] text-white/40 [.light-mode_&]:text-black/40 lowercase mt-0.5 leading-relaxed max-w-[280px] md:max-w-[340px]">
                            {link.description}
                          </p>
                        )}
                      </div>
                    </a>

                    <div className="flex items-center gap-1.5 ml-2">
                      {/* Copy individual link button */}
                      <button
                        onClick={() => handleCopyIndividualLink(link.url, link.id)}
                        className="p-1.5 rounded-lg opacity-0 group-hover/btn:opacity-100 text-white/30 hover:text-white hover:bg-white/10 transition-all [.light-mode_&]:text-black/30 [.light-mode_&]:hover:text-black [.light-mode_&]:hover:bg-black/5"
                        title="copiar este link"
                      >
                        {copiedLink === link.id ? (
                          <Check className="w-3.5 h-3.5 text-[var(--accent)]" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                          trackExternalClicked(link.title, link.url);
                          trackSocialLinkClicked(link.title, link.url, link.title.toLowerCase());
                        }}
                      >
                        <ArrowUpRight className="w-4 h-4 text-white/50 [.light-mode_&]:text-black/50 group-hover/btn:text-[var(--accent)] group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-all flex-shrink-0" />
                      </a>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* INACTIVE / PLANNING LINKS (PLACEHOLDERS) */}
          {inactiveLinks.map((link) => (
            <div
              key={link.id}
              className="w-full flex items-center justify-between p-5 bg-white/[0.01] border border-white/5 rounded-2xl opacity-30 select-none cursor-not-allowed [.light-mode_&]:bg-black/[0.01] [.light-mode_&]:border-black/5"
            >
              <div className="flex items-center gap-4 text-left">
                <span className="text-xl filter grayscale">⚙️</span>
                <div>
                  <h3 className="font-electrolize text-base text-white/60 [.light-mode_&]:text-black/60 tracking-tight lowercase leading-tight">
                    {link.title}
                  </h3>
                  <p className="font-mono text-[9px] uppercase tracking-widest text-[var(--accent)]/50 mt-1 italic">
                    [{link.status}]
                  </p>
                </div>
              </div>
            </div>
          ))}

          {bioConfig.links.length === 0 && (
            <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl opacity-40 font-mono text-xs lowercase">
              nenhum link disponível ainda. acesse o backoffice para gerenciar seus canais.
            </div>
          )}
        </div>

        {/* Footer / Back to Landing Navigation */}
        <footer className="mt-16 text-center space-y-4">
          <div className="w-12 h-px bg-white/10 mx-auto"></div>
          <button 
            onClick={() => onNavigate(ViewState.LANDING)}
            className="font-mono text-[9px] uppercase tracking-[0.35em] text-white/40 hover:text-[var(--accent)] transition-colors lowercase"
          >
            {bioConfig.backButtonText || '← voltar ao portal principal'}
          </button>
          <p className="font-mono text-[9px] text-white/20 select-none">
            {bioConfig.footerText || 'ruídos atmosféricos // todos os direitos reservados'}
          </p>
        </footer>

      </div>
    </div>
  );
};

export default PageBio;
