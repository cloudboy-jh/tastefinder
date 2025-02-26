/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { 
    domains: ['s3-media1.fl.yelpcdn.com', 's3-media2.fl.yelpcdn.com', 's3-media3.fl.yelpcdn.com', 's3-media4.fl.yelpcdn.com', 'images.unsplash.com'],
    unoptimized: true 
  },
};

module.exports = nextConfig;