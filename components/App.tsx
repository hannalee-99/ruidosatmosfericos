
import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import { ViewState } from '../types';
import { useTheme, useDataSeeding } from '../lib/hooks';
import { initAnalytics, trackPageView, trackLandingPageViewed } from './analytics';

// Layout & UI (Sempre necessários)
import Navigation from './Navigation';
import Splash from './Splash';
import CustomCursor from './CustomCursor';
import ObserverEffect from './ObserverEffect';
import FaviconManager from './FaviconManager';
import Footer from './Footer';
import BackToTop from './BackToTop';

// Pages (Carregadas sob demanda para otimizar TTI)
const LandingPage = lazy(() => import('./LandingPage'));
const PageMateria = lazy(() => import('./PageMateria'));
const PageManifesto = lazy(() => import('./PageManifestoV2'));
const PageSinais = lazy(() => import('./PageSinais'));
const PageEcos = lazy(() => import('./PageEcos'));
const PageAbout = lazy(() => import('./PageAbout'));
const PageConnect = lazy(() => import('./PageConnect'));
const PageBackoffice = lazy(() => import('./PageBackoffice'));

const PageLoader = () => (
  <div className="w-full h-screen flex items-center justify-center bg-black">
    <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const App: React.FC = () => {
  const [hasEntered, setHasEntered] = useState(false);
  const [view, setView] = useState<ViewState>(ViewState.LANDING);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const { isDarkMode, toggleTheme } = useTheme();
  
  useDataSeeding();

  useEffect(() => {
    initAnalytics();

    // Bloquear clique direito nas imagens para evitar downloads
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG' || target.closest('.no-download')) {
        e.preventDefault();
      }
    };

    // Bloquear arrastar imagens
    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG') {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('dragstart', handleDragStart);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('dragstart', handleDragStart);
    };
  }, []);

  // Atalhos de teclado globais para navegação
  useEffect(() => {
    if (!hasEntered) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ignorar se o usuário estiver digitando em campos de texto ou editáveis
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.isContentEditable
      ) {
        return;
      }

      // Se houver um detalhe ativo de obra ou sinal, a página cuida dos seus atalhos locais
      if (activeSlug !== null) {
        return;
      }

      // Evitar navegação acidental se estiver no painel administrativo
      if (view === ViewState.BACKOFFICE) {
        return;
      }

      const navItems = Object.values(ViewState).filter(v => v !== ViewState.BACKOFFICE);
      const currentIndex = navItems.indexOf(view);

      if (e.key === 'Escape') {
        if (view !== ViewState.LANDING) {
          e.preventDefault();
          setView(ViewState.LANDING);
        }
      } else if (e.key === 'ArrowRight') {
        if (currentIndex !== -1) {
          e.preventDefault();
          const nextIndex = (currentIndex + 1) % navItems.length;
          setView(navItems[nextIndex]);
        }
      } else if (e.key === 'ArrowLeft') {
        if (currentIndex !== -1) {
          e.preventDefault();
          const prevIndex = (currentIndex - 1 + navItems.length) % navItems.length;
          setView(navItems[prevIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [hasEntered, view, activeSlug]);

  useEffect(() => {
    const darkViews = [ViewState.BACKOFFICE, ViewState.MANIFESTO, ViewState.CONNECT];
    const isDarkView = darkViews.includes(view);
    const shouldBeLight = !isDarkMode && !isDarkView;
    
    if (shouldBeLight) {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }

    // Gerenciar transição de fundo para evitar pisca-pisca
    if (isDarkView) {
      document.body.style.transition = 'none';
      document.body.style.backgroundColor = '#050505';
    } else {
      document.body.style.transition = 'background-color 0.8s ease';
      document.body.style.backgroundColor = '';
    }
  }, [isDarkMode, view]);

  const getViewFromHash = useCallback(() => {
    const rawHash = window.location.hash.replace(/^#\/?/, '').replace(/\/$/, '');
    const decoded = decodeURIComponent(rawHash);
    const parts = decoded.split('/').map(p => p.replace(/\./g, ''));
    
    const baseViewStr = parts[0];
    const slug = parts[1] || null;

    const validView = Object.values(ViewState).find(v => v === baseViewStr) as ViewState;
    return { 
      view: validView || ViewState.LANDING, 
      slug 
    };
  }, []);

  useEffect(() => {
    const { view: initialView, slug } = getViewFromHash();
    if (initialView !== ViewState.LANDING) {
      setView(initialView);
      setActiveSlug(slug);
    }
  }, [getViewFromHash]);

  useEffect(() => {
    const syncState = () => {
      const { view: newView, slug } = getViewFromHash();
      setView(newView);
      setActiveSlug(slug);
    };

    window.addEventListener('hashchange', syncState);
    window.addEventListener('popstate', syncState);
    syncState();

    return () => {
      window.removeEventListener('hashchange', syncState);
      window.removeEventListener('popstate', syncState);
    };
  }, [getViewFromHash]);

  useEffect(() => {
    if (!hasEntered) {
      trackPageView('Splash Screen');
      return;
    }

    let targetHash = `#/${view}/`;
    
    if ((view === ViewState.MATERIA || view === ViewState.SINAIS) && activeSlug) {
      const cleanSlug = activeSlug.replace(/\./g, '');
      targetHash = `#/${view}/${cleanSlug}/`;
    }

    if (window.location.hash !== targetHash) {
      try {
        window.history.pushState({ view, slug: activeSlug }, '', targetHash);
      } catch (e) {
        window.location.hash = targetHash;
      }
    }
    
    const mainElement = document.getElementById('main-scroll');
    if (mainElement) {
      mainElement.scrollTo({ top: 0, behavior: 'smooth' });
    }

    trackPageView(view, activeSlug || undefined);
    if (view === ViewState.LANDING) {
      trackLandingPageViewed('home');
    }
  }, [view, activeSlug, hasEntered]);

  const handleEntry = () => {
    setHasEntered(true);
    const { view: currentView, slug } = getViewFromHash();
    setView(currentView);
    setActiveSlug(slug);
  };

  const renderView = () => {
    return (
      <Suspense fallback={<PageLoader />}>
        {(() => {
          switch (view) {
            case ViewState.LANDING: return <LandingPage onNavigate={setView} onSignalSelect={setActiveSlug} isDarkMode={isDarkMode} />;
            case ViewState.MATERIA: return <PageMateria isDarkMode={isDarkMode} workSlug={activeSlug} onNavigate={setView} onWorkSelect={setActiveSlug} />;
            case ViewState.MANIFESTO: return <PageManifesto onNavigate={setView} />;
            case ViewState.SINAIS: return <PageSinais isDarkMode={isDarkMode} activeSignalSlug={activeSlug} onSignalSelect={setActiveSlug} />;
            case ViewState.ECOS: return <PageEcos onNavigate={setView} isDarkMode={isDarkMode} />;
            case ViewState.ABOUT: return <PageAbout onNavigate={setView} isDarkMode={isDarkMode} />;
            case ViewState.CONNECT: return <PageConnect onNavigate={setView} />;
            case ViewState.BACKOFFICE: return <PageBackoffice onLogout={() => { setView(ViewState.LANDING); }} />;
            default: return null;
          }
        })()}
      </Suspense>
    );
  };

  if (!hasEntered) {
    return (
      <HelmetProvider>
        <Helmet>
          <title>ruídos atmosféricos</title>
          <meta name="description" content="ruídos atmosféricos é uma experiência imersiva de arte digital e manifesto artístico. registros de presença, sensações e desequilíbrio controlado entre o físico e o digital." />
          <meta property="og:title" content="ruídos atmosféricos" />
          <meta property="og:description" content="uma experiência imersiva de arte digital e manifesto artístico. registros de presença e desequilíbrio controlado entre o físico e o digital." />
          <meta property="og:image" content="https://64.media.tumblr.com/2469fc83feaecaf0b7a97fa55f6793d6/670f92e2b0934e32-bb/s2048x3072/3b1cf9f39410af90a8d0607d572f83c0024b2472.jpg" />
        </Helmet>
        <div className="relative w-full h-screen bg-black overflow-hidden">
          <FaviconManager />
          <CustomCursor />
          <Splash onEnter={handleEntry} />
        </div>
      </HelmetProvider>
    );
  }

  return (
    <HelmetProvider>
      <Helmet>
        <title>ruídos atmosféricos</title>
        <meta name="description" content="ruídos atmosféricos é uma experiência imersiva de arte digital e manifesto artístico. registros de presença, sensações e desequilíbrio controlado entre o físico e o digital." />
        <meta property="og:title" content="ruídos atmosféricos" />
        <meta property="og:description" content="uma experiência imersiva de arte digital e manifesto artístico. registros de presença e desequilíbrio controlado entre o físico e o digital." />
        <meta property="og:image" content="https://64.media.tumblr.com/2469fc83feaecaf0b7a97fa55f6793d6/670f92e2b0934e32-bb/s2048x3072/3b1cf9f39410af90a8d0607d572f83c0024b2472.jpg" />
      </Helmet>
      <div className="relative w-full h-[100dvh] overflow-hidden flex flex-col bg-[var(--bg)] text-[var(--text)] transition-colors duration-700">
        <FaviconManager />
        <CustomCursor />
        <ObserverEffect />

        {view !== ViewState.BACKOFFICE && (
          <Navigation currentView={view} onNavigate={setView} isDarkMode={isDarkMode} onToggleTheme={toggleTheme} />
        )}

        <main id="main-scroll" className="flex-grow relative z-10 h-full overflow-y-auto overflow-x-hidden scroll-smooth no-scrollbar">
          <div className="min-h-[100dvh] flex flex-col">
            <div className="flex-grow">{renderView()}</div>
            {view !== ViewState.BACKOFFICE && <Footer />}
          </div>
          <BackToTop targetId="main-scroll" />
        </main>
      </div>
    </HelmetProvider>
  );
};

export default App;
