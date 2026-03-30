import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mode standalone SANGAT DIREKOMENDASIKAN untuk Hostinger / cPanel Node.js App
  output: 'standalone',
  
  // Mengurangi potensi loop/konflik trailing slash dengan router eksternal (LiteSpeed/Nginx Hostinger)
  trailingSlash: false,

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.pinimg.com', // Untuk Pinterest
      },
      {
        protocol: 'https',
        hostname: '**.freepik.com', // Untuk Freepik
      },
      {
        protocol: 'https',
        hostname: '**.vercel-storage.com', // WAJIB: Untuk Vercel Blob
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com', // Opsional: Untuk testing
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb', // Naikkan jadi 5MB (sesuaikan kebutuhan)
    },
  },
};

export default nextConfig;
