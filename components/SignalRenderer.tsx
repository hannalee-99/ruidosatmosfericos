
import React, { useMemo } from 'react';
import { Signal, SignalBlock } from '../types';
import LazyImage from './LazyImage';

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
      <div className="w-full rounded-xl overflow-hidden shadow-2xl my-8">
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
        <div className="w-full aspect-video rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-black my-8">
          <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${videoId}`} title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen></iframe>
        </div>
      );
    }
  }

  return (
    <div className="w-full aspect-video rounded-xl overflow-hidden bg-black/10 border border-white/10 my-8">
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

    const subParts = part.content.split(/(\*\*.*?\*\*|\*.*?\*|~~.*?~~)/g);
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
      return sub;
    });
  });
};

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  const lines = content.split('\n');
  return (
    <div className="space-y-6 text-left font-mono text-base md:text-lg font-normal leading-[1.8] opacity-80 text-neutral-300 [.light-mode_&]:text-neutral-800">
      {lines.map((line, index) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('# ')) return <h2 key={index} className="font-electrolize text-3xl md:text-5xl text-white [.light-mode_&]:text-black mt-12 mb-8 opacity-100 lowercase">{trimmed.substring(2)}</h2>;
        if (trimmed.startsWith('## ')) return <h3 key={index} className="font-electrolize text-2xl md:text-4xl text-white [.light-mode_&]:text-black mt-10 mb-6 opacity-95 lowercase">{trimmed.substring(3)}</h3>;
        if (trimmed.startsWith('### ')) return <h4 key={index} className="font-electrolize text-xl md:text-3xl text-white [.light-mode_&]:text-black mt-8 mb-4 opacity-90 lowercase">{trimmed.substring(4)}</h4>;
        if (trimmed.startsWith('> ')) return <blockquote key={index} className="border-l-2 border-[var(--accent)] pl-6 py-2 my-8 italic opacity-70 bg-white/5 [.light-mode_&]:bg-black/5 rounded-r-lg">{parseInline(trimmed.substring(2))}</blockquote>;
        if (trimmed === '---') return <hr key={index} className="border-t border-white/10 [.light-mode_&]:border-black/10 my-8" />;
        return <p key={index} className="lowercase min-h-[1em]">{parseInline(line)}</p>;
      })}
    </div>
  );
};

interface SignalRendererProps {
  signal: Signal;
  onImageClick?: (index: number) => void;
}

type RenderGroup = 
  | { type: 'text'; id: string; content: string }
  | { type: 'gallery'; id: string; images: SignalBlock[] }
  | { type: 'embed'; id: string; content: string };

const SignalRenderer: React.FC<SignalRendererProps> = ({ signal, onImageClick }) => {
  const allImages = useMemo(() => signal.blocks.filter(b => b.type === 'image'), [signal.blocks]);

  const processedBlocks = useMemo(() => {
    const result: RenderGroup[] = [];
    let currentGallery: SignalBlock[] = [];

    signal.blocks.forEach((block, index) => {
      if (block.type === 'image') {
        currentGallery.push(block);
      } else {
        if (currentGallery.length > 0) {
          result.push({ type: 'gallery', id: `gallery-${index}`, images: [...currentGallery] });
          currentGallery = [];
        }
        if (block.type === 'text') result.push({ type: 'text', id: block.id, content: block.content });
        else if (block.type === 'embed') result.push({ type: 'embed', id: block.id, content: block.content });
      }
    });

    if (currentGallery.length > 0) {
      result.push({ type: 'gallery', id: `gallery-end`, images: [...currentGallery] });
    }
    return result;
  }, [signal.blocks]);

  return (
    <div className="space-y-12 w-full">
      {processedBlocks.map((group) => (
        <div key={group.id}>
          {group.type === 'text' && <MarkdownRenderer content={group.content} />}
          {group.type === 'gallery' && (
            <div className={`my-12 grid gap-12 ${group.images.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
              {group.images.map((imgBlock) => (
                <figure key={imgBlock.id} className="relative w-full flex flex-col">
                  <div 
                    className="relative cursor-zoom-in" 
                    onClick={() => {
                      if (onImageClick) {
                        const idx = allImages.findIndex(b => b.id === imgBlock.id);
                        onImageClick(idx);
                      }
                    }}
                  >
                    <LazyImage 
                      src={formatImageUrl(imgBlock.content)} 
                      alt="registro visual" 
                      className="w-full h-auto" 
                      autoHeight 
                    />
                  </div>
                  {imgBlock.caption && <figcaption className="mt-4 font-vt text-sm tracking-widest opacity-60 lowercase border-l border-[var(--accent)] pl-3">{imgBlock.caption}</figcaption>}
                </figure>
              ))}
            </div>
          )}
          {group.type === 'embed' && <SmartEmbed url={group.content} />}
        </div>
      ))}
    </div>
  );
};

export default SignalRenderer;
