import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  // Performance optimizations
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-dropdown-menu', '@radix-ui/react-slot'],
  },
  
  // Bundle optimization
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Optimize bundle splitting
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          farcaster: {
            test: /[\\/]node_modules[\\/]@farcaster[\\/]/,
            name: 'farcaster',
            chunks: 'all',
            priority: 20,
          },
          ui: {
            test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
            name: 'ui',
            chunks: 'all',
            priority: 15,
          },
        },
      };
    }
    return config;
  },
  
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Remove redirect - serve manifest directly
  // async redirects() {
  //   return [
  //     {
  //       source: '/.well-known/farcaster.json',
  //       destination: 'https://api.farcaster.xyz/miniapps/hosted-manifest/0199146d-79d0-ca3f-2062-f3243dedc8a5',
  //       permanent: false,
  //     },
  //   ];
  // },
  async headers() {
    return [
      {
        source: '/.well-known/farcaster.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/json',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
