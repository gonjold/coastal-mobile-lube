import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@coastal/shared-types', '@coastal/shared-ui'],
};

export default nextConfig;
