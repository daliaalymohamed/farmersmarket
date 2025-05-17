"use client";

import { useMemo } from "react";
import Head from "next/head";
import { useTranslation } from "../contexts/translationContext";
import { Container, Box } from "@mui/material";
import HeaderNav from "@/components/headerNav";
import Footer from "@/components/footer";

const LayoutContent = ({ children }) => {
  const { t } = useTranslation();

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
          fixed
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: (theme) => theme.palette.background.paper,
          }}
        >
          <HeaderNav />
          <main className="main-content">{children}</main>
          <Footer />
        </Container>
      </Box>
    </>
  );
};

export default LayoutContent;
