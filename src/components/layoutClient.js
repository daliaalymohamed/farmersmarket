"use client";
import "../styles/globals.css";
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import ReduxProvider from "@/store/reduxProvider";
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import theme from "@/lib/utils/theme";
import { TranslationProvider } from "@/contexts/translationContext"; // ✅ Now in Client Component
import { CssBaseline } from "@mui/material";
import LayoutContent from "@/components/layoutContent"; // ✅ Moved dynamic logic here
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const LayoutClient = ({ children }) => {
    return (
        <ReduxProvider>
            <MuiThemeProvider theme={theme}>
                <StyledThemeProvider theme={theme}>
                    <TranslationProvider> {/* ✅ Now inside Client Component */}
                        <CssBaseline />
                        <LayoutContent>{children}</LayoutContent>
                         {/* ✅ Add ToastContainer for react-toastify */}
                        <ToastContainer
                            position="top-right"
                            autoClose={3000}
                            pauseOnHover
                            hideProgressBar={false}
                            closeOnClick
                        />
                    </TranslationProvider>
                </StyledThemeProvider>
            </MuiThemeProvider>
        </ReduxProvider>
    );
};

export default LayoutClient;
