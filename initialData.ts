import { Work, Signal, AboutData, ConnectConfig, SensorData } from './types';

export const INITIAL_DATA: {
  lastUpdated: number;
  works: Work[];
  signals: Signal[];
  about: {
    profile: AboutData | null;
    connect_config: ConnectConfig | null;
    sensor_metrics: SensorData | null;
  };
} = {
  "lastUpdated": 1771110920113,
  "works": [
    {
      "title": "essência na ionosfera",
      "year": "2025",
      "month": "2",
      "date": "2025-03-15",
      "technique": "acrílica sobre tela",
      "dimensions": "70x60 cm",
      "imageUrl": "https://64.media.tumblr.com/b66d6bd4a439ffdcc801f7dab1e05667/eed33f511f0fbd92-86/s2048x3072/d7031cbe671309845c127778c351178555843cc5.jpg",
      "isFeatured": true,
      "id": "seed-work-2",
      "gallery": [],
      "status": "disponível",
      "isVisible": true,
      "views": 0
    },
    {
      "title": "ruídos de perto",
      "year": "2024",
      "month": "11",
      "date": "2024-12-01",
      "technique": "acrílica sobre painel",
      "dimensions": "50x50 cm",
      "imageUrl": "https://64.media.tumblr.com/2469fc83feaecaf0b7a97fa55f6793d6/670f92e2b0934e32-bb/s2048x3072/3b1cf9f39410af90a8d0607d572f83c0024b2472.jpg",
      "isFeatured": true,
      "id": "seed-work-1",
      "gallery": [],
      "status": "disponível",
      "isVisible": true,
      "views": 0
    }
  ],
  "signals": [
    {
      "id": "signal-1771101541489",
      "slug": "esse-e-um-teste",
      "title": "esse é um teste",
      "subtitle": "",
      "date": "14/02/2026",
      "status": "rascunho",
      "views": 0,
      "blocks": [
        {
          "id": "b-1771101541489",
          "type": "text",
          "content": "## tomara que dê certo dessa vez!\n\n# quero publicar *logoooo*\nlalalalla\n**lalalalala**\nuhuuuuuu\n\n\n"
        },
        {
          "id": "b-1771101598236-5nyk3",
          "type": "image",
          "content": "https://64.media.tumblr.com/0274354bfed2d35de4c9a7d56c62bbe3/44698b6eb1de685d-2b/s2048x3072/52bbac4571b22c3c68f7233f6269567c6c51acc1.png",
          "caption": "eu"
        },
        {
          "id": "b-1771101605541-thnrj",
          "type": "embed",
          "content": "<iframe data-testid=\"embed-iframe\" style=\"border-radius:12px\" src=\"https://open.spotify.com/embed/track/02XvknCqa2kPcOLdqD9h69?utm_source=generator&theme=0\" width=\"100%\" height=\"352\" frameBorder=\"0\" allowfullscreen=\"\" allow=\"autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture\" loading=\"lazy\"></iframe>"
        }
      ]
    },
    {
      "id": "signal-macro-vision-v2",
      "title": "nunca esquecer",
      "subtitle": "não perca a visão macro!!! a descida da consciência através das camadas da matéria.",
      "date": "13/03/2025",
      "status": "publicado",
      "views": 12,
      "blocks": [
        {
          "id": "b-diagram",
          "type": "image",
          "content": "https://theosophy.wiki/en/images/thumb/7/7b/Diagram_of_Principles_1890.jpg/400px-Diagram_of_Principles_1890.jpg",
          "caption": "source > soul > mind > body > earth"
        },
        {
          "id": "b-noise",
          "type": "image",
          "content": "https://upload.wikimedia.org/wikipedia/commons/c/ce/WMAP_2010.png",
          "caption": "fundo cósmico de micro-ondas"
        }
      ]
    }
  ],
  "about": {
    "profile": {
      "id": "profile",
      "text": "fluxo no ar",
      "imageUrl": "https://64.media.tumblr.com/0274354bfed2d35de4c9a7d56c62bbe3/44698b6eb1de685d-2b/s2048x3072/52bbac4571b22c3c68f7233f6269567c6c51acc1.png"
    },
    "connect_config": {
      "id": "connect_config",
      "email": "oi.hannalee@gmail.com",
      "sobreText": "ruídos atmosféricos // v3.1 // sistema de gestão existencial",
      "links": [
        {
          "id": "lnk1",
          "label": "instagram",
          "url": "https://instagram.com"
        }
      ]
    },
    "sensor_metrics": {
      "id": "sensor_metrics",
      "clicks": 0
    }
  }
};
