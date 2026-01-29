
import React, { useState, useEffect } from 'react';

interface NoiseBackgroundProps {
  opacity?: number;
  muted?: boolean;
}

const NoiseBackground: React.FC<NoiseBackgroundProps> = ({ opacity = 0.5, muted = true }) => {
  const [videoSrc, setVideoSrc] = useState('ruidos_atmosfericos.mp4');

  useEffect(() => {
    const saved = localStorage.getItem('ra_video');
    if (saved) setVideoSrc(saved);
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full -z-10 overflow-hidden pointer-events-none select-none">
      <div className="absolute inset-0 bg-black"></div>
      
      {/* Camada de Vídeo (Opcional - Mantida, mas com CSS otimizado) */}
      <video
        key={videoSrc}
        autoPlay
        loop
        muted={muted}
        playsInline
        className="w-full h-full object-cover mix-blend-screen brightness-[0.85] contrast-[1.2]"
        style={{ 
          opacity,
          // Removido o filtro URL pesado. Mantém apenas transformações de composição simples.
          willChange: 'opacity'
        }}
      >
        <source src={videoSrc} type="video/mp4" />
      </video>

      <div 
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.6) 100%)`
        }}
      ></div>
      
      {/* 
         OTIMIZAÇÃO DE PERFORMANCE:
         Substituição do filtro SVG <feTurbulence> (CPU Heavy) por animação CSS de background (GPU Friendly).
         Usa uma imagem de ruído minúscula e move ela rapidamente.
      */}
      <div 
        className="absolute inset-0 w-[200%] h-[200%] pointer-events-none mix-blend-overlay z-20 opacity-[0.15]"
        style={{
            backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')",
            animation: "noiseAnimation 0.4s steps(3) infinite",
            top: '-50%',
            left: '-50%'
        }}
      ></div>

      <style>{`
        @keyframes noiseAnimation {
          0% { transform: translate(0, 0); }
          10% { transform: translate(-5%, -5%); }
          20% { transform: translate(-10%, 5%); }
          30% { transform: translate(5%, -10%); }
          40% { transform: translate(-5%, 15%); }
          50% { transform: translate(-10%, 5%); }
          60% { transform: translate(15%, 0); }
          70% { transform: translate(0, 10%); }
          80% { transform: translate(-15%, 0); }
          90% { transform: translate(10%, 5%); }
          100% { transform: translate(5%, 0); }
        }
      `}</style>
    </div>
  );
};

export default NoiseBackground;
