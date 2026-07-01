
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ViewState, ManifestoConfig } from '../types';
import { storage } from '../lib/storage';
import { trackGenericClick } from './analytics';

interface TextSegment {
  t: string;
  accent?: boolean;
  nabla?: boolean;
}

interface Layer {
  n: string;
  scale: string;
  name: string;
  lines: TextSegment[][];
}

export const DEFAULT_LAYERS: Layer[] = [
  {
    n: "01",
    scale: "dualidade",
    name: "atrito",
    lines: [
      [{ t: "entre o " }, { t: "atrito", accent: true }],
      [{ t: "do " }, { t: "vazio", accent: true }, { t: " com a forma" }],
      [{ t: "do corpo com o mundo" }],
      [{ t: "do controle com o fluxo" }],
      [{ t: "do eu com o " }, { t: "outro", accent: true }],
    ],
  },
  {
    n: "02",
    scale: "infinito",
    name: "espaço",
    lines: [
      [{ t: "há um " }, { t: "espaço", accent: true }],
      [{ t: "para além da consciência terrena" }],
    ],
  },
  {
    n: "03",
    scale: "10⁻³³ cm",
    name: "microscópica",
    lines: [
      [{ t: "10⁻³³ cm", accent: true }],
      [{ t: "o " }, { t: "tecido central", accent: true }],
      [{ t: "onde o todo se condensa" }],
      [{ t: "e o que está em cima é como o que está embaixo" }],
      [{ t: "e o que está embaixo é como o que está em cima" }],
      [{ t: "em " }, { t: "vibração primordial", accent: true }],
    ],
  },
  {
    n: "04",
    scale: "13.8 bi",
    name: "cósmica",
    lines: [
      [{ t: "há treze bilhões de anos" }],
      [{ t: "sou " }, { t: "matéria em reorganização", accent: true }],
      [{ t: "quarks, léptons, partículas" }],
      [{ t: "hoje atravessados" }],
      [{ t: "por fluidos terráqueos" }],
    ],
  },
  {
    n: "05",
    scale: "instante",
    name: "instante",
    lines: [
      [{ t: "quem fui no " }, { t: "milissegundo", accent: true }, { t: " que já se foi" }],
      [{ t: "absorve no tempo e abstrai no instante" }],
      [{ t: "e já não é quem estou " }, { t: "agora", accent: true }],
    ],
  },
  {
    n: "06",
    scale: "operação",
    name: "fluxo",
    lines: [
      [{ t: "no limiar de estímulo e sentido" }],
      [{ t: "resistindo à (des)ordem" }],
      [{ t: "criando padrões temporários" }],
      [{ t: "opero em " }, { t: "desconformidade controlada", accent: true }],
      [{ t: "negociando constantemente com a tendência ao " }, { t: "caos", accent: true }],
    ],
  },
  {
    n: "07",
    scale: "ego",
    name: "existencial",
    lines: [
      [{ t: "existir sob o modo dominante" }],
      [{ t: "nos limita os sentidos frente à " }, { t: "transitoriedade", accent: true }],
      [{ t: "a falta surge quando a expectativa é criada" }],
      [{ t: "projetamos cenários para suportar o indeterminado" }],
      [{ t: "sobrevivemos no útil e chamamos isso de mundo" }],
    ],
  },
  {
    n: "08",
    scale: "sentido",
    name: "decifrar",
    lines: [
      [{ t: "decifrar o " }, { t: "sentir", accent: true }, { t: " não é escolha" }],
      [{ t: "é o que resta" }],
    ],
  },
  {
    n: "09",
    scale: "limite",
    name: "falha",
    lines: [
      [{ t: "quando a forma cede" }],
      [{ t: "a palavra " }, { t: "falha", accent: true }],
      [{ t: "e o movimento escorre" }],
    ],
  },
  {
    n: "10",
    scale: "conexão",
    name: "sinais",
    lines: [
      [{ t: "sinais", accent: true }, { t: " atravessam o tecido cósmico" }],
    ],
  },
  {
    n: "11",
    scale: "fenda",
    name: "ruídos",
    lines: [
      [{ t: "e é nessa fenda que observo os " }, { t: "ruídos", accent: true }],
    ],
  },
  {
    n: "12",
    scale: "meta",
    name: "criando",
    lines: [
      [{ t: "criando.", nabla: true }],
    ],
  },
];

interface HistoryLine {
  id: string;
  type: 'system' | 'success' | 'output' | 'text';
  content: string | TextSegment[];
}

const PageManifestoV2: React.FC<{ onNavigate: (view: ViewState) => void }> = ({ onNavigate }) => {
  const [manifestoData, setManifestoData] = useState<ManifestoConfig | null>(null);
  const [history, setHistory] = useState<HistoryLine[]>([]);
  const [currentText, setCurrentText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [layerIndex, setLayerIndex] = useState(0);
  const [lineIndex, setLineIndex] = useState(0);
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [isBooted, setIsBooted] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const [flashedSegmentIndex, setFlashedSegmentIndex] = useState(-1);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasBootedRef = useRef(false);

  useEffect(() => {
    const fetchManifesto = async () => {
      const data = await storage.get('about', 'landing_manifesto');
      setManifestoData(data);
    };
    fetchManifesto();
  }, []);

  const activeLayers = useMemo(() => {
    if (manifestoData?.isCustomized && manifestoData?.layers && manifestoData.layers.length > 0) {
      return manifestoData.layers;
    }
    return DEFAULT_LAYERS;
  }, [manifestoData]);

  const scrollToEnd = useCallback(() => {
    if (isComplete) return; 
    // Only scroll if content is likely to be near or below the fold
    if (history.length > 5) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [history.length, isComplete]);

  useEffect(() => {
    scrollToEnd();
  }, [history, scrollToEnd]); // Only scroll on new lines, not on every character

  // Boot sequence
  useEffect(() => {
    if (hasBootedRef.current) return;
    hasBootedRef.current = true;

    const boot = async () => {
      const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      
      const addSys = (text: string, type: 'system' | 'success' | 'output' = 'system') => 
        setHistory(prev => [...prev, { id: Math.random().toString(), type, content: text }]);
      
      await wait(500);
      addSys("acordando terminal...", 'system');
      await wait(500);
      addSys("link estabelecido: 10^-33_cm_tecido", 'success');
      await wait(600);
      addSys("transmissão iniciada.", 'output');
      await wait(1000);
      setHistory([]); // Clear terminal before starting manifesto
      setIsBooted(true);
    };
    boot();
  }, []);

  // Typer logic
  useEffect(() => {
    if (!isBooted || isComplete || isFlashing) return;

    const layer = activeLayers[layerIndex];
    if (!layer) {
      setIsComplete(true);
      return;
    }

    const line = layer.lines[lineIndex];
    if (!line) {
      // End of layer
      timerRef.current = setTimeout(() => {
        setHistory([]); // Clear terminal for the next paragraph
        setLayerIndex(prev => prev + 1);
        setLineIndex(0);
        setSegmentIndex(0);
        setFlashedSegmentIndex(-1);
      }, 2000); // Give 2 seconds for the user to read the full block
      return;
    }

    const segment = line[segmentIndex];
    if (!segment) {
      // End of line, commit full line to history
      timerRef.current = setTimeout(() => {
        setHistory(prev => [...prev, { 
          id: Math.random().toString(), 
          type: 'text',
          content: [...line]
        }]);
        setCurrentText('');
        setLineIndex(prev => prev + 1);
        setSegmentIndex(0);
        setFlashedSegmentIndex(-1);
      }, 150);
      return;
    }

    if (currentText.length < segment.t.length) {
      setIsTyping(true);
      
      const delay = 25; 
      
      timerRef.current = setTimeout(() => {
        setCurrentText(segment.t.substring(0, currentText.length + 1));
      }, delay);
    } else {
      setIsTyping(false);

      // Handle accent flash
      if (segment.accent && flashedSegmentIndex !== segmentIndex) {
        setIsFlashing(true);
        setTimeout(() => {
          setIsFlashing(false);
          setFlashedSegmentIndex(segmentIndex);
        }, 300);
        return;
      }

      // Fluid transition to next segment
      timerRef.current = setTimeout(() => {
         setSegmentIndex(prev => prev + 1);
         setCurrentText('');
      }, 40);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isBooted, layerIndex, lineIndex, segmentIndex, currentText, isComplete, isFlashing, flashedSegmentIndex, activeLayers]);

  const handleRestart = () => {
    setHistory([]);
    setLayerIndex(0);
    setLineIndex(0);
    setSegmentIndex(0);
    setCurrentText('');
    setIsComplete(false);
    setFlashedSegmentIndex(-1);
  };

  const lastSkipRef = useRef<number>(0);
  const skipLayer = () => {
    if (isComplete) return;
    
    // Debounce skip action (200ms) to prevent double-triggers
    const now = Date.now();
    if (now - lastSkipRef.current < 200) return;
    lastSkipRef.current = now;

    const layer = activeLayers[layerIndex];
    
    // Always clear timer to stop any pending automatic commits/transitions
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // If we are in the pause between paragraphs, skip the wait
    if (layer && !layer.lines[lineIndex]) {
      setHistory([]);
      setLayerIndex(prev => prev + 1);
      setLineIndex(0);
      setSegmentIndex(0);
      setFlashedSegmentIndex(-1);
      return;
    }

    if (!layer || !layer.lines[lineIndex]) return;

    setHistory(prev => [...prev, { 
      id: Math.random().toString(), 
      type: 'text',
      content: [...layer.lines[lineIndex]]
    }]);
    setCurrentText('');
    setLineIndex(prev => prev + 1);
    setSegmentIndex(0);
    setFlashedSegmentIndex(-1);
  };

  return (
    <div 
      className="min-h-[100dvh] w-full bg-[#050505] text-[#9ff85d] font-mono text-sm md:text-base selection:bg-[#9ff85d] selection:text-black overflow-x-hidden pt-44 md:pt-48 pb-20 px-6 md:px-20 relative cursor-pointer" 
      onClick={skipLayer}
    >
      <h1 className="sr-only">manifesto /// desconformidade controlada</h1>
      {/* Scanline effect override to look more Matrix */}
      <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.05] [.light-mode_&]:hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]"></div>
      </div>

      <div className="max-w-4xl w-full mx-auto relative z-10">
        <div className="mb-12 text-[10px] uppercase tracking-[0.2em] flex justify-center items-center min-h-[20px]">
          {isComplete && <span className="opacity-40 animate-pulse">fim da transmissão</span>}
        </div>

        <div className="space-y-3">
          {history.map((line) => (
            <div key={line.id}>
              <span className={`leading-relaxed lowercase ${
                line.type === 'system' ? 'text-white' :
                line.type === 'output' ? 'opacity-50 italic' : 
                line.type === 'success' ? 'text-[#9ff85d] font-bold' : ''
              }`}>
                {Array.isArray(line.content) ? (
                  (line.content as TextSegment[]).map((s, idx) => (
                    <span key={idx} className={`
                      ${s.accent ? 'text-glow brightness-125' : ''}
                      ${s.nabla ? 'font-nabla palette-matrix text-5xl md:text-8xl block mt-4 mb-8' : ''}
                    `}>
                      {s.t}
                    </span>
                  ))
                ) : (
                  line.content
                )}
              </span>
            </div>
          ))}

          {isBooted && !isComplete && activeLayers[layerIndex] && activeLayers[layerIndex].lines[lineIndex] && (
            <div>
              <span className="leading-relaxed lowercase">
                 {/* Render already typed segments of the current line */}
                 {activeLayers[layerIndex].lines[lineIndex].slice(0, segmentIndex).map((s: TextSegment, idx: number) => (
                   <span key={idx} className={`
                      ${s.accent ? 'text-glow brightness-125' : ''}
                      ${s.nabla ? 'font-nabla palette-matrix text-5xl md:text-8xl block mt-4 mb-8' : ''}
                   `}>
                     {s.t}
                   </span>
                 ))}
                 
                 {/* Current typing segment */}
                 <span className={`
                    ${activeLayers[layerIndex].lines[lineIndex][segmentIndex]?.accent ? 'text-glow' : ''} 
                    ${activeLayers[layerIndex].lines[lineIndex][segmentIndex]?.nabla ? 'font-nabla palette-matrix text-5xl md:text-8xl block mt-4 mb-8' : ''}
                    ${isFlashing ? 'brightness-[3] shadow-[0_0_20px_#9ff85d] text-white' : ''}
                    transition-all duration-150
                 `}>
                    {currentText}
                 </span>
                 
                 <span className="inline-block w-2 h-[1.1em] ml-1 bg-[#9ff85d] align-middle shadow-[0_0_8px_#9ff85d] animate-[cursor-blink_0.8s_step-end_infinite]"></span>
              </span>
            </div>
          )}
        </div>

        {isComplete && (
          <div className="mt-16 flex flex-col items-center gap-8 pt-4 animate-in fade-in duration-1000">
             <div className="text-center space-y-8 flex flex-col items-center">
                <button 
                  onClick={() => {
                    trackGenericClick('contato_iniciar_manifesto', 'button', { 'From Page': 'manifesto' });
                    onNavigate(ViewState.CONNECT);
                  }}
                  className="group flex items-center gap-2 font-mono text-[10px] md:text-xs tracking-widest lowercase transition-all duration-300 active:scale-95"
                >
                  <span className="text-[#9ff85d] font-bold">visitante@ruidos:~$</span>
                  <span className="text-white opacity-80 group-hover:opacity-100 text-glow">contato --iniciar</span>
                  <span className="w-1 h-3.5 bg-[#9ff85d] animate-pulse shadow-[0_0_5px_#9ff85d]"></span>
                </button>
             </div>
             <button 
               onClick={() => {
                 trackGenericClick('reiniciar_manifesto', 'button', { 'From Page': 'manifesto' });
                 handleRestart();
               }} 
               className="text-[10px] opacity-20 hover:opacity-100 underline tracking-widest lowercase transition-opacity"
             >
                reiniciar manifesto
             </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Retro Matrix Glow Styles */}
      <style>{`
        body { background-color: #050505 !important; }
        .text-glow {
          text-shadow: 0 0 5px #9ff85d, 0 0 10px rgba(159, 248, 93, 0.5);
        }
        @keyframes cursor-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        ::selection {
          background-color: #9ff85d;
          color: #000;
        }
      `}</style>
      
      {!isComplete && (
        <div className="fixed bottom-4 right-6 md:bottom-8 md:right-12 text-[7px] md:text-[8px] text-zinc-600 uppercase tracking-[0.3em] pointer-events-none select-none opacity-30">
          [ toque para acelerar ]
        </div>
      )}
    </div>
  );
};

export default PageManifestoV2;
