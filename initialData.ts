
import { Work, Signal, AboutData, ConnectConfig, SensorData, SiteConfig } from './types';

export const INITIAL_DATA: {
  works: Work[];
  signals: Signal[];
  about: {
    profile: AboutData | null;
    connect_config: ConnectConfig | null;
    sensor_metrics: SensorData | null;
    site_config: SiteConfig | null;
  };
} = {
  "works": [
    {
      "id": "1769122184111",
      "title": "the hyper post modern world",
      "year": "2014",
      "month": "7",
      "technique": "colagem digital",
      "dimensions": "--",
      "imageUrl": "https://64.media.tumblr.com/32443e171a63a3e6f12f532557fd7e8a/tumblr_n93fqaVKP41qbwhaio1_1280.jpg",
      "gallery": [],
      "status": "disponível",
      "isVisible": true,
      "isFeatured": false,
      "views": 0,
      "description": "me aventurando em um tablet numa época mais analógica (nem tanto assim)",
      "slug": "the-hyper-post-modern-world"
    }
  ],
  "signals": [],
  "about": {
    "profile": {
      "id": "profile",
      "text": "",
      "imageUrl": "https://64.media.tumblr.com/0274354bfed2d35de4c9a7d56c62bbe3/44698b6eb1de685d-2b/s2048x3072/52bbac4571b22c3c68f7233f6269567c6c51acc1.png"
    },
    "connect_config": {
      "id": "connect_config",
      "email": "",
      "links": []
    },
    "sensor_metrics": null,
    "site_config": {
      "id": "site_config",
      "siteTitle": "ruídos atmosféricos",
      "siteDescription": "sistemas vivos operam em desequilíbrio controlado.",
      "siteName": "",
      "siteKeywords": "arte contemporânea"
    }
  }
};
