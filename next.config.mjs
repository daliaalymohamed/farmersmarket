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
        {
          source: "/dashboard/customers", // ✅ The actual-facing route that users will access in the browser
          destination: "/api/users/", // ✅ Internally serves /api/users/
        },
        // {
        //   source: "/login", // ✅ The public-facing route that users will access
        //   destination: "/api/users/login", // ✅ Internally serves /api/users/login
        // },
      ];
    },
    serverExternalPackages: ["mongoose"],
  };
  
  export default nextConfig;
  