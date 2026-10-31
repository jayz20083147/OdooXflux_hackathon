/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
