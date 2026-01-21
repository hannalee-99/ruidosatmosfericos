
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full h-[60px] border-t border-white/5 [.light-mode_&]:border-black/5 relative flex flex-row justify-center items-center px-8 md:px-12 mt-auto bg-black/30 [.light-mode_&]:bg-white/95 backdrop-blur-[4px] z-50 text-white [.light-mode_&]:text-black transition-colors duration-500">
      
      {/* Centro: Marquee (Discreto e em minúsculo) */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden opacity-10 pointer-events-none">
         <div className="whitespace-nowrap flex animate-marquee font-vt text-[11px] tracking-[0.3em]">
            <span>ruídos atmosféricos v.2.0 /// navegando no caos ///</span>
            <span className="mx-12">---</span>
            <span>não espere nada /// aprecie tudo ///</span>
         </div>
      </div>
      
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(20%); }
          100% { transform: translateX(-20%); }
        }
        .animate-marquee {
          animation: marquee 40s linear infinite alternate;
        }
      `}</style>
    </footer>
  );
};

export default Footer;
