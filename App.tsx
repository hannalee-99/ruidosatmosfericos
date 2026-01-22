import React, { useState, useEffect, useRef } from 'react';
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
import { DEFAULT_IMAGE } from './constants';
import { INITIAL_DATA } from './initialData';

const App: React.FC = () => {
  const [hasEntered, setHasEntered] = useState(false);
  const [view, setView] = useState<ViewState>(ViewState.LANDING);
  const [activeBreadcrumb, setActiveBreadcrumb] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // Seeding: Carrega dados do arquivo initialData.ts para o IndexedDB
  useEffect(() => {
    const seedData = async () => {
      try {
        // --- 1. SEED OBRAS ---
        const existingWorks = await storage.getAll('works');
        if (existingWorks.length === 0 && INITIAL_DATA.works.length > 0) {
            console.log("Seeding Works from Initial Data...");
            for (const work of INITIAL_DATA.works) {
                await storage.save('works', work);
            }
        }

        // --- 2. SEED SINAIS (BLOG) ---
        const existingSignals = await storage.getAll('signals');
        if (existingSignals.length === 0 && INITIAL_DATA.signals.length > 0) {
            console.log("Seeding Signals from Initial Data...");
            for (const signal of INITIAL_DATA.signals) {
                await storage.save('signals', signal);
            }
        }

        // --- 3. SEED PERFIL (ABOUT) ---
        const currentProfile = await storage.get('about', 'profile');
        if (!currentProfile && INITIAL_DATA.about.profile) {
            console.log("Seeding Profile from Initial Data...");
            await storage.save('about', INITIAL_DATA.about.profile);
        }

        // --- 4. SEED CONEXÕES ---
        const currentConfig = await storage.get('about', 'connect_config');
        if (!currentConfig && INITIAL_DATA.about.connect_config) {
            console.log("Seeding Connections from Initial Data...");
            await storage.save('about', INITIAL_DATA.about.connect_config);
        }

        // --- 5. SEED METRICAS DO SENSOR (OLHOS) ---
        const currentSensor = await storage.get('about', 'sensor_metrics');
        if (!currentSensor && INITIAL_DATA.about.sensor_metrics) {
            console.log("Seeding Sensor Metrics from Initial Data...");
            await storage.save('about', INITIAL_DATA.about.sensor_metrics);
        }

      } catch (e) {
        console.error("Erro ao verificar dados iniciais:", e);
      }
    };

    seedData();
  }, []);

  // Deep Linking Check: Verifica se existe um parâmetro 'work' na URL para abrir a galeria diretamente
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('work')) {
        setHasEntered(true); // Pula splash screen
        setView(ViewState.MATERIA); // Vai direto para galeria
    }
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      document.documentElement.style.setProperty('--m-x', `${x}%`);
      document.documentElement.style.setProperty('--m-y', `${y}%`);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.add('light-mode');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // Wrapper para navegação que limpa o breadcrumb e scrolla para o topo
  const handleNavigate = (newView: ViewState) => {
    setView(newView);
    setActiveBreadcrumb(null);
    const mainElement = document.getElementById('main-scroll');
    if (mainElement) {
      mainElement.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleEnter = () => {
    setHasEntered(true);
  };

  const handleBackofficeLogout = () => {
    sessionStorage.removeItem('ra_auth');
    setHasEntered(false);
    setView(ViewState.LANDING);
    setActiveBreadcrumb(null);
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
        return <LandingPage onNavigate={handleNavigate} isDarkMode={isDarkMode} />;
      case ViewState.MATERIA:
        return <PageMateria isDarkMode={isDarkMode} setBreadcrumb={setActiveBreadcrumb} />;
      case ViewState.MANIFESTO:
        return <PageManifesto isDarkMode={isDarkMode} />;
      case ViewState.SINAIS:
        return <PageSinais isDarkMode={isDarkMode} setBreadcrumb={setActiveBreadcrumb} />;
      case ViewState.INTERACTIVE: // Agora 'medição' (Oculto, mas renderizável se selecionado)
        return <PageSensor />;
      case ViewState.ABOUT: // Agora '👁👁'
        return <PageAbout onNavigate={handleNavigate} />;
      case ViewState.CONNECT:
        return <PageConnect onNavigate={handleNavigate} />;
      case ViewState.BACKOFFICE:
        return <PageBackoffice onLogout={handleBackofficeLogout} />;
      default:
        return null;
    }
  };

  return (
    <div className={`relative w-full h-screen overflow-hidden flex flex-col ${isDarkMode ? 'bg-black text-white' : 'bg-offWhite text-black'} transition-colors duration-1000 animate-in fade-in duration-1000`}>
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
          breadcrumb={activeBreadcrumb}
          onNavigate={handleNavigate} 
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