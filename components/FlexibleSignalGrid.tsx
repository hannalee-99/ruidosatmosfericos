import React, { useState, useEffect, useMemo } from 'react';
import { SignalBlock } from '../types';
import LazyImage from './LazyImage';
import { Maximize2, Columns2, Grid3X3, Sparkles } from 'lucide-react';

const formatImageUrl = (url: string): string => {
  if (!url) return '';
  if (url.startsWith('data:image')) return url;
  if (url.includes('drive.google.com')) {
    const match = url.match(/\/d\/(.+?)\/(view|edit)?/) || url.match(/[?&]id=(.+?)(&|$)/);
    if (match && match[1]) {
      return `https://drive.google.com/uc?export=view&id=${match[1]}`;
    }
  }
  return url;
};

interface FlexibleSignalGridProps {
  images: SignalBlock[];
  onImageClick: (src: string, alt: string) => void;
  imageSize?: 'p' | 'm' | 'g';
}

type LayoutMode = 'full' | 'side' | 'gallery';

const FlexibleSignalGrid: React.FC<FlexibleSignalGridProps> = ({ images, onImageClick, imageSize = 'm' }) => {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('side');
  const [aspectRatios, setAspectRatios] = useState<Record<string, number>>({});
  const [loadingDimensions, setLoadingDimensions] = useState(true);
  const [isAuto, setIsAuto] = useState(true);

  // Load image dimensions to determine aspect ratios
  useEffect(() => {
    let active = true;
    const loadDimensions = async () => {
      const ratios: Record<string, number> = {};
      const promises = images.map((img) => {
        return new Promise<void>((resolve) => {
          const imageObj = new Image();
          imageObj.src = formatImageUrl(img.content);
          imageObj.onload = () => {
            if (imageObj.naturalWidth && imageObj.naturalHeight) {
              ratios[img.id] = imageObj.naturalWidth / imageObj.naturalHeight;
            }
            resolve();
          };
          imageObj.onerror = () => {
            resolve();
          };
        });
      });

      await Promise.all(promises);
      if (active) {
        setAspectRatios(ratios);
        setLoadingDimensions(false);
      }
    };

    loadDimensions();
    return () => {
      active = false;
    };
  }, [images]);

  // Determine ideal layout automatically based on proportion and captions
  useEffect(() => {
    if (!isAuto || loadingDimensions) return;

    const hasCaptions = images.some((img) => img.caption && img.caption.trim().length > 0);
    const totalImages = images.length;

    if (totalImages === 1) {
      setLayoutMode('full');
      return;
    }

    // Classify aspect ratios
    let verticalCount = 0;
    let horizontalCount = 0;
    images.forEach((img) => {
      const ratio = aspectRatios[img.id] || 1; // Default to square if unknown
      if (ratio < 0.85) {
        verticalCount++;
      } else if (ratio > 1.2) {
        horizontalCount++;
      }
    });

    if (totalImages >= 3) {
      // If we have many vertical images or captions, 2 columns is usually cleaner than 3
      if (hasCaptions && verticalCount > 1) {
        setLayoutMode('side');
      } else {
        setLayoutMode('gallery');
      }
    } else if (totalImages === 2) {
      // For exactly 2 images:
      // If they are landscape (horizontal) and have captions, full-width is more readable
      if (horizontalCount === 2 && hasCaptions) {
        setLayoutMode('full');
      } else {
        setLayoutMode('side');
      }
    }
  }, [images, aspectRatios, loadingDimensions, isAuto]);

  const handleManualLayoutChange = (mode: LayoutMode) => {
    setLayoutMode(mode);
    setIsAuto(false);
  };

  const hasCaptions = useMemo(() => {
    return images.some((img) => img.caption && img.caption.trim().length > 0);
  }, [images]);

  // Grid styling based on current layoutMode and imageSize
  const gridClassName = useMemo(() => {
    let classes = 'my-12 grid gap-12 transition-all duration-500 ease-in-out';
    if (layoutMode === 'full') {
      classes += ' grid-cols-1';
    } else if (layoutMode === 'side') {
      classes += ' grid-cols-1 md:grid-cols-2';
    } else {
      classes += ' grid-cols-1 sm:grid-cols-2 md:grid-cols-3';
    }

    if (imageSize === 'p') {
      classes += ' max-w-md md:max-w-xl mx-auto w-full';
    } else if (imageSize === 'm') {
      classes += ' max-w-3xl md:max-w-4xl mx-auto w-full';
    } else {
      classes += ' w-full max-w-full md:-mx-16 lg:-mx-24';
    }
    return classes;
  }, [layoutMode, imageSize]);

  return (
    <div className="w-full space-y-4">
      {/* Dynamic Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 [.light-mode_&]:border-black/5 pb-3 mb-6 font-mono text-[10px] lowercase tracking-widest text-neutral-400 [.light-mode_&]:text-neutral-500">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
          <span className="opacity-80">
            registro de imagem // {images.length} {images.length === 1 ? 'item' : 'itens'}
            {hasCaptions && ' (detalhados)'}
            {!loadingDimensions && ` [${isAuto ? 'arranjo inteligente' : 'arranjo manual'}]`}
          </span>
        </div>

        <div className="flex items-center gap-1 bg-neutral-900/60 [.light-mode_&]:bg-neutral-100 p-1 rounded-lg border border-white/5 [.light-mode_&]:border-black/5">
          <button
            onClick={() => setIsAuto(true)}
            className={`px-2 py-1 rounded flex items-center gap-1 transition-all text-[9px] ${
              isAuto
                ? 'bg-[var(--accent)] text-black font-semibold'
                : 'hover:text-white [.light-mode_&]:hover:text-neutral-900 hover:bg-white/5 [.light-mode_&]:hover:bg-black/5 text-neutral-400 [.light-mode_&]:text-neutral-600'
            }`}
            title="Ajustar automaticamente baseado em proporção e legendas"
          >
            <Sparkles size={10} />
            <span>auto</span>
          </button>

          <span className="h-3 w-[1px] bg-white/10 [.light-mode_&]:bg-black/10 mx-1" />

          <button
            onClick={() => handleManualLayoutChange('full')}
            className={`p-1.5 rounded transition-all ${
              layoutMode === 'full' && !isAuto
                ? 'bg-neutral-800 text-[var(--accent)] [.light-mode_&]:bg-neutral-200'
                : 'hover:text-white [.light-mode_&]:hover:text-neutral-950 hover:bg-white/5 [.light-mode_&]:hover:bg-black/5 text-neutral-400 [.light-mode_&]:text-neutral-600'
            }`}
            title="Largura total (1 coluna)"
          >
            <Maximize2 size={11} />
          </button>

          <button
            onClick={() => handleManualLayoutChange('side')}
            className={`p-1.5 rounded transition-all ${
              layoutMode === 'side' && !isAuto
                ? 'bg-neutral-800 text-[var(--accent)] [.light-mode_&]:bg-neutral-200'
                : 'hover:text-white [.light-mode_&]:hover:text-neutral-950 hover:bg-white/5 [.light-mode_&]:hover:bg-black/5 text-neutral-400 [.light-mode_&]:text-neutral-600'
            }`}
            title="Lado a lado (2 colunas)"
          >
            <Columns2 size={11} />
          </button>

          {images.length >= 2 && (
            <button
              onClick={() => handleManualLayoutChange('gallery')}
              className={`p-1.5 rounded transition-all ${
                layoutMode === 'gallery' && !isAuto
                  ? 'bg-neutral-800 text-[var(--accent)] [.light-mode_&]:bg-neutral-200'
                  : 'hover:text-white [.light-mode_&]:hover:text-neutral-950 hover:bg-white/5 [.light-mode_&]:hover:bg-black/5 text-neutral-400 [.light-mode_&]:text-neutral-600'
              }`}
              title="Galeria compacta (3 colunas)"
            >
              <Grid3X3 size={11} />
            </button>
          )}
        </div>
      </div>

      {/* Grid rendering images */}
      <div className={gridClassName}>
        {images.map((imgBlock) => {
          const ratio = aspectRatios[imgBlock.id];
          const isVertical = ratio ? ratio < 0.85 : false;

          return (
            <figure key={imgBlock.id} className="relative w-full flex flex-col group/fig">
              <div
                onClick={() => onImageClick(formatImageUrl(imgBlock.content), imgBlock.caption || 'registro visual')}
                className="relative w-full cursor-zoom-in overflow-hidden rounded-2xl bg-transparent transition-all duration-300"
              >
                <LazyImage
                  src={formatImageUrl(imgBlock.content)}
                  alt={imgBlock.caption || "registro visual"}
                  className={`w-full h-auto bg-transparent transition-all duration-300 ${
                    layoutMode === 'full' && !isVertical ? 'max-h-[80vh] object-cover' : ''
                  }`}
                  imgClassName="rounded-2xl transition-all duration-300"
                  autoHeight={layoutMode !== 'full' || isVertical}
                  overflowHidden={false}
                />
              </div>
              {imgBlock.caption && (
                <figcaption className="mt-4 font-vt text-sm tracking-widest opacity-50 group-hover/fig:opacity-80 transition-opacity lowercase border-l border-[var(--accent)] pl-3 text-neutral-300 [.light-mode_&]:text-neutral-700">
                  {imgBlock.caption}
                  {ratio && (
                    <span className="block mt-1 font-mono text-[9px] opacity-30 select-none">
                      fração: {ratio.toFixed(2)} ({isVertical ? 'vertical' : ratio > 1.25 ? 'horizontal' : 'quadrado'})
                    </span>
                  )}
                </figcaption>
              )}
            </figure>
          );
        })}
      </div>
    </div>
  );
};

export default FlexibleSignalGrid;
