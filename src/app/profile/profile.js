'use client';

import { useState, useEffect, memo } from 'react';
import { useRouter, usePathname } from "next/navigation";
import { useTranslation } from '../../contexts/translationContext';
import {
  Box,
  Container,
  Paper,
  Typography,
  Tabs,
  Tab,
  TextField,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  FormControlLabel,
  Checkbox,
  IconButton
} from '@mui/material';
import Grid from '@mui/material/Grid2'; // Using Grid2
import {
  Person as PersonIcon,
  LocationOn as LocationIcon,
  ShoppingBag as OrdersIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { checkPermission } from '@/middlewares/frontend_helpers';
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import { editProfile } from '@/store/slices/userSlice';
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import Loading from "@/components/UI/loading";
import ButtonLoader from '@/components/UI/buttonLoader';
import Error from "@/components/UI/error";
import withAuth  from "@/components/withAuth"; // Import withAuth HOC
import { toast } from "react-toastify";
import { profileUpdateSchema, addressSchema } from '@/lib/utils/validation';

const MyProfile = ({ initialData }) => {
  const router = useRouter();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  // Tabs
  const [activeTab, setActiveTab] = useState(0);
 
  // Address modal state
  const [openAddressModal, setOpenAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  // Redux Selectors
  const actions = useSelector(
      (state) => state.auth?.actions || [],
      shallowEqual 
  ); // With shallowEqual - only re-renders if selected values actually changed
  const { loading , error, user } = useSelector(
    state => ({
      loading: state.users.loading,
      error: state.users.error,
      user: (state.users.list.find(u => u._id === initialData._id)) || initialData
    }),
    shallowEqual
  );

  // Profile form hook
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
  } = useForm({
    mode: 'all',
    resolver: yupResolver(profileUpdateSchema(t)),
    defaultValues: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
    }
  });

  // Address form hook
  const {
    register: registerAddress,
    handleSubmit: handleSubmitAddress,
    formState: { errors: addressErrors },
    reset: resetAddress,
    control
  } = useForm({
    mode: 'all',
    resolver: yupResolver(addressSchema(t)),
    defaultValues: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
      isDefaultShipping: false,
      isDefaultBilling: false,
    }
  });

  // Check permissions on mount
  // This effect runs once when the component mounts
  // and checks if the user has the required permissions to view this page.
  // If not, it redirects to the home page.
  useEffect(() => {
    const requiredPermissions = ["view_user", "edit_user"];
    const hasAccess = checkPermission(actions, requiredPermissions);
    
    if (!hasAccess) {
      router.push("/home");
    }
  }, [actions, router]);
    
  // Reset profile form when initialData changes
  // Sync address form when editing
  useEffect(() => {
    if (editingAddress) {
      resetAddress(editingAddress);
    } else {
      resetAddress({
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
        isDefaultShipping: false,
        isDefaultBilling: false,
      });
    }
  }, [editingAddress, openAddressModal, resetAddress]);


  // Handle tab changes
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Save profile
  const onSubmitProfile = async (data) => {
    try {
      await dispatch(
        editProfile({
          userId: initialData._id,
          profile: data,
        })
      ).unwrap();
      toast.success(t('profileUpdated'));
    } catch (err) {
      toast.error(t('profileUpdateFailed'));
    }
  };

  // Open address modal for add/edit
  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setOpenAddressModal(true);
  };

  // Close address modal
  const handleCloseAddressModal = () => {
    setOpenAddressModal(false);
    setEditingAddress(null);
  };

  // Save address (add or edit)
  const onSubmitAddress = async (data) => {
    try {
      if (editingAddress && editingAddress._id) {
        // Edit existing address
        await dispatch(
          editProfile({
            userId: initialData._id,
            editAddress: { ...data, _id: editingAddress._id },
          })
        ).unwrap();
      } else {
        // Add new address
        await dispatch(
          editProfile({
            userId: initialData._id,
            newAddress: data,
          })
        ).unwrap();
      }
      toast.success(t('addressSavedSuccessfully'));
      handleCloseAddressModal();
    } catch (err) {
      toast.error(t('addressSaveFailed'));
    }
  };

  // Remove address
  const handleRemoveAddress = async (addressId) => {
    try {
      await dispatch(
        editProfile({
          userId: initialData._id,
          removeAddressId: addressId,
        })
      ).unwrap();
      toast.success(t('addressRemovedSuccessfully'));
    } catch (err) {
      toast.error(t('addressRemoveFailed'));
    }
  };

  // Profile Form
  const renderPersonalInfo = () => (
    <Box sx={{ py: 2 }}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 12 }}>
          <Paper sx={{ p: 3 }}>
            <form onSubmit={handleSubmitProfile(onSubmitProfile)}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label={t('firstName')}
                    {...registerProfile('firstName')}
                    error={!!profileErrors.firstName}
                    helperText={profileErrors.firstName?.message}
                    aria-describedby={t("firstName")}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label={t('lastName')}
                    {...registerProfile('lastName')}
                    error={!!profileErrors.lastName}
                    helperText={profileErrors.lastName?.message}
                    aria-describedby={t("lastName")}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label={t('email')}
                    {...registerProfile('email')}
                    error={!!profileErrors.email}
                    helperText={profileErrors.email?.message}
                    type="email"
                    aria-describedby={t("email")}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label={t('phoneNumber')}
                    {...registerProfile('phoneNumber')}
                    error={!!profileErrors.phoneNumber}
                    helperText={profileErrors.phoneNumber?.message}
                    aria-describedby={t("phoneNumber")}
                  />
                </Grid>
              </Grid>
              <Button
                variant="contained"
                color="primary"
                sx={{ alignSelf: 'flex-end', mt: 2 }}
                type="submit"
                disabled={loading}
              >
                {loading ? <ButtonLoader /> : t('saveChanges')}
              </Button>
            </form>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  // Render addresses
  const renderAddresses = () => (
    <Box sx={{ py: 2 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          color="primary"
          onClick={() => handleEditAddress(null)} // Open modal for new address
        >
          {t('addNewAddress')}
        </Button>
      </Box>
      <Grid container spacing={3}>
      {(user.addresses || []).map((address) => (
        <Grid xs={12} md={6} key={address._id}>
          <Card variant="outlined" sx={{ p: 2, borderRadius: 2, boxShadow: 2 }}>
            <Stack spacing={3}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <LocationIcon color="primary" />
                <Typography variant="subtitle1" fontWeight={600}>
                  {t('addressDetails')}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ ml: 1, direction: 'ltr' }}>
                  {address.isDefaultShipping && (
                    <Chip
                      label={t('defaultShipping')}
                      color="primary"
                      size="small"
                      sx={{ mr: address.isDefaultBilling ? 1 : 0 }}
                    />
                  )}
                  {address.isDefaultBilling && (
                    <Chip
                      label={t('defaultBilling')}
                      color="secondary"
                      size="small"
                    />
                  )}
                </Stack>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {address.street}, {address.city}, {address.state}, {address.zipCode}, {address.country}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => handleEditAddress(address)}
                >
                  {t('edit')}
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  startIcon={<DeleteIcon />}
                  onClick={() => handleRemoveAddress(address._id)}
                >
                  {t('delete')}
                </Button>
              </Stack>
            </Stack>
          </Card>
        </Grid>
      ))}
    </Grid>
    </Box>
  );

  const renderOrders = () => (
    <Box sx={{ py: 2 }}>
      <Grid container spacing={2}>
        {[1, 2, 3].map((order) => (
          <Grid size={{ xs: 12 }} key={order}>
            <Card>
              <CardContent>
                <Grid container spacing={2} alignItems="center">
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      {t('orderNumber')}
                    </Typography>
                    <Typography>#ORD-2023-{order}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      {t('orderDate')}
                    </Typography>
                    <Typography>2023-06-{order}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      {t('status')}
                    </Typography>
                    <Chip 
                      label={t('delivered')} 
                      color="success" 
                      size="small" 
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      fullWidth
                    >
                      {t('viewDetails')}
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  // Address Dialog
  const addressDialog = (
    <Dialog open={openAddressModal} onClose={handleCloseAddressModal} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 0 }}>
        {editingAddress ? t('editAddress') : t('addNewAddress')}
      </DialogTitle>
      <DialogContent>
        <form onSubmit={handleSubmitAddress(onSubmitAddress)}>
          <Box
            sx={{
              mt: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 1 }}>
              {t('addressDetails')}
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label={t('street')}
                name="street"
                fullWidth
                {...registerAddress('street')}
                error={!!addressErrors.street}
                helperText={addressErrors.street?.message}
                margin="dense"
                aria-describedby={t("street")}
              />
              <TextField
                label={t('city')}
                name="city"
                fullWidth
                {...registerAddress('city')}
                error={!!addressErrors.city}
                helperText={addressErrors.city?.message}
                margin="dense"
                aria-describedby={t("city")}
              />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label={t('state')}
                name="state"
                fullWidth
                {...registerAddress('state')}
                error={!!addressErrors.state}
                helperText={addressErrors.state?.message}
                margin="dense"
                aria-describedby={t("state")}
              />
              <TextField
                label={t('zipCode')}
                name="zipCode"
                fullWidth
                {...registerAddress('zipCode')}
                error={!!addressErrors.zipCode}
                helperText={addressErrors.zipCode?.message}
                margin="dense"
                aria-describedby={t("zipCode")}
              />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label={t('country')}
                name="country"
                fullWidth
                {...registerAddress('country')}
                error={!!addressErrors.country}
                helperText={addressErrors.country?.message}
                margin="dense"
                aria-describedby={t("country")}
              />
            </Stack>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 1 }}>
                {t('addressType')}
              </Typography>
              <Stack direction="row" spacing={2}>
              <Controller
                name="isDefaultShipping"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        {...field}
                        checked={!!field.value}
                      />
                    }
                    label={t('isDefaultShipping')}
                  />
                )}
              />
              <Controller
                name="isDefaultBilling"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        {...field}
                        checked={!!field.value}
                      />
                    }
                    label={t('isDefaultBilling')}
                  />
                )}
              />
              </Stack>
            </Box>

            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={handleCloseAddressModal} color="inherit" variant="outlined">
                {t('cancel')}
              </Button>
              <Button
                variant="contained"
                color="primary"
                type="submit"
                disabled={loading}
              >
                {loading ? <ButtonLoader /> : t('save')}
              </Button>
            </DialogActions>
          </Box>
        </form>  
      </DialogContent>
      
    </Dialog>
  );

  return (
    <>
       {addressDialog}   
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          {t('myAccount')}
        </Typography>
        
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab 
              icon={<PersonIcon />} 
              label={t('personalInfo')} 
              iconPosition="start"
            />
            <Tab 
              icon={<LocationIcon />} 
              label={t('addresses')} 
              iconPosition="start"
            />
            <Tab 
              icon={<OrdersIcon />} 
              label={t('orders')} 
              iconPosition="start"
            />
          </Tabs>

          <Box sx={{ p: 3 }}>
            {activeTab === 0 && renderPersonalInfo()}
            {activeTab === 1 && renderAddresses()}
            {activeTab === 2 && renderOrders()}
          </Box>
        </Paper>
      </Container>
    </>
  );
};

export default memo(withAuth(MyProfile));