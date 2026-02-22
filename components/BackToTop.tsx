
import React, { useState, useEffect } from 'react';

interface BackToTopProps {
  targetId?: string;
  bottom?: string;
  right?: string;
  zIndex?: string;
}

const BackToTop: React.FC<BackToTopProps> = ({ 
  targetId, 
  bottom = "bottom-20", 
  right = "right-8",
  zIndex = "z-[80]"
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const scrollTarget = targetId ? document.getElementById(targetId) : window;
    
    const handleScroll = () => {
      let currentScroll = 0;
      if (targetId) {
        const el = document.getElementById(targetId);
        if (el) currentScroll = el.scrollTop;
      } else {
        currentScroll = window.scrollY;
      }
      setVisible(currentScroll > 300);
    };

    if (targetId) {
      const el = document.getElementById(targetId);
      if (el) el.addEventListener('scroll', handleScroll, { passive: true });
    } else {
      window.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => {
      if (targetId) {
        const el = document.getElementById(targetId);
        if (el) el.removeEventListener('scroll', handleScroll);
      } else {
        window.removeEventListener('scroll', handleScroll);
      }
    };
  }, [targetId]);

  const scrollToTop = () => {
    const scrollTarget = targetId ? document.getElementById(targetId) : window;
    if (scrollTarget) {
      scrollTarget.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <button
      onClick={scrollToTop}
      className={`fixed ${bottom} ${right} ${zIndex} w-12 h-12 rounded-full flex items-center justify-center bg-black/80 [.light-mode_&]:bg-white/80 backdrop-blur-md hover:bg-[var(--accent)] text-white [.light-mode_&]:text-black hover:text-black border border-white/10 transition-all duration-500 transform ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-90 pointer-events-none'}`}
      title="voltar ao topo"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M12 19V5M5 12l7-7 7 7"/>
      </svg>
    </button>
  );
};

export default BackToTop;
