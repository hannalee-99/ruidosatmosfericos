
import { Work, Signal, AboutData, ConnectConfig, ManifestoConfig } from './types';

export const INITIAL_DATA: {
  lastUpdated: number;
  works: Work[];
  signals: Signal[];
  about: {
    profile: AboutData | null;
    connect_config: ConnectConfig | null;
    landing_manifesto: ManifestoConfig | null;
  };
} = {
  "lastUpdated": 1771101700000,
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
      "title": "formas de conexão",
      "year": "2024",
      "month": "12",
      "date": "2024-12-20",
      "technique": "técnica mista sobre tela",
      "dimensions": "100x100 cm",
      "imageUrl": "https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=2070&auto=format&fit=crop",
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
      "imageUrl": "https://64.media.tumblr.com/0274354bfed2d35de4c9a7d56c62bbe3/44698b6eb1de685d-2b/s2048x3072/52bbac4571b22c3c68f7233f6269567c6c51acc1.png",
      "faviconUrl": ""
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
    "landing_manifesto": {
        "id": "landing_manifesto",
        "text": "opero em \ndesconformidade controlada\nresistindo à (des)ordem \ncriando padrões temporários\no modo dominante de existir \ngera angústia por natureza\nos limita a poucos sentidos\nenquanto transitamos \npela impermanência",
        "fullManifesto": [
          "entre o atrito\ndo vazio com a forma\ndo corpo com o mundo\ndo eu com o outro\ndo controle com o fluxo\nabre-se um espaço",
          "além do limiar\nda consciência terrena\n10⁻³³ cm, o tecido central\nonde tudo reside\nem transição molecular\ne o que está embaixo\né como o que está no alto\ne o que está no alto\né como o que está embaixo\nabsorve no tempo\ne abstrai no agora",
          "há treze bilhões de anos\nsou matéria em reorganização\nquarks, léptons, partículas\nhoje atravessadas por fluidos terráqueos",
          "quem fui segundo passado\nnão é mais eu\nnegociando constantemente\nwith a tendência ao caos\nonde o excesso entorpece a frequência\npercebo no ruído o escape",
          "entre estímulo e sentido\nopero em desconformidade controlada\nresistindo à (des)ordem\ncriando padrões temporários",
          "o modo dominante de existir\ngera angústia por natureza\nnos limita a poucos sentidos\nenquanto transitamos pela impermanência",
          "a falta surge\nquando a expectativa não se sustenta\nprojetamos cenários\npara suportar o indeterminado\naderimos à lógica utilitária\npor pressão e sobrevivência\na existência não se sustenta na ilusão\npois existir é transcender",
          "poder é discernir o que se sente\npara reconhecer o necessário\nquando a palavra falha\na forma não sustenta\no movimento escorre",
          "sinais atravessam\no tecido cósmico",
          "e é nessa fenda\nque observo",
          "criando."
        ]
    }
  }
};
