import Analytics from 'analytics';
import googleAnalyticsPlugin from '@analytics/google-analytics';
import Router from 'next/router';
import { hotjar } from 'react-hotjar';

const analytics = Analytics({
  debug: process.env.NODE_ENV !== 'production',
  plugins: [
    googleAnalyticsPlugin({
      trackingId:
        process.env.REACT_APP_GOOGLE_ANALYTICS_TRACKING_ID || 'UA-000000000-0',
    }),
  ],
});

// Track initial pageview
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  analytics.page();
  hotjar.initialize(process.env.HOTJAR_ID, 6);
}

// Track pageview on route change
Router.events.on('routeChangeComplete', (url) => {
  if (process.env.NODE_ENV === 'production') {
    analytics.page();
  }
});

export default analytics;
