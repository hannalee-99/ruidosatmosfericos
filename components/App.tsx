
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

const App: React.FC = () => {
  const [hasEntered, setHasEntered] = useState(false);
  const [view, setView] = useState<ViewState>(ViewState.LANDING);
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // Seeding: Adicionar obras, sinais e perfil iniciais
  useEffect(() => {
    const seedData = async () => {
      try {
        // --- 1. SEED OBRAS ---
        const existingWorks = await storage.getAll('works');
        
        const worksToSeed = [
          {
            title: 'ruídos de perto',
            year: '2024',
            month: '11', // Dezembro
            technique: 'acrílica sobre painel',
            dimensions: '50x50 cm',
            imageUrl: 'https://64.media.tumblr.com/2469fc83feaecaf0b7a97fa55f6793d6/670f92e2b0934e32-bb/s2048x3072/3b1cf9f39410af90a8d0607d572f83c0024b2472.jpg',
            isFeatured: true
          },
          {
            title: 'essência na ionosfera',
            year: '2025',
            month: '2', // Março
            technique: 'acrílica sobre tela',
            dimensions: '70x60 cm',
            imageUrl: 'https://64.media.tumblr.com/b66d6bd4a439ffdcc801f7dab1e05667/eed33f511f0fbd92-86/s2048x3072/d7031cbe671309845c127778c351178555843cc5.jpg',
            isFeatured: true
          },
          {
            title: 'frequência residual',
            year: '2025',
            month: '4', // Maio
            technique: 'óleo sobre tela',
            dimensions: '80x100 cm',
            imageUrl: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=2070&auto=format&fit=crop',
            isFeatured: false
          },
          {
            title: 'eco magnético',
            year: '2024',
            month: '8', // Setembro
            technique: 'mista sobre papel',
            dimensions: '40x30 cm',
            imageUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop',
            isFeatured: false
          },
          {
            title: 'silêncio comprimido',
            year: '2023',
            month: '11', // Dezembro
            technique: 'carvão e acrílica',
            dimensions: '120x120 cm',
            imageUrl: 'https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?q=80&w=1974&auto=format&fit=crop',
            isFeatured: true
          }
        ];

        for (const seed of worksToSeed) {
          const exists = existingWorks.some((w: any) => w.title === seed.title);
          if (!exists) {
            await storage.save('works', {
              id: `seed-work-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              title: seed.title,
              year: seed.year,
              month: seed.month,
              technique: seed.technique,
              dimensions: seed.dimensions,
              imageUrl: seed.imageUrl,
              gallery: [],
              status: 'disponível',
              isVisible: true,
              isFeatured: seed.isFeatured,
              views: 0
            });
          }
        }

        // --- 2. SEED SINAIS (BLOG) ---
        const existingSignals = await storage.getAll('signals');
        if (existingSignals.length === 0) {
           const signalsToSeed = [
             {
               id: 'signal-macro-vision-v2', 
               title: 'nunca esquecer',
               subtitle: 'não perca a visão macro!!! a descida da consciência através das camadas da matéria.',
               date: '13/03/2025',
               status: 'publicado',
               views: 12,
               blocks: [
                 {
                   id: 'b-diagram',
                   type: 'image',
                   content: 'https://theosophy.wiki/en/images/thumb/7/7b/Diagram_of_Principles_1890.jpg/400px-Diagram_of_Principles_1890.jpg',
                   caption: 'source > soul > mind > body > earth'
                 },
                 {
                   id: 'b-calder',
                   type: 'image',
                   content: 'https://uploads4.wikiart.org/images/alexander-calder/balloons.jpg',
                   caption: 'alexander calder: balloons'
                 },
                 {
                   id: 'b-sonic',
                   type: 'image',
                   content: 'https://www.inhotim.org.br/uploads/2021/04/doug-aitken-sonic-pavilion-2009-inhotim-foto-daniela-paoliello.jpg',
                   caption: 'doug aitken: sonic pavilion (inhotim)'
                 },
                 {
                   id: 'b-noise',
                   type: 'image',
                   content: 'https://upload.wikimedia.org/wikipedia/commons/c/ce/WMAP_2010.png',
                   caption: 'fundo cósmico de micro-ondas'
                 }
               ]
             },
             {
               id: 'signal-tarsila-grid',
               title: 'antropofagia',
               subtitle: 'tarsila do amaral e a digestão do moderno.',
               date: '14/03/2025',
               status: 'publicado',
               views: 4,
               blocks: [
                 {
                    id: 'b-txt-1',
                    type: 'text',
                    content: 'a cor não é apenas superfície, é estrutura. o brasil digeriu o moderno e devolveu o tropical, o onírico e o monstruoso.'
                 },
                 {
                   id: 'b-abaporu',
                   type: 'image',
                   content: 'https://upload.wikimedia.org/wikipedia/en/e/e8/Abaporu.jpg',
                   caption: 'abaporu (1928)'
                 },
                 {
                    id: 'b-txt-2',
                    type: 'text',
                    content: 'apenas a antropofagia nos une. socialmente. economicamente. filosoficamente.'
                 }
               ]
             }
           ];

           for (const seed of signalsToSeed) {
                // @ts-ignore
                await storage.save('signals', seed);
           }
        }

        // --- 3. SEED PERFIL (ABOUT) ---
        const currentProfile = await storage.get('about', 'profile');
        if (!currentProfile) {
            await storage.save('about', {
                id: 'profile',
                text: "não sou uma imagem única. sou uma coleção de fatias temporais, organizadas por uma estrutura orgânica que cresce sobre o digital.\n\nassim como as raízes verdes buscam caminho no azul profundo, minha consciência navega entre o ruído e a forma, costurando pedaços desconexos em uma identidade provisória.",
                imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1000&auto=format&fit=crop"
            });
        }

      } catch (e) {
        console.error("Erro ao verificar dados iniciais:", e);
      }
    };

    seedData();
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
        return <PageMateria />;
      case ViewState.MANIFESTO:
        return <PageManifesto />;
      case ViewState.SINAIS:
        return <PageSinais />;
      case ViewState.INTERACTIVE: // Agora 'medição' (Oculto, mas renderizável se selecionado)
        return <PageSensor />;
      case ViewState.ABOUT: // Agora '👁👁'
        return <PageAbout onNavigate={setView} />;
      case ViewState.CONNECT:
        return <PageConnect />;
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
