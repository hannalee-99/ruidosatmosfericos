
import React, { useState, useEffect, memo } from 'react';

interface NoiseBackgroundProps {
  opacity?: number;
  muted?: boolean;
}

const NoiseBackground: React.FC<NoiseBackgroundProps> = memo(({ opacity = 0.5, muted = true }) => {
  const [videoSrc, setVideoSrc] = useState('ruidos_atmosfericos.mp4');

  useEffect(() => {
    const saved = localStorage.getItem('ra_video');
    if (saved) setVideoSrc(saved);
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full -z-10 overflow-hidden pointer-events-none select-none">
      <div className="absolute inset-0 bg-black"></div>
      
      <video
        key={videoSrc}
        autoPlay
        loop
        muted={muted}
        playsInline
        preload="auto"
        className="w-full h-full object-cover mix-blend-screen brightness-[0.85] contrast-[1.2] transition-opacity duration-1000"
        style={{ 
          opacity,
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
      
      <div 
        className="absolute inset-0 w-[200%] h-[200%] pointer-events-none mix-blend-overlay z-20 opacity-[0.12]"
        style={{
            backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')",
            animation: "noiseAnimation 0.3s steps(4) infinite",
            top: '-50%',
            left: '-50%',
            willChange: 'transform'
        }}
      ></div>

      <style>{`
        @keyframes noiseAnimation {
          0% { transform: translate(0, 0); }
          10% { transform: translate(-2%, -1%); }
          30% { transform: translate(-4%, 2%); }
          50% { transform: translate(3%, -3%); }
          70% { transform: translate(-2%, 4%); }
          90% { transform: translate(4%, -1%); }
          100% { transform: translate(0, 0); }
        }
      `}</style>
    </div>
  );
});

export default NoiseBackground;
