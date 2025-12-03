"use client";

import { useMemo, useState, useEffect } from "react";
import Head from "next/head";
import { usePathname } from 'next/navigation'; 
import { useTranslation } from "../contexts/translationContext";
import { Container, Box } from "@mui/material";
import HeaderNav from "@/components/headerNav";
import CartInitializer from "./cartInitializer";
import Footer from "@/components/footer";
import { useSelector } from "react-redux";

const LayoutContent = ({ children }) => {
  const { t } = useTranslation();
  const pathname = usePathname(); // Get current path
  const [mounted, setMounted] = useState(false);
  const user = useSelector((state) => state.auth.user);

// Update the dashboard check to include all dashboard routes
  const isDashboard = pathname.startsWith('/dashboard');

  // ✅ Prevent hydration issues with useMemo
  const title = useMemo(() => t("headTitle") || "Default Title", [t]);

   useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }
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
          {!isDashboard && <>
            {user && <CartInitializer /> } {/* Only initialize cart if user is logged in */}
            <HeaderNav />
          </>} {/* Only render HeaderNav if not in dashboard */}
          <main className="main-content">{children}</main>
          {!isDashboard && <Footer /> } {/* Only render this footer if not in dashboard */}
        </Container>
      </Box>
    </>
  );
};

export default LayoutContent;
