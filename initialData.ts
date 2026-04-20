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
  "lastUpdated": Date.now(),
  "works": [
    {
      "id": "work-1771621176503",
      "title": "processos em transmutação",
      "slug": "processos-em-transmutacao",
      "year": "2026",
      "month": "01",
      "date": "2026-01-01",
      "technique": "acrílica sobre tela",
      "dimensions": "30x40 cm",
      "imageUrl": "https://res.cloudinary.com/dcxm8yd49/image/upload/v1771620670/processos-em-transmutacao.avif",
      "status": "disponível",
      "isVisible": true,
      "isFeatured": true,
      "featuredOrder": 1,
      "views": 0,
      "description": "quando a palavra falha...",
      "seoDescription": "quando a palavra falha..."
    },
    {
      "id": "work-1771618034208",
      "title": "zona de estudos",
      "slug": "zona-de-estudos",
      "year": "2025",
      "month": "10",
      "date": "2025-10-01",
      "technique": "acrílica sobre tela",
      "dimensions": "18x24 cm",
      "imageUrl": "https://res.cloudinary.com/dcxm8yd49/image/upload/v1771617791/zonadeestudo.avif",
      "status": "disponível",
      "isVisible": true,
      "isFeatured": false,
      "featuredOrder": 999,
      "views": 0,
      "description": "caminhando",
      "seoDescription": "caminhando"
    },
    {
      "id": "work-1771620711655",
      "title": "formas de conexão",
      "slug": "formas-de-conexao",
      "year": "2025",
      "month": "10",
      "date": "2025-10-01",
      "technique": "acrílica sobre tela",
      "dimensions": "30x20 cm",
      "imageUrl": "https://res.cloudinary.com/dcxm8yd49/image/upload/v1771620670/formas-de-conexao.avif",
      "status": "disponível",
      "isVisible": true,
      "isFeatured": false,
      "featuredOrder": 999,
      "views": 0,
      "description": "",
      "seoDescription": ""
    },
    {
      "id": "work-1771625141819",
      "title": "depois",
      "slug": "depois",
      "year": "2025",
      "month": "04",
      "date": "2025-04-01",
      "technique": "acrílica sobre tela",
      "dimensions": "40x40 cm",
      "imageUrl": "https://res.cloudinary.com/dcxm8yd49/image/upload/v1771624957/depois.avif",
      "status": "disponível",
      "isVisible": true,
      "isFeatured": false,
      "featuredOrder": 999,
      "views": 0,
      "description": "",
      "seoDescription": ""
    },
    {
      "id": "work-1771624576638",
      "title": "essência na ionosfera",
      "slug": "essencia-na-ionosfera",
      "year": "2025",
      "month": "02",
      "date": "2025-02-01",
      "technique": "acrílica sobre painel",
      "dimensions": "70x60 cm",
      "imageUrl": "https://res.cloudinary.com/dcxm8yd49/image/upload/v1771624476/essencia_na_ionosfera.avif",
      "status": "disponível",
      "isVisible": true,
      "isFeatured": true,
      "featuredOrder": 2,
      "views": 0,
      "description": "flutuando...",
      "seoDescription": "flutuando..."
    },
    {
      "id": "work-1771625241605",
      "title": "processamento de emoções na usina",
      "slug": "processamento-de-emocoes-na-usina",
      "year": "2025",
      "month": "02",
      "date": "2025-02-01",
      "technique": "acrílica sobre tela",
      "dimensions": "50x50 cm",
      "imageUrl": "https://res.cloudinary.com/dcxm8yd49/image/upload/v1771624972/processamento_de_emocoes.avif",
      "status": "disponível",
      "isVisible": true,
      "isFeatured": false,
      "featuredOrder": 999,
      "views": 0,
      "description": "",
      "seoDescription": ""
    },
    {
      "id": "work-1771621387589",
      "title": "superfície pulsante",
      "slug": "superficie-pulsante",
      "year": "2025",
      "month": "01",
      "date": "2025-01-01",
      "technique": "acrílica sobre tela",
      "dimensions": "40x30cm",
      "imageUrl": "https://res.cloudinary.com/dcxm8yd49/image/upload/v1771620670/superficie-pulsante.avif",
      "status": "disponível",
      "isVisible": true,
      "isFeatured": false,
      "featuredOrder": 999,
      "views": 0,
      "description": "simplesmente não consigo tirar uma boa foto dessa obra, mas adoro ela na minha parede do escritório, me lembra lava lamps!",
      "seoDescription": "simplesmente não consigo tirar uma boa foto dessa obra, mas adoro ela na minha parede do escritório, me lembra lava lamps!"
    },
    {
      "id": "work-1771624652272",
      "title": "ruídos de perto",
      "slug": "ruidos-de-perto",
      "year": "2024",
      "month": "12",
      "date": "2024-12-01",
      "technique": "acrílica sobre tela",
      "dimensions": "50x50 cm",
      "imageUrl": "https://res.cloudinary.com/dcxm8yd49/image/upload/v1771624488/ru%C3%ADdos_de_perto.avif",
      "status": "disponível",
      "isVisible": true,
      "isFeatured": false,
      "featuredOrder": 999,
      "views": 0,
      "description": "",
      "seoDescription": ""
    },
    {
      "id": "work-1771621785684",
      "title": "input:output",
      "slug": "inputoutput",
      "year": "2024",
      "month": "11",
      "date": "2024-11-01",
      "technique": "acrílica sobre tela",
      "dimensions": "80x60 cm",
      "imageUrl": "https://res.cloudinary.com/dcxm8yd49/image/upload/v1771620946/input_output.avif",
      "status": "disponível",
      "isVisible": true,
      "isFeatured": false,
      "featuredOrder": 999,
      "views": 0,
      "description": "primeira obra em tela maior e com tinta acrílica, quis explorar várias técnicas até que virou isso!",
      "seoDescription": "primeira obra em tela maior e com tinta acrílica, quis explorar várias técnicas até que virou isso!"
    },
    {
      "id": "work-1771621688445",
      "title": "santo antônio além do carmo de são salvador da bahia de todos os santos",
      "slug": "sao-salvador-da-bahia-de-todos-os-santos",
      "year": "2024",
      "month": "06",
      "date": "2024-06-01",
      "technique": "acrílica sobre tela",
      "dimensions": "40x30 cm",
      "imageUrl": "https://res.cloudinary.com/dcxm8yd49/image/upload/v1771620742/sao-salvador-da-bahia-de-todos-os-santos.avif",
      "status": "disponível",
      "isVisible": true,
      "isFeatured": false,
      "featuredOrder": 999,
      "views": 0,
      "description": "todo mundo deveria visitar pelo menos 1x na vida Salvador, Bahia.",
      "seoDescription": "todo mundo deveria visitar pelo menos 1x na vida Salvador, Bahia."
    },
    {
      "id": "work-1771621899694",
      "title": "no 3 abre",
      "slug": "no-3-abre",
      "year": "2024",
      "month": "03",
      "date": "2024-03-01",
      "technique": "acrílica no papel canson",
      "dimensions": "A3",
      "imageUrl": "https://res.cloudinary.com/dcxm8yd49/image/upload/v1771620946/no_3_abre.avif",
      "status": "disponível",
      "isVisible": true,
      "isFeatured": false,
      "featuredOrder": 999,
      "views": 0,
      "description": "",
      "seoDescription": ""
    },
    {
      "id": "work-1771621609155",
      "title": "o que surgiu na mente quando eu fechei meus olhos",
      "slug": "o-que-surgiu-na-mente-quando-eu-fechei-meus-olhos",
      "year": "2024",
      "month": "02",
      "date": "2024-02-01",
      "technique": "óleo sobre tela",
      "dimensions": "40x40cm",
      "imageUrl": "https://res.cloudinary.com/dcxm8yd49/image/upload/v1771620678/o-que-vi-quando-fechei-os-olhos.avif",
      "status": "disponível",
      "isVisible": true,
      "isFeatured": false,
      "featuredOrder": 999,
      "views": 0,
      "description": "após cultivo de boas memórias na baía de paraty",
      "seoDescription": "após cultivo de boas memórias na baía de paraty"
    },
    {
      "id": "work-1771621977364",
      "title": "velour no black lodge",
      "slug": "velour-no-black-lodge",
      "year": "2023",
      "month": "11",
      "date": "2023-11-01",
      "technique": "óleo sobre tela",
      "dimensions": "20x15 cm",
      "imageUrl": "https://res.cloudinary.com/dcxm8yd49/image/upload/v1771620966/velour_no_black_lodge.avif",
      "status": "disponível",
      "isVisible": true,
      "isFeatured": true,
      "featuredOrder": 0,
      "views": 0,
      "description": "",
      "seoDescription": ""
    },
    {
      "id": "work-1771625183870",
      "title": "kling klang kats",
      "slug": "kling-klang-kats",
      "year": "2023",
      "month": "07",
      "date": "2023-07-01",
      "technique": "óleo sobre tela",
      "dimensions": "40x50 cm",
      "imageUrl": "https://res.cloudinary.com/dcxm8yd49/image/upload/v1771624965/kling_klang_kats.avif",
      "status": "disponível",
      "isVisible": true,
      "isFeatured": false,
      "featuredOrder": 999,
      "views": 0,
      "description": "",
      "seoDescription": ""
    },
    {
      "id": "work-1771626518362",
      "title": "the hyper post modern world ",
      "slug": "the-hyper-post-modern-world",
      "year": "2014",
      "month": "01",
      "date": "2014-01-01",
      "technique": "digital",
      "dimensions": "",
      "imageUrl": "https://64.media.tumblr.com/32443e171a63a3e6f12f532557fd7e8a/tumblr_n93fqaVKP41qbwhaio1_1280.jpg",
      "status": "disponível",
      "isVisible": true,
      "isFeatured": false,
      "featuredOrder": 999,
      "views": 0,
      "description": "",
      "seoDescription": ""
    }
  ],
  "signals": [
    {
      "id": "signal-1771101541489",
      "slug": "primeiratransmissao",
      "title": "primeira transmissão",
      "subtitle": "alô? pronto!",
      "date": "14/02/2026",
      "status": "publicado",
      "views": 1,
      "blocks": [
        {
          "id": "b-1771101541489",
          "type": "text",
          "content": "fui uma pré-adolescente fascinada por qualquer possibilidade de customizar coisas: cortava todos os uniformes da escola, fazia as próprias capas de caderno, meus próprios icons no photoshop 6.bolinha e lembro como se fosse agora quando conheci o templates by marina e entendi que poderia criar meu sítio digital~~~. passava horasss editando o meu blogger pra ficar com a minha cara que já tinha muita dessa essência aqui que você tá vendo nesse espaço. do dropsdemorango.blogger.com lá em 2004, fotolog, livejournal, deviantart, até o blogpost, onde fiz minha primeira url **ruidosatmosfericos**\n**esse nome**\nera 2007 quando ouvi **ruídos atmosféricos** pela primeira vez. a tv tava ligada na cultura de madrugada por algum motivo, o tema era a poluição sonora na atmosfera, os ruídos atmosféricos meteorológicos. a expressão me prendeu, fiquei obcecada, comecei a imaginar que eu mesma estava contribuindo com esses ruídos de uma forma energética, biológica e filosófica com a boa bagunça que a mente de uma pessoa de 16 anos (que curtia entender de física quântica e fazer autoanálise de questões existenciais que só quem viveu sabe) pode proporcionar.\npois bem, tenho me sentido sem um espaço na internet já faz um tempo. estou online ativamente desde 2003, embarcando nos primeiros trens de toda novidade que surgiu. boa parte das minhas maiores amizades iniciaram online por fóruns e comunidades no orkut (viva topicão na comunidade do nine inch nails que servia apenas pra gente falar as maiores bobeiras possíveis sobre trent reznor e cia), pra mim estar online é manter viva essa minha vida social que sempre foi pacatíssima onde moro. mas não me sinto mais em casa como já me senti um dia, as redes sociais são mecanismos de consumir energia mental em troca de atenção e dinheiro e atenção é o novo petróleo junto com dados, que é outra coisa que as redes também captam de nós em uma troca bem injusta, enfim, eu não me vejo mais nesses lugares, mas me mantenho para evitar isolamento e motivos maiores.\nentão uni minha força fuçeira de coisas nerd e criei esse sítio digital aqui sozinha, um espaço que tenho vontade de ter desde quando me entendo por gente conectada. \npossivelmente escreverei para ninguém ler, mas como uma saudosa twitteira, não me importo! mas se você estiver até aqui lendo isso aqui, **welcome to my crib! 💜**"
        }
      ],
      "coverImageUrl": ""
    },
  ],
  "about": {
    "profile": {
      "id": "profile",
      "text": "apenas fluxo me movimentando sendo força de natureza autêntica",
      "imageUrl": "https://res.cloudinary.com/dcxm8yd49/image/upload/v1771623752/yoIeu.avif",
      "faviconUrl": ""
    },
    "connect_config": {
      "id": "connect_config",
      "email": "oi.hannalee@gmail.com",
      "sobreText": "ruídos atmosféricos // v3.1 // sistema de gestão existencial",
      "links": [
        {
          "id": "lnk1",
          "label": "bluesky",
          "url": "https://bsky.app/profile/hannaleeee.bsky.social/"
        },
        {
          "id": "1771623969528",
          "label": "instagram",
          "url": "https://www.instagram.com/h3nn3l99/"
        },
        {
          "id": "1771623994000",
          "label": "tumblr",
          "url": "http://ranali.tumblr.com/"
        }
      ]
    },
    "landing_manifesto": {
      "id": "landing_manifesto",
      "text": "quem fui no milissegundo que já se foi\nabsorve no tempo e abstrai no instante\ne já não é quem estou agora",
      "layers": [
        { "n": "01", "scale": "∅", "name": "abertura", "lines": [[{ "t": "abre-se um " }, { "t": "espaço", "accent": true }], [{ "t": "para além da consciência terrena" }]] },
        { "n": "02", "scale": "10⁻³³ cm", "name": "microscópica", "lines": [[{ "t": "o " }, { "t": "tecido central", "accent": true }], [{ "t": "onde o todo se condensa" }], [{ "t": "e o que está em cima é como o que está embaixo" }], [{ "t": "e o que está embaixo é como o que está em cima" }], [{ "t": "em " }, { "t": "vibração primordial", "accent": true }]] },
        { "n": "03", "scale": "10⁻³ s", "name": "instante", "lines": [[{ "t": "quem fui no " }, { "t": "milissegundo", "accent": true }, { "t": " que já se foi" }], [{ "t": "absorve no tempo e abstrai no instante" }], [{ "t": "e já não é quem estou " }, { "t": "agora", "accent": true }]] },
        { "n": "04", "scale": "13 × 10⁹ anos", "name": "cósmica", "lines": [[{ "t": "há treze bilhões de anos" }], [{ "t": "sou " }, { "t": "matéria em reorganização", "accent": true }], [{ "t": "quarks, léptons, particulas" }], [{ "t": "hoje atravessados" }], [{ "t": "por fluidos terráqueos" }]] },
        { "n": "05", "scale": "existencial", "name": "angústia", "lines": [[{ "t": "existir sob o modo dominante angústia" }], [{ "t": "nos limitando os sentidos frente à " }, { "t": "transitoriedade", "accent": true }], [{ "t": "a falta surge quando a expectativa fora criada" }], [{ "t": "projetamos cenários para suportar o " }, { "t": "indeterminado", "accent": true }], [{ "t": "vivemos a lógica utilitária somente por pressão e sobrevivência" }]] },
        { "n": "06", "scale": "cognitiva", "name": "decifrar", "lines": [[{ "t": "poder é " }, { "t": "decifrar", "accent": true }, { "t": " o sentir" }], [{ "t": "aprender a reconhecer o necessário" }], [{ "t": "pois a existência não se sustenta na ilusão" }], [{ "t": "" }], [{ "t": "existir é " }, { "t": "transcender", "accent": true }]] },
        { "n": "07", "scale": "operação", "name": "desconformidade", "lines": [[{ "t": "no limiar de estímulo e sentido" }], [{ "t": "resistindo à (des)ordem" }], [{ "t": "criando padrões temporários" }], [{ "t": "opero em " }, { "t": "desconformidade controlada", "accent": true }], [{ "t": "negociando constantemente com a tendência ao " }, { "t": "caos", "accent": true }]] },
        { "n": "08", "scale": "limite", "name": "falha", "lines": [[{ "t": "quando a palavra " }, { "t": "falha", "accent": true }, { "t": ", a forma não sustenta, o movimento escorre" }]] },
        { "n": "09", "scale": "cósmica++", "name": "sinais", "lines": [[{ "t": "sinais", "accent": true }, { "t": " atravessam o " }, { "t": "tecido cósmico", "accent": true }]] },
        { "n": "10", "scale": "dualidades", "name": "atrito", "lines": [[{ "t": "entre o atrito" }], [{ "t": "do vazio com a forma" }], [{ "t": "do corpo com o mundo" }], [{ "t": "do controle com o fluxo" }], [{ "t": "do eu com o " }, { "t": "outro", "accent": true }]] },
        { "n": "11", "scale": "meta", "name": "criando", "lines": [[{ "t": "e é nessa fenda que observo os " }, { "t": "ruídos", "accent": true }], [{ "t": "criando.", "accent": true }]] }
      ]
    }
  }
};

