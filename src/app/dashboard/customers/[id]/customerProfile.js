// This is client-side code for a Next.js page that fetches customer data based on the provided ID.
'use client';

import { useState, useEffect, memo } from 'react';
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
  Tabs,
  CircularProgress
} from '@mui/material';
import Grid from "@mui/material/Grid2";
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import { checkPermission } from '@/middlewares/frontend_helpers';
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import { toggleUserActiveStatus } from '@/store/slices/userSlice';
import Breadcrumb from "@/components/UI/breadcrumb";
import Loading from "@/components/UI/loading";
import ButtonLoader from '@/components/UI/buttonLoader';
import Error from "@/components/UI/error";
import withAuth  from "@/components/withAuth"; // Import withAuth HOC

const CustomerProfile = ({ initialData }) => {
  const router = useRouter();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(0);
  const [isActive, setIsActive] = useState(initialData?.active);
  const [isUpdating, setIsUpdating] = useState(false);  
  const dispatch = useDispatch();

  // Redux Selectors
  const actions = useSelector(
      (state) => state.auth?.actions || [],
      shallowEqual 
  ); // With shallowEqual - only re-renders if selected values actually changed
  const { loading , error } = useSelector(
    state => ({
      loading: state.users.loading,
      error: state.users.error
    }),
    shallowEqual
  )
  // Check permissions on mount
  // This effect runs once when the component mounts
  // and checks if the user has the required permissions to view this page.
  // If not, it redirects to the home page.
  useEffect(() => {
    const requiredPermissions = ["view_user", "toggle_user_status"];
    const hasAccess = checkPermission(actions, requiredPermissions);
    
    if (!hasAccess) {
      router.push("/home");
    }
  }, [actions, router]);

  // Handle tab changes
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const {
    firstName,
    lastName,
    email,
    phoneNumber,
    active,
    createdAt,
    addresses = [],    
    orders = []
  } = initialData;

  // Get default addresses
  const defaultShippingAddress = addresses.find(addr => addr.isDefaultShipping);
  const defaultBillingAddress = addresses.find(addr => addr.isDefaultBilling);

  // Render address information
  const renderAddress = (address) => (
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
  );

  // Handle toggle active status
  const handleToggleActive = async () => {
    if (loading || isUpdating) return; // Prevent multiple clicks
    setIsUpdating(true);
    try {
      // Use unwrap() to handle the promise properly
      await dispatch(toggleUserActiveStatus({ 
        userId: initialData._id, 
        isActive: !isActive 
      })).unwrap();

      setIsActive(!isActive); // Update local state after successful toggle
      // Only show success toast - errors are handled by interceptor
      toast.success(t('userStatusUpdatedSuccessfully'));
      
    } catch (error) {
      // DO NOT show toast here. Axios interceptor already did it.
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dashboard>
      <Box sx={{ p: 3 }}>
        {/* Breadcrumb */}
        <Breadcrumb 
          sideNavItem={t("customers")} 
          href="/dashboard/customers/list" 
          urlText={t("customerDetails")}
        />

        {loading ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Loading />
          </Paper>
        ) : error ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Error message={error} />
          </Paper>
        ) : !initialData ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
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
          </Paper>
        ) : (
        <>
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
                  gap: 2
                  }}>
                  <Button 
                    variant="contained"
                    color={isActive ? 'error' : 'success'}
                    onClick={handleToggleActive}
                    disabled={loading || isUpdating}
                    startIcon={(loading || isUpdating) ? <ButtonLoader /> : null}
                  >
                    {(loading || isUpdating) ? t('updating') : isActive ? t('deactivate') : t('activate')}
                  </Button>
                      <Button 
                      variant="outlined" 
                      onClick={() => router.back()}
                      >
                      {t('goBack')}
                      </Button>
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
                  {addresses.length > 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          {/* Shipping Address */}
                          <Box>
                              <Typography variant="subtitle1" color="primary" gutterBottom>
                                  {t('shippingAddress')}
                              </Typography>
                              {defaultShippingAddress ? (
                                  renderAddress(defaultShippingAddress)
                              ) : (
                                  <Typography color="text.secondary">
                                  {t('noDefaultShippingAddress')}
                                  </Typography>
                              )}
                          </Box>

                          {/* Billing Address */}
                          <Box>
                              <Typography variant="subtitle1" color="primary" gutterBottom>
                                  {t('billingAddress')}
                              </Typography>
                              {defaultBillingAddress ? (
                                  renderAddress(defaultBillingAddress)
                              ) : (
                                  <Typography color="text.secondary">
                                  {t('noDefaultBillingAddress')}
                                  </Typography>
                              )}
                          </Box>
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
          </>
        )}
      </Box>
    </Dashboard>
  );
};

export default memo(withAuth(CustomerProfile));