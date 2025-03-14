/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
      domains: [
        'raw.githubusercontent.com',
        'cdn.jsdelivr.net'
      ],
      // Fallback for token icons that fail to load
      unoptimized: process.env.NODE_ENV !== 'production',
    },
    webpack: (config) => {
      // Resolve for packages that use Node.js polyfills
      config.resolve = config.resolve || {};
      config.resolve.fallback = {
        fs: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        http: false,
        https: false,
        zlib: false,
      };
      return config;
    },
    experimental: {
      turbo: {
        resolveExtensions: [
          '.mdx',
          '.tsx',
          '.ts',
          '.jsx',
          '.js',
          '.mjs',
          '.json'
        ]
      }
    },
    // Handle web3 packages that may use buffer
    transpilePackages: [
      '@solana/web3.js',
      '@project-serum/anchor',
      '@solana/spl-token',
    ],
  };
  
  export default nextConfig;