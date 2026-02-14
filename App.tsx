
import React, { useState, useEffect } from 'react';
import { ViewState } from './types';
import { useTheme, useDataSeeding } from './lib/hooks';

// Layout & UI
import NoiseBackground from './components/NoiseBackground';
import Navigation from './components/Navigation';
import Splash from './components/Splash';
import CustomCursor from './components/CustomCursor';
import ObserverEffect from './components/ObserverEffect';
import GenerativeFavicon from './components/GenerativeFavicon';
import Footer from './components/Footer';

// Pages
import LandingPage from './components/LandingPage';
import PageMateria from './components/PageMateria';
import PageManifesto from './components/PageManifesto';
import PageSinais from './components/PageSinais';
import PageSensor from './components/PageSensor';
import PageAbout from './components/PageAbout';
import PageConnect from './components/PageConnect';
import PageBackoffice from './components/PageBackoffice';

const App: React.FC = () => {
  const [hasEntered, setHasEntered] = useState(false);
  const [view, setView] = useState<ViewState>(ViewState.LANDING);
  const { isDarkMode, toggleTheme } = useTheme();
  useDataSeeding();

  useEffect(() => {
    const mainElement = document.getElementById('main-scroll');
    if (mainElement) mainElement.scrollTo({ top: 0, behavior: 'smooth' });
  }, [view]);

  if (!hasEntered) {
    return (
      <div className="relative w-full h-screen bg-black overflow-hidden">
        <GenerativeFavicon />
        <CustomCursor />
        <Splash onEnter={() => setHasEntered(true)} />
      </div>
    );
  }

  const renderView = () => {
    switch (view) {
      case ViewState.LANDING: return <LandingPage onNavigate={setView} isDarkMode={isDarkMode} />;
      case ViewState.MATERIA: return <PageMateria isDarkMode={isDarkMode} />;
      case ViewState.MANIFESTO: return <PageManifesto isDarkMode={isDarkMode} />;
      case ViewState.SINAIS: return <PageSinais isDarkMode={isDarkMode} />;
      case ViewState.INTERACTIVE: return <PageSensor />;
      case ViewState.ABOUT: return <PageAbout onNavigate={setView} isDarkMode={isDarkMode} />;
      case ViewState.CONNECT: return <PageConnect onNavigate={setView} />;
      case ViewState.BACKOFFICE: return <PageBackoffice onLogout={() => { sessionStorage.removeItem('ra_auth'); setView(ViewState.LANDING); }} />;
      default: return null;
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col">
      <GenerativeFavicon />
      <CustomCursor />
      <ObserverEffect />
      <NoiseBackground opacity={isDarkMode ? 0.3 : 0.1} />

      {view !== ViewState.BACKOFFICE && (
        <Navigation currentView={view} onNavigate={setView} isDarkMode={isDarkMode} onToggleTheme={toggleTheme} />
      )}

      <main id="main-scroll" className="flex-grow relative z-10 h-full overflow-y-auto overflow-x-hidden scroll-smooth">
        <div className="min-h-screen flex flex-col">
          <div className="flex-grow">{renderView()}</div>
          {view !== ViewState.BACKOFFICE && <Footer />}
        </div>
      </main>
    </div>
  );
};

export default App;
