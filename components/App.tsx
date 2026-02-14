
import React, { useState, useEffect, useCallback } from 'react';
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
import PageSensor from './PageSensor';
import PageAbout from './PageAbout';
import PageConnect from './PageConnect';
import PageBackoffice from './PageBackoffice';

const App: React.FC = () => {
  const [hasEntered, setHasEntered] = useState(false);
  const [view, setView] = useState<ViewState>(ViewState.LANDING);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const { isDarkMode, toggleTheme } = useTheme();
  
  useDataSeeding();

  // Gerenciamento centralizado da classe de tema
  useEffect(() => {
    // Força modo escuro se estiver no backoffice
    const shouldBeLight = !isDarkMode && view !== ViewState.BACKOFFICE;
    
    if (shouldBeLight) {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
  }, [isDarkMode, view]);

  const getViewFromHash = useCallback(() => {
    const rawHash = window.location.hash.replace(/^#\/?/, '');
    const decoded = decodeURIComponent(rawHash);
    const parts = decoded.split('/');
    
    const baseView = parts[0] as ViewState;
    const slug = parts[1] || null;

    const validView = Object.values(ViewState).find(v => v === baseView) as ViewState;
    return { 
      view: validView || ViewState.LANDING, 
      slug 
    };
  }, []);

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

    let targetHash = `#/${view}`;
    // Adiciona slug ao hash para Matéria ou Sinais
    if ((view === ViewState.MATERIA || view === ViewState.SINAIS) && activeSlug) {
      targetHash = `#/${view}/${activeSlug}`;
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
    setView(ViewState.LANDING);
    setActiveSlug(null);
  };

  const renderView = () => {
    switch (view) {
      case ViewState.LANDING: return <LandingPage onNavigate={setView} isDarkMode={isDarkMode} />;
      case ViewState.MATERIA: return <PageMateria isDarkMode={isDarkMode} workSlug={activeSlug} onNavigate={setView} onWorkSelect={setActiveSlug} />;
      case ViewState.MANIFESTO: return <PageManifesto isDarkMode={isDarkMode} />;
      case ViewState.SINAIS: return <PageSinais isDarkMode={isDarkMode} activeSignalSlug={activeSlug} onSignalSelect={setActiveSlug} />;
      case ViewState.INTERACTIVE: return <PageSensor />;
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
    </div>
  );
};

export default App;
