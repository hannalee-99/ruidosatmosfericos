
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
    <div className="fixed inset-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-black"></div>
      <video
        key={videoSrc}
        autoPlay
        loop
        muted={muted}
        playsInline
        className="w-full h-full object-cover mix-blend-screen brightness-[0.85] contrast-[1.2]"
        style={{ 
          opacity,
          filter: 'blur(4px) saturate(0.5) url(#distortionFilter)',
          transform: 'scale(1.02)'
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
      
      <div className="absolute inset-0 opacity-[0.08] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

      <svg className="hidden">
        <filter id="distortionFilter">
          <feTurbulence 
            type="fractalNoise" 
            baseFrequency="0.01" 
            numOctaves="2" 
            result="noise" 
          >
            <animate 
              attributeName="baseFrequency" 
              values="0.01;0.015;0.01" 
              dur="15s" 
              repeatCount="indefinite" 
            />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="8" />
        </filter>
      </svg>
    </div>
  );
};

export default NoiseBackground;
