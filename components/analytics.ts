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

  const rawToken = import.meta.env.VITE_MIXPANEL_TOKEN;
  const region = import.meta.env.VITE_MIXPANEL_REGION || 'US';
  const isEU = region.toUpperCase() === 'EU';
  const apiHost = isEU ? 'https://api-eu.mixpanel.com' : 'https://api-js.mixpanel.com';

  // Output full Mixpanel initialization diagnostic state
  console.log('📊 [Mixpanel Diagnostics] Checking initialization state:', {
    tokenSource: rawToken ? 'Environment Variable' : 'Default/Fallback Constant',
    tokenValue: MIXPANEL_TOKEN,
    isDev: IS_DEV,
    region: region,
    apiHost: apiHost,
    isInitialized: isInitialized
  });

  // Verify VITE_MIXPANEL_TOKEN presence and validity
  if (!rawToken) {
    console.warn('⚠️ [Mixpanel Warning]: VITE_MIXPANEL_TOKEN is missing from the environment variables (or .env file). A fallback/temporary token is being used, but your real dashboard will not receive events.');
  } else {
    // Check if token format is valid (standard Mixpanel project tokens are exactly 32-character hex strings)
    const isValidHexToken = /^[0-9a-fA-F]{32}$/.test(rawToken);
    if (!isValidHexToken) {
      console.warn(`⚠️ [Mixpanel Warning]: The configured VITE_MIXPANEL_TOKEN ("${rawToken}") appears to be invalid or incomplete. Mixpanel project tokens are typically 32-character hexadecimal strings.`);
    }
  }

  if (!MIXPANEL_TOKEN) {
    console.warn('📊 [Mixpanel Sandbox]: No token configured (even fallback). Mocking tracking calls.');
    return;
  }

  try {
    mixpanel.init(MIXPANEL_TOKEN, {
      debug: true, // Always enable debug so the user sees detailed internal SDK logs in console
      track_pageview: false, // We'll handle pageviews manually for SPA precision
      persistence: 'localStorage',
      ignore_dnt: true, // Let's ensure tracking is active for deep analysis
      api_host: apiHost,
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

    // 👤 Update User Profile Properties in Mixpanel Lexicon
    try {
      mixpanel.people.set_once({
        '$created': new Date().toISOString(),
        'First Acquisition Channel': socialSource,
        'First Referrer': referrer || 'Direct',
        'Initial Screen Resolution': `${window.innerWidth}x${window.innerHeight}`
      });

      mixpanel.people.set({
        '$last_seen': new Date().toISOString(),
        'User Language': navigator.language || 'unknown',
        'Current Screen Resolution': `${window.innerWidth}x${window.innerHeight}`
      });
    } catch (profileErr) {
      console.warn('⚠️ [Mixpanel User Profiles] Failed to set initial people properties:', profileErr);
    }

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

    // Update profile properties in real-time
    try {
      mixpanel.people.increment('Total Page Views', 1);
      mixpanel.people.set({
        'Last Viewed Page': viewName,
        '$last_seen': new Date().toISOString()
      });
    } catch (e) {
      console.warn('⚠️ [Mixpanel User Profiles] Failed to increment Page Views:', e);
    }
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

    // Update profile properties in real-time
    try {
      mixpanel.people.increment('Artworks Opened Count', 1);
      mixpanel.people.set({
        'Last Viewed Artwork': title,
        '$last_seen': new Date().toISOString()
      });
    } catch (e) {
      console.warn('⚠️ [Mixpanel User Profiles] Failed to update Artwork Opened profile:', e);
    }
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

    // Update profile properties in real-time
    try {
      mixpanel.people.increment('Artworks Zoomed Count', 1);
      mixpanel.people.set('$last_seen', new Date().toISOString());
    } catch (e) {
      console.warn('⚠️ [Mixpanel User Profiles] Failed to increment Artworks Zoomed:', e);
    }
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

    // Update profile properties in real-time
    try {
      mixpanel.people.increment('Signals Read Count', 1);
      mixpanel.people.set({
        'Last Read Signal': title,
        '$last_seen': new Date().toISOString()
      });
    } catch (e) {
      console.warn('⚠️ [Mixpanel User Profiles] Failed to update Signal Opened profile:', e);
    }
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

    // Update profile properties in real-time
    try {
      mixpanel.people.increment('Links Shared Count', 1);
      mixpanel.people.set({
        'Last Shared Content': titleOrValue,
        '$last_seen': new Date().toISOString()
      });
    } catch (e) {
      console.warn('⚠️ [Mixpanel User Profiles] Failed to update Link Shared profile:', e);
    }
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

    // Update profile properties in real-time
    try {
      mixpanel.people.increment('Outbound Clicks Count', 1);
      mixpanel.people.set({
        'Last Outbound URL': url,
        'Last Outbound Channel': channel,
        '$last_seen': new Date().toISOString()
      });
    } catch (e) {
      console.warn('⚠️ [Mixpanel User Profiles] Failed to update Outbound Clicks profile:', e);
    }
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

    // Update profile properties in real-time
    try {
      mixpanel.people.increment('Terminal Commands Run', 1);
      mixpanel.people.set({
        'Last Typed Command': command,
        '$last_seen': new Date().toISOString()
      });
    } catch (e) {
      console.warn('⚠️ [Mixpanel User Profiles] Failed to update Terminal Commands profile:', e);
    }
  }
};

/**
 * Unified Funnel Step Tracker
 * Captures events 'LandingPage Viewed', 'Signal Selected', 'Materia Read', and 'Social Link Clicked'
 * with their corresponding slugs for conversion analysis.
 */
export const trackFunnelStep = (
  step: 'LandingPage Viewed' | 'Signal Selected' | 'Materia Read' | 'Social Link Clicked',
  slug: string,
  extraProperties?: Record<string, any>
) => {
  initAnalytics();
  const properties = {
    'Funnel Step': step,
    'Step Order': step === 'LandingPage Viewed' ? 1 : step === 'Signal Selected' ? 2 : step === 'Materia Read' ? 3 : 4,
    'Slug': slug,
    ...extraProperties
  };

  console.log(`📊 [Mixpanel Funnel Track] ${step}:`, properties, isInitialized ? '(Sending...)' : '(Sandbox/No-Token)');
  if (isInitialized) {
    mixpanel.track(step, properties, (response) => {
      console.log(`📊 [Mixpanel Server Response] ${step}:`, response === 1 ? 'SUCCESS (1)' : 'FAILED (' + response + ')');
    });
  }
};

/**
 * Specific helpers for funnel tracking
 */
export const trackLandingPageViewed = (slug: string = 'home') => {
  trackFunnelStep('LandingPage Viewed', slug, { 'Page Title': 'Landing Page' });
};

export const trackSignalSelected = (slug: string, title?: string) => {
  trackFunnelStep('Signal Selected', slug, { 'Signal Title': title || slug });
};

export const trackMateriaRead = (slug: string, title?: string) => {
  trackFunnelStep('Materia Read', slug, { 'Materia Title': title || slug });
};

export const trackSocialLinkClicked = (channel: string, url: string, slug: string = 'social') => {
  trackFunnelStep('Social Link Clicked', slug, {
    'Destination Channel': channel,
    'Destination URL': url
  });
};

/**
 * Generic tracking utility for interface elements (buttons, navigation tabs, links)
 * Useful for checking which nav items, buttons, or links are most frequently clicked.
 */
export const trackGenericClick = (
  elementName: string,
  category: 'navigation' | 'button' | 'link' | 'tab',
  extraProperties?: Record<string, any>
) => {
  initAnalytics();
  const properties = {
    'Element Name': elementName,
    'Element Category': category,
    ...extraProperties
  };

  console.log(`📊 [Mixpanel Generic Click] ${elementName} [${category}]:`, properties, isInitialized ? '(Sending...)' : '(Sandbox/No-Token)');
  if (isInitialized) {
    mixpanel.track('Generic Click', properties, (response) => {
      console.log(`📊 [Mixpanel Server Response] Generic Click (${elementName}):`, response === 1 ? 'SUCCESS (1)' : 'FAILED (' + response + ')');
    });
  }
};

