"use client";
import React from "react";
import { Box, Container, Typography, IconButton, Stack } from "@mui/material";
import { Facebook, Twitter, LinkedIn, YouTube } from "@mui/icons-material";
import { useTranslation } from "@/contexts/translationContext";

const Footer = () => {
    const { t } = useTranslation();

    return (
        <Box 
            component="footer" 
            sx={{ 
                color: "text.secondary", 
                py: 3, 
                display: "flex", 
                justifyContent: "center", 
                alignItems: "center",  // Ensures vertical centering
                textAlign: "center",
                width: "100%",
            }}
        >
            <Container>
                {/* Centered Content */}
                <Stack spacing={1} alignItems="center" justifyContent="center" textAlign="center">
                    <Typography variant="h6">{t("headTitle")}</Typography>
                    <Typography variant="body2">
                        &copy; {new Date().getFullYear()} {t("allRightsReserved")}
                    </Typography>

                    {/* Centered Social Icons */}
                    <Box mt={2} display="flex" justifyContent="center" alignItems="center" gap={2}>
                        <IconButton href="#" sx={{ color: "text.secondary" }} aria-label="Facebook">
                            <Facebook/>
                        </IconButton>
                        <IconButton href="#" sx={{ color: "text.secondary" }} aria-label="Twitter">
                            <Twitter />
                        </IconButton>
                        <IconButton href="#" sx={{ color: "text.secondary" }} aria-label="LinkedIn">
                            <LinkedIn />
                        </IconButton>
                        <IconButton href="#" sx={{ color: "text.secondary" }} aria-label="YouTube">
                            <YouTube />
                        </IconButton>
                    </Box>
                </Stack>
            </Container>
        </Box>
    );
}

export default Footer;
