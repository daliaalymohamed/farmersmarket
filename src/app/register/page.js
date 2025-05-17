"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTranslation } from "../../contexts/translationContext"; 
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { TextField, Button, Box, Typography, Container, Link, MenuItem, Select } from "@mui/material";
import Grid from "@mui/material/Grid2";
import Image from "next/image";
import { registerSchema } from "../../lib/utils/validation";
import { useDispatch, useSelector } from "react-redux";
import { registerUser } from "@/store/slices/authSlice";
import main from "../../assets/main.jpg";
import { toast } from "react-toastify";

const countries = [
  { code: "EG", dialCode: "+20", flag: "🇪🇬", name: "Egypt" },
  { code: "SA", dialCode: "+966", flag: "🇸🇦", name: "Saudi Arabia" },
  { code: "US", dialCode: "+1", flag: "🇺🇸", name: "United States" },
];

const Register = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const pathname = usePathname();
  const [selectedCountry, setSelectedCountry] = useState(countries[0]); // Default country
  const [phoneNumber, setPhoneNumber] = useState(""); 
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth || {}); // Use optional chaining to avoid errors if auth is not defined

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    getValues,
    setValue,
  } = useForm({
    mode: "all",
    reValidateMode: "onSubmit",
    resolver: yupResolver(registerSchema(t)),
  });

  useEffect(() => {
    reset(getValues()); // Keeps values but clears errors when language changes
  }, [t]);

  // 🌍 Detect User Location (Auto Select Country)
  useEffect(() => {
    fetch("https://ipapi.co/json/")
      .then((res) => res.json())
      .then((data) => {
        const country = countries.find((c) => c.code === data.country_code) || countries[0];
        setSelectedCountry(country);
        setValue("countryCode", country.dialCode, { shouldValidate: true }); // Trigger validation
      });
  }, []);

  const handleCountryChange = (event) => {
    const country = countries.find((c) => c.dialCode === event.target.value);
    setSelectedCountry(country);
    setValue("countryCode", country.dialCode, { shouldValidate: true }); // Ensure re-validation
  };

  const handlePhoneNumberChange = (event) => {
    setPhoneNumber(event.target.value);
    setValue("phoneNumber", event.target.value);
  };

  const onSubmit = async (data) => {
    const fullPhoneNumber = `${selectedCountry.dialCode} ${data.phoneNumber}`
    const updatedData = {
      ...data,
      phoneNumber: fullPhoneNumber, // Replace phoneNumber with fullPhoneNumber
    };
    try {
      //unwrap() throws the actual error from the thunk, 
      // which your interceptor catches and displays via toast.
      await dispatch(registerUser(updatedData)).unwrap(); // throws if rejected
      toast.success(t("registrationSuccessfullMsg")); // show success toast here
      reset(); // Reset the form
      setPhoneNumber(""); // Clear phone state
      router.push("/login"); // Navigate to login
    } catch (error) {
      // DO NOT show toast here. Axios interceptor already did it.
      // console.error("Registration failed:", error);
    }
  };

  return (
    <Container maxWidth="lg">
      <Grid container sx={{ minHeight: "100vh", alignItems: "center" }}>
        {/* Image Section */}
        <Grid xs={12} md={6} sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 3 }}>
          <Image
            src={main}
            alt="Fresh Market"
            width={500}
            height={500}
            style={{ objectFit: "cover", borderRadius: "10px", maxWidth: "100%" }}
            priority
          />
        </Grid>

        {/* Form Section */}
        <Grid xs={12} md={6} sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 3 }}>
          <Box sx={{ maxWidth: 400, width: "100%", textAlign: "center", p: 4, boxShadow: 3, borderRadius: 2, bgcolor: "white" }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              {t("welcomeMsg")}
            </Typography>
            <Typography variant="body1" color="textSecondary" mb={3}>
              {t("slogan")}
            </Typography>

            <form key={pathname} onSubmit={handleSubmit(onSubmit)}>
              <TextField fullWidth label={t("firstName")} {...register("firstName")} error={!!errors.firstName} helperText={errors.firstName?.message} margin="normal" />
              <TextField fullWidth label={t("lastName")} {...register("lastName")} error={!!errors.lastName} helperText={errors.lastName?.message} margin="normal" />
              <TextField fullWidth label={t("email")} {...register("email")} error={!!errors.email} helperText={errors.email?.message} margin="normal" />
              <TextField fullWidth type="password" label={t("password")} {...register("password")} error={!!errors.password} helperText={errors.password?.message} margin="normal" />
              
              {/* Phone Number with Country Code */}
              <Grid container spacing={2} alignItems="center" sx={{ mt: 2 }}>
                {/* Country Code Dropdown */}
                <Grid xs={4}>
                  <Select
                    fullWidth
                    value={selectedCountry.dialCode}
                    onChange={handleCountryChange}
                    {...register("countryCode")}
                  >
                    {countries.map((country) => (
                      <MenuItem key={country.code} value={country.dialCode}>
                        {country.flag} {country.dialCode}
                      </MenuItem>
                    ))}
                  </Select>
                </Grid>

                {/* Phone Number Input */}
                <Grid xs={8}>
                  <TextField
                    fullWidth
                    {...register("phoneNumber")}
                    value={phoneNumber}
                    onChange={handlePhoneNumberChange}
                    error={!!errors.phoneNumber}
                    helperText={errors.phoneNumber?.message}
                    placeholder={t("enterPhoneNumber")}
                  />
                </Grid>
              </Grid>

              <Button fullWidth type="submit" variant="contained" color="primary" sx={{ mt: 3 }}>
                {t("register")}
              </Button>

              <Typography mt={2}>
                {t("alreadyHaveAnAccountQuestion")}{" "}
                <Link href="/login" underline="hover">
                  {t("login")}
                </Link>
              </Typography>
            </form>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Register;
