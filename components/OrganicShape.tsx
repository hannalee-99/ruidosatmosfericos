
import React, { useEffect, useState } from 'react';
import { GoogleGenAI } from "@google/genai";

interface OrganicShapeProps {
  color: string;
  size: number;
  top: string;
  left: string;
  delay: string;
  opacity?: number;
}

const OrganicShape: React.FC<OrganicShapeProps> = ({ 
  color, 
  size, 
  top, 
  left, 
  delay,
  opacity = 0.8
}) => {
  const [textureUrl, setTextureUrl] = useState<string | null>(null);
  const idSuffix = delay.replace(/[^a-z0-9]/gi, '') + Math.random().toString(36).substr(2, 5);
  const filterId = `lava-filter-${idSuffix}`;
  const patternId = `lava-pattern-${idSuffix}`;

  // Hook para textura generativa (opcional, mantendo a lógica existente)
  useEffect(() => {
    let isMounted = true;
    const generateTexture = async () => {
      try {
        if (!process.env.API_KEY) return;
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `Abstract liquid texture, lava lamp oil close up. Color: ${color}. Smooth gradients, minimal noise.`;
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: { parts: [{ text: prompt }] },
          config: { imageConfig: { aspectRatio: "1:1" } }
        });
        if (!isMounted) return;
        const parts = response.candidates?.[0]?.content?.parts;
        if (parts) {
            for (const part of parts) {
                if (part.inlineData) {
                    setTextureUrl(`data:image/png;base64,${part.inlineData.data}`);
                    break;
                }
            }
        }
      } catch (e) { console.warn("Texture skipped:", e); }
    };
    const timeout = setTimeout(generateTexture, Math.random() * 5000);
    return () => { isMounted = false; clearTimeout(timeout); };
  }, [color]);

  return (
    <div 
      className="absolute pointer-events-none mix-blend-screen"
      style={{
        top,
        left,
        width: `${size}px`,
        height: `${size}px`,
        opacity: opacity,
        // Animação de flutuação muito mais lenta para efeito "Lava Lamp"
        animation: `lava-float 30s ease-in-out infinite alternate ${delay}`,
        filter: `url(#${filterId}) blur(20px)`,
        willChange: 'transform'
      }}
    >
      <svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg" className="w-full h-full overflow-visible">
        <defs>
          <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
            {/* 1. Turbulência Suave e Lenta para deformação líquida */}
            <feTurbulence type="turbulence" baseFrequency="0.008" numOctaves="2" result="turbulence">
               <animate attributeName="baseFrequency" values="0.008;0.004;0.008" dur="40s" repeatCount="indefinite"/>
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="turbulence" scale="120" result="distorted" />
            
            {/* 2. Gooey Effect (Blur + Contrast) para bordas viscosas */}
            <feGaussianBlur in="distorted" stdDeviation="15" result="blur" />
            <feColorMatrix 
              in="blur" 
              mode="matrix" 
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -8" 
              result="goo" 
            />
            <feComposite in="goo" in2="goo" operator="atop"/>
          </filter>

          {textureUrl && (
            <pattern id={patternId} patternUnits="userSpaceOnUse" width="500" height="500">
               <image href={textureUrl} x="0" y="0" width="500" height="500" preserveAspectRatio="none" />
            </pattern>
          )}
        </defs>

        {/* Forma Base: Um círculo que se deforma organicamente via CSS + Filtro SVG */}
        <g style={{ animation: `lava-morph 45s linear infinite ${delay}` }}>
          <circle cx="250" cy="250" r="180" fill={textureUrl ? `url(#${patternId})` : color} />
        </g>
      </svg>
      
      <style>{`
        @keyframes lava-float {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(40px, -60px) scale(1.1); }
          100% { transform: translate(-30px, 40px) scale(0.95); }
        }
        @keyframes lava-morph {
          0% { transform: rotate(0deg) scale(1, 1); transform-origin: center; }
          33% { transform: rotate(120deg) scale(1.1, 0.9); transform-origin: center; }
          66% { transform: rotate(240deg) scale(0.95, 1.05); transform-origin: center; }
          100% { transform: rotate(360deg) scale(1, 1); transform-origin: center; }
        }
      `}</style>
    </div>
  );
};

export default OrganicShape;
