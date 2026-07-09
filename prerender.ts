// Gera páginas HTML estáticas por post (obras e sinais) com as meta tags
// de redes sociais já embutidas. Roda DEPOIS do `vite build`, sobre o
// dist/index.html final (com os assets já com hash).
//
// Isso faz o compartilhamento social funcionar em qualquer host estático
// (Vercel, Netlify, etc.) sem precisar de um servidor Node em produção:
// o robô do WhatsApp/Facebook/X/LinkedIn recebe um HTML real já com a
// imagem, título e descrição corretos do post.

import fs from 'fs';
import path from 'path';
import { INITIAL_DATA } from './initialData';
import { resolveSeoMeta, injectSeoIntoHtml } from './seo';

const DIST = path.join(process.cwd(), 'dist');
const TEMPLATE_PATH = path.join(DIST, 'index.html');

function loadJsonOr<T>(fileName: string, fallback: T): T {
  try {
    const p = path.join(process.cwd(), fileName);
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, 'utf-8')) as T;
    }
  } catch (e) {
    console.warn(`[prerender] Não foi possível ler ${fileName}, usando initialData.`, e);
  }
  return fallback;
}

function writePage(routePath: string, html: string) {
  // /materia/slug  ->  dist/materia/slug/index.html  (URL limpa)
  const outDir = path.join(DIST, routePath.replace(/^\//, ''));
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf-8');
}

function run() {
  if (!fs.existsSync(TEMPLATE_PATH)) {
    console.error('[prerender] dist/index.html não encontrado. Rode o vite build antes.');
    process.exit(1);
  }

  const template = fs.readFileSync(TEMPLATE_PATH, 'utf-8');
  const aboutSeo = INITIAL_DATA.about.seo_config;

  const works = loadJsonOr('works-db.json', INITIAL_DATA.works) as any[];
  const signals = loadJsonOr('signals-db.json', INITIAL_DATA.signals) as any[];

  let count = 0;

  // Obras (matérias)
  for (const work of works) {
    if (work.isVisible === false) continue;
    const slug = work.slug || work.id;
    if (!slug) continue;
    const route = `/materia/${slug}`;
    const meta = resolveSeoMeta(route, works, signals, aboutSeo);
    writePage(route, injectSeoIntoHtml(template, meta));
    count++;
  }

  // Sinais (matéria/blog) — gera tanto /sinais/ quanto /sinal/ por segurança
  for (const signal of signals) {
    if (signal.status && signal.status !== 'publicado') continue;
    const slug = signal.slug || signal.id;
    if (!slug) continue;
    for (const prefix of ['/sinais/', '/sinal/']) {
      const route = `${prefix}${slug}`;
      const meta = resolveSeoMeta(route, works, signals, aboutSeo);
      writePage(route, injectSeoIntoHtml(template, meta));
    }
    count++;
  }

  console.log(`[prerender] ${count} posts pré-renderizados com SEO em dist/.`);
}

run();
