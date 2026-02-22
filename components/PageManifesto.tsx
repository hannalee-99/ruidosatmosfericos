
import React, { useState, useEffect, memo, useRef } from 'react';

// Alfabeto e símbolos para o efeito de decodificação inicial
const CHARS = "abcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";

const useDecodedText = (text: string, delay: number = 0, speed: number = 15) => {
  const [displayText, setDisplayText] = useState('');
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setHasStarted(true), delay);
    return () => clearTimeout(timeout);
  }, [delay]);

  useEffect(() => {
    if (!hasStarted) return;
    let interval: ReturnType<typeof setTimeout>;
    let iteration = 0;
    
    interval = setInterval(() => {
      setDisplayText(
        text.split("").map((char, index) => {
          if (index < iteration) return text[index];
          if (char === " " || char === "\n" || char === "\r") return char;
          return CHARS[Math.floor(Math.random() * CHARS.length)];
        }).join("")
      );
      
      if (iteration >= text.length) {
        clearInterval(interval);
      }
      iteration += 1;
    }, speed);

    return () => clearInterval(interval);
  }, [hasStarted, text, speed]);

  return displayText;
};

const DecodedText: React.FC<{ text: string; delay: number; className?: string; tag?: 'span' | 'div' | 'h1' | 'h2' | 'p' | 'h3' | 'h4' }> = ({ text, delay, className = "", tag = 'p' }) => {
  const { segments, cleanText } = React.useMemo(() => {
    const segments: { text: string; className?: string }[] = [];
    let cleanText = "";
    const regex = /\[\[(.*?)\|(.*?)\]\]/g;
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        const plainText = text.substring(lastIndex, match.index);
        segments.push({ text: plainText });
        cleanText += plainText;
      }
      segments.push({ text: match[1], className: match[2] });
      cleanText += match[1];
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) {
      const plainText = text.substring(lastIndex);
      segments.push({ text: plainText });
      cleanText += plainText;
    }
    return { segments, cleanText };
  }, [text]);

  const displayText = useDecodedText(cleanText, delay);
  const Component = tag as any;

  let currentIndex = 0;
  return (
    <Component className={`transition-all duration-700 whitespace-pre-wrap ${className}`}>
      {segments.map((segment, i) => {
        const segmentText = displayText.substring(currentIndex, currentIndex + segment.text.length);
        currentIndex += segment.text.length;
        return (
          <span key={i} className={segment.className}>
            {segmentText}
          </span>
        );
      })}
    </Component>
  );
};

interface PageManifestoProps {
    isDarkMode?: boolean;
}

const PageManifesto: React.FC<PageManifestoProps> = ({ isDarkMode = true }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="relative pt-48 md:pt-64 pb-96 px-6 md:px-24 w-full min-h-screen flex flex-col items-start bg-transparent selection:bg-[var(--accent)] selection:text-black overflow-x-hidden">
      
      {/* Background sutil - Vazio Atmosférico */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.01] bg-[radial-gradient(circle_at_center,rgba(159,248,93,0.15),transparent)] -z-10"></div>
      
      <div className="max-w-4xl w-full flex flex-col items-start space-y-32 md:space-y-56 text-left">
        
        {/* Bloco 1: Atrito / Vazio / Forma */}
        <section className="relative w-full flex flex-col items-end text-right">
          <div className="max-w-3xl">
            <DecodedText 
              text={"entre o atrito\ndo vazio com a [[forma|italic]]\ndo corpo com o mundo\ndo controle com o fluxo\ndo eu com o [[outro|text-[var(--accent)] font-bold]]"} 
              delay={200} 
              className="font-electrolize text-2xl md:text-4xl text-white [.light-mode_&]:text-black leading-tight lowercase"
            />
          </div>
          <div className="mt-12 h-px w-24 bg-[var(--accent)] opacity-30 animate-pulse"></div>
        </section>

        {/* Bloco 2: Espaço */}
        <section className="py-20 md:py-40">
          <DecodedText 
            text={"abre-se um espaço"} 
            delay={1500} 
            className="font-electrolize text-5xl md:text-8xl text-[var(--accent)] leading-none lowercase tracking-tighter"
          />
        </section>

        {/* Bloco 3: Limiar */}
        <section className="opacity-60">
          <DecodedText 
            text={"para além da consciência terrena"} 
            delay={3000} 
            className="font-electrolize text-2xl md:text-4xl text-white [.light-mode_&]:text-black leading-relaxed lowercase"
          />
        </section>

        {/* Bloco 4: 10⁻³³ cm / Tecido Central */}
        <section className="relative pl-8 border-l border-[var(--accent)]/20">
          <div className="absolute -left-1 top-0 w-2 h-2 bg-[var(--accent)] rounded-full animate-ping"></div>
          <DecodedText 
            text={"10⁻³³ cm\no tecido central \nonde o todo se condensa\ne o que está em cima é como o que está embaixo\ne o que está embaixo é como o que está em cima\nem vibração primordial"} 
            delay={4500} 
            className="font-mono text-xl md:text-3xl text-[var(--accent)] leading-relaxed lowercase"
          />
        </section>

        {/* Bloco 5: Tempo / Instante */}
        <section className="max-w-2xl">
          <DecodedText 
            text={"quem fui no milissegundo que já se foi\nabsorve no tempo e abstrai no instante\ne já não é quem estou agora"} 
            delay={7500} 
            className="font-mono text-lg md:text-2xl opacity-60 leading-relaxed lowercase italic"
          />
        </section>

        {/* Bloco 6: Matéria / Quarks */}
        <section className="relative p-8 md:p-12 bg-white/[0.02] [.light-mode_&]:bg-black/[0.02] rounded-3xl border border-white/5 [.light-mode_&]:border-black/5 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
            {[...Array(20)].map((_, i) => (
              <div 
                key={i}
                className="absolute w-1 h-1 bg-[var(--accent)] rounded-full animate-pulse"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 5}s`,
                  animationDuration: `${2 + Math.random() * 3}s`
                }}
              />
            ))}
          </div>
          <DecodedText 
            text={"há treze bilhões de anos\nsou matéria em reorganização\nquarks, léptons, partículas\nhoje atravessados\npor fluidos terráqueos"} 
            delay={10000} 
            className="relative z-10 font-electrolize text-2xl md:text-4xl text-white [.light-mode_&]:text-black leading-tight lowercase"
          />
        </section>

        {/* Bloco 7: Modo Dominante / Angústia */}
        <section className="max-w-3xl space-y-8">
          <DecodedText 
            text={"existir sob o modo dominante angustia\nnos limitando os sentidos frente à transitoriedade\na falta surge quando a expectativa fora criada\nprojetamos cenários para suportar o indeterminado\nvivemos a lógica utilitária somente por pressão e sobrevivência"} 
            delay={13000} 
            className="font-mono text-base md:text-xl opacity-40 leading-relaxed lowercase"
          />
        </section>

        {/* Bloco 8: Poder / Transcender */}
        <section className="py-20 space-y-12">
          <DecodedText 
            text={"poder é decifrar o sentir\naprender a reconhecer o necessário\npois a existência não se sustenta na ilusão\n\nexistir é transcender"} 
            delay={16500} 
            className="font-electrolize text-3xl md:text-5xl text-[var(--accent)] leading-none lowercase tracking-tighter"
          />
        </section>

        {/* Bloco 9: Estímulo / Sentido / Caos */}
        <section className="space-y-12 pl-8 border-l border-[var(--accent)]/10">
          <DecodedText 
            text={"no limiar de estímulo e sentido\nresistindo à (des)ordem\ncriando padrões temporários\nopero em desconformidade controlada\nnegociando constantemente com a tendência ao caos"} 
            delay={20000} 
            className="font-electrolize text-2xl md:text-4xl text-white [.light-mode_&]:text-black leading-snug lowercase"
          />
        </section>

        {/* Bloco 10: Falha / Escorre */}
        <section className="relative">
          <DecodedText 
            text={"quando a palavra falha, a forma não sustenta, o movimento escorre"} 
            delay={23500} 
            className="font-mono text-lg md:text-2xl opacity-30 leading-relaxed lowercase animate-pulse"
          />
          <div className="absolute -bottom-4 left-0 w-full h-px bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-20"></div>
        </section>

        {/* Bloco 11: Sinais */}
        <section className="py-10 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--accent)]/5 to-transparent animate-[scan_4s_linear_infinite] pointer-events-none"></div>
          <DecodedText 
            text={"sinais atravessam o tecido cósmico"} 
            delay={26000} 
            className="font-electrolize text-3xl md:text-5xl text-white [.light-mode_&]:text-black leading-tight lowercase tracking-[0.1em]"
          />
        </section>

        {/* Bloco 12: Final */}
        <section className="pt-32 flex flex-col items-start w-full">
           <div className="font-electrolize text-2xl md:text-4xl text-white [.light-mode_&]:text-black leading-tight lowercase mb-16">
              <DecodedText text={"e é nessa fenda que \nobservo os ruídos"} delay={28500} />
           </div>
          
          <div className="relative group">
            {/* Brilho Atmosférico no hover */}
            <div className="absolute inset-0 bg-[var(--accent)]/10 blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
            <span 
              className="font-nabla text-[12vw] md:text-[10rem] leading-none block mix-blend-screen [.light-mode_&]:mix-blend-multiply origin-left transition-transform duration-1000 group-hover:scale-[1.05]" 
              style={{ fontPalette: isDarkMode ? '--matrix' : '--matrix-blue' }}
            >
              <DecodedText text="criando." delay={30500} />
            </span>
          </div>
        </section>

      </div>

      <style>{`
        body { scroll-behavior: smooth; }
        ::selection { background: var(--accent); color: black; }
        
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
      `}</style>
    </div>
  );
};

export default memo(PageManifesto);
