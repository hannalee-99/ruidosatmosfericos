
import React, { useState, useEffect } from 'react';
import { ViewState } from './types';
import NoiseBackground from './components/NoiseBackground';
import Splash from './components/Splash';
import LandingPage from './components/LandingPage';
import Navigation from './components/Navigation';
import PageMateria from './components/PageMateria';
import PageManifesto from './components/PageManifesto';
import PageSinais from './components/PageSinais';
import PageSensor from './components/PageSensor';
import PageAbout from './components/PageAbout';
import PageConnect from './components/PageConnect';
import PageBackoffice from './components/PageBackoffice';
import CustomCursor from './components/CustomCursor';
import ObserverEffect from './components/ObserverEffect';
import GenerativeFavicon from './components/GenerativeFavicon';
import Footer from './components/Footer';
import { storage } from './components/storage';
import { INITIAL_DATA } from './initialData';

const App: React.FC = () => {
  const [hasEntered, setHasEntered] = useState(false);
  const [view, setView] = useState<ViewState>(ViewState.LANDING);
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  useEffect(() => {
    const seedData = async () => {
      try {
        const existingWorks = await storage.getAll('works');
        if (existingWorks.length === 0 && INITIAL_DATA.works.length > 0) {
            for (const work of INITIAL_DATA.works) {
                await storage.save('works', work);
            }
        }

        const existingSignals = await storage.getAll('signals');
        if (existingSignals.length === 0 && INITIAL_DATA.signals.length > 0) {
            for (const signal of INITIAL_DATA.signals) {
                await storage.save('signals', signal);
            }
        }

        const currentProfile = await storage.get('about', 'profile');
        if (!currentProfile && INITIAL_DATA.about.profile) {
            await storage.save('about', INITIAL_DATA.about.profile);
        }

        const currentConfig = await storage.get('about', 'connect_config');
        if (!currentConfig && INITIAL_DATA.about.connect_config) {
            await storage.save('about', INITIAL_DATA.about.connect_config);
        }

        const currentSensor = await storage.get('about', 'sensor_metrics');
        if (!currentSensor && INITIAL_DATA.about.sensor_metrics) {
            await storage.save('about', INITIAL_DATA.about.sensor_metrics);
        }
      } catch (e) {
        console.error("Erro ao verificar dados iniciais:", e);
      }
    };
    seedData();
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.add('light-mode');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  useEffect(() => {
    const mainElement = document.getElementById('main-scroll');
    if (mainElement) {
      mainElement.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [view]);

  const handleEnter = () => {
    setHasEntered(true);
  };

  const handleBackofficeLogout = () => {
    sessionStorage.removeItem('ra_auth');
    setHasEntered(false);
    setView(ViewState.LANDING);
  };

  if (!hasEntered) {
    return (
      <div className="relative w-full h-screen bg-black overflow-hidden">
        <GenerativeFavicon />
        <CustomCursor />
        <div className="opacity-0">
           <NoiseBackground opacity={0} muted={true} /> 
        </div>
        <Splash onEnter={handleEnter} />
      </div>
    );
  }

  const renderContent = () => {
    switch (view) {
      case ViewState.LANDING:
        return <LandingPage onNavigate={setView} isDarkMode={isDarkMode} />;
      case ViewState.MATERIA:
        return <PageMateria isDarkMode={isDarkMode} />;
      case ViewState.MANIFESTO:
        return <PageManifesto isDarkMode={isDarkMode} />;
      case ViewState.SINAIS:
        return <PageSinais isDarkMode={isDarkMode} />;
      case ViewState.INTERACTIVE:
        return <PageSensor />;
      case ViewState.ABOUT:
        return <PageAbout onNavigate={setView} isDarkMode={isDarkMode} />;
      case ViewState.CONNECT:
        return <PageConnect onNavigate={setView} />;
      case ViewState.BACKOFFICE:
        return <PageBackoffice onLogout={handleBackofficeLogout} />;
      default:
        return null;
    }
  };

  return (
    <div className={`relative w-full h-screen overflow-hidden flex flex-col transition-colors duration-1000 animate-in fade-in`}>
      <GenerativeFavicon />
      <CustomCursor />
      <ObserverEffect />
      
      <NoiseBackground 
        opacity={isDarkMode ? 0.3 : 0.1} 
        muted={true} 
      />

      {view !== ViewState.BACKOFFICE && (
        <Navigation 
          currentView={view} 
          onNavigate={setView} 
          isDarkMode={isDarkMode} 
          onToggleTheme={toggleTheme} 
        />
      )}

      <main 
        id="main-scroll"
        className="flex-grow relative z-10 h-full overflow-y-auto overflow-x-hidden scroll-smooth"
      >
        <div className="min-h-screen flex flex-col">
          <div className="flex-grow">
             {renderContent()}
          </div>
          {view !== ViewState.BACKOFFICE && <Footer />}
        </div>
      </main>

      <div className="fixed inset-0 pointer-events-none z-[200] opacity-[0.03]">
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <filter id="noiseFilter">
            <feTurbulence 
              type="fractalNoise" 
              baseFrequency="0.75" 
              numOctaves="3" 
              stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noiseFilter)" />
        </svg>
      </div>
    </div>
  );
};

export default App;
