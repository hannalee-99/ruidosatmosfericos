
import React, { useState, useEffect, useCallback, useRef } from 'react';
import NeobrutalistButton from './NeobrutalistButton';

// Componente para efeito de escrita suave e atmosférica
const Typewriter: React.FC<{ 
  text: string; 
  speed?: number; 
  delay?: number; 
  onComplete?: () => void;
  className?: string;
}> = ({ text, speed = 50, delay = 0, onComplete, className = "" }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [started, setStarted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const startTimeout = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(startTimeout);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    
    if (displayedText.length < text.length) {
      // Adiciona um pequeno fator randômico para parecer mais orgânico
      const randomSpeed = speed + Math.random() * 30;
      timerRef.current = setTimeout(() => {
        setDisplayedText(text.substring(0, displayedText.length + 1));
      }, randomSpeed);
    } else if (onComplete) {
      // Pausa estratégica após terminar de escrever
      timerRef.current = setTimeout(onComplete, 1000);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [displayedText, text, speed, started, onComplete]);

  return (
    <span className={className}>
      {displayedText}
      {displayedText.length < text.length && started && (
        <span className="inline-block w-2 h-4 ml-1 bg-[var(--accent)] animate-pulse align-middle"></span>
      )}
    </span>
  );
};

// Loader Atmosférico: Onda de Interferência
const AtmosphericWave: React.FC = () => {
  const count = 6;
  return (
    <div className="relative flex items-center justify-center">
      {/* Camada Principal (Sinal Forte) */}
      <div className="flex gap-1.5 items-center justify-center text-[var(--accent)] font-mono text-xl md:text-2xl select-none z-10">
        {[...Array(count)].map((_, i) => (
          <span 
            key={i} 
            className="inline-block"
            style={{ 
              animation: `waveSignal 2s cubic-bezier(0.4, 0, 0.2, 1) infinite`,
              animationDelay: `${i * 120}ms` 
            }}
          >
            ~
          </span>
        ))}
      </div>
      
      {/* Camada de Eco (Interferência/Blur) - Cria profundidade */}
      <div className="absolute inset-0 flex gap-1.5 items-center justify-center text-[var(--accent)] font-mono text-xl md:text-2xl select-none pointer-events-none opacity-50 mix-blend-screen">
        {[...Array(count)].map((_, i) => (
          <span 
            key={`ghost-${i}`} 
            className="inline-block"
            style={{ 
              animation: `waveGhost 2s cubic-bezier(0.4, 0, 0.2, 1) infinite`,
              animationDelay: `${(i * 120) + 150}ms` 
            }}
          >
            ~
          </span>
        ))}
      </div>

      <style>{`
        @keyframes waveSignal {
          0%, 100% { 
            transform: translateY(1px); 
            opacity: 0.2; 
            filter: blur(1px); 
          }
          50% { 
            transform: translateY(-3px); 
            opacity: 1; 
            filter: blur(0px); 
            text-shadow: 0 0 12px currentColor; 
          }
        }
        @keyframes waveGhost {
          0%, 100% { 
            transform: translateY(1px); 
            opacity: 0; 
          }
          50% { 
            transform: translateY(-3px) scale(1.2); 
            opacity: 0.4; 
            filter: blur(3px); 
          }
        }
      `}</style>
    </div>
  );
};

interface SplashProps {
  onEnter: () => void;
}

const Splash: React.FC<SplashProps> = ({ onEnter }) => {
  const [showButton, setShowButton] = useState(false);
  const [phase, setPhase] = useState(0);

  const sequences = [
    "sintonizando",
    "vazio detectado",
    "forma em processamento",
    "pronto"
  ];

  const skipSequence = useCallback(() => {
    if (!showButton) {
      setPhase(sequences.length);
      setShowButton(true);
    }
  }, [showButton, sequences.length]);

  const handleNextPhase = () => {
    if (phase < sequences.length - 1) {
      setPhase(prev => prev + 1);
    } else {
      setShowButton(true);
    }
  };

  return (
    <div 
      onClick={skipSequence}
      className="fixed inset-0 z-[9999] bg-black text-[var(--accent)] flex flex-col items-center justify-center overflow-hidden select-none px-6 cursor-pointer"
    >
      {/* Grão de ruído sutil */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
      
      {/* Cabeçalho Estilo Terminal / HUD - Otimizado para Tablet */}
      <div className="absolute top-8 md:top-12 w-full px-8 md:px-16 flex justify-between items-start opacity-30 text-xs md:text-base tracking-[0.2em] lowercase font-vt mix-blend-screen">
        <div className="flex flex-col gap-2 items-start">
          <div className="border-l border-[var(--accent)] pl-3">unificado</div>
          <div className="pl-3 opacity-50">10^-33 cm</div>
        </div>
        <div className="flex flex-col gap-2 items-end text-right">
          <div className="border-r border-[var(--accent)] pr-3">∿ ∿ ∿</div>
          <div className="pr-3 opacity-50">presente</div>
        </div>
      </div>

      {/* Conteúdo Central de Texto */}
      <div className="relative h-32 md:h-40 flex items-center justify-center text-center max-w-2xl z-10">
        {!showButton && phase < sequences.length && (
          <Typewriter 
            key={phase} 
            text={sequences[phase]} 
            speed={40} 
            onComplete={handleNextPhase}
            className="font-electrolize text-lg md:text-3xl tracking-[0.1em] lowercase text-neutral-300 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"
          />
        )}
        {showButton && (
          <p className="font-electrolize text-lg md:text-3xl tracking-[0.1em] lowercase text-white animate-in fade-in duration-1000 drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">
            {sequences[sequences.length - 1]}
          </p>
        )}
      </div>

      {/* Área de Ação: Tils (loading) -> Botão (pronto) */}
      <div className="mt-8 md:mt-12 h-16 flex items-center justify-center w-full relative">
        {/* Camada do Loader (Onda Atmosférica) */}
        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-1000 ${showButton ? 'opacity-0 scale-90 blur-sm pointer-events-none' : 'opacity-100 scale-100'}`}>
          <AtmosphericWave />
        </div>

        {/* Camada do Botão */}
        <div 
          className={`transition-all duration-[1500ms] cubic-bezier(0.22, 1, 0.36, 1) transform ${showButton ? 'opacity-100 translate-y-0 blur-0 delay-500' : 'opacity-0 translate-y-4 blur-sm pointer-events-none'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <NeobrutalistButton
            onClick={onEnter}
            variant="matrix"
            className="text-xs md:text-sm tracking-[0.3em] px-12 py-4 font-mono lowercase"
          >
            acessar
          </NeobrutalistButton>
        </div>
      </div>

      {!showButton && (
        <div className="absolute bottom-24 md:bottom-32 font-vt text-[10px] md:text-xs opacity-20 lowercase tracking-widest animate-pulse">
          [ toque para pular ]
        </div>
      )}

      {/* Rodapé do Sistema */}
      <div className="absolute bottom-8 md:bottom-12 w-full px-12 font-vt text-[10px] md:text-xs opacity-20 flex justify-center border-t border-[var(--accent)]/10 pt-4">
        <div className="max-w-md text-center leading-loose tracking-[0.4em] lowercase">
          ruídos atmosféricos // ciclo 21 // 2026
        </div>
      </div>
    </div>
  );
};

export default Splash;
