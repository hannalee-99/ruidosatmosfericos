
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { INITIAL_DATA } from './initialData';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function escapeHtmlAttr(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function getSignalDescription(signal: any): string {
  if (signal.subtitle) return signal.subtitle;
  if (Array.isArray(signal.blocks)) {
    const textBlock = signal.blocks.find((b: any) => b.type === 'paragraph' && b.content);
    if (textBlock && textBlock.content) {
      return textBlock.content.substring(0, 160) + (textBlock.content.length > 160 ? '...' : '');
    }
  }
  return '';
}

function getDynamicHtml(reqUrl: string, html: string): string {
  const cleanPath = reqUrl.replace(/\/$/, ''); // remove trailing slash
  
  // Carrega os dados atualizados do Backoffice dinamicamente para injeção de SEO em tempo real
  let works = INITIAL_DATA.works;
  let signals = INITIAL_DATA.signals;
  
  try {
    const worksPath = path.join(process.cwd(), 'works-db.json');
    if (fs.existsSync(worksPath)) {
      works = JSON.parse(fs.readFileSync(worksPath, 'utf-8'));
    }
  } catch (e) {
    console.error('Erro ao ler works-db.json para SEO:', e);
  }
  
  try {
    const signalsPath = path.join(process.cwd(), 'signals-db.json');
    if (fs.existsSync(signalsPath)) {
      signals = JSON.parse(fs.readFileSync(signalsPath, 'utf-8'));
    }
  } catch (e) {
    console.error('Erro ao ler signals-db.json para SEO:', e);
  }

  let title = INITIAL_DATA.about.seo_config?.title || "ruídos atmosféricos";
  let description = INITIAL_DATA.about.seo_config?.description || "uma experiência imersiva de arte digital e manifesto artístico. registros de presença, sensações e desequilíbrio controlado entre o físico e o digital.";
  let imageUrl = INITIAL_DATA.about.seo_config?.image || "https://64.media.tumblr.com/2469fc83feaecaf0b7a97fa55f6793d6/670f92e2b0934e32-bb/s2048x3072/3b1cf9f39410af90a8d0607d572f83c0024b2472.jpg";
  
  // Procura imagem padrão se não configurada
  if (!imageUrl || imageUrl.trim() === '') {
    const firstFeatured = works.find(w => w.isFeatured && w.imageUrl);
    if (firstFeatured) {
      imageUrl = firstFeatured.imageUrl;
    }
  }

  const isMateria = cleanPath.startsWith('/materia/');
  const isSinais = cleanPath.startsWith('/sinais/') || cleanPath.startsWith('/sinal/');

  if (isMateria) {
    const slug = cleanPath.substring('/materia/'.length);
    const work = works.find(w => w.slug === slug || w.id === slug);
    if (work) {
      title = `${work.title} — ruídos atmosféricos`;
      description = work.seoDescription || work.description || work.technique || description;
      imageUrl = work.imageUrl || imageUrl;
    }
  } else if (isSinais) {
    const prefix = cleanPath.startsWith('/sinais/') ? '/sinais/' : '/sinal/';
    const slug = cleanPath.substring(prefix.length);
    const signal = signals.find(s => s.slug === slug || s.id === slug);
    if (signal) {
      title = `${signal.title} — ruídos atmosféricos`;
      description = signal.seoDescription || getSignalDescription(signal) || description;
      imageUrl = signal.seoImage || signal.coverImageUrl || imageUrl;
    }
  }

  const escapedTitle = escapeHtmlAttr(title);
  const escapedDescription = escapeHtmlAttr(description);
  const escapedImage = escapeHtmlAttr(imageUrl);

  let modified = html;
  
  // Replace title tag
  modified = modified.replace(/<title>[^<]*<\/title>/gi, `<title>${escapedTitle}</title>`);
  
  // Replace description tag
  modified = modified.replace(/<meta name="description" content="[^"]*">/gi, `<meta name="description" content="${escapedDescription}">`);
  
  // Replace open graph and twitter tags
  modified = modified.replace(/<meta property="og:title" content="[^"]*">/gi, `<meta property="og:title" content="${escapedTitle}">`);
  modified = modified.replace(/<meta property="og:description" content="[^"]*">/gi, `<meta property="og:description" content="${escapedDescription}">`);
  modified = modified.replace(/<meta property="og:image" content="[^"]*">/gi, `<meta property="og:image" content="${escapedImage}">`);
  modified = modified.replace(/<meta property="og:url" content="[^"]*">/gi, `<meta property="og:url" content="https://ruidosatmosfericos.online${cleanPath}">`);
  
  modified = modified.replace(/<meta name="twitter:title" content="[^"]*">/gi, `<meta name="twitter:title" content="${escapedTitle}">`);
  modified = modified.replace(/<meta name="twitter:description" content="[^"]*">/gi, `<meta name="twitter:description" content="${escapedDescription}">`);
  modified = modified.replace(/<meta name="twitter:image" content="[^"]*">/gi, `<meta name="twitter:image" content="${escapedImage}">`);
  modified = modified.replace(/<meta name="twitter:url" content="[^"]*">/gi, `<meta name="twitter:url" content="https://ruidosatmosfericos.online${cleanPath}">`);

  return modified;
}

async function startServer() {
  console.log('Starting server...');
  try {
    const app = express();
    const port = 3000;

    // Request logging
    app.use((req, res, next) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
      next();
    });

    // Middleware de parse do body com limite aumentado para imagens customizadas geradas
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ extended: true, limit: '50mb' }));

    // API para retornar obras cadastradas (lê works-db.json ou fallback para INITIAL_DATA)
    app.get('/api/works', (req, res) => {
      try {
        const worksPath = path.join(process.cwd(), 'works-db.json');
        if (fs.existsSync(worksPath)) {
          const data = JSON.parse(fs.readFileSync(worksPath, 'utf-8'));
          return res.json(data);
        }
        res.json(INITIAL_DATA.works);
      } catch (err) {
        console.error('Erro ao ler base de dados de obras:', err);
        res.json(INITIAL_DATA.works);
      }
    });

    // API para retornar sinais cadastrados (lê signals-db.json ou fallback para INITIAL_DATA)
    app.get('/api/signals', (req, res) => {
      try {
        const signalsPath = path.join(process.cwd(), 'signals-db.json');
        if (fs.existsSync(signalsPath)) {
          const data = JSON.parse(fs.readFileSync(signalsPath, 'utf-8'));
          return res.json(data);
        }
        res.json(INITIAL_DATA.signals);
      } catch (err) {
        console.error('Erro ao ler base de dados de sinais:', err);
        res.json(INITIAL_DATA.signals);
      }
    });

    // API para persistir alterações do Backoffice no servidor
    app.post('/api/save-data', (req, res) => {
      try {
        const { type, data } = req.body;
        if (type !== 'works' && type !== 'signals') {
          return res.status(400).json({ error: 'Tipo inválido de dados.' });
        }
        const fileName = type === 'works' ? 'works-db.json' : 'signals-db.json';
        const filePath = path.join(process.cwd(), fileName);
        
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
        console.log(`[API] Sucesso ao gravar ${data.length} itens do tipo ${type} em ${fileName}`);
        res.json({ success: true, count: data.length });
      } catch (err) {
        console.error('Erro no endpoint de save-data:', err);
        res.status(500).json({ error: 'Erro ao persistir dados no servidor.' });
      }
    });

    // Health check
    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', server: 'express' });
    });

    // Ensure sw.js is served with no-cache headers to quickly unregister old service workers
    app.get('/sw.js', (req, res) => {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Content-Type', 'application/javascript');
      res.sendFile(path.join(__dirname, 'sw.js'));
    });

    // Intercept page requests for Dynamic SEO
    const pageRoutes = [
      '/', 
      '/materia', 
      '/materia/:slug', 
      '/sinais', 
      '/sinais/:slug', 
      '/sinal', 
      '/sinal/:slug', 
      '/manifesto', 
      '/ecos', 
      '/about', 
      '/connect'
    ];

    app.get(pageRoutes, (req, res, next) => {
      const isProd = process.env.NODE_ENV === 'production';
      const indexPath = isProd 
        ? path.join(__dirname, 'dist', 'index.html') 
        : path.join(__dirname, 'index.html');

      fs.readFile(indexPath, 'utf-8', async (err, html) => {
        if (err) {
          console.error('Error reading index.html:', err);
          return next();
        }

        let processedHtml = html;
        if (!isProd) {
          const vite = app.get('vite');
          if (vite) {
            try {
              processedHtml = await vite.transformIndexHtml(req.originalUrl, html);
            } catch (viteErr) {
              console.error('Vite transform error:', viteErr);
            }
          }
        }

        const modifiedHtml = getDynamicHtml(req.path, processedHtml);
        res.setHeader('Content-Type', 'text/html');
        res.send(modifiedHtml);
      });
    });

    // Vite middleware for development
    if (process.env.NODE_ENV !== 'production') {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.set('vite', vite);
      app.use(vite.middlewares);
    } else {
      // Serve static files in production
      app.use(express.static(path.join(__dirname, 'dist')));
      app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'dist', 'index.html'));
      });
    }

    app.listen(port, '0.0.0.0', () => {
      console.log(`Server running at http://0.0.0.0:${port}`);
    });
  } catch (e) {
    console.error('Failed to start server:', e);
  }
}

startServer();
