'use client';

import { useState, useEffect, memo } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import { Typography, Button, Box, Chip, TextField, Stack, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem } from '@mui/material';
import { checkPermission } from '@/middlewares/frontend_helpers';
import { addZone, editZone, updateZoneInList } from '@/store/slices/shippingZonesSlice';
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import ButtonLoader from "@/components/UI/buttonLoader";
import { shippingZoneSchema } from '@/lib/utils/validation';
import { toast } from "react-toastify";

const countries = [
    { code: "EG", dialCode: "+20", flag: "🇪🇬", name: "Egypt" },
    { code: "SA", dialCode: "+966", flag: "🇸🇦", name: "Saudi Arabia" },
    { code: "US", dialCode: "+1", flag: "🇺🇸", name: "United States" },
    { code: "GB", dialCode: "+44", flag: "🇬🇧", name: "United Kingdom" },
    { code: "AE", dialCode: "+971", flag: "🇦🇪", name: "UAE" },
    { code: "JO", dialCode: "+962", flag: "🇯🇴", name: "Jordan"}
];

// Shipping modal to edit and add new zone
const ZoneModal = memo(({ open, handleClose, zone, t, loading }) => {
    const router = useRouter();
    const dispatch = useDispatch();
    const [selectedCountry, setSelectedCountry] = useState(countries[0]); // Default country
    const [currentZipInput, setCurrentZipInput] = useState('');

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

        const requiredPermissions = ["add_shipping_zone"];
        const hasAccess = checkPermission(actions, requiredPermissions);

        if (!hasAccess) {
            router.push("/home");
        }
    }, [actions, actionsLoaded, router]);

    // Vendor form hook with edit mode detection
    const isEditMode = !!(zone && zone._id);

    // ✅ Proper default values with consistent date handling
    const getDefaultValues = () => {
        if (!zone) {
            return {
            name: { en: '', ar: '' },
            country: 'Egypt',
            zipCodes: [],
            cityNames: [{ en: '', ar: '' }],
            shippingFee: '',
            taxRate: 0.14,
            };
        }

        return {
            name: zone.name || { en: '', ar: '' },
            country: zone.country || 'Egypt',
            zipCodes: Array.isArray(zone.zipCodes) ? zone.zipCodes : [],
            cityNames: Array.isArray(zone.cityNames) ? zone.cityNames : [{ en: '', ar: '' }],
            shippingFee: zone.shippingFee || '',
            taxRate: zone.taxRate != null ? parseFloat(zone.taxRate) : 0.14, // ✅ Parse as float
        };
    };
    // Zone form hook
      const {
        register,
        handleSubmit: handleSubmitZone,
        control,
        setValue,
        watch,
        reset,
        trigger,
        formState: { errors, isSubmitting },
      } = useForm({
        mode: 'onChange',
        resolver: yupResolver(shippingZoneSchema(t, isEditMode)),
        defaultValues: getDefaultValues(zone)
      });

    // Reset form when modal opens/closes or zone changes
    // 1. Debug form reset triggers
    useEffect(() => {
        if (open) {
            const defaultValues = getDefaultValues(zone);
            reset(defaultValues);
        }
    }, [open, zone, reset]);
   
    // Handle Country change
    const handleCountryChange = (event) => {
        const country = countries.find((c) => c.name === event.target.value);
        setSelectedCountry(country);
        setValue("countryCode", country.name, { shouldValidate: true }); // Ensure re-validation
    };

    // Watch fields
    const watchedZipCodes = watch('zipCodes') || '';
    const watchedCityNames = watch('cityNames') || [{ en: '', ar: '' }];

    // Handle zip code input changes
    const handleZipCodeInputChange = (event) => {
        setCurrentZipInput(event.target.value);
    };

    // HandleZipCodeKeyDown
    const handleZipCodeKeyDown = (event) => {
        if (event.key === 'Enter' || event.key === ',') {
            event.preventDefault();
            let value = currentZipInput.trim().replace(/,$/, '');
            if (value && !watchedZipCodes.includes(value)) {
                setValue('zipCodes', [...watchedZipCodes, value], { shouldValidate: true });
                setCurrentZipInput('');
                trigger('zipCodes');
            }
        }
  
    }

    // Add new city name row
    const addCityRow = () => {
        const updated = [...watchedCityNames, { en: '', ar: '' }];
        setValue('cityNames', updated, { shouldValidate: true });
        trigger('cityNames'); // Re-validate whole array
    };

    // Remove city name row
    const removeCityRow = (index) => {
        const updated = watchedCityNames.filter((_, i) => i !== index);
        setValue('cityNames', updated.length > 0 ? updated : [{ en: '', ar: '' }], { shouldValidate: true });
        trigger('cityNames'); // Re-validate whole array
    };

    // Handle Tax Rate Input Change
    const handleTaxRateInputChange = (event) => {
        const val = event.target.value;
        const numVal = val === '' ? '' : parseFloat(val);

        if (val === '' || (!isNaN(numVal) && numVal >= 0 && numVal <= 1)) {
            setValue('taxRate', numVal, { shouldValidate: true });
            trigger('taxRate'); // ✅ Validate now
        }
    }
     
    // Handle form submission for adding/editing zone
    const onSubmitZone = async (data) => {

        // Parse zipCodes into array
        const zipCodesArray = (data.zipCodes || [])
            .map(code => String(code).trim())
            .filter(Boolean);

        // Clean up empty city names
        const cityNamesArray = data.cityNames
            .map(city => ({
            en: city.en?.trim(),
            ar: city.ar?.trim()
            }))
            .filter(city => city.en || city.ar);

        try {
            let payload;
            payload = { 
                name: {
                    en: data.name.en.trim(),
                    ar: data.name.ar.trim()
                },
                country: data.country,
                zipCodes: zipCodesArray,
                cityNames: cityNamesArray,
                shippingFee: parseFloat(data.shippingFee),
                taxRate: parseFloat(data.taxRate),
            };
            if (isEditMode) {
                // Edit existing zone
                const result = await dispatch(editZone({
                    zoneId: zone._id,
                    zoneData: payload
                })).unwrap();

                // Ensure UI reflects changes immediately
                if (result?.zone) {
                    dispatch(updateZoneInList(result.zone));
                }

                toast.success(t('shippingZoneUpdatedSuccessfully'));
            } else {
                // Add new zone
                const result = await dispatch(addZone(payload)).unwrap();
                // Ensure UI reflects changes immediately
                if (result?.zone) {
                    dispatch(updateZoneInList(result.zone));
                }
                toast.success(t('shippingZoneAddedSuccessfully'));
            }
            
            // Close modal after submission
            handleClose();
            
        } catch (err) {
            toast.error(t('shippingZoneSaveFailed'));
            if (err.details) {
                toast.error(err.details);
            }
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
            <DialogTitle>
                {zone ? t('editZone') : t('addZone')}
            </DialogTitle>
            <form onSubmit={handleSubmitZone(onSubmitZone)} encType="multipart/form-data">
                <DialogContent>
                    <Stack spacing={3}>
                        {/* Zone Name - English */}
                        <TextField
                        label={t('zoneNameInEnglish')}
                        {...register('name.en')}
                        error={!!errors?.name?.en}
                        helperText={errors?.name?.en?.message}
                        fullWidth
                        required
                        />

                        {/* Zone Name - Arabic */}
                        <TextField
                        label={t('zoneNameInArabic')}
                        {...register('name.ar')}
                        error={!!errors?.name?.ar}
                        helperText={errors?.name?.ar?.message}
                        fullWidth
                        required
                        dir="rtl"
                        />

                        {/* Country */}
                        <TextField
                        select
                        label={t('country')}
                        {...register('country')}
                        defaultValue="Egypt"
                        fullWidth
                        value={watch('country') || selectedCountry.name}
                        onChange={handleCountryChange}
                        >
                        {countries.map((c) => (
                            <MenuItem key={c.name} value={c.name}>
                            {c.name}
                            </MenuItem>
                        ))}
                        </TextField>

                        {/* ZIP Codes */}
                        {/* Display existing ZIP code tags */}
                        {watchedZipCodes && watchedZipCodes.length > 0 && (
                            <Box
                            sx={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 0.5,
                                mb: 1,
                                p: 1,
                                border: '1px solid #e0e0e0',
                                borderRadius: 1,
                                backgroundColor: '#fafafa'
                            }}
                            >
                            {watchedZipCodes.map((zip, index) => (
                                <Chip
                                key={index}
                                label={zip}
                                size="small"
                                variant="filled"
                                color="primary"
                                onDelete={() => {
                                    const newZips = watchedZipCodes.filter((_, i) => i !== index);
                                    setValue('zipCodes', newZips, { shouldValidate: true });
                                }}
                                />
                            ))}
                            </Box>
                        )}

                        {/* Input to add new ZIP code */}
                        <TextField
                            label={t('addZipCode')}
                            placeholder={t('typeAndPressEnterToZipCode')}
                            value={currentZipInput}
                            onChange={handleZipCodeInputChange}
                            onKeyDown={handleZipCodeKeyDown}
                            onBlur={() => trigger('zipCodes')}
                            error={!!errors.zipCodes}
                            helperText={
                                errors?.zipCodes?.message ||
                                t('pressEnterOrCommaToAddZipCode')
                            }
                            fullWidth
                            size="small"
                        />


                        {/* City Names */}
                        <Typography variant="subtitle1">{t('cities')}</Typography>
                        {watchedCityNames.map((city, index) => (
                            <Stack key={index} direction="row" spacing={1} alignItems="center">
                                <TextField
                                    label={t('typeCityNameInEnglish')}
                                    value={city.en || ''}
                                    onChange={(e) => {
                                        const updated = [...watchedCityNames];
                                        updated[index].en = e.target.value;
                                        setValue('cityNames', updated);
                                        trigger(`cityNames[${index}].en`); // ✅ Validate this specific field
                                    }}
                                    error={!!errors?.cityNames?.[index]?.en}
                                    helperText={errors?.cityNames?.[index]?.en?.message}
                                    fullWidth
                                    required
                                />
                                <TextField
                                    label={t('typeCityNameInArabic')}
                                    value={city.ar || ''}
                                    onChange={(e) => {
                                        const updated = [...watchedCityNames];
                                        updated[index].ar = e.target.value;
                                        setValue('cityNames', updated);
                                        trigger(`cityNames[${index}].ar`); // ✅ Validate this specific field
                                    }}
                                    error={!!errors?.cityNames?.[index]?.ar}
                                    helperText={errors?.cityNames?.[index]?.ar?.message}
                                    fullWidth
                                    dir="rtl"
                                    required
                                />
                                {
                                    index === watchedCityNames.length - 1 && (
                                        <Button size="small" onClick={addCityRow} variant="outlined">+</Button>
                                    )}
                                {watchedCityNames.length > 1 && (
                                <Button
                                    size="small"
                                    color="error"
                                    onClick={() => removeCityRow(index)}
                                    sx={{ minWidth: 'auto', px: 1 }}
                                >
                                    ×
                                </Button>
                                )}
                            </Stack>
                        ))}
                        {errors.cityNames && (
                            <Typography color="error" variant="caption">{errors.cityNames.message}</Typography>
                        )}

                        {/* Shipping Fee */}
                        <TextField
                            type="number"
                            step="0.01"
                            label={t('shippingFee')}
                            {...register('shippingFee')}
                            onBlur={() => trigger('shippingFee')}
                            error={!!errors.shippingFee}
                            helperText={errors.shippingFee?.message}
                            InputProps={{ endAdornment: 'EGP' }}
                            fullWidth
                            required
                        />

                        {/* Tax Rate */}
                        <TextField
                            type="number"
                            step="0.01"
                            label={t('taxRate')}
                            placeholder="0.14"
                            {...register('taxRate')}
                            onChange={handleTaxRateInputChange}
                            onBlur={() => trigger('taxRate')}
                            error={!!errors.taxRate}
                            helperText={
                                errors.taxRate?.message ||
                                t('taxRateHelperText')
                            }
                            inputProps={{
                                min: 0,
                                max: 1,
                                step: 0.01,
                                title: t('taxRateTooltip')
                            }}
                            fullWidth
                            required
                        />
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
})

export default ZoneModal;