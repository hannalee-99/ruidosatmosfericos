
export enum ViewState {
  LANDING = 'entrada',
  MATERIA = 'materia',
  MANIFESTO = 'manifesto',
  SINAIS = 'sinais',
  ABOUT = 'esse eu',          
  CONNECT = 'conectar',
  BACKOFFICE = 'fluxo'
}

export type GalleryItemType = 'image' | 'video';

export interface GalleryItem {
  type: GalleryItemType;
  url: string;
  coverUrl?: string;
}

export type WorkStatus = 'disponível' | 'reservado' | 'vendido' | string;

export interface Work {
  id: string;
  slug?: string;
  title: string;
  year: string;
  month: string;
  date: string; // Formato YYYY-MM-DD
  technique: string;
  dimensions: string;
  imageUrl: string;
  gallery?: (string | GalleryItem)[];
  status: WorkStatus;
  isVisible: boolean;
  isFeatured?: boolean;
  featuredOrder?: number; // Nova propriedade para ordenação
  views: number;
  description?: string;
  // Campos SEO para Marketing Digital
  seoTitle?: string;
  seoDescription?: string;
  seoImage?: string;
}

export type SignalBlockType = 'text' | 'image' | 'embed';

export interface SignalBlock {
  id: string;
  type: SignalBlockType;
  content: string;
  caption?: string;
}

export interface Signal {
  id: string;
  slug?: string;
  title: string;
  subtitle?: string;
  date: string;
  blocks: SignalBlock[];
  status: 'rascunho' | 'publicado';
  views: number;
  coverImageUrl?: string; // Imagem de capa / Hero
  seoDescription?: string; // Breve descrição para SEO/Cards
  seoTitle?: string;
  seoImage?: string;
}

export interface AboutData {
  id: string; // 'profile'
  text: string;
  imageUrl: string;
  faviconUrl?: string; 
}

export interface LinkItem {
  id: string;
  label: string;
  url: string;
}

export interface ConnectConfig {
  id: string; // 'connect_config'
  email: string;
  sobreText?: string;
  links: LinkItem[];
}

export interface SensorData {
  id: string; // ex: 'sensor_metrics'
  clicks: number;
}
