'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import Image from "next/image";
import { Box, Typography, Button, 
    TextField, InputLabel, Stack, Dialog, DialogActions, DialogContent, 
    DialogTitle, CircularProgress, MenuItem, FormControlLabel, 
    Checkbox, Chip } from '@mui/material';
import { checkPermission } from '@/middlewares/frontend_helpers';
import { addVendor, editVendor, updateVendorInList } from '@/store/slices/vendorSlice';
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import ButtonLoader from "@/components/UI/buttonLoader";
import { vendorSchema } from '@/lib/utils/validation';
import { toast } from "react-toastify";

const countries = [
  { code: "EG", dialCode: "+20", flag: "🇪🇬", name: "Egypt" },
  { code: "SA", dialCode: "+966", flag: "🇸🇦", name: "Saudi Arabia" },
  { code: "US", dialCode: "+1", flag: "🇺🇸", name: "United States" },
];

// Vendor modal to edit and add new vendor
const VendorModal = ({ open, handleClose, vendor, t, loading, language }) => {
    const router = useRouter();
    const dispatch = useDispatch();
    const [selectedCountry, setSelectedCountry] = useState(countries[0]); // Default country

    // Redux Selectors
    // With shallowEqual - only re-renders if selected values actually changed
    // ✅ Separate selectors to avoid object creation
    const actions = useSelector(state => state.auth.actions, shallowEqual);
    const actionsLoaded = useSelector(state => state.auth.actionsLoaded);
    // Check permissions on mount
    // This effect runs once when the component mounts
    // and checks if the user has the required permissions to view this page.
    // If not, it redirects to the home page.
    useEffect(() => {
        if (!actionsLoaded) return; // ⏳ Wait until actions are loaded

        const requiredPermissions = ["add_vendor"];
        const hasAccess = checkPermission(actions, requiredPermissions);

        if (!hasAccess) {
            router.push("/home");
        }
    }, [actions, actionsLoaded, router]);

    // Vendor form hook with edit mode detection
    const isEditMode = !!(vendor && vendor._id);

    const escapeRegExp = (string) => {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };
    // ✅ Proper default values with consistent date handling
    const getDefaultValues = () => {
        if (vendor) {
            const contactPhone = vendor.contactPhone || '';
            
            // Extract country code
            const countryCodeMatch = contactPhone.match(/^\+(\d+)/);
            const extractedCountryCode = countryCodeMatch ? `+${countryCodeMatch[1]}` : '+20'; // fallback

            // Find matching country
            const matchedCountry = countries.find(c => c.dialCode === extractedCountryCode) || countries[0];
            if (matchedCountry.dialCode !== selectedCountry.dialCode) {
            setSelectedCountry(matchedCountry);
            }

            // ✅ Safely remove country code using escaped string
            const localPhone = contactPhone.replace(
            new RegExp(`^${escapeRegExp(extractedCountryCode)}\\s*`, 'g'), 
            ''
            );

            return {
            name: vendor.name || '',
            countryCode: extractedCountryCode,
            contactPhone: localPhone,
            location: vendor.location || '',
            about: vendor.about || '',
            socialLinks: {
                facebook: vendor.socialLinks?.facebook || '',
                instagram: vendor.socialLinks?.instagram || ''
            }
            };
        } else {
            const defaultCountry = countries[0];
            return {
            name: '',
            countryCode: defaultCountry.dialCode,
            contactPhone: '',
            location: '',
            about: '',
            socialLinks: {
                facebook: '',
                instagram: ''
            }
            };
        }
    };
    // Vendor form hook
      const {
        register,
        handleSubmit: handleSubmitVendor,
        control,
        setValue,
        watch,
        reset,
        formState: { errors, isSubmitting },
      } = useForm({
        mode: 'onChange',
        resolver: yupResolver(vendorSchema(t, isEditMode)),
        defaultValues: getDefaultValues()
      });

    // Reset form when modal opens/closes or product changes
    // 1. Debug form reset triggers
    useEffect(() => {
        if (open) {
            const defaultValues = getDefaultValues();
            reset(defaultValues);
        }
    }, [open, vendor, reset]);

   
    // Handle Country change
    const handleCountryChange = (event) => {
        const country = countries.find((c) => c.dialCode === event.target.value);
        setSelectedCountry(country);
        setValue("countryCode", country.dialCode, { shouldValidate: true }); // Ensure re-validation
  };
     
    // Handle form submission for adding/editing vendor
    const onSubmitVendor = async (data) => {
        try {
            let payload;

            if (isEditMode) {
                // Edit existing vendor
                const contactPhoneNumber = `${data.countryCode} ${data.contactPhone}`;
                payload = { 
                    name: data.name,
                    contactPhone: contactPhoneNumber,
                    location: data.location,
                    about: data.about,
                    socialLinks: { facebook: data.socialLinks.facebook, instagram: data.socialLinks.instagram },
                };
                const result = await dispatch(editVendor({
                    vendorId: vendor._id, 
                    vendorData: payload
                })).unwrap();

                // Ensure UI reflects changes immediately
                if (result?.vendor) {
                    dispatch(updateVendorInList(result.vendor));
                }

                toast.success(t('vendorUpdatedSuccessfully'));
            } else {
                // Add new vendor - always use FormData for new vendors
                const contactPhoneNumber = `${selectedCountry.dialCode} ${data.contactPhone}`
                payload = {
                    name: data.name,
                    contactPhone: contactPhoneNumber,
                    location: data.location,
                    about: data.about,
                    socialLinks: {
                        facebook: data.socialLinks.facebook || '',
                        instagram: data.socialLinks.instagram || ''
                    }
                };
                
                const result = await dispatch(addVendor(payload)).unwrap();
                console.log(result)
                // Ensure UI reflects changes immediately
                if (result?.vendor) {
                    dispatch(updateVendorInList(result.vendor));
                }
                toast.success(t('vendorAddedSuccessfully'));
            }
            
            // Close modal after submission
            handleClose();
            
        } catch (err) {
            toast.error(t('vendorSaveFailed'));
            if (err.details) {
                toast.error(err.details);
            }
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
            <DialogTitle>
                {vendor ? t('editVendor') : t('addVendor')}
            </DialogTitle>
            <form onSubmit={handleSubmitVendor(onSubmitVendor)} encType="multipart/form-data">
                <DialogContent>
                    <Stack spacing={3}>
                        <Stack direction="row" spacing={2}>
                            <>
                                <TextField
                                    label={t('vendorName')}
                                    {...register('name')}
                                    error={!!errors?.name}
                                    helperText={errors?.name?.message}
                                    fullWidth
                                    required
                                />
                            </>
                        </Stack>
                        <Stack direction="row" spacing={2}>
                            <>
                                <TextField
                                    select
                                    label={t('countryCode')}
                                    {...register('countryCode')}
                                    value={watch('countryCode') || selectedCountry.dialCode}
                                    onChange={handleCountryChange}
                                    error={!!errors?.countryCode}
                                    helperText={errors?.countryCode?.message}
                                    sx={{ minWidth: 120 }}
                                >
                                    {countries.map((country) => (
                                        <MenuItem key={country.code} value={country.dialCode}>
                                        {country.flag} {country.dialCode}
                                        </MenuItem>
                                    ))}
                                </TextField>
                                <TextField
                                    label={t('contactPhone')}
                                    fullWidth
                                    {...register("contactPhone")}
                                    onChange={(e) => {
                                        // Strip any + or country-like patterns
                                        const value = e.target.value.replace(/\+.*$/, '');
                                        setValue('contactPhone', value, { shouldValidate: true });
                                    }}
                                    error={!!errors.contactPhone}
                                    helperText={errors.contactPhone?.message}
                                    placeholder={t("enterPhoneNumber")}
                                />
                            </>
                        </Stack>
                        <Stack direction="row" spacing={2}>
                            <TextField
                                label={t('location')}
                                {...register('location')}
                                error={!!errors?.location}
                                helperText={errors?.location?.message}
                                fullWidth
                            />
                        </Stack>
                        <Stack direction="row" spacing={2}>
                            <TextField
                                label={t('aboutVendor')}
                                {...register('about')}
                                error={!!errors?.about}
                                helperText={errors?.about?.message}
                                fullWidth
                                multiline
                                rows={4}
                            />
                        </Stack>
                        <Stack direction="column" spacing={2}>
                          
                            <Typography variant="subtitle1" component="h3">
                                {t('socialLinks')}
                            </Typography>

                            
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} width="100%">
                                <TextField
                                    label={t('facebook')}
                                    {...register('socialLinks.facebook')} 
                                    error={!!errors?.socialLinks?.facebook}
                                    helperText={errors?.socialLinks?.facebook?.message}
                                    fullWidth
                                />
                                <TextField
                                    label={t('instagram')}
                                    {...register('socialLinks.instagram')} 
                                    error={!!errors?.socialLinks?.instagram}
                                    helperText={errors?.socialLinks?.instagram?.message}
                                    fullWidth
                                />
                            </Stack>
                        </Stack>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={handleClose} variant="outlined">{t('cancel')}</Button>
                    <Button variant="contained" color="primary" type="submit" disabled={loading || isSubmitting}>
                        {(loading || isSubmitting) ? <ButtonLoader /> : t('saveChanges')}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    )
}

export default VendorModal;