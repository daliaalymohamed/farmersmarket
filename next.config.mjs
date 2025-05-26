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
        //   source: "/path", // ✅ The actual-facing route that users will access in the browser
        //   destination: "/api/path/", // ✅ Internally serves /api/users/
        // },
      ];
    },
    serverExternalPackages: ["mongoose"],
  };
  
  export default nextConfig;
  