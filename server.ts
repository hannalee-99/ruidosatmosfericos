
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { Feed } from 'feed';
import { INITIAL_DATA } from './initialData';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = 3000;

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

  // RSS Route
  app.get('/rss.xml', (req, res) => {
    const feed = generateFeed();
    res.header('Content-Type', 'application/xml');
    res.send(feed.rss2());
  });

  // Atom Route
  app.get('/atom.xml', (req, res) => {
    const feed = generateFeed();
    res.header('Content-Type', 'application/xml');
    res.send(feed.atom1());
  });

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
    console.log(`RSS Feed available at http://0.0.0.0:${port}/rss.xml`);
  });
}

startServer();
