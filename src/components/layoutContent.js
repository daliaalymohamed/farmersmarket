"use client";

import { useMemo } from "react";
import Head from "next/head";
import { usePathname } from 'next/navigation'; 
import { useTranslation } from "../contexts/translationContext";
import { Container, Box } from "@mui/material";
import HeaderNav from "@/components/headerNav";
import Footer from "@/components/footer";

const LayoutContent = ({ children }) => {
  const { t } = useTranslation();
  const pathname = usePathname(); // Get current path
  const isDashboard = pathname === '/dashboard'; // Check if current path is dashboard

  // ✅ Prevent hydration issues with useMemo
  const title = useMemo(() => t("headTitle") || "Default Title", [t]);

  return (
    <>
      <Head>
          <title>{title}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/logo.png" />
      </Head>
      <Box sx={{ backgroundColor: (theme) => theme.palette.background.default, minHeight: '100vh' }}>
        <Container
          fixed={!isDashboard} // Don't use fixed width for dashboard
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: (theme) => theme.palette.background.paper,
            maxWidth: isDashboard ? '100% !important' : undefined, // Override MUI's fixed width for dashboard
            padding: isDashboard ? 0 : undefined, // Remove padding for dashboard
          }}
        >
          {!isDashboard && <HeaderNav />} {/* Only render HeaderNav if not in dashboard */}
          <main className="main-content">{children}</main>
          {!isDashboard && <Footer /> } {/* Only render this footer if not in dashboard */}
        </Container>
      </Box>
    </>
  );
};

export default LayoutContent;
