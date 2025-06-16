// This is client-side code for a Next.js page that fetches customer data based on the provided ID.
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '../../../../contexts/translationContext';
import Dashboard from '@/components/dashboard';
import {
  Box,
  Paper,
  Typography,
  Divider,
  Chip,
  Button,
  Tab,
  Tabs
} from '@mui/material';
import Grid from "@mui/material/Grid2";
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import Breadcrumb from "@/components/breadcrumb";

const CustomerProfile = ({ initialData }) => {
  const router = useRouter();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(0);

  // Handle tab changes
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Early return if no data
  if (!initialData) {
    return (
      <Dashboard>
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="error">
            {t('customerNotFound')}
          </Typography>
          <Button 
            onClick={() => router.back()}
            variant="contained"
            sx={{ mt: 2 }}
          >
            {t('goBack')}
          </Button>
        </Box>
      </Dashboard>
    );
  }

  const {
    firstName,
    lastName,
    email,
    phoneNumber,
    active,
    createdAt,
    address,
    orders = []
  } = initialData;

  return (
    <Dashboard>
      <Box sx={{ p: 3 }}>
        {/* Breadcrumb */}
        <Breadcrumb 
          sideNavItem={t("customers")} 
          href="/dashboard/customers/list" 
          urlText={t("customerDetails")}
        />

        {/* Header Section */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid xs={12} md={8}>
              <Typography variant="h4">
                {firstName} {lastName}
              </Typography>
              <Box sx={{ mt: 1, display: 'flex', gap: 2, alignItems: 'center' }}>
                <Chip 
                  label={active === true ? t('active') : t('inactive')}
                  color={active === true ? 'success' : 'error'}
                  size="small"
                />
                <Typography variant="body2" color="text.secondary">
                  {t('joinedOn')}: {new Date(createdAt).toLocaleDateString()}
                </Typography>
              </Box>
            </Grid>
            <Grid xs={12} md={4} sx={{ 
                display: 'flex!important', 
                justifyContent: { xs: 'flex-start', md: 'flex-end' },
                mt: { xs: 2, md: 0 },
                alignItems: 'center',
                width: '100%'
                }}>
                <Box sx={{ 
                    width: '100%',
                    display: 'flex',
                    justifyContent: { xs: 'flex-start', md: 'flex-end' }
                }}>
                    <Button 
                    variant="outlined" 
                    onClick={() => router.back()}
                    >
                    {t('goBack')}
                    </Button>
                </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Tabs Navigation */}
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
        >
          <Tab label={t('basicInfo')} />
          <Tab label={t('customerOrders')} />
        </Tabs>

        {/* Tab Panels */}
        {activeTab === 0 && (
          <Paper sx={{ p: 3 }}>
            <Grid container spacing={3}>
              {/* Contact Information */}
              <Grid xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  {t('contactInformation')}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon color="primary" />
                    <Typography>
                      {firstName} {lastName}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmailIcon color="primary" />
                    <Typography>{email}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PhoneIcon color="primary" />
                    <Typography>{phoneNumber}</Typography>
                  </Box>
                </Box>
              </Grid>

              {/* Address Information */}
              <Grid xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  {t('addressInformation')}
                </Typography>
                {address ? (
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <LocationIcon color="primary" />
                    <Typography>
                      {address.street}, {address.city}
                      <br />
                      {address.state}, {address.country}
                      <br />
                      {address.zipCode}
                    </Typography>
                  </Box>
                ) : (
                  <Typography color="text.secondary">
                    {t('noAddressProvided')}
                  </Typography>
                )}
              </Grid>
            </Grid>
          </Paper>
        )}

        {activeTab === 1 && (
          <Paper sx={{ p: 3 }}>
            {orders.length > 0 ? (
              <Grid container spacing={2}>
                {orders.map((order) => (
                  <Grid xs={12} key={order._id}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle1">
                        {t('orderNumber')}: {order._id}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {t('orderDate')}: {new Date(order.createdAt).toLocaleDateString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {t('orderStatus')}: {order.status}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Typography color="text.secondary" align="center">
                {t('noOrders')}
              </Typography>
            )}
          </Paper>
        )}
      </Box>
    </Dashboard>
  );
};

export default CustomerProfile;