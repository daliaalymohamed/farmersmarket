"use client";
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from "next/navigation";
import { useTranslation } from "../../contexts/translationContext"; // Import useTranslation
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { TextField, Button, Box, Typography, Container, Checkbox, FormControlLabel, Link, InputAdornment, IconButton } from "@mui/material";
import Grid from "@mui/material/Grid2";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import Image from "next/image";
import GoogleSignInButton from '@/components/UI/googleSignInButton';
import { loginSchema } from "../../lib/utils/validation";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "@/store/slices/authSlice";
import loginImg from "../../assets/loginImg.jpeg";
import { toast } from "react-toastify";

const Login = () => {
  const router = useRouter();
  const { t } = useTranslation();  // Get the translation function
  const pathname = usePathname(); // Get the current pathname to detect route changes
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const { loading, error, user } = useSelector((state) => state.auth || {}); // Use optional chaining to avoid errors if auth is not defined
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    getValues,
  } = useForm({
    mode: 'all',
    reValidateMode: "onSubmit",
    resolver: yupResolver(loginSchema(t)), // Initialize with translated schema
  });

  // Add this effect to redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/home');
    }
  }, [user, router]);

  useEffect(() => {
    reset(getValues()); // Keeps values but clears errors when language changes
  }, [t]);

  
  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  const onSubmit =  async(data) => {
    try {
          //unwrap() throws the actual error from the thunk, 
          // which your interceptor catches and displays via toast.
          await dispatch(loginUser(data)).unwrap(); // throws if rejected
          toast.success(t("loginSuccessfullMsg")); // show success toast here
          reset(); // Reset the form
          router.push("/home"); // Navigate to login
        } catch (error) {
          // DO NOT show toast here. Axios interceptor already did it.
          // console.error("Login failed:", error);
        }
  };

  return (
    <Container maxWidth="lg">
      <Grid container sx={{ minHeight: "100vh", alignItems: "center" }}>
        {/* Image Section */}
        <Grid xs={12} md={6} sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 3 }}>
          <Image
            src={loginImg}
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

            {/* ✅ Google Sign-In Button */}
            <Box sx={{ width: '100%', maxWidth: 400, mb: 2 }}>
              <GoogleSignInButton />
            </Box>

            {/* Add a key to the form to force re-render on route change */}
            <form key={pathname} onSubmit={handleSubmit(onSubmit)}>
              <TextField
                fullWidth
                label={t("email")}
                {...register("email")}
                error={!!errors.email}
                helperText={errors.email?.message}
                margin="normal"
                aria-describedby={t("email")}
              />

              <TextField
                fullWidth
                type={showPassword ? "text" : "password"}
                label={t("password")}
                {...register("password")}
                error={!!errors.password}
                helperText={errors.password?.message}
                aria-describedby={t("password")}
                margin="normal"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleTogglePassword}
                        edge="end"
                        aria-label={showPassword ? t("showPassword") : t("hidePassword")}
                      >
                        {showPassword ? <Visibility /> : <VisibilityOff />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <FormControlLabel
                control={<Checkbox {...register("rememberMe")} />}
                label={t("rememberMe")}
                sx={{ textAlign: "left", width: "100%", mt: 1 }}
              />

              {/* ✅ Loading & Error Messages */}
              {loading && <Typography color="primary">{t("loading")}</Typography>}
              {error && <Typography color="error">{error}</Typography>}

              <Button fullWidth type="submit" variant="contained" color="primary" sx={{ mt: 3 }}>
                {t("login")}
              </Button>

              <Typography mt={2} color="textSecondary">
                {t("signUpQuestion")}{" "}
                <Link href="/register" underline="hover">
                  {t("register")}
                </Link>
              </Typography>
            </form>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Login;