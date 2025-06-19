// app/dashboard/page.js
'use client';
import { useEffect } from 'react';
import { useRouter } from "next/navigation";
import { useTranslation } from "../../contexts/translationContext"; // Import useTranslation
import Dashboard from '@/components/dashboard';
import { Typography ,Box } from '@mui/material';
import { checkPermission } from '@/middlewares/frontend_helpers';
import { useSelector } from "react-redux";
import withAuth  from "@/components/withAuth"; // Import withAuth HOC

const DashboardPage = () => {
    const router = useRouter();
    const { t } = useTranslation();  // Get the translation function
    const actions = useSelector((state) => state.auth?.actions || []);
    
    // Check permissions on mount
    // This effect runs once when the component mounts
    // and checks if the user has the required permissions to view this page.
    // If not, it redirects to the home page.
    useEffect(() => {
        const requiredPermissions = ["view_dashboard"];
        const hasAccess = checkPermission(actions, requiredPermissions);
        
        if (!hasAccess) {
        router.push("/home");
        }
    }, [actions, router]);
    
     return (
        <Dashboard>
            <Box sx={{ 
                mt: 4, // Add top margin (32px)
                display: 'flex',
                flexDirection: 'column',
                gap: 2 // Add gap between Typography elements (16px)
            }}>
                <Typography variant="h4" gutterBottom>
                    {t('welcomeToDashboardMsg')}
                </Typography>
                <Typography>
                    {t('dashboardSlogan')}
                </Typography>
                Dashboard home page content goes here.
            </Box>
        </Dashboard>
    );
}

export default withAuth(DashboardPage); // Wrap the DashboardPage component with the withAuth HOC
// This will ensure that the user is authenticated before accessing the dashboard
// and will redirect them to the login page if they are not authenticated.
// The withAuth HOC will also handle the loading state and show a loading spinner
// while the authentication status is being checked.