// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    //serverComponentsExternalPackages: ["msnodesqlv8"],
  },
  output: "standalone", // ✅ añade esto para crear el build listo para subir
};

export default nextConfig;
