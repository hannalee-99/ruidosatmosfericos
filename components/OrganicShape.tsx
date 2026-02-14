
import React, { useEffect, useState, memo } from 'react';
import { GoogleGenAI } from "@google/genai";

interface OrganicShapeProps {
  color: string;
  size: number;
  top: string;
  left: string;
  delay: string;
  opacity?: number;
}

const OrganicShape: React.FC<OrganicShapeProps> = memo(({ 
  color, 
  size, 
  top, 
  left, 
  delay,
  opacity = 0.8
}) => {
  const [textureUrl, setTextureUrl] = useState<string | null>(null);
  const filterId = `lava-filter-${delay.replace(/[^a-z0-9]/gi, '')}`;

  useEffect(() => {
    let isMounted = true;
    const generateTexture = async () => {
      if (!process.env.API_KEY) return;
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: { parts: [{ text: `abstract fluid texture, lava lamp, color ${color}, high contrast` }] },
          config: { imageConfig: { aspectRatio: "1:1" } }
        });
        if (!isMounted) return;
        const imgPart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
        if (imgPart?.inlineData) {
          setTextureUrl(`data:image/png;base64,${imgPart.inlineData.data}`);
        }
      } catch (e) {
        console.warn("Organic texture failed", e);
      }
    };
    generateTexture();
    return () => { isMounted = false; };
  }, [color]);

  return (
    <div 
      className="absolute pointer-events-none mix-blend-screen will-change-transform"
      style={{
        top, left,
        width: `${size}px`, height: `${size}px`,
        opacity,
        animation: `lava-float 40s ease-in-out infinite alternate ${delay}`,
        filter: `url(#${filterId}) blur(15px)`,
      }}
    >
      <svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
          <filter id={filterId}>
            <feTurbulence type="turbulence" baseFrequency="0.01" numOctaves="1" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="80" />
          </filter>
        </defs>
        <circle 
          cx="250" cy="250" r="180" 
          fill={color}
          style={{ 
            animation: `lava-morph 30s linear infinite ${delay}`,
            transformOrigin: 'center'
          }} 
        />
        {textureUrl && (
          <image href={textureUrl} x="70" y="70" width="360" height="360" opacity="0.4" clipPath="circle(180px at 180px 180px)" />
        )}
      </svg>
      
      <style>{`
        @keyframes lava-float {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(20px, -30px) scale(1.05); }
        }
        @keyframes lava-morph {
          0% { border-radius: 40% 60% 60% 40% / 40% 40% 60% 60%; transform: rotate(0deg); }
          100% { border-radius: 40% 60% 60% 40% / 40% 40% 60% 60%; transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
});

export default OrganicShape;
