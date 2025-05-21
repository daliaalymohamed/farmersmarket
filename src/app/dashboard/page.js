// app/dashboard/page.js
'use client';
import { useEffect } from 'react';
import { useRouter } from "next/navigation";
import { useTranslation } from "../../contexts/translationContext"; // Import useTranslation
import Dashboard from '@/components/dashboard';
import { Typography } from '@mui/material';
import { useSelector } from "react-redux";
import withAuth  from "@/components/withAuth"; // Import withAuth HOC

const DashboardPage = () => {
    const router = useRouter();
    const { t } = useTranslation();  // Get the translation function
    const actions = useSelector((state) => state.auth?.actions || []);
    
    useEffect(() => {
        const hasAccess = actions && actions.some(action => action.name === "view_dashboard");
        if (!hasAccess) {
        router.push("/home");
        }
  }, [actions, router]);
    
     return (
        <Dashboard>
            <Typography variant="h4" gutterBottom>
                {t('Welcome to the Dashboard!')}
            </Typography>
            <Typography>
                {t('Here you can see your stats, recent activity, and more.')}
            </Typography>
        </Dashboard>
    );
}

export default withAuth(DashboardPage); // Wrap the DashboardPage component with the withAuth HOC
// This will ensure that the user is authenticated before accessing the dashboard
// and will redirect them to the login page if they are not authenticated.
// The withAuth HOC will also handle the loading state and show a loading spinner
// while the authentication status is being checked.