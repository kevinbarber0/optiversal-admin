const nextSourceMaps = require('@zeit/next-source-maps');

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(
  nextSourceMaps({
    env: {
      REACT_APP_GOOGLE_ANALYTICS_TRACKING_ID:
        process.env.GOOGLE_ANALYTICS_TRACKING_ID,
      NEXT_PUBLIC_GA_TRACKING_ID: process.env.GOOGLE_ANALYTICS_TRACKING_ID,
    },
    poweredByHeader: false,
  }),
);
