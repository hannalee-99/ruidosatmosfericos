
import React, { useState, useEffect, memo } from 'react';

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
  const displayText = useDecodedText(text, delay);
  const Component = tag as any;
  return (
    <Component className={`transition-all duration-700 whitespace-pre-wrap ${className}`}>
      {displayText}
    </Component>
  );
};

interface PageManifestoProps {
    isDarkMode?: boolean;
}

const PageManifesto: React.FC<PageManifestoProps> = ({ isDarkMode = true }) => {
  return (
    <div className="relative pt-48 md:pt-64 pb-96 px-6 md:px-24 w-full min-h-screen flex flex-col items-start bg-transparent selection:bg-[var(--accent)] selection:text-black overflow-x-hidden">
      
      {/* Background sutil - Vazio Atmosférico */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.01] bg-[radial-gradient(circle_at_center,rgba(159,248,93,0.15),transparent)] -z-10"></div>
      
      <div className="max-w-4xl w-full flex flex-col items-start space-y-24 md:space-y-40 text-left">
        
        {/* Bloco 1: Atrito */}
        <section>
          <DecodedText 
            text={"entre o atrito\ndo vazio com a forma\ndo corpo com o mundo\ndo eu com o outro\ndo controle com o fluxo\nabre-se um espaço"} 
            delay={200} 
            className="font-electrolize text-3xl md:text-5xl text-white [.light-mode_&]:text-black leading-tight lowercase"
          />
        </section>

        {/* Bloco 2: Tecido Central */}
        <section className="pl-4 md:pl-12 border-l border-[var(--accent)]/10">
          <DecodedText 
            text={"além do limiar\nda consciência terrena\n10⁻³³ cm, o tecido central\nonde tudo reside\nem transição molecular\ne o que está embaixo\né como o que está no alto\ne o que está no alto\né como o que está embaixo\nabsorve no tempo\ne abstrai no agora"} 
            delay={2000} 
            className="font-electrolize text-2xl md:text-4xl text-[var(--accent)] leading-relaxed lowercase opacity-90"
          />
        </section>

        {/* Bloco 3: Matéria */}
        <section>
          <DecodedText 
            text={"há treze bilhões de anos\nsou matéria em reorganização\nquarks, léptons, partículas\nhoje atravessadas por fluidos terráqueos"} 
            delay={5000} 
            className="font-electrolize text-2xl md:text-4xl text-neutral-400 [.light-mode_&]:text-neutral-600 leading-tight lowercase"
          />
        </section>

        {/* Bloco 4: Caos */}
        <section>
          <DecodedText 
            text={"quem fui segundo passado\nnão é mais eu\nnegociando constantemente\ncom a tendência ao caos\nonde o excesso entorpece a frequência\npercebo no ruído o escape"} 
            delay={7500} 
            className="font-mono text-base md:text-xl opacity-60 leading-relaxed lowercase tracking-tight"
          />
        </section>

        {/* Bloco 5: Operação */}
        <section>
          <DecodedText 
            text={"entre estímulo e sentido\nopero em desconformidade controlada\nresistindo à (des)ordem\ncriando padrões temporários"} 
            delay={10000} 
            className="font-electrolize text-3xl md:text-5xl text-white [.light-mode_&]:text-black leading-tight lowercase"
          />
        </section>

        {/* Bloco 6: Angústia */}
        <section className="max-w-2xl">
          <DecodedText 
            text={"o modo dominante de existir\ngera angústia por natureza\nnos limita a poucos sentidos\nenquanto transitamos pela impermanência"} 
            delay={12500} 
            className="font-mono text-lg md:text-2xl opacity-40 leading-relaxed lowercase italic"
          />
        </section>

        {/* Bloco 7: Transcender */}
        <section className="bg-[var(--accent)]/5 p-8 md:p-12 rounded-3xl border border-[var(--accent)]/10">
          <DecodedText 
            text={"a falta surge\nquando a expectativa não se sustenta\nprojetamos cenários\npara suportar o indeterminado\naderimos à lógica utilitária\npor pressão e sobrevivência\na existência não se sustenta na ilusão\npois existir é transcender"} 
            delay={15000} 
            className="font-electrolize text-xl md:text-3xl text-neutral-400 [.light-mode_&]:text-neutral-600 leading-relaxed lowercase"
          />
        </section>

        {/* Bloco 8: Poder */}
        <section>
          <DecodedText 
            text={"poder é discernir o que se sente\npara reconhecer o necessário\nquando a palavra falha\na forma não sustenta\no movimento escorre"} 
            delay={18000} 
            className="font-electrolize text-3xl md:text-6xl text-[var(--accent)] leading-[0.9] lowercase"
          />
        </section>

        {/* Bloco 9: Sinais */}
        <section className="opacity-30">
          <DecodedText 
            text={"sinais atravessam\no tecido cósmico"} 
            delay={21000} 
            className="font-mono text-xl md:text-3xl tracking-[0.2em] uppercase"
          />
        </section>

        {/* Bloco 10: Final */}
        <section className="pt-32 flex flex-col items-start w-full">
           <div className="font-electrolize text-2xl md:text-4xl text-white [.light-mode_&]:text-black leading-tight lowercase mb-16">
              <DecodedText text={"e é nessa fenda\nque observo"} delay={23000} />
           </div>
          
          <div className="relative group">
            {/* Brilho Atmosférico no hover */}
            <div className="absolute inset-0 bg-[var(--accent)]/10 blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
            <span 
              className="font-nabla text-[20vw] md:text-[20rem] leading-none block mix-blend-screen [.light-mode_&]:mix-blend-multiply origin-left transition-transform duration-1000 group-hover:scale-[1.05]" 
              style={{ fontPalette: isDarkMode ? '--matrix' : '--matrix-blue' }}
            >
              <DecodedText text="criando." delay={24500} />
            </span>
          </div>
        </section>

      </div>

      <style>{`
        body { scroll-behavior: smooth; }
        ::selection { background: var(--accent); color: black; }
      `}</style>
    </div>
  );
};

export default memo(PageManifesto);
