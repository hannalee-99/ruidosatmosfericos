
import React, { useState, useEffect, memo } from 'react';

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
      className={`transition-all duration-500 cursor-crosshair ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {displayText}
    </Component>
  );
};

// Elemento decorativo de "Nó de Dados"
const DataNode = ({ className = "" }) => (
  <div className={`w-1.5 h-1.5 bg-[var(--accent)] rounded-full shadow-[0_0_8px_var(--accent)] animate-pulse ${className}`} />
);

interface PageManifestoProps {
    isDarkMode?: boolean;
}

const PageManifesto: React.FC<PageManifestoProps> = ({ isDarkMode = true }) => {
  return (
    <div className="relative pt-32 pb-60 px-6 md:px-12 w-full min-h-screen flex flex-col items-center bg-transparent overflow-hidden selection:bg-[var(--accent)] selection:text-black">
      
      {/* Efeito de Scanline Vertical (Atmosférico) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-[0.03]">
        <div className="absolute top-0 left-0 w-full h-1 bg-[var(--accent)] animate-[scanline_10s_linear_infinite]" />
      </div>

      {/* Espinha Dorsal Refinada */}
      <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent [.light-mode_&]:via-black/10 -z-10">
        <DataNode className="absolute top-[20%] -left-[2px]" />
        <DataNode className="absolute top-[50%] -left-[2px]" />
        <DataNode className="absolute top-[85%] -left-[2px]" />
      </div>

      <div className="max-w-6xl w-full flex flex-col gap-40 md:gap-64 relative z-10">
        
        {/* BLOCO 01 - O Limiar */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 items-start">
           <div className="md:text-right md:pr-16 md:pt-12 order-2 md:order-1 relative">
              <div className="flex flex-col gap-3 font-mono text-sm md:text-lg opacity-60 border-l-2 md:border-l-0 md:border-r-2 border-[var(--accent)]/30 pl-6 md:pl-0 md:pr-6 py-4 transition-opacity hover:opacity-100">
                  <DecodedText text="do vazio com a forma" delay={600} className="block" />
                  <DecodedText text="do corpo com o mundo" delay={900} className="block" />
                  <DecodedText text="do eu com o outro" delay={1200} className="block" />
                  <DecodedText text="do controle com o fluxo" delay={1500} className="block text-[var(--accent)] font-bold tracking-tight" />
              </div>
           </div>
           
           <div className="order-1 md:order-2">
              <DecodedText 
                 tag="h2"
                 text="entre o atrito" 
                 delay={200} 
                 className="font-electrolize text-6xl md:text-8xl leading-[0.8] text-white [.light-mode_&]:text-black block mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] [.light-mode_&]:drop-shadow-none"
               />
           </div>
        </section>

        {/* BLOCO 02 - O Espaço */}
        <section className="relative py-20 md:py-32">
            <div className="flex flex-col items-center text-center max-w-5xl mx-auto">
               <DecodedText text="abre-se um espaço" delay={1800} className="font-electrolize text-3xl md:text-5xl block mb-3 opacity-90" />
               <DecodedText text="além do limiar da consciência terrena" delay={2100} className="font-mono text-[10px] md:text-xs opacity-40 tracking-[0.5em] uppercase block mb-16" />

               {/* Typography Gigante com Blur de Fundo */}
               <div className="w-screen relative left-1/2 -translate-x-1/2 border-y border-white/5 [.light-mode_&]:border-black/5 py-16 md:py-28 my-12 bg-white/[0.02] [.light-mode_&]:bg-black/[0.02] backdrop-blur-[2px]">
                   <DecodedText 
                     text="dez elevado a menos trinta e três centímetros" 
                     delay={2400} 
                     className="text-4xl md:text-7xl lg:text-8xl font-light text-[var(--accent)] block font-electrolize leading-none max-w-6xl mx-auto px-6 tracking-tighter"
                   />
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-left max-w-4xl w-full px-6 md:px-0 mt-12">
                  <div className="font-mono text-base opacity-60 space-y-3 leading-relaxed">
                      <DecodedText text="o tecido central onde tudo reside" delay={2700} className="block"/>
                      <DecodedText text="em transição molecular" delay={3000} className="block"/>
                      <DecodedText text="o que não se fixa, transmuta" delay={3300} className="block text-white [.light-mode_&]:text-black font-bold border-b border-[var(--accent)]/20 pb-1 inline-block"/>
                  </div>
                  
                  <div className="font-mono text-sm opacity-60 flex flex-col justify-end items-start md:items-end">
                      <div className="flex flex-col items-start md:items-end gap-0 relative group cursor-crosshair">
                          <div className="pb-3 border-l md:border-l-0 md:border-r border-[var(--accent)] pl-6 md:pl-0 md:pr-6 relative">
                             <DecodedText text="aonde o que está embaixo é como o que está no alto" delay={3600} className="block leading-tight text-white [.light-mode_&]:text-black" />
                             <div className="absolute left-0 md:left-auto md:right-0 bottom-0 w-3 h-px bg-[var(--accent)] shadow-[0_0_5px_var(--accent)]"></div>
                          </div>
                          
                          <div className="pt-3 border-l md:border-l-0 md:border-r border-[var(--accent)]/30 pl-6 md:pl-0 md:pr-6 relative">
                             <div className="absolute left-0 md:left-auto md:right-0 top-0 w-3 h-px bg-[var(--accent)]/30"></div>
                             <DecodedText text="e o que está no alto é como o que está embaixo" delay={3900} className="block leading-tight opacity-70" />
                          </div>
                      </div>
                      <DecodedText text="absorve no tempo e abstrai no agora" delay={4200} className="block text-[var(--accent)] pt-6 md:pr-6 opacity-90 italic"/>
                  </div>
               </div>
            </div>
        </section>

        {/* BLOCO 03 - Origem */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-8 relative">
           <div className="md:col-start-6 md:col-span-7 flex flex-col items-start">
               <DecodedText text="há treze bilhões de anos" delay={4800} className="font-electrolize text-5xl md:text-8xl block leading-[0.9] text-white [.light-mode_&]:text-black mb-10 drop-shadow-[0_0_20px_rgba(var(--accent-rgb),0.1)]" />
               
               <div className="pl-8 border-l border-white/10 [.light-mode_&]:border-black/10 space-y-6">
                  <DecodedText text="sou matéria em reorganização" delay={5100} className="font-mono text-xl md:text-2xl text-[var(--accent)] block tracking-tight" />
                  
                  <div className="font-mono text-base opacity-50 space-y-2">
                      <DecodedText text="quarks, léptons, partículas" delay={5400} className="block" />
                      <DecodedText text="hoje atravessadas por fluidos terráqueos" delay={5700} className="block" />
                      <DecodedText text="quem fui segundo passado não é mais eu" delay={6000} className="block" />
                  </div>

                  <div className="pt-6 font-mono text-base opacity-80 space-y-3 max-w-lg">
                      <DecodedText text="negociando constantemente com a tendência ao caos" delay={6300} className="block italic opacity-60" />
                      <DecodedText text="onde o excesso entorpece a frequência" delay={6600} className="block" />
                      <DecodedText text="percebo no ruído o escape entre estímulo e sentido" delay={6900} className="block text-white [.light-mode_&]:text-black font-bold text-lg md:text-xl border-t border-white/5 pt-4" />
                  </div>
               </div>
           </div>
        </section>

        {/* BLOCO 04 - Operação */}
        <section className="md:pr-24">
            <div className="bg-black/40 [.light-mode_&]:bg-white/40 backdrop-blur-md border border-white/5 [.light-mode_&]:border-black/5 p-10 md:p-16 rounded-3xl relative overflow-hidden group shadow-2xl">
               {/* Decoração Tech Refinada */}
               <div className="absolute top-6 right-8 flex gap-3 opacity-30 group-hover:opacity-100 transition-opacity">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_5px_red]"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 shadow-[0_0_5px_yellow]"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_green]"></div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                   <div className="space-y-6">
                       <DecodedText text="opero em desconformidade controlada" delay={7200} className="font-electrolize text-3xl md:text-4xl text-[var(--accent)] block leading-tight" />
                       <div className="space-y-4 font-mono text-base md:text-lg opacity-80 border-l border-[var(--accent)]/20 pl-6">
                           <p className="flex items-center gap-4"><span className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full opacity-40"></span><DecodedText text="resistindo à (des)ordem" delay={7500}/></p>
                           <p className="flex items-center gap-4"><span className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full opacity-40"></span><DecodedText text="criando padrões temporários" delay={7800}/></p>
                       </div>
                   </div>

                   <div className="font-mono text-sm md:text-base leading-relaxed opacity-50 flex flex-col justify-end space-y-4 text-justify md:text-left">
                       <DecodedText text="o modo dominante de existir gera angústia por natureza" delay={8100} className="block" />
                       <DecodedText text="nos limita a poucos sentidos" delay={8400} className="block" />
                       <DecodedText text="enquanto transitamos pela impermanência" delay={8700} className="block text-white [.light-mode_&]:text-black opacity-80" />
                   </div>
               </div>
            </div>
        </section>

        {/* BLOCO 05 - A Falta */}
        <section className="flex flex-col items-center text-center py-24 md:py-40">
             <div className="max-w-3xl space-y-12 relative">
                 <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-px h-24 bg-gradient-to-t from-[var(--accent)]/50 to-transparent"></div>
                 
                 <DecodedText 
                   text="a falta surge quando a expectativa não se sustenta" 
                   delay={9000} 
                   className="font-electrolize text-3xl md:text-5xl block leading-tight text-white [.light-mode_&]:text-black px-4"
                 />
                 
                 <div className="h-px w-32 bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent mx-auto opacity-60"></div>
                 
                 <div className="font-mono text-base md:text-lg opacity-50 space-y-4 max-w-2xl mx-auto px-6">
                    <DecodedText text="projetamos cenários para suportar o indeterminado" delay={9300} className="block" />
                    <DecodedText text="aderimos à lógica utilitária por pressão e sobrevivência" delay={9600} className="block" />
                 </div>
                 
                 <div className="pt-12">
                    <DecodedText text="a existência não se sustenta na ilusão" delay={9900} className="block font-mono text-xs tracking-[0.6em] uppercase opacity-30 mb-4" />
                    <div className="inline-block relative">
                       <DecodedText text="pois existir é explorar e transcender" delay={10200} className="block font-electrolize text-2xl md:text-3xl text-[var(--accent)] px-8 py-4 border border-[var(--accent)]/20 rounded-full hover:bg-[var(--accent)]/5 transition-colors" />
                    </div>
                 </div>
             </div>
        </section>

        {/* BLOCO 06 - Poder */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
             <div className="relative">
                <div className="absolute -left-12 top-1/2 -translate-y-1/2 font-vt text-8xl md:text-9xl opacity-[0.03] select-none pointer-events-none">PODER</div>
                <DecodedText 
                  text="poder é discernir o que se sente" 
                  delay={10500} 
                  className="font-electrolize text-6xl md:text-8xl leading-[0.8] text-white [.light-mode_&]:text-black block"
                />
                <DecodedText text="para reconhecer o necessário" delay={10800} className="font-mono text-sm md:text-base opacity-40 block mt-8 tracking-widest uppercase" />
             </div>

             <div className="border-t border-white/10 [.light-mode_&]:border-black/10 pt-12 md:pl-12">
                 <div className="font-mono text-lg md:text-xl opacity-70 space-y-2">
                     <DecodedText text="quando a palavra falha" delay={11100} className="block hover:text-[var(--accent)]" />
                     <DecodedText text="a forma não sustenta" delay={11400} className="block hover:text-[var(--accent)]" />
                     <DecodedText text="o movimento escorre" delay={11700} className="block hover:text-[var(--accent)]" />
                 </div>
                 <div className="mt-12 font-electrolize text-3xl md:text-4xl text-[var(--accent)] flex flex-col gap-2">
                     <DecodedText text="sinais atravessam" delay={12000} className="block drop-shadow-[0_0_10px_rgba(var(--accent-rgb),0.3)]" />
                     <DecodedText text="o tecido cósmico" delay={12300} className="block opacity-60 ml-8" />
                 </div>
             </div>
        </section>

        {/* FINAL - Criando */}
        <section className="pt-48 pb-32 flex flex-col items-center justify-center relative">
             <div className="absolute inset-0 bg-gradient-to-t from-[var(--accent)]/10 via-transparent to-transparent pointer-events-none opacity-40"></div>
             
             <div className="text-center space-y-6 z-10">
                 <div className="flex flex-col gap-2 opacity-30">
                    <DecodedText text="é nessa fenda" delay={12600} className="font-mono text-xs tracking-[0.8em] uppercase block" />
                    <DecodedText text="que observo" delay={12900} className="font-mono text-xs tracking-[0.8em] uppercase block" />
                 </div>
                 
                 <div className="pt-12 relative">
                    <div className="absolute inset-0 bg-[var(--accent)]/20 blur-[80px] rounded-full -z-10 animate-pulse"></div>
                    <span className="font-nabla text-8xl md:text-[14rem] leading-none block mix-blend-screen [.light-mode_&]:mix-blend-multiply transition-transform hover:scale-105 duration-1000" style={{ fontPalette: isDarkMode ? '--matrix' : '--matrix-blue' }}>
                        <DecodedText text="criando." delay={13200} />
                    </span>
                 </div>
             </div>
        </section>

      </div>

      <style>{`
        @keyframes scanline {
          from { transform: translateY(-100%); }
          to { transform: translateY(100vh); }
        }
      `}</style>
    </div>
  );
};

export default memo(PageManifesto);
