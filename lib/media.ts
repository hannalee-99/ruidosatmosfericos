
/**
 * Utilitário para otimização dinâmica de mídia.
 * Aproveita as APIs do Cloudinary e Unsplash para entregar o menor arquivo possível
 * sem perda de percepção de qualidade.
 */
export const getOptimizedUrl = (url: string, width?: number): string => {
  if (!url) return '';
  
  // Otimização Cloudinary
  if (url.includes('res.cloudinary.com')) {
    // Insere transformações automáticas: f_auto (formato), q_auto (qualidade)
    // Se width for provido, adiciona redimensionamento inteligente (w_XXX,c_limit)
    const transformation = `f_auto,q_auto${width ? `,w_${width},c_limit` : ''}`;
    return url.replace('/upload/', `/upload/${transformation}/`);
  }

  // Otimização Unsplash
  if (url.includes('images.unsplash.com')) {
    const urlObj = new URL(url);
    urlObj.searchParams.set('auto', 'format,compress');
    if (width) urlObj.searchParams.set('w', width.toString());
    urlObj.searchParams.set('q', '80');
    return urlObj.toString();
  }

  // Fallback para Google Drive (UC mode)
  if (url.includes('drive.google.com')) {
    const match = url.match(/\/d\/(.+?)\/(view|edit)?/) || url.match(/[?&]id=(.+?)(&|$)/);
    if (match && match[1]) {
      return `https://drive.google.com/uc?export=view&id=${match[1]}`;
    }
  }

  return url;
};
