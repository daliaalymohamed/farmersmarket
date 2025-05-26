'use client';
import { useEffect } from 'react';
import { useRouter } from "next/navigation";
import { useTranslation } from "../../../../contexts/translationContext"; // Import useTranslation
import Dashboard from '@/components/dashboard';
import { Typography, Box } from '@mui/material';
import { useSelector } from "react-redux";
import withAuth from "@/components/withAuth";

const CustomersListPage = () => {
    const router = useRouter();
    const { t } = useTranslation();
    const actions = useSelector((state) => state.auth?.actions || []);
    
    useEffect(() => {
        const hasAccess = actions && actions.some(action => action.name === "view_users");
        if (!hasAccess) {
            router.push("/home");
        }
    }, [actions, router]);
    
    return (
        <Dashboard>
            <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="h4" gutterBottom>
                    {t('customersManagement')}
                </Typography>
                {/* Add your customers management UI here */}
            </Box>
        </Dashboard>
    );
}

export default withAuth(CustomersListPage);