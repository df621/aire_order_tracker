const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true
});

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // other Next.js settings
};

module.exports = withPWA(nextConfig);
