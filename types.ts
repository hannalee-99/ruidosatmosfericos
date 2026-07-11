
export enum ViewState {
  LANDING = 'entrada',
  MATERIA = 'materia',
  MANIFESTO = 'manifesto',
  SINAIS = 'sinais',
  ECOS = 'ecos',
  ABOUT = 'esse eu',          
  CONNECT = 'conectar',
  BACKOFFICE = 'fluxo',
  BIO = 'bio'
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

export interface SignalMetadataItem {
  question: string;
  answer: string;
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
  imageSize?: 'p' | 'm' | 'g'; // Tamanho das imagens no blogpost (pequeno, médio, grande)
  imageLayout?: 'full' | 'side' | 'gallery' | 'auto'; // Arranjo/Layout das imagens
  seoDescription?: string; // Breve descrição para SEO/Cards
  seoTitle?: string;
  seoImage?: string;
  metadata?: SignalMetadataItem[]; // Metadados de Campo (DeviantArt style)
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

export interface ManifestoConfig {
  id: string; // 'landing_manifesto'
  text: string; // Texto da landing page (typewriter)
  layers?: any[]; // Camadas de texto para PageManifestoV2
  isCustomized?: boolean; // Flag para priorizar sobre DEFAULT_LAYERS
}

export interface SensorData {
  id: string; // ex: 'sensor_metrics'
  clicks: number;
}

export interface EcoLink {
  id: string;
  title: string;
  description: string;
  url: string;
  status: 'ativo' | 'mapeando' | string;
  isFeatured?: boolean;
  emoji?: string;
  visible?: boolean;
}

export interface EcosConfig {
  id: string; // 'ecos_config'
  links: EcoLink[];
  bio?: string;
}

export interface BioConfig {
  id: string; // 'bio_config'
  links: EcoLink[];
  bio?: string;
  profileTitle?: string;
  profileHandle?: string;
  footerText?: string;
  backButtonText?: string;
}

export interface SeoConfig {
  id: string; // 'seo_config'
  title: string;
  description: string;
  image?: string;
}


