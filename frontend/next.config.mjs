/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true
  },
  images: {
    domains: ["api.arise-ai.org", "images.unsplash.com"],
  },
};

export default nextConfig;
