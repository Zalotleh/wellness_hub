/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/auth/login',
        destination: '/login',
        permanent: true,
      },
      {
        source: '/auth/logout',
        destination: '/',
        permanent: true,
      },
      {
        source: '/auth/error',
        destination: '/login',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
