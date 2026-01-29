
import React, { useState, useEffect } from 'react';

// Alfabeto e símbolos em caixa baixa para o efeito de decodificação
const CHARS = "abcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";

// Hook de Decodificação
const useDecodedText = (text: string, delay: number = 0, speed: number = 30) => {
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
            if (Math.random() < 0.5) return char;
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
      className={`transition-colors duration-300 cursor-crosshair ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {displayText}
    </Component>
  );
};

// Componente de Número de Seção
const SectionIndex: React.FC<{ num: string; label: string }> = ({ num, label }) => (
  <div className="flex items-center gap-3 mb-6 opacity-40 font-mono text-[10px] tracking-widest uppercase select-none">
    <span className="text-[var(--accent)]">[{num}]</span>
    <span className="w-8 h-px bg-current"></span>
    <span>{label}</span>
  </div>
);

interface PageManifestoProps {
    isDarkMode?: boolean;
}

const PageManifesto: React.FC<PageManifestoProps> = ({ isDarkMode = true }) => {
  return (
    <div className="relative pt-32 pb-60 px-6 md:px-12 w-full min-h-screen flex flex-col items-center bg-transparent overflow-hidden">
      
      {/* Linha Vertical Decorativa (Espinha Dorsal) */}
      <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-white/5 [.light-mode_&]:bg-black/5 -z-10"></div>

      <div className="max-w-6xl w-full flex flex-col gap-32 relative z-10">
        
        {/* BLOCO 01: O LIMIAR (Alinhado à Esquerda) */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-20 items-start">
           <div className="md:text-right md:pr-12 md:pt-12 order-2 md:order-1">
              <SectionIndex num="00" label="input" />
              <div className="flex flex-col gap-2 font-mono text-sm md:text-base opacity-70 border-l-2 md:border-l-0 md:border-r-2 border-[var(--accent)] pl-4 md:pl-0 md:pr-4 py-2">
                  <DecodedText text="do vazio com a forma" delay={600} className="block" />
                  <DecodedText text="do corpo com o mundo" delay={900} className="block" />
                  <DecodedText text="do eu com o outro" delay={1200} className="block" />
                  <DecodedText text="do controle com o fluxo" delay={1500} className="block text-[var(--accent)] font-bold" />
              </div>
           </div>
           
           <div className="order-1 md:order-2">
              <DecodedText 
                 tag="h2"
                 text="entre o atrito" 
                 delay={200} 
                 className="font-electrolize text-5xl md:text-7xl leading-[0.85] text-white [.light-mode_&]:text-black block mb-4"
               />
           </div>
        </section>

        {/* BLOCO 02: O ESPAÇO (Full Width / Impacto) */}
        <section className="relative py-12">
            <div className="absolute left-0 top-0 text-[10px] font-mono opacity-20 rotate-90 origin-top-left translate-x-4">
               /// expansão_dimensional
            </div>
            
            <div className="flex flex-col items-center text-center">
               <SectionIndex num="01" label="space" />
               
               <DecodedText text="abre-se um espaço" delay={1800} className="font-electrolize text-2xl md:text-4xl block mb-2" />
               <DecodedText text="além do limiar da consciência terrena" delay={2100} className="font-mono text-xs opacity-50 tracking-[0.2em] uppercase block mb-12" />

               {/* Typography Gigante */}
               <div className="w-full border-y border-white/10 [.light-mode_&]:border-black/10 py-12 md:py-20 my-8 bg-white/5 [.light-mode_&]:bg-black/5 backdrop-blur-sm">
                   <DecodedText 
                     text="dez elevado a menos trinta e três centímetros" 
                     delay={2400} 
                     className="text-3xl md:text-6xl lg:text-7xl font-light text-[var(--accent)] block font-electrolize leading-tight max-w-4xl mx-auto px-4"
                   />
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left max-w-3xl w-full px-4 md:px-0 mt-8">
                  <div className="font-mono text-sm opacity-70 space-y-2">
                      <DecodedText text="o tecido central onde tudo reside" delay={2700} className="block"/>
                      <DecodedText text="em transição molecular" delay={3000} className="block"/>
                      <DecodedText text="o que não se fixa, transmuta" delay={3300} className="block text-white [.light-mode_&]:text-black font-bold"/>
                  </div>
                  
                  {/* Simetria Hermética - Bloco Ajustado */}
                  <div className="font-mono text-sm opacity-70 flex flex-col justify-end items-end md:items-end">
                      <div className="flex flex-col items-end gap-0 relative group cursor-crosshair">
                          {/* Parte Superior (O Alto) */}
                          <div className="pb-2 border-r border-[var(--accent)] pr-6 relative">
                             <DecodedText text="aonde o que está embaixo é como o que está no alto" delay={3600} className="block leading-tight text-white [.light-mode_&]:text-black" />
                             {/* Marcador de conexão */}
                             <div className="absolute right-0 bottom-0 w-2 h-px bg-[var(--accent)]"></div>
                          </div>
                          
                          {/* Parte Inferior (O Embaixo) - Espelho */}
                          <div className="pt-2 border-r border-[var(--accent)]/50 pr-6 relative">
                             <div className="absolute right-0 top-0 w-2 h-px bg-[var(--accent)]/50"></div>
                             <DecodedText text="e o que está no alto é como o que está embaixo" delay={3900} className="block leading-tight opacity-80" />
                          </div>
                      </div>
                      <DecodedText text="absorve no tempo e abstrai no agora" delay={4200} className="block text-[var(--accent)] pt-4 pr-6"/>
                  </div>
               </div>
            </div>
        </section>

        {/* BLOCO 03: ORIGEM (Alinhado à Direita) */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-8">
           <div className="md:col-start-6 md:col-span-7 flex flex-col items-start">
               <SectionIndex num="02" label="origin" />
               
               <DecodedText text="há treze bilhões de anos" delay={4800} className="font-electrolize text-4xl md:text-6xl block leading-none text-white [.light-mode_&]:text-black mb-6" />
               
               <div className="pl-6 border-l border-white/20 [.light-mode_&]:border-black/20 space-y-4">
                  <DecodedText text="sou matéria em reorganização" delay={5100} className="font-mono text-lg text-[var(--accent)] block" />
                  
                  <div className="font-mono text-sm opacity-60 space-y-1">
                      <DecodedText text="quarks, léptons, partículas" delay={5400} className="block" />
                      <DecodedText text="hoje atravessadas por fluidos terráqueos" delay={5700} className="block" />
                      <DecodedText text="quem fui segundo passado não é mais eu" delay={6000} className="block" />
                  </div>

                  <div className="pt-4 font-mono text-sm opacity-80 space-y-1">
                      <DecodedText text="negociando constantemente com a tendência ao caos" delay={6300} className="block" />
                      <DecodedText text="onde o excesso entorpece a frequência" delay={6600} className="block" />
                      <DecodedText text="percebo no ruído o escape entre estímulo e sentido" delay={6900} className="block text-white [.light-mode_&]:text-black font-bold" />
                  </div>
               </div>
           </div>
        </section>

        {/* BLOCO 04: OPERAÇÃO (Caixa de Código) */}
        <section className="md:pr-20">
            <div className="bg-[#111] [.light-mode_&]:bg-[#e5e5e5] border border-white/10 [.light-mode_&]:border-black/10 p-8 md:p-12 rounded-lg relative overflow-hidden group">
               {/* Decoração Tech */}
               <div className="absolute top-4 right-4 flex gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
                  <div className="w-2 h-2 rounded-full bg-yellow-500/50"></div>
                  <div className="w-2 h-2 rounded-full bg-green-500/50"></div>
               </div>
               
               <SectionIndex num="03" label="operation" />

               <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                   <div>
                       <DecodedText text="opero em desconformidade controlada" delay={7200} className="font-electrolize text-2xl md:text-3xl text-[var(--accent)] block mb-4" />
                       <div className="space-y-2 font-mono text-sm opacity-80">
                           <p><span className="opacity-30">01.</span> <DecodedText text="resistindo à (des)ordem" delay={7500}/></p>
                           <p><span className="opacity-30">02.</span> <DecodedText text="criando padrões temporários" delay={7800}/></p>
                       </div>
                   </div>

                   <div className="font-mono text-xs md:text-sm leading-relaxed opacity-60 flex flex-col justify-end">
                       <DecodedText text="o modo dominante de existir gera angústia por natureza" delay={8100} className="block mb-2" />
                       <DecodedText text="nos limita a poucos sentidos" delay={8400} className="block mb-2" />
                       <DecodedText text="enquanto transitamos pela impermanência" delay={8700} className="block" />
                   </div>
               </div>
            </div>
        </section>

        {/* BLOCO 05: FALTA (Centralizado e Minimal) */}
        <section className="flex flex-col items-center text-center py-16">
             <SectionIndex num="04" label="error_handling" />
             
             <div className="max-w-2xl space-y-8">
                 <DecodedText 
                   text="a falta surge quando a expectativa não se sustenta" 
                   delay={9000} 
                   className="font-electrolize text-2xl md:text-4xl block leading-tight text-white [.light-mode_&]:text-black"
                 />
                 
                 <div className="h-px w-20 bg-[var(--accent)] mx-auto opacity-50"></div>
                 
                 <div className="font-mono text-sm opacity-60 space-y-2">
                    <DecodedText text="projetamos cenários para suportar o indeterminado" delay={9300} className="block" />
                    <DecodedText text="aderimos à lógica utilitária por pressão e sobrevivência" delay={9600} className="block" />
                 </div>
                 
                 <div className="pt-4">
                    <DecodedText text="a existência não se sustenta na ilusão" delay={9900} className="block font-mono text-xs tracking-widest uppercase opacity-40 mb-2" />
                    <DecodedText text="pois existir é explorar e transcender" delay={10200} className="block font-electrolize text-xl text-[var(--accent)]" />
                 </div>
             </div>
        </section>

        {/* BLOCO 06: PODER (Tipografia Grande) */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-end">
             <div>
                <SectionIndex num="05" label="power" />
                <DecodedText 
                  text="poder é discernir o que se sente" 
                  delay={10500} 
                  className="font-electrolize text-5xl md:text-7xl leading-[0.9] text-white [.light-mode_&]:text-black block"
                />
                <DecodedText text="para reconhecer o necessário" delay={10800} className="font-mono text-sm opacity-50 block mt-4" />
             </div>

             <div className="border-t border-white/10 [.light-mode_&]:border-black/10 pt-8">
                 <div className="font-mono text-base md:text-lg opacity-80 space-y-1">
                     <DecodedText text="quando a palavra falha" delay={11100} className="block" />
                     <DecodedText text="a forma não sustenta" delay={11400} className="block" />
                     <DecodedText text="o movimento escorre" delay={11700} className="block" />
                 </div>
                 <div className="mt-8 font-electrolize text-2xl text-[var(--accent)]">
                     <DecodedText text="sinais atravessam" delay={12000} className="block" />
                     <DecodedText text="o tecido cósmico" delay={12300} className="block opacity-70" />
                 </div>
             </div>
        </section>

        {/* FINAL: OUTPUT */}
        <section className="pt-32 pb-20 flex flex-col items-center justify-center relative">
             <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--accent)]/5 to-transparent pointer-events-none"></div>
             
             <SectionIndex num="06" label="output" />

             <div className="text-center space-y-4 z-10">
                 <DecodedText text="é nessa fenda" delay={12600} className="font-mono text-xs tracking-[0.4em] uppercase opacity-40 block" />
                 <DecodedText text="que observo" delay={12900} className="font-mono text-xs tracking-[0.4em] uppercase opacity-40 block" />
                 
                 <div className="pt-8">
                    <span className="font-nabla text-8xl md:text-[11rem] leading-none block mix-blend-screen [.light-mode_&]:mix-blend-multiply" style={{ fontPalette: isDarkMode ? '--matrix' : '--matrix-blue' }}>
                        <DecodedText text="criando." delay={13200} />
                    </span>
                 </div>
             </div>
        </section>

      </div>
    </div>
  );
};

export default PageManifesto;
