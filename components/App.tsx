
import React, { useState, useEffect, useCallback } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { ViewState } from '../types';
import { useTheme, useDataSeeding } from '../lib/hooks';

// Layout & UI
import Navigation from './Navigation';
import Splash from './Splash';
import CustomCursor from './CustomCursor';
import ObserverEffect from './ObserverEffect';
import GenerativeFavicon from './GenerativeFavicon';
import Footer from './Footer';

// Pages
import LandingPage from './LandingPage';
import PageMateria from './PageMateria';
import PageManifesto from './PageManifesto';
import PageSinais from './PageSinais';
import PageAbout from './PageAbout';
import PageConnect from './PageConnect';
import PageBackoffice from './PageBackoffice';

const App: React.FC = () => {
  const [hasEntered, setHasEntered] = useState(false);
  const [view, setView] = useState<ViewState>(ViewState.LANDING);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const { isDarkMode, toggleTheme } = useTheme();
  
  useDataSeeding();

  useEffect(() => {
    const shouldBeLight = !isDarkMode && view !== ViewState.BACKOFFICE;
    if (shouldBeLight) {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
  }, [isDarkMode, view]);

  const getViewFromHash = useCallback(() => {
    // Remove # e limpa possíveis caracteres residuais de encoding e pontos
    const rawHash = window.location.hash.replace(/^#\/?/, '').replace(/\/$/, '');
    const decoded = decodeURIComponent(rawHash);
    const parts = decoded.split('/').map(p => p.replace(/\./g, ''));
    
    const baseViewStr = parts[0];
    const slug = parts[1] || null;

    // Mapeia strings de URL para ViewState
    const validView = Object.values(ViewState).find(v => v === baseViewStr) as ViewState;
    return { 
      view: validView || ViewState.LANDING, 
      slug 
    };
  }, []);

  // Sincroniza estado inicial com a URL antes mesmo do Splash terminar
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
    if (!hasEntered) return;

    // Constrói a URL limpa conforme solicitado: #/materia/ ou #/materia/slug/
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
  }, [view, activeSlug, hasEntered]);

  const handleEntry = () => {
    setHasEntered(true);
    // Re-sincroniza ao entrar para garantir que deep links funcionem após o splash
    const { view: currentView, slug } = getViewFromHash();
    setView(currentView);
    setActiveSlug(slug);
  };

  const renderView = () => {
    switch (view) {
      case ViewState.LANDING: return <LandingPage onNavigate={setView} onSignalSelect={setActiveSlug} isDarkMode={isDarkMode} />;
      case ViewState.MATERIA: return <PageMateria isDarkMode={isDarkMode} workSlug={activeSlug} onNavigate={setView} onWorkSelect={setActiveSlug} />;
      case ViewState.MANIFESTO: return <PageManifesto isDarkMode={isDarkMode} />;
      case ViewState.SINAIS: return <PageSinais isDarkMode={isDarkMode} activeSignalSlug={activeSlug} onSignalSelect={setActiveSlug} />;
      case ViewState.ABOUT: return <PageAbout onNavigate={setView} isDarkMode={isDarkMode} />;
      case ViewState.CONNECT: return <PageConnect onNavigate={setView} />;
      case ViewState.BACKOFFICE: return <PageBackoffice onLogout={() => { setView(ViewState.LANDING); }} />;
      default: return null;
    }
  };

  if (!hasEntered) {
    return (
      <div className="relative w-full h-screen bg-black overflow-hidden">
        <GenerativeFavicon />
        <CustomCursor />
        <Splash onEnter={handleEntry} />
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col bg-[var(--bg)] text-[var(--text)] transition-colors duration-700">
      <GenerativeFavicon />
      <CustomCursor />
      <ObserverEffect />

      {view !== ViewState.BACKOFFICE && (
        <Navigation currentView={view} onNavigate={setView} isDarkMode={isDarkMode} onToggleTheme={toggleTheme} />
      )}

      <main id="main-scroll" className="flex-grow relative z-10 h-full overflow-y-auto overflow-x-hidden scroll-smooth no-scrollbar">
        <div className="min-h-screen flex flex-col">
          <div className="flex-grow">{renderView()}</div>
          {view !== ViewState.BACKOFFICE && <Footer />}
        </div>
      </main>
      <Analytics />
    </div>
  );
};

export default App;
