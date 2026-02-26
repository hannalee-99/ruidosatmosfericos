
import React from 'react';

interface FooterProps {
  showRSS?: boolean;
}

const Footer: React.FC<FooterProps> = ({ showRSS = true }) => {
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
      
      {/* Direita: RSS Feed Link */}
      {showRSS && (
        <div className="absolute right-8 md:right-12 flex items-center gap-2">
          <a 
            href="/rss-feed" 
            target="_blank" 
            rel="noopener noreferrer"
            className="font-mono text-[9px] uppercase tracking-[0.2em] opacity-40 hover:opacity-100 transition-opacity flex items-center gap-1.5"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 11a9 9 0 0 1 9 9"></path><path d="M4 4a16 16 0 0 1 16 16"></path><circle cx="5" cy="19" r="1"></circle></svg>
            feed rss
          </a>
        </div>
      )}

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
