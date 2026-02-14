
import { Work, Signal, AboutData, ConnectConfig, SensorData } from './types';

export const INITIAL_DATA: {
  works: Work[];
  signals: Signal[];
  about: {
    profile: AboutData | null;
    connect_config: ConnectConfig | null;
    sensor_metrics: SensorData | null;
  };
} = {
  "works": [
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
    },
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
      "title": "silêncio comprimido",
      "year": "2023",
      "month": "11",
      "date": "2023-12-20",
      "technique": "carvão e acrílica",
      "dimensions": "120x120 cm",
      "imageUrl": "https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?q=80&w=1974&auto=format&fit=crop",
      "isFeatured": true,
      "id": "seed-work-3",
      "gallery": [],
      "status": "disponível",
      "isVisible": true,
      "views": 0
    }
  ],
  "signals": [
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
      "text": "não sou uma imagem única. sou uma coleção de fatias temporais, organizadas por uma estrutura orgânica que cresce sobre o digital.\n\nassim como as raízes verdes buscam caminho no azul profundo, minha consciência navega entre o ruído e a forma, costurando pedaços desconexos em uma identidade provisória.",
      "imageUrl": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1000&auto=format&fit=crop"
    },
    "connect_config": {
      "id": "connect_config",
      "email": "contato@ruidos.atmosfericos",
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
