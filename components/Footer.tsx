
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full h-[60px] border-t border-white/5 [.light-mode_&]:border-black/5 relative flex flex-row justify-center items-center px-8 md:px-12 mt-auto bg-black/30 [.light-mode_&]:bg-white/95 backdrop-blur-[4px] z-50 text-white [.light-mode_&]:text-black transition-colors duration-500">
      
      {/* Centro: Marquee (Discreto e em minúsculo) */}
      <div className="absolute inset-0 flex items-center overflow-hidden opacity-10 pointer-events-none">
         <div className="whitespace-nowrap flex animate-marquee font-vt text-[9px] md:text-[10px] tracking-[0.4em] uppercase">
            <span className="flex items-center">
              ruídos atmosféricos v.2.0 <span className="mx-8 opacity-40">///</span> 
              navegando no caos <span className="mx-8 opacity-40">///</span> 
              não espere nada <span className="mx-8 opacity-40">---</span> 
              aprecie tudo <span className="mx-8 opacity-40">///</span>
            </span>
            <span className="flex items-center">
              ruídos atmosféricos v.2.0 <span className="mx-8 opacity-40">///</span> 
              navegando no caos <span className="mx-8 opacity-40">///</span> 
              não espere nada <span className="mx-8 opacity-40">---</span> 
              aprecie tudo <span className="mx-8 opacity-40">///</span>
            </span>
         </div>
      </div>
      
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 60s linear infinite;
        }
      `}</style>
    </footer>
  );
};

export default Footer;
