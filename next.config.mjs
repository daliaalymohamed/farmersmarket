/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'cdn.breadfast.com', // ✅ Keep this
        },
        {
          protocol: "https",
          hostname: "www.breadfast.com" // ✅ Corrected hostname
        }
      ],
    },
    async rewrites() {
      console.log("🚀 Rewrites applied!"); // ✅ Check if this runs
      return [
        // {
        //   source: "/register", // ✅ The public-facing route that users will access
        //   destination: "/api/users/register", // ✅ Internally serves /api/users/registe
        // },
        // {
        //   source: "/login", // ✅ The public-facing route that users will access
        //   destination: "/api/users/login", // ✅ Internally serves /api/users/login
        // },
      ];
    },
    serverExternalPackages: ["mongoose"],
  };
  
  export default nextConfig;
  