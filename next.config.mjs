/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      remotePatterns: [
        {
          protocol: 'http',
          hostname: 'localhost',
          port: '3000',
          pathname: '/api/images/**',
        },
        // Add your production domain
        {
          protocol: 'https',
          hostname: 'yourdomain.com',
          pathname: '/api/images/**',
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
  