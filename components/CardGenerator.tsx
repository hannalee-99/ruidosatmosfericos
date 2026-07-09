import React, { useState, useEffect, useRef } from 'react';
import NeobrutalistButton from './NeobrutalistButton';

interface CardGeneratorProps {
  initialTitle: string;
  initialTagline?: string;
  bgImageUrl?: string;
  onApplyImage: (dataUrl: string) => void;
  onClose: () => void;
  toastTrigger: (msg: string) => void;
}

type ThemeType = 'slate' | 'void' | 'rust' | 'cyber';
type FormatType = 'landscape' | 'square' | 'vertical';
type FontType = 'sans' | 'mono' | 'serif';
type AlignType = 'left' | 'center' | 'right';
type BorderStyleType = 'none' | 'border' | 'tech';

export const CardGenerator: React.FC<CardGeneratorProps> = ({
  initialTitle,
  initialTagline = 'ruídos atmosféricos',
  bgImageUrl,
  onApplyImage,
  onClose,
  toastTrigger,
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [tagline, setTagline] = useState(initialTagline);
  const [theme, setTheme] = useState<ThemeType>('slate');
  const [format, setFormat] = useState<FormatType>('landscape');
  const [font, setFont] = useState<FontType>('sans');
  const [align, setAlign] = useState<AlignType>('left');
  const [borderStyle, setBorderStyle] = useState<BorderStyleType>('tech');
  const [useBgImage, setUseBgImage] = useState(!!bgImageUrl);
  const [overlayOpacity, setOverlayOpacity] = useState(0.75);
  const [imgZoom, setImgZoom] = useState(1.0);
  const [imgOffsetX, setImgOffsetX] = useState(0);
  const [imgOffsetY, setImgOffsetY] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Redraw canvas whenever parameters change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dimensions based on chosen format
    let width = 1200;
    let height = 630;
    if (format === 'square') {
      width = 1080;
      height = 1080;
    } else if (format === 'vertical') {
      width = 1080;
      height = 1920;
    }

    canvas.width = width;
    canvas.height = height;

    const drawTextAndElements = () => {
      // 1. Draw border / framing
      if (borderStyle === 'border' || borderStyle === 'tech') {
        ctx.strokeStyle = theme === 'cyber' ? '#ccff00' : 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = format === 'vertical' ? 6 : 4;
        const padding = format === 'vertical' ? 80 : 50;
        const radius = format === 'vertical' ? 36 : 20;

        const x = padding;
        const y = padding;
        const w = width - padding * 2;
        const h = height - padding * 2;

        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.arcTo(x + w, y, x + w, y + h, radius);
        ctx.arcTo(x + w, y + h, x, y + h, radius);
        ctx.arcTo(x, y + h, x, y, radius);
        ctx.arcTo(x, y, x + w, y, radius);
        ctx.closePath();
        ctx.stroke();

        if (borderStyle === 'tech') {
          ctx.fillStyle = theme === 'cyber' ? '#ccff00' : 'rgba(255, 255, 255, 0.6)';
          ctx.font = `${format === 'vertical' ? 24 : 14}px monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          // Corners crosshairs
          const offset = format === 'vertical' ? 12 : 8;
          ctx.fillText('+', padding - offset, padding - offset);
          ctx.fillText('+', width - padding + offset, padding - offset);
          ctx.fillText('+', padding - offset, height - padding + offset);
          ctx.fillText('+', width - padding + offset, height - padding + offset);
        }
      }

      // 2. Setup alignment X coordinate
      const paddingX = format === 'vertical' ? 120 : 90;
      const startX = align === 'left' ? paddingX : align === 'right' ? width - paddingX : width / 2;
      ctx.textAlign = align;

      // 3. Draw Tagline (top metadata)
      ctx.fillStyle = theme === 'cyber' ? '#ccff00' : 'rgba(255, 255, 255, 0.55)';
      const taglineSize = format === 'vertical' ? 24 : 13;
      
      if (font === 'mono') {
        ctx.font = `${taglineSize}px "JetBrains Mono", monospace`;
      } else if (font === 'serif') {
        ctx.font = `italic ${taglineSize + 2}px "Playfair Display", Georgia, serif`;
      } else {
        ctx.font = `bold ${taglineSize}px "Inter", sans-serif`;
      }

      const taglineY = format === 'vertical' ? 220 : 130;
      ctx.fillText(tagline.toUpperCase(), startX, taglineY);

      // 4. Draw main Title
      ctx.fillStyle = '#ffffff';
      
      // Responsive size logic based on length & format
      let titleSize = format === 'vertical' ? 68 : 46;
      if (title.length < 15) titleSize += format === 'vertical' ? 24 : 16;
      if (title.length > 35) titleSize -= format === 'vertical' ? 12 : 8;

      if (font === 'mono') {
        ctx.font = `bold ${titleSize}px "JetBrains Mono", monospace`;
      } else if (font === 'serif') {
        ctx.font = `italic ${titleSize + 4}px "Playfair Display", Georgia, serif`;
      } else {
        ctx.font = `900 ${titleSize}px "Inter", sans-serif`;
      }

      const centerY = height / 2;
      
      // Wrapping text manually for HTML Canvas
      const words = title.split(' ');
      let line = '';
      const lines: string[] = [];
      const maxWidth = width - (paddingX * 2);

      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
          lines.push(line);
          line = words[n] + ' ';
        } else {
          line = testLine;
        }
      }
      lines.push(line);

      const lineHeight = titleSize * 1.3;
      const totalTextHeight = lines.length * lineHeight;
      let currentY = centerY - (totalTextHeight / 2) + (lineHeight / 1.5);

      lines.forEach((l) => {
        ctx.fillText(l.trim(), startX, currentY);
        currentY += lineHeight;
      });

      // 5. Draw Footer (bottom metadata) removed per user request
    };

    // Fill background color or draw image
    if (useBgImage && bgImageUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous'; // avoids tainted canvas
      img.src = bgImageUrl;
      img.onload = () => {
        // cover style drawing with zoom and offset panning
        const imgRatio = img.width / img.height;
        const canvasRatio = width / height;
        let baseWidth = width;
        let baseHeight = height;
        
        if (imgRatio > canvasRatio) {
          baseWidth = height * imgRatio;
        } else {
          baseHeight = width / imgRatio;
        }

        const dWidth = baseWidth * imgZoom;
        const dHeight = baseHeight * imgZoom;
        
        // Center the scaled image, then apply offsets (as percentage of canvas width/height)
        const dx = (width / 2) - (dWidth / 2) + (width * imgOffsetX / 100);
        const dy = (height / 2) - (dHeight / 2) + (height * imgOffsetY / 100);
        
        ctx.drawImage(img, dx, dy, dWidth, dHeight);

        // Apply dark overlay for contrast
        ctx.fillStyle = `rgba(0, 0, 0, ${overlayOpacity})`;
        ctx.fillRect(0, 0, width, height);

        drawTextAndElements();
      };
      img.onerror = () => {
        // Fallback if image fails to load
        drawGradientBg(ctx, width, height, theme);
        drawTextAndElements();
      };
    } else {
      drawGradientBg(ctx, width, height, theme);
      
      // Draw subtle brutalist overlay (scanlines/noise)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.015)';
      for (let y = 0; y < height; y += 4) {
        ctx.fillRect(0, y, width, 1);
      }
      
      drawTextAndElements();
    }

  }, [title, tagline, theme, format, font, align, borderStyle, useBgImage, overlayOpacity, bgImageUrl, imgZoom, imgOffsetX, imgOffsetY]);

  const drawGradientBg = (ctx: CanvasRenderingContext2D, width: number, height: number, selectedTheme: ThemeType) => {
    if (selectedTheme === 'slate') {
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#1c1c1e');
      grad.addColorStop(1, '#09090b');
      ctx.fillStyle = grad;
    } else if (selectedTheme === 'rust') {
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#361109');
      grad.addColorStop(1, '#080100');
      ctx.fillStyle = grad;
    } else if (selectedTheme === 'cyber') {
      ctx.fillStyle = '#060606';
    } else {
      ctx.fillStyle = '#000000';
    }
    ctx.fillRect(0, 0, width, height);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    setIsGenerating(true);
    try {
      const link = document.createElement('a');
      const safeTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      link.download = `ruidos-preview-${safeTitle}-${format}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toastTrigger('card baixado com sucesso!');
    } catch (err) {
      console.error(err);
      toastTrigger('erro ao exportar imagem. permissões de CORS?');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsGenerating(true);
    try {
      // Compress and export
      const dataUrl = canvas.toDataURL('image/webp', 0.85);
      onApplyImage(dataUrl);
      toastTrigger('imagem do card aplicada com sucesso!');
      onClose();
    } catch (err) {
      console.error(err);
      // Try png if webp fails
      try {
        const dataUrl = canvas.toDataURL('image/png');
        onApplyImage(dataUrl);
        toastTrigger('imagem do card aplicada!');
        onClose();
      } catch (pngErr) {
        console.error(pngErr);
        toastTrigger('erro ao aplicar imagem de card no registro');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-8 overflow-y-auto">
      <div className="bg-[#0c0c0d] border border-white/10 rounded-2xl w-full max-w-6xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
          <div>
            <h3 className="text-sm tracking-[0.2em] text-[var(--accent)] font-bold uppercase">Gerador de Card Personalizado</h3>
            <p className="text-[10px] text-neutral-400 mt-1 lowercase font-mono">crie artes exclusivas de compartilhamento a partir de canvas digital</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-neutral-400 hover:text-white text-xs border border-white/10 hover:border-white/30 px-3 py-1.5 rounded-md font-mono lowercase transition-all"
          >
            fechar
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Preview Section */}
          <div className="lg:col-span-7 flex flex-col justify-center items-center bg-black/40 border border-white/5 rounded-xl p-4 min-h-[300px] relative overflow-hidden group">
            <div className="absolute top-3 left-3 text-[9px] font-mono opacity-30 uppercase tracking-widest">
              Canvas de Pré-Visualização
            </div>
            
            {/* The canvas that renders the card */}
            <div className="w-full max-w-full flex items-center justify-center">
              <canvas 
                ref={canvasRef} 
                className="max-h-[50vh] max-w-full rounded-lg border border-white/10 shadow-lg object-contain bg-neutral-900 transition-all duration-300"
              />
            </div>
            
            <p className="text-[9px] font-mono opacity-25 mt-3 lowercase text-center">
              * renderizado em alta definição ({format === 'landscape' ? '1200x630px' : format === 'square' ? '1080x1080px' : '1080x1920px'})
            </p>
          </div>

          {/* Controls Section */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Texts */}
            <div className="space-y-3">
              <label className="text-[10px] text-[var(--accent)] tracking-widest font-bold uppercase block">Textos</label>
              
              <div className="space-y-1">
                <span className="text-[9px] text-neutral-500 uppercase tracking-wider block">Título da Obra</span>
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-black border border-white/10 px-3 py-2 rounded-md outline-none text-xs text-white focus:border-[var(--accent)] font-mono" 
                  placeholder="título..." 
                />
              </div>

              <div className="space-y-1">
                <span className="text-[9px] text-neutral-500 uppercase tracking-wider block">Tagline / Cabeçalho</span>
                <input 
                  type="text" 
                  value={tagline} 
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full bg-black border border-white/10 px-3 py-2 rounded-md outline-none text-xs text-white focus:border-[var(--accent)] font-mono" 
                  placeholder="tagline..." 
                />
              </div>
            </div>

            {/* Formatting */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[9px] text-neutral-500 uppercase tracking-wider block">Formato / Proporção</span>
                <select 
                  value={format} 
                  onChange={(e) => setFormat(e.target.value as FormatType)}
                  className="w-full bg-black border border-white/10 px-3 py-2 rounded-md outline-none text-xs text-white focus:border-[var(--accent)] font-mono lowercase"
                >
                  <option value="landscape">horizontal (1200x630)</option>
                  <option value="square">quadrado (1080x1080)</option>
                  <option value="vertical">story/vertical (1080x1920)</option>
                </select>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] text-neutral-500 uppercase tracking-wider block">Estilo de Fonte</span>
                <select 
                  value={font} 
                  onChange={(e) => setFont(e.target.value as FontType)}
                  className="w-full bg-black border border-white/10 px-3 py-2 rounded-md outline-none text-xs text-white focus:border-[var(--accent)] font-mono lowercase"
                >
                  <option value="sans">sans-serif (inter)</option>
                  <option value="mono">monospace (jetbrains)</option>
                  <option value="serif">serif (playfair / georgia)</option>
                </select>
              </div>
            </div>

            {/* Layout options */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[9px] text-neutral-500 uppercase tracking-wider block">Alinhamento Texto</span>
                <select 
                  value={align} 
                  onChange={(e) => setAlign(e.target.value as AlignType)}
                  className="w-full bg-black border border-white/10 px-3 py-2 rounded-md outline-none text-xs text-white focus:border-[var(--accent)] font-mono lowercase"
                >
                  <option value="left">esquerda</option>
                  <option value="center">centro</option>
                  <option value="right">direita</option>
                </select>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] text-neutral-500 uppercase tracking-wider block">Moldura / Borda</span>
                <select 
                  value={borderStyle} 
                  onChange={(e) => setBorderStyle(e.target.value as BorderStyleType)}
                  className="w-full bg-black border border-white/10 px-3 py-2 rounded-md outline-none text-xs text-white focus:border-[var(--accent)] font-mono lowercase"
                >
                  <option value="none">nenhum</option>
                  <option value="border">borda clássica</option>
                  <option value="tech">brutalista/technical (+)</option>
                </select>
              </div>
            </div>

            {/* Background Setup */}
            <div className="space-y-3 bg-white/[0.02] border border-white/5 p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[var(--accent)] tracking-widest font-bold uppercase">Background</span>
                {bgImageUrl && (
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={useBgImage} 
                      onChange={(e) => setUseBgImage(e.target.checked)}
                      className="rounded border-white/10 bg-black text-[var(--accent)] focus:ring-0 w-3 h-3"
                    />
                    <span className="text-[9px] font-mono lowercase text-neutral-400">usar foto como fundo</span>
                  </label>
                )}
              </div>

              {!useBgImage ? (
                <div className="space-y-1.5">
                  <span className="text-[9px] text-neutral-500 uppercase tracking-wider block">Tema de Fundo</span>
                  <div className="grid grid-cols-4 gap-2">
                    {(['slate', 'void', 'rust', 'cyber'] as ThemeType[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTheme(t)}
                        className={`py-1.5 rounded-md border text-[10px] font-mono uppercase transition-all ${
                          theme === t 
                            ? 'bg-white/10 border-[var(--accent)] text-white' 
                            : 'bg-black border-white/10 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Opacity Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] text-neutral-400 lowercase">opacidade do overlay escuro</span>
                      <span className="text-[9px] font-mono text-[var(--accent)]">{Math.round(overlayOpacity * 100)}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.05"
                      value={overlayOpacity} 
                      onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                      className="w-full accent-[var(--accent)] bg-neutral-900 h-1.5 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Zoom Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] text-neutral-400 lowercase">zoom da imagem</span>
                      <span className="text-[9px] font-mono text-[var(--accent)]">{Math.round(imgZoom * 100)}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="3.5" 
                      step="0.05"
                      value={imgZoom} 
                      onChange={(e) => setImgZoom(parseFloat(e.target.value))}
                      className="w-full accent-[var(--accent)] bg-neutral-900 h-1.5 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Offset X Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] text-neutral-400 lowercase">deslocamento horizontal (x)</span>
                      <span className="text-[9px] font-mono text-[var(--accent)]">{imgOffsetX > 0 ? `+${imgOffsetX}` : imgOffsetX}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="-100" 
                      max="100" 
                      step="1"
                      value={imgOffsetX} 
                      onChange={(e) => setImgOffsetX(parseInt(e.target.value))}
                      className="w-full accent-[var(--accent)] bg-neutral-900 h-1.5 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Offset Y Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] text-neutral-400 lowercase">deslocamento vertical (y)</span>
                      <span className="text-[9px] font-mono text-[var(--accent)]">{imgOffsetY > 0 ? `+${imgOffsetY}` : imgOffsetY}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="-100" 
                      max="100" 
                      step="1"
                      value={imgOffsetY} 
                      onChange={(e) => setImgOffsetY(parseInt(e.target.value))}
                      className="w-full accent-[var(--accent)] bg-neutral-900 h-1.5 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Reset Controls */}
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setImgZoom(1.0);
                        setImgOffsetX(0);
                        setImgOffsetY(0);
                        toastTrigger('zoom e enquadramento redefinidos!');
                      }}
                      className="text-[9px] text-neutral-400 hover:text-white border border-white/10 hover:border-white/30 px-2 py-1 rounded font-mono lowercase transition-all"
                    >
                      redefinir zoom/posição
                    </button>
                  </div>

                  <span className="text-[8px] opacity-40 font-mono block leading-tight lowercase">
                    ajuste o enquadramento arrastando as barras para focar na melhor parte da arte.
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-4 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <NeobrutalistButton 
                  type="button" 
                  variant="matrix" 
                  onClick={handleDownload}
                  disabled={isGenerating}
                  className="text-xs py-3 w-full"
                >
                  {isGenerating ? 'gerando...' : 'baixar card png'}
                </NeobrutalistButton>

                <NeobrutalistButton 
                  type="button" 
                  variant="matrix" 
                  onClick={handleApply}
                  disabled={isGenerating}
                  className="text-xs py-3 w-full bg-[var(--accent)] text-black font-bold"
                >
                  {isGenerating ? 'aplicando...' : 'definir como imagem'}
                </NeobrutalistButton>
              </div>

              <p className="text-[9px] text-center opacity-40 font-mono lowercase">
                &quot;definir como imagem&quot; substituirá a imagem da obra no banco de dados local com este card otimizado.
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
