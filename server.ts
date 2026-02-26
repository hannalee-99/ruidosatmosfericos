
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { Feed } from 'feed';
import { INITIAL_DATA } from './initialData';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

    // RSS Routes (at the very top)
    app.get('/rss.xml', (req, res) => {
      console.log('HIT: /rss.xml');
      try {
        const feed = generateFeed();
        res.set('Content-Type', 'text/xml');
        res.send(feed.rss2());
      } catch (err) {
        console.error('RSS Error:', err);
        res.status(500).send('RSS Generation Error');
      }
    });

    // Test route without extension
    app.get('/rss-feed', (req, res) => {
      console.log('HIT: /rss-feed');
      const feed = generateFeed();
      res.set('Content-Type', 'text/xml');
      res.send(feed.rss2());
    });

    app.get('/atom.xml', (req, res) => {
      console.log('HIT: /atom.xml');
      try {
        const feed = generateFeed();
        res.set('Content-Type', 'text/xml');
        res.send(feed.atom1());
      } catch (err) {
        console.error('Atom Error:', err);
        res.status(500).send('Atom Generation Error');
      }
    });

    // Health check
    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', server: 'express' });
    });

  // Function to generate the feed
  const generateFeed = () => {
    const siteUrl = process.env.APP_URL || 'https://ruidos-atmosfericos.run.app';
    const feed = new Feed({
      title: "ruídos atmosféricos",
      description: "espere (espero) nada aprecie (aprecio) tudo - captura de frequências e registros de campo",
      id: siteUrl,
      link: siteUrl,
      language: "pt-BR",
      image: `${siteUrl}/favicon.ico`,
      favicon: `${siteUrl}/favicon.ico`,
      copyright: `All rights reserved ${new Date().getFullYear()}, ruídos atmosféricos`,
      author: {
        name: "ruídos atmosféricos",
        email: INITIAL_DATA.about.connect_config?.email,
        link: siteUrl
      }
    });

    // Add signals (blog posts) to the feed
    INITIAL_DATA.signals
      .filter(post => post.status === 'publicado')
      .forEach(post => {
        const url = `${siteUrl}/sinais/${post.slug || post.id}`;
        
        // Convert date DD/MM/YYYY to Date object
        const [day, month, year] = post.date.split('/').map(Number);
        const date = new Date(year, month - 1, day);

        // Simple content summary from blocks
        const content = post.blocks
          .filter(b => b.type === 'text')
          .map(b => b.content)
          .join('\n\n');

        feed.addItem({
          title: post.title,
          id: url,
          link: url,
          description: post.subtitle || '',
          content: content,
          author: [
            {
              name: "ruídos atmosféricos",
              link: siteUrl
            }
          ],
          date: date,
          image: post.coverImageUrl || post.seoImage
        });
      });

    return feed;
  };

  // JSON Feed Route
  app.get('/feed.json', (req, res) => {
    const feed = generateFeed();
    res.header('Content-Type', 'application/json');
    res.send(feed.json1());
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
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
    console.log(`RSS Feed: http://0.0.0.0:${port}/rss.xml`);
  });
} catch (e) {
  console.error('Failed to start server:', e);
}
}

startServer();
