/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  transpilePackages: ['@firebase/auth'],
  images: {
    domains: ['firebasestorage.googleapis.com'],
  },
  webpack: (config, { isServer }) => {
    // Only apply these changes to the client-side bundle
    if (!isServer) {
      // Set proper fallbacks for Node.js modules
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
        async_hooks: false,
        perf_hooks: false,
        http2: false,
        // Additional fallbacks to handle undici issues
        url: false,
        http: false,
        https: false,
        stream: false,
        path: false,
        os: false,
        zlib: false,
        // Remove require.resolve calls until packages are installed
        crypto: false,
        buffer: false,
      };
    }
    
    config.resolve.alias = {
      ...config.resolve.alias,
      'undici': false,  // Disable undici
    };
    
    config.module.rules.push({
      test: /\.(js|mjs|jsx)$/,
      resolve: {
        fullySpecified: false,
      },
    });
    
    return config;
  },
};

module.exports = nextConfig;
