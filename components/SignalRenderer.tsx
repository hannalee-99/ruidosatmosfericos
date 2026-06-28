
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

    // 1. Code Blocks
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

    // 2. Horizontal Rules
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      if (currentBlock) {
        blocks.push(currentBlock);
        currentBlock = null;
      }
      blocks.push({ type: 'hr', lines: [] });
      continue;
    }

    // 3. Headers
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

    // 4. Blockquotes
    if (trimmed.startsWith('>')) {
      const quoteText = trimmed.substring(1).trim();
      if (currentBlock) {
        blocks.push(currentBlock);
      }
      blocks.push({ type: 'blockquote', lines: [quoteText] });
      currentBlock = null;
      continue;
    }

    // 5. Unordered lists
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

    // 6. Ordered lists
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

    // 7. Normal paragraphs: DO NOT merge lines to preserve original line-breaks
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
    <div className="space-y-0 text-left">
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'h2':
            return (
              <h2 key={index} className="font-electrolize text-2xl md:text-4xl text-white [.light-mode_&]:text-black mt-16 mb-6 lowercase tracking-wider border-b border-white/10 [.light-mode_&]:border-black/10 pb-3">
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
              <div key={index} className="relative my-10 rounded-xl overflow-hidden border border-white/10 [.light-mode_&]:border-black/10 bg-black/60 [.light-mode_&]:bg-neutral-900 text-left font-mono text-sm leading-relaxed shadow-2xl">
                <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 [.light-mode_&]:border-black/5 bg-black/40 text-[9px] uppercase tracking-[0.2em] text-neutral-500">
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
            return <hr key={index} className="border-t border-white/15 [.light-mode_&]:border-black/15 my-12" />;
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

interface SignalRendererProps {
  signal: Signal;
}

type RenderGroup = 
  | { type: 'text'; id: string; content: string }
  | { type: 'gallery'; id: string; images: SignalBlock[] }
  | { type: 'embed'; id: string; content: string };

const SignalRenderer: React.FC<SignalRendererProps> = ({ signal }) => {
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
            <div className={`my-16 grid gap-12 ${group.images.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
              {group.images.map((imgBlock) => (
                <figure key={imgBlock.id} className="relative w-full flex flex-col group/fig">
                  <div className="relative rounded-2xl overflow-hidden border border-white/10 [.light-mode_&]:border-black/10 shadow-2xl bg-neutral-900 [.light-mode_&]:bg-neutral-100 transition-all duration-700 hover:scale-[1.015] hover:border-[var(--accent)]/40 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                    <LazyImage 
                      src={formatImageUrl(imgBlock.content)} 
                      alt="registro visual" 
                      className="w-full h-auto object-cover" 
                      autoHeight 
                    />
                  </div>
                  {imgBlock.caption && (
                    <figcaption className="mt-4 font-vt text-sm tracking-widest opacity-50 group-hover/fig:opacity-80 transition-opacity lowercase border-l border-[var(--accent)] pl-3">
                      {imgBlock.caption}
                    </figcaption>
                  )}
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
