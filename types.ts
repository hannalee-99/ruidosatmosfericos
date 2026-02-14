
export enum ViewState {
  LANDING = 'entrada',
  MATERIA = 'matéria',
  MANIFESTO = 'manifesto',
  SINAIS = 'sinais',
  INTERACTIVE = 'medição', 
  ABOUT = '👁👁',          
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
  views: number;
  description?: string;
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
}

export interface AboutData {
  id: string; // 'profile'
  text: string;
  imageUrl: string;
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
  id: string; // 'sensor_metrics'
  clicks: number;
}
