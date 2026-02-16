
import React, { useState, useEffect, memo } from 'react';

// Alfabeto e símbolos para o efeito de decodificação
const CHARS = "abcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";

const useDecodedText = (text: string, delay: number = 0, speed: number = 25) => {
  const [displayText, setDisplayText] = useState('');
  const [isHovered, setIsHovered] = useState(false);
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
      if (isHovered) {
        setDisplayText(
          text.split("").map((char) => {
            if (char === " ") return " ";
            if (Math.random() < 0.3) return char;
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          }).join("")
        );
        iteration = 0; 
      } else {
        setDisplayText(
          text.split("").map((char, index) => {
            if (index < iteration) return text[index];
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          }).join("")
        );
        if (iteration >= text.length) clearInterval(interval);
        iteration += 1;
      }
    }, speed);
    return () => clearInterval(interval);
  }, [hasStarted, isHovered, text, speed]);

  return { displayText, setIsHovered };
};

const DecodedText: React.FC<{ text: string; delay: number; className?: string; tag?: 'span' | 'div' | 'h1' | 'h2' | 'p' | 'h3' | 'h4' }> = ({ text, delay, className = "", tag = 'span' }) => {
  const { displayText, setIsHovered } = useDecodedText(text, delay);
  const Component = tag as any;
  return (
    <Component 
      className={`transition-all duration-700 cursor-crosshair ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {displayText}
    </Component>
  );
};

interface PageManifestoProps {
    isDarkMode?: boolean;
}

const PageManifesto: React.FC<PageManifestoProps> = ({ isDarkMode = true }) => {
  return (
    <div className="relative pt-40 pb-64 px-8 md:px-0 w-full min-h-screen flex flex-col items-center bg-transparent selection:bg-[var(--accent)] selection:text-black">
      
      {/* Elemento de background minimalista: apenas uma linha de luz */}
      <div className="fixed left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[var(--accent)]/5 to-transparent -z-10 -translate-x-1/2"></div>

      <div className="max-w-3xl w-full flex flex-col items-center space-y-32 md:space-y-64 text-center">
        
        {/* INTRO */}
        <section className="space-y-8">
          <DecodedText 
            tag="h2"
            text="isto não é uma obra para ser admirada — é um campo de forças." 
            delay={200} 
            className="font-electrolize text-3xl md:text-6xl text-white [.light-mode_&]:text-black leading-tight"
          />
        </section>

        {/* ATRITO */}
        <section className="space-y-6">
          <DecodedText 
            text="entre o atrito" 
            delay={1000} 
            className="font-mono text-xs uppercase tracking-[0.5em] opacity-30 block mb-12"
          />
          <div className="font-electrolize text-2xl md:text-5xl space-y-4 text-neutral-400 [.light-mode_&]:text-neutral-600">
             <DecodedText text="do vazio com a forma," delay={1400} className="block" />
             <DecodedText text="do corpo com o mundo," delay={1800} className="block" />
             <DecodedText text="do eu com o outro," delay={2200} className="block" />
             <DecodedText text="do controle com o fluxo." delay={2600} className="block text-white [.light-mode_&]:text-black" />
          </div>
        </section>

        {/* ESPAÇO */}
        <section className="space-y-12">
          <DecodedText 
            text="abre-se um espaço além do limiar da consciência terrena." 
            delay={3200} 
            className="font-electrolize text-2xl md:text-5xl text-[var(--accent)]"
          />
          <div className="font-mono text-xs md:text-lg opacity-40 space-y-4 max-w-xl mx-auto">
             <DecodedText text="dez elevado a menos trinta e três centímetros." delay={3800} className="block tracking-widest" />
             <DecodedText text="o tecido central onde tudo reside em transição molecular. o que não se fixa, transmuta." delay={4400} className="block leading-relaxed" />
          </div>
        </section>

        {/* ASIMETRIA */}
        <section className="font-mono text-sm md:text-xl opacity-50 space-y-6">
          <DecodedText text="aonde o que está embaixo é como o que está no alto," delay={5200} className="block" />
          <DecodedText text="e o que está no alto é como o que está embaixo." delay={5600} className="block" />
        </section>

        {/* ORIGEM */}
        <section className="space-y-12">
          <DecodedText text="há treze bilhões de anos," delay={6200} className="font-electrolize text-4xl md:text-8xl text-white [.light-mode_&]:text-black leading-none" />
          <div className="font-mono text-sm md:text-xl opacity-60 space-y-4 max-w-2xl mx-auto text-justify md:text-center">
             <DecodedText text="sou matéria em reorganização: quarks, léptons, partículas. hoje atravessadas por fluidos terráqueos, negociando constantemente com a tendência ao caos, onde o excesso entorpece a frequência." delay={6800} className="block leading-relaxed" />
             <DecodedText text="percebo no ruído o escape entre estímulo e sentido." delay={7600} className="block text-[var(--accent)] font-bold mt-8" />
          </div>
        </section>

        {/* OPERAÇÃO */}
        <section className="space-y-12">
          <DecodedText text="opero em desconformidade controlada." delay={8400} className="font-electrolize text-3xl md:text-6xl text-white [.light-mode_&]:text-black" />
          <div className="font-mono text-sm md:text-lg opacity-40 space-y-6 max-w-2xl mx-auto">
             <DecodedText text="resistindo à (des)ordem, criando padrões temporários, enquanto transito pela impermanência." delay={9000} className="block" />
             <DecodedText text="o modo dominante de existir gera angústia por natureza, nos limita a poucos sentidos." delay={9600} className="block" />
          </div>
        </section>

        {/* FALTA */}
        <section className="space-y-10">
          <DecodedText text="a falta surge quando a expectativa não se sustenta." delay={10400} className="font-electrolize text-2xl md:text-5xl text-neutral-300 [.light-mode_&]:text-neutral-700" />
          <div className="font-mono text-xs md:text-lg opacity-40 space-y-4">
             <DecodedText text="projetamos cenários para suportar o indeterminado. aderimos à lógica utilitária por pressão e sobrevivência." delay={11000} className="block max-w-xl mx-auto leading-relaxed" />
          </div>
        </section>

        {/* PODER */}
        <section className="space-y-12">
          <div className="inline-block border-y border-[var(--accent)]/20 py-12 md:py-20 px-4">
            <DecodedText text="existir é explorar e transcender." delay={11800} className="font-electrolize text-3xl md:text-7xl text-[var(--accent)]" />
          </div>
          <div className="font-mono text-sm md:text-xl opacity-60 space-y-6 max-w-2xl mx-auto">
             <DecodedText text="poder é discernir o que se sente para reconhecer o necessário." delay={12400} className="block text-white [.light-mode_&]:text-black" />
             <DecodedText text="quando a palavra falha, a forma não sustenta e o movimento escorre, sinais atravessam o tecido cósmico." delay={13000} className="block italic" />
          </div>
        </section>

        {/* FINAL */}
        <section className="pt-40 flex flex-col items-center">
          <div className="flex flex-col gap-4 opacity-20 mb-20">
            <DecodedText text="é nessa fenda que observo," delay={13800} className="font-mono text-xs tracking-[0.8em] uppercase" />
          </div>
          
          <div className="relative group">
            <div className="absolute inset-0 bg-[var(--accent)]/5 blur-[80px] rounded-full group-hover:bg-[var(--accent)]/15 transition-all duration-1000"></div>
            <span 
              className="font-nabla text-7xl md:text-[20rem] leading-none block mix-blend-screen [.light-mode_&]:mix-blend-multiply transition-transform hover:scale-105 duration-1000" 
              style={{ fontPalette: isDarkMode ? '--matrix' : '--matrix-blue' }}
            >
              <DecodedText text="criando." delay={14500} />
            </span>
          </div>
        </section>

      </div>

      <style>{`
        body { scroll-behavior: smooth; }
      `}</style>
    </div>
  );
};

export default memo(PageManifesto);
