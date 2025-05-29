/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  transpilePackages: ['@firebase/auth'],
  images: {
    domains: ['firebasestorage.googleapis.com'],
  },  webpack: (config, { isServer }) => {
    // Solo aplica estos cambios al bundle del cliente (no al servidor)
    if (!isServer) {
      // Establecer los fallbacks apropiados para los módulos de Node.js
      config.resolve.fallback = {
        ...config.resolve.fallback,
        events: require.resolve('events'),  // Añadir el polyfill para 'events'
        stream: require.resolve('stream-browserify'),  // Añadir el polyfill para 'stream'
        buffer: require.resolve('buffer'),  // Añadir el polyfill para 'buffer'
        process: require.resolve('process/browser'),  // Añadir el polyfill para 'process'
        // Desactivar algunos módulos de Node.js no necesarios en el frontend
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
        async_hooks: false,
        perf_hooks: false,
        http2: false,
        url: false,
        http: false,
        https: false,
        path: false,
        os: false,
        zlib: false,
        crypto: false,
      };
      
      // Configurar alias para manejar imports con 'node:' prefix
      config.resolve.alias = {
        ...config.resolve.alias,
        undici: false,
        'node:events': require.resolve('events'),
        'node:stream': require.resolve('stream-browserify'),
        'node:buffer': require.resolve('buffer'),
        'node:process': require.resolve('process/browser'),
        'node:fs': false,
        'node:path': false,
        'node:os': false,
        'node:crypto': false,
        'node:util': false,
        'node:url': false,
        'node:querystring': false,
      };
    }

    // Agregar regla para manejar módulos js, mjs, jsx sin 'fullySpecified'
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
