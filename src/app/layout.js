import { connectToDatabase } from "@/lib/utils/dbConnection";
import { unstable_cache } from "next/cache"; // Ensures it runs once

// console.log("📢 layout.js is running");

const ensureDB = unstable_cache(async () => {
  console.log("🚀 Running ensureDB...");
  await connectToDatabase(); // This already runs initializeDatabase()
  console.log("✅ Database setup complete.");
}, ["db-connection"], { revalidate: 3600 }); // Runs once per hour

import LayoutClient from "@/components/layoutClient"; // ✅ Move Client logic here

const RootLayout = async ({ children }) => {
  await ensureDB(); // Ensure DB connection and initialization

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/logo.png" />
      </head>
      <body>
        <LayoutClient>{children}</LayoutClient> {/* ✅ Move Client logic here */}
      </body>
    </html>
  );
}

export default RootLayout
