import React, { useState, useEffect, useMemo } from 'react';
import { Signal, SignalBlock } from '../types';
import LazyImage from './LazyImage';
import Lightbox from './Lightbox';
// No lucide-react icons needed

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

const SmartEmbed: React.FC<{ url: string }> = ({ url }) => {
  if (url.includes('spotify.com')) {
    const embedUrl = url.replace('open.spotify.com/', 'open.spotify.com/embed/');
    return (
      <div className="w-full rounded-xl overflow-hidden shadow-2xl my-8 col-span-2">
        <iframe src={embedUrl} width="100%" height="152" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
      </div>
    );
  }

  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    let videoId = '';
    if (url.includes('v=')) videoId = url.split('v=')[1].split('&')[0];
    else if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1].split('?')[0];
    
    if (videoId) {
      return (
        <div className="w-full aspect-video rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-black my-8 col-span-2">
          <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${videoId}`} title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen></iframe>
        </div>
      );
    }
  }

  return (
    <div className="w-full aspect-video rounded-xl overflow-hidden bg-black/10 border border-white/10 my-8 col-span-2">
      <iframe src={url} className="w-full h-full" frameBorder="0" allowFullScreen></iframe>
    </div>
  );
};

const parseInline = (text: string) => {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.substring(lastIndex, match.index) });
    }
    parts.push({ type: 'link', content: match[1], url: match[2] });
    lastIndex = linkRegex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.substring(lastIndex) });
  }

  return parts.map((part, i) => {
    if (part.type === 'link') {
      return (
        <a key={i} href={part.url} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] underline hover:no-underline font-bold">
          {part.content}
        </a>
      );
    }

    const subParts = part.content.split(/(\*\*.*?\*\*|\*.*?\*|~~.*?~~|<br\s*\/?>)/g);
    return subParts.map((sub, j) => {
      if (sub.startsWith('**') && sub.endsWith('**')) {
        return <strong key={`${i}-${j}`} className="font-bold text-[var(--accent)] opacity-100">{sub.slice(2, -2)}</strong>;
      }
      if (sub.startsWith('*') && sub.endsWith('*')) {
        return <em key={`${i}-${j}`} className="italic opacity-80">{sub.slice(1, -1)}</em>;
      }
      if (sub.startsWith('~~') && sub.endsWith('~~')) {
        return <del key={`${i}-${j}`} className="line-through opacity-50">{sub.slice(2, -2)}</del>;
      }
      if (sub.match(/<br\s*\/?>/)) {
        return <br key={`${i}-${j}`} />;
      }
      return sub;
    });
  });
};

interface Block {
  type: 'p' | 'h2' | 'h3' | 'h4' | 'blockquote' | 'ul' | 'ol' | 'code' | 'hr';
  lines: string[];
  lang?: string;
}

const parseMarkdown = (text: string): Block[] => {
  const lines = text.split(/\r?\n/);
  const blocks: Block[] = [];
  let currentBlock: Block | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Code Blocks
    if (trimmed.startsWith('```')) {
      if (currentBlock && currentBlock.type === 'code') {
        blocks.push(currentBlock);
        currentBlock = null;
      } else {
        if (currentBlock) {
          blocks.push(currentBlock);
        }
        const lang = trimmed.substring(3).trim();
        currentBlock = { type: 'code', lines: [], lang };
      }
      continue;
    }

    if (currentBlock && currentBlock.type === 'code') {
      currentBlock.lines.push(line);
      continue;
    }

    // Horizontal Rules
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      if (currentBlock) {
        blocks.push(currentBlock);
        currentBlock = null;
      }
      blocks.push({ type: 'hr', lines: [] });
      continue;
    }

    // Headers
    if (trimmed.startsWith('# ')) {
      if (currentBlock) {
        blocks.push(currentBlock);
        currentBlock = null;
      }
      blocks.push({ type: 'h2', lines: [trimmed.substring(2)] });
      continue;
    }
    if (trimmed.startsWith('## ')) {
      if (currentBlock) {
        blocks.push(currentBlock);
        currentBlock = null;
      }
      blocks.push({ type: 'h3', lines: [trimmed.substring(3)] });
      continue;
    }
    if (trimmed.startsWith('### ')) {
      if (currentBlock) {
        blocks.push(currentBlock);
        currentBlock = null;
      }
      blocks.push({ type: 'h4', lines: [trimmed.substring(4)] });
      continue;
    }

    // Blockquotes
    if (trimmed.startsWith('>')) {
      const quoteText = trimmed.substring(1).trim();
      if (currentBlock) {
        blocks.push(currentBlock);
      }
      blocks.push({ type: 'blockquote', lines: [quoteText] });
      currentBlock = null;
      continue;
    }

    // Unordered lists
    const bulletMatch = line.match(/^(\s*)([•\-\*])\s+(.*)/);
    if (bulletMatch) {
      const content = bulletMatch[3];
      if (currentBlock && currentBlock.type === 'ul') {
        currentBlock.lines.push(content);
      } else {
        if (currentBlock) {
          blocks.push(currentBlock);
        }
        currentBlock = { type: 'ul', lines: [content] };
      }
      continue;
    }

    // Ordered lists
    const orderedMatch = line.match(/^(\s*)(\d+[\.\)])\s+(.*)/);
    if (orderedMatch) {
      const content = orderedMatch[3];
      if (currentBlock && currentBlock.type === 'ol') {
        currentBlock.lines.push(content);
      } else {
        if (currentBlock) {
          blocks.push(currentBlock);
        }
        currentBlock = { type: 'ol', lines: [content] };
      }
      continue;
    }

    // Paragraphs
    if (currentBlock) {
      blocks.push(currentBlock);
      currentBlock = null;
    }
    blocks.push({ type: 'p', lines: [line] });
  }

  if (currentBlock) {
    blocks.push(currentBlock);
  }

  return blocks;
};

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  const blocks = useMemo(() => parseMarkdown(content), [content]);

  return (
    <div className="space-y-0 text-left col-span-2">
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'h2':
            return (
              <h2 key={index} className="font-electrolize text-2xl md:text-4xl text-white [.light-mode_&]:text-black mt-16 mb-6 lowercase tracking-wider">
                {block.lines[0]}
              </h2>
            );
          case 'h3':
            return (
              <h3 key={index} className="font-electrolize text-xl md:text-3xl text-white [.light-mode_&]:text-black mt-12 mb-4 lowercase tracking-wide">
                {block.lines[0]}
              </h3>
            );
          case 'h4':
            return (
              <h4 key={index} className="font-electrolize text-lg md:text-2xl text-white [.light-mode_&]:text-black mt-8 mb-3 lowercase opacity-90">
                {block.lines[0]}
              </h4>
            );
          case 'blockquote':
            return (
              <blockquote key={index} className="border-l-4 border-[var(--accent)] pl-8 py-4 my-10 bg-[var(--accent)]/5 rounded-r-xl shadow-inner font-vt text-lg md:text-xl text-neutral-200 [.light-mode_&]:text-neutral-800 italic relative leading-relaxed max-w-2xl mx-auto">
                {parseInline(block.lines.join(' '))}
              </blockquote>
            );
          case 'code':
            return (
              <div key={index} className="relative my-10 rounded-xl overflow-hidden bg-black/60 [.light-mode_&]:bg-neutral-900 text-left font-mono text-sm leading-relaxed shadow-2xl">
                <div className="flex items-center justify-between px-4 py-2 bg-black/40 text-[9px] uppercase tracking-[0.2em] text-neutral-500">
                  <span>{block.lang || 'registro'}</span>
                  <span className="animate-pulse">● ativo</span>
                </div>
                <pre className="p-5 overflow-x-auto text-emerald-400 [.light-mode_&]:text-teal-700 font-mono select-all">
                  <code>{block.lines.join('\n')}</code>
                </pre>
              </div>
            );
          case 'ul':
            return (
              <ul key={index} className="space-y-3.5 my-8 pl-4">
                {block.lines.map((item, idx) => (
                  <li key={idx} className="flex gap-3 items-start text-base md:text-lg leading-[1.8] lowercase text-neutral-300 [.light-mode_&]:text-neutral-700 font-mono">
                    <span className="text-[var(--accent)] select-none shrink-0 mt-1.5 opacity-80 text-xs">■</span>
                    <span className="flex-grow">{parseInline(item)}</span>
                  </li>
                ))}
              </ul>
            );
          case 'ol':
            return (
              <ol key={index} className="space-y-3.5 my-8 pl-4">
                {block.lines.map((item, idx) => (
                  <li key={idx} className="flex gap-3 items-start text-base md:text-lg leading-[1.8] lowercase text-neutral-300 [.light-mode_&]:text-neutral-700 font-mono">
                    <span className="text-[var(--accent)] font-vt text-lg leading-none shrink-0 mt-0.5 font-bold">{idx + 1}.</span>
                    <span className="flex-grow">{parseInline(item)}</span>
                  </li>
                ))}
              </ol>
            );
          case 'hr':
            return <div key={index} className="my-12 h-1 bg-transparent" />;
          case 'p':
          default:
            const isEmpty = block.lines[0].trim() === '';
            return (
              <p key={index} className={`lowercase leading-[1.9] text-base md:text-[17px] opacity-85 text-neutral-300 [.light-mode_&]:text-neutral-700 font-mono tracking-wide ${isEmpty ? 'min-h-[1.5em]' : 'mb-8 last:mb-0'}`}>
                {isEmpty ? '\u00A0' : parseInline(block.lines[0])}
              </p>
            );
        }
      })}
    </div>
  );
};

interface SignalGridProps {
  signal: Signal;
}

// Represent groups of consecutive image blocks together with text/embed blocks
type GridGroup =
  | { type: 'text'; id: string; content: string }
  | { type: 'embed'; id: string; content: string }
  | { type: 'images'; id: string; blocks: SignalBlock[] };

export const SignalGrid: React.FC<SignalGridProps> = ({ signal }) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const imageSize = signal.imageSize || 'm';
  const [aspectRatios, setAspectRatios] = useState<Record<string, number>>({});
  const [loadingAspects, setLoadingAspects] = useState(true);
  const [autoLayout, setAutoLayout] = useState(true);
  
  // Custom manual override state for specific group IDs
  const [manualLayouts, setManualLayouts] = useState<Record<string, 'full' | 'side' | 'gallery'>>({});

  // Flat list of all images in the post for gallery lightbox navigation
  const allImagesList = useMemo(() => {
    const list: { src: string; alt: string; id: string }[] = [];
    signal.blocks.forEach((block) => {
      if (block.type === 'image') {
        list.push({
          src: formatImageUrl(block.content),
          alt: block.caption || 'registro visual',
          id: block.id
        });
      }
    });
    return list;
  }, [signal.blocks]);

  // Group signal blocks to detect single vs dual or multiple images in sequence
  const groupedGroups = useMemo(() => {
    const groups: GridGroup[] = [];
    let currentImages: SignalBlock[] = [];

    signal.blocks.forEach((block, idx) => {
      if (block.type === 'image') {
        currentImages.push(block);
      } else {
        if (currentImages.length > 0) {
          groups.push({
            type: 'images',
            id: `img-group-${idx - currentImages.length}`,
            blocks: [...currentImages],
          });
          currentImages = [];
        }
        if (block.type === 'text') {
          groups.push({ type: 'text', id: block.id, content: block.content });
        } else if (block.type === 'embed') {
          groups.push({ type: 'embed', id: block.id, content: block.content });
        }
      }
    });

    if (currentImages.length > 0) {
      groups.push({
        type: 'images',
        id: `img-group-end`,
        blocks: [...currentImages],
      });
    }

    return groups;
  }, [signal.blocks]);

  // Load image aspect ratios to automatically toggle modes
  useEffect(() => {
    let active = true;
    const loadAspects = async () => {
      const ratios: Record<string, number> = {};
      const imageBlocks = signal.blocks.filter((b) => b.type === 'image');
      
      const promises = imageBlocks.map((img) => {
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
        setLoadingAspects(false);
      }
    };

    loadAspects();
    return () => {
      active = false;
    };
  }, [signal.blocks]);

  const handleToggleLayout = (groupId: string, mode: 'full' | 'side' | 'gallery') => {
    setAutoLayout(false);
    setManualLayouts((prev) => ({ ...prev, [groupId]: mode }));
  };

  return (
    <div className="w-full space-y-12">
      {/* Grid container with 2 columns on medium screens */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12 w-full items-start">
        {groupedGroups.map((group) => {
          if (group.type === 'text') {
            // Standard blocks for text span col-span-2
            return (
              <div key={group.id} className="col-span-1 md:col-span-2">
                <MarkdownRenderer content={group.content} />
              </div>
            );
          }

          if (group.type === 'embed') {
            return (
              <div key={group.id} className="col-span-1 md:col-span-2">
                <SmartEmbed url={group.content} />
              </div>
            );
          }

          // Images Group Layout Determination
          const images = group.blocks;
          const totalImages = images.length;
          
          if (totalImages === 0) return null;

          // Default fallback assignment
          let chosenLayout: 'full' | 'side' | 'gallery' = totalImages === 1 ? 'full' : 'side';

          if (signal.imageLayout && signal.imageLayout !== 'auto') {
            chosenLayout = signal.imageLayout;
          } else {
            // Auto logic based on aspect ratio & captions
            if (totalImages === 1) {
              const singleImg = images[0];
              const ratio = aspectRatios[singleImg.id] || 1.0;
              const hasCaption = !!singleImg.caption;

              // If image is vertical (portrait ratio < 0.82) and has caption, we automatically
              // toggle to side layout (col-span-1 on desktop instead of full col-span-2)
              // to make it smaller and elegant in the journal!
              if (ratio < 0.82 && hasCaption) {
                chosenLayout = 'side'; // places it in single column layout beautifully
              } else {
                chosenLayout = 'full'; // landscapes and square stay full size
              }
            } else if (totalImages === 2) {
              const imgA = images[0];
              const imgB = images[1];
              const ratioA = aspectRatios[imgA.id] || 1.0;
              const ratioB = aspectRatios[imgB.id] || 1.0;
              const hasCaptionA = !!imgA.caption;
              const hasCaptionB = !!imgB.caption;

              // If dual-images have highly mismatching proportions or both have captions
              // we can toggle them to vertical stack (full width) so captions and images get ample room
              const verticalMismatch = Math.abs(ratioA - ratioB) > 0.6;
              const bothHaveCaptions = hasCaptionA && hasCaptionB;

              if (verticalMismatch || bothHaveCaptions) {
                chosenLayout = 'full'; // Toggles to stacked full-width elements automatically
              } else {
                chosenLayout = 'side'; // Dual-image side-by-side layout (grid-cols-2)
              }
            } else {
              // 3 or more images default to side or gallery
              chosenLayout = 'gallery';
            }
          }

          return (
            <div 
              key={group.id} 
              className="col-span-1 md:col-span-2 space-y-4 group/section"
            >
              {/* Dynamic grid mapping based on chosenLayout and imageSize */}
              <div 
                className={`grid gap-10 transition-all duration-300 ${
                  chosenLayout === 'full' 
                    ? 'grid-cols-1' 
                    : chosenLayout === 'side' 
                    ? 'grid-cols-1 md:grid-cols-2' 
                    : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
                } ${
                  imageSize === 'p' 
                    ? 'max-w-md md:max-w-xl mx-auto w-full' 
                    : imageSize === 'm' 
                    ? 'max-w-3xl md:max-w-4xl mx-auto w-full' 
                    : 'w-full max-w-full md:-mx-12 lg:-mx-20'
                }`}
              >
                {images.map((img) => {
                  const ratio = aspectRatios[img.id];
                  const isVertical = ratio ? ratio < 0.85 : false;

                  return (
                    <figure key={img.id} className="relative w-full flex flex-col group/fig">
                      <div
                        onClick={() => {
                          const idx = allImagesList.findIndex((item) => item.src === formatImageUrl(img.content));
                          setLightboxIndex(idx !== -1 ? idx : 0);
                        }}
                        className="relative w-full cursor-zoom-in overflow-hidden rounded-2xl bg-transparent transition-all duration-300"
                      >
                        <LazyImage
                          src={formatImageUrl(img.content)}
                          alt={img.caption || "registro visual"}
                          className={`w-full h-auto bg-transparent transition-all duration-300 ${
                            chosenLayout === 'full' && !isVertical ? 'max-h-[85vh] object-cover' : ''
                          }`}
                          imgClassName="rounded-2xl w-full h-auto object-cover transition-all duration-300"
                          autoHeight={chosenLayout !== 'full' || isVertical}
                          overflowHidden={false}
                        />
                      </div>
                      {img.caption && (
                        <figcaption className="mt-4 font-vt text-sm tracking-widest opacity-50 group-hover/fig:opacity-80 transition-opacity lowercase border-l border-[var(--accent)] pl-3 text-neutral-300 [.light-mode_&]:text-neutral-700">
                          {img.caption}
                        </figcaption>
                      )}
                    </figure>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Lightbox Modal with Gallery Navigation */}
      <Lightbox 
        isOpen={lightboxIndex !== null} 
        onClose={() => setLightboxIndex(null)} 
        src={lightboxIndex !== null ? allImagesList[lightboxIndex].src : ''} 
        alt={lightboxIndex !== null ? allImagesList[lightboxIndex].alt : ''} 
        images={allImagesList}
        currentIndex={lightboxIndex !== null ? lightboxIndex : 0}
        onIndexChange={(idx) => setLightboxIndex(idx)}
      />
    </div>
  );
};

export default SignalGrid;
