
declare global {
  interface Window {
    mixpanel?: any;
  }
}

export enum ViewState {
  LANDING = 'entrada',
  MATERIA = 'matéria',
  MANIFESTO = 'manifesto',
  SINAIS = 'sinais',
  INTERACTIVE = 'medição', // Antigo 👁👁, agora oculto e renomeado
  ABOUT = '👁👁',          // Antigo 'esse eu', agora assume o ícone
  CONNECT = 'conectar',
  BACKOFFICE = 'fluxo'
}

export interface GalleryItem {
  type: 'image' | 'video';
  url: string;
  coverUrl?: string;
}

export interface Work {
  id: string;
  title: string;
  slug?: string; // URL personalizada para compartilhamento
  seoTitle?: string;       // Título específico para metatags
  seoDescription?: string; // Descrição específica para metatags
  year: string;
  month: string;
  technique: string;
  dimensions: string;
  imageUrl: string;
  gallery?: (string | GalleryItem)[]; // Suporta legado (string) e novo formato
  status: string;
  isVisible: boolean;
  isFeatured?: boolean;
  views: number;
  description?: string;
}

export interface SignalBlock {
  id: string;
  type: 'text' | 'image' | 'embed';
  content: string;
  caption?: string;
}

export interface Signal {
  id: string;
  title: string;
  subtitle?: string;
  slug?: string;           // URL amigável
  seoTitle?: string;       // Título para meta tags
  seoDescription?: string; // Descrição para meta tags
  date: string;
  blocks: SignalBlock[];
  status: 'rascunho' | 'publicado';
  views: number;
}

export interface AboutData {
  id: string; // Geralmente 'profile'
  text: string;
  imageUrl: string;
}

export interface LinkItem {
  id: string;
  label: string;
  url: string;
}

export interface ConnectConfig {
  id: string; // Geralmente 'connect_config'
  email: string;
  links: LinkItem[];
}

export interface SensorData {
  id: string; // Geralmente 'sensor_metrics'
  clicks: number;
}

export interface SiteConfig {
  id: string; // Geralmente 'site_config'
  siteTitle: string;       // <title>
  siteName: string;        // og:site_name
  siteDescription: string; // meta description & og:description
  siteKeywords: string;    // meta keywords
  faviconUrl?: string;     // Se vazio, usa o generativo
  ogImageUrl?: string;     // og:image (Imagem padrão para compartilhamento)
}

// Deprecated type kept for migration safety if needed, but UI uses ConnectConfig
export interface SocialLinks {
  id: string;
  instagram: string;
  bluesky: string;
  vimeo: string;
  email: string;
}
