import mixpanel from 'mixpanel-browser';

const MIXPANEL_TOKEN = import.meta.env.VITE_MIXPANEL_TOKEN || '';
const IS_DEV = import.meta.env.DEV || false;

let isInitialized = false;

/**
 * Helper to identify the social media source from referring domains
 */
function getSocialReferrer(referrer: string): string {
  if (!referrer) return 'Direct';
  const url = referrer.toLowerCase();
  if (url.includes('pinterest') || url.includes('pin.it')) return 'Pinterest';
  if (url.includes('tumblr')) return 'Tumblr';
  if (url.includes('instagram') || url.includes('l.instagram.com')) return 'Instagram';
  if (url.includes('bluesky') || url.includes('bsky.app')) return 'Bluesky';
  if (url.includes('facebook') || url.includes('l.facebook.com')) return 'Facebook';
  if (url.includes('t.co') || url.includes('twitter') || url.includes('x.com')) return 'Twitter/X';
  if (url.includes('linkedin')) return 'LinkedIn';
  return 'Other Website';
}

export const initAnalytics = () => {
  if (isInitialized) return;

  if (!MIXPANEL_TOKEN) {
    if (IS_DEV) {
      console.log('📊 [Mixpanel Sandbox]: Token not configured. Mocking tracking calls.');
    }
    return;
  }

  try {
    mixpanel.init(MIXPANEL_TOKEN, {
      debug: IS_DEV,
      track_pageview: false, // We'll handle pageviews manually for SPA precision
      persistence: 'localStorage',
      ignore_dnt: true // Let's ensure tracking is active for deep analysis
    });

    const referrer = document.referrer;
    const socialSource = getSocialReferrer(referrer);

    // Register super properties to persist across all events
    mixpanel.register({
      'Acquisition Channel': socialSource,
      'Referrer URL': referrer || 'Direct',
      'Screen Width': window.innerWidth,
      'Screen Height': window.innerHeight,
      'Device Orientation': window.innerWidth > window.innerHeight ? 'Landscape' : 'Portrait'
    });

    isInitialized = true;
    if (IS_DEV) {
      console.log('📊 [Mixpanel]: Successfully initialized with Acquisition Channel:', socialSource);
    }
  } catch (err) {
    console.error('📊 [Mixpanel] Initialization failed:', err);
  }
};

/**
 * Track page views (views in our atmospheric system)
 */
export const trackPageView = (viewName: string, slug?: string) => {
  initAnalytics();
  const properties = {
    'Page Name': viewName,
    'Page Path': slug ? `/${viewName}/${slug}` : `/${viewName}`,
    'Has Slug': !!slug,
    'View Slug': slug || 'none'
  };

  if (isInitialized) {
    mixpanel.track('Page Viewed', properties);
  } else if (IS_DEV) {
    console.log('📊 [Mixpanel Sandbox] Page Viewed:', properties);
  }
};

/**
 * Track when an artwork is opened
 */
export const trackArtworkOpened = (title: string, slug: string) => {
  initAnalytics();
  const properties = {
    'Artwork Title': title,
    'Artwork Slug': slug,
    'Engagement Type': 'Detail View'
  };

  if (isInitialized) {
    mixpanel.track('Artwork Opened', properties);
  } else if (IS_DEV) {
    console.log('📊 [Mixpanel Sandbox] Artwork Opened:', properties);
  }
};

/**
 * Track when lightbox zoom is activated
 */
export const trackArtworkZoomed = (title: string, slug: string) => {
  initAnalytics();
  const properties = {
    'Artwork Title': title,
    'Artwork Slug': slug,
    'Action': 'Zoom Lightbox'
  };

  if (isInitialized) {
    mixpanel.track('Artwork Zoomed', properties);
  } else if (IS_DEV) {
    console.log('📊 [Mixpanel Sandbox] Artwork Zoomed:', properties);
  }
};

/**
 * Track when a writing signal is opened
 */
export const trackSignalOpened = (title: string, slug: string) => {
  initAnalytics();
  const properties = {
    'Signal Title': title,
    'Signal Slug': slug
  };

  if (isInitialized) {
    mixpanel.track('Signal Opened', properties);
  } else if (IS_DEV) {
    console.log('📊 [Mixpanel Sandbox] Signal Opened:', properties);
  }
};

/**
 * Track copy link / sharing actions
 */
export const trackLinkShared = (type: 'artwork' | 'signal' | 'email', titleOrValue: string) => {
  initAnalytics();
  const properties = {
    'Share Type': type,
    'Content Identifier': titleOrValue
  };

  if (isInitialized) {
    mixpanel.track('Link Shared', properties);
  } else if (IS_DEV) {
    console.log('📊 [Mixpanel Sandbox] Link Shared:', properties);
  }
};

/**
 * Track clicks on social ecos links (outbound)
 */
export const trackExternalClicked = (channel: string, url: string) => {
  initAnalytics();
  const properties = {
    'Destination Channel': channel,
    'Destination URL': url
  };

  if (isInitialized) {
    mixpanel.track('Outbound Link Clicked', properties);
  } else if (IS_DEV) {
    console.log('📊 [Mixpanel Sandbox] Outbound Link Clicked:', properties);
  }
};

/**
 * Track terminal actions on PageConnect
 */
export const trackTerminalCommand = (command: string, responseType: 'success' | 'error' | 'system' | 'output') => {
  initAnalytics();
  const properties = {
    'Command Typed': command,
    'Response Type': responseType
  };

  if (isInitialized) {
    mixpanel.track('Terminal Command Run', properties);
  } else if (IS_DEV) {
    console.log('📊 [Mixpanel Sandbox] Terminal Command Run:', properties);
  }
};
