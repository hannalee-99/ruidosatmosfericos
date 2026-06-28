import mixpanel from 'mixpanel-browser';

const MIXPANEL_TOKEN = import.meta.env.VITE_MIXPANEL_TOKEN || '8cfbdd06c994726e27988cbe0818d4c';
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
    console.log('📊 [Mixpanel Sandbox]: Token not configured. Mocking tracking calls.');
    return;
  }

  try {
    mixpanel.init(MIXPANEL_TOKEN, {
      debug: true, // Always enable debug so the user sees detailed internal SDK logs in console
      track_pageview: false, // We'll handle pageviews manually for SPA precision
      persistence: 'localStorage',
      ignore_dnt: true, // Let's ensure tracking is active for deep analysis
      api_host: 'https://api-eu.mixpanel.com',
      batch_requests: false // Disable batching to send events immediately
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
    console.log('📊 [Mixpanel]: Successfully initialized with Token:', MIXPANEL_TOKEN, 'and Acquisition Channel:', socialSource);
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

  console.log('📊 [Mixpanel Track] Page Viewed:', properties, isInitialized ? '(Sending...)' : '(Sandbox/No-Token)');
  if (isInitialized) {
    mixpanel.track('Page Viewed', properties, (response) => {
      console.log('📊 [Mixpanel Server Response] Page Viewed:', response === 1 ? 'SUCCESS (1)' : 'FAILED (' + response + ')');
    });
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

  console.log('📊 [Mixpanel Track] Artwork Opened:', properties, isInitialized ? '(Sending...)' : '(Sandbox/No-Token)');
  if (isInitialized) {
    mixpanel.track('Artwork Opened', properties, (response) => {
      console.log('📊 [Mixpanel Server Response] Artwork Opened:', response === 1 ? 'SUCCESS (1)' : 'FAILED (' + response + ')');
    });
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

  console.log('📊 [Mixpanel Track] Artwork Zoomed:', properties, isInitialized ? '(Sending...)' : '(Sandbox/No-Token)');
  if (isInitialized) {
    mixpanel.track('Artwork Zoomed', properties, (response) => {
      console.log('📊 [Mixpanel Server Response] Artwork Zoomed:', response === 1 ? 'SUCCESS (1)' : 'FAILED (' + response + ')');
    });
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

  console.log('📊 [Mixpanel Track] Signal Opened:', properties, isInitialized ? '(Sending...)' : '(Sandbox/No-Token)');
  if (isInitialized) {
    mixpanel.track('Signal Opened', properties, (response) => {
      console.log('📊 [Mixpanel Server Response] Signal Opened:', response === 1 ? 'SUCCESS (1)' : 'FAILED (' + response + ')');
    });
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

  console.log('📊 [Mixpanel Track] Link Shared:', properties, isInitialized ? '(Sending...)' : '(Sandbox/No-Token)');
  if (isInitialized) {
    mixpanel.track('Link Shared', properties, (response) => {
      console.log('📊 [Mixpanel Server Response] Link Shared:', response === 1 ? 'SUCCESS (1)' : 'FAILED (' + response + ')');
    });
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

  console.log('📊 [Mixpanel Track] Outbound Link Clicked:', properties, isInitialized ? '(Sending...)' : '(Sandbox/No-Token)');
  if (isInitialized) {
    mixpanel.track('Outbound Link Clicked', properties, (response) => {
      console.log('📊 [Mixpanel Server Response] Outbound Link Clicked:', response === 1 ? 'SUCCESS (1)' : 'FAILED (' + response + ')');
    });
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

  console.log('📊 [Mixpanel Track] Terminal Command Run:', properties, isInitialized ? '(Sending...)' : '(Sandbox/No-Token)');
  if (isInitialized) {
    mixpanel.track('Terminal Command Run', properties, (response) => {
      console.log('📊 [Mixpanel Server Response] Terminal Command Run:', response === 1 ? 'SUCCESS (1)' : 'FAILED (' + response + ')');
    });
  }
};
