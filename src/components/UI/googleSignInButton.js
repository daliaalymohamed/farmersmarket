"use client";

import { useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { Button } from '@mui/material';
import { useTranslation } from '@/contexts/translationContext';
import { useDispatch } from 'react-redux';
import { syncGoogleLogin } from '@/store/slices/authSlice';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

export default function GoogleSignInButton() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const router = useRouter();
  const { data: session, status } = useSession();

  // Effect to handle session changes
  useEffect(() => {
    if (session?.user?.customToken) {
      const setupSession = async () => {
        try {
          // Build user data from session
          const userData = {
            _id: session.user.userId,
            firstName: session.user.firstName || "",
            lastName: session.user.lastName || "",
            email: session.user.email,
            roleId: session.user.roleId,
            token: session.user.customToken,
          };

          // Save to localStorage
          if (typeof window !== "undefined") {
            localStorage.setItem("token", session.user.customToken);
            localStorage.setItem("user", JSON.stringify(userData));
          }

          // Call API to set token as cookie (so server can access it)
          const response = await fetch('/api/set-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: session.user.customToken }),
          });

          if (!response.ok) {
            throw new Error('Failed to set token cookie');
          }

          // Dispatch to Redux - wait for it to complete
          const result = await dispatch(syncGoogleLogin({
            token: session.user.customToken,
            user: userData,
          }));

          // Check if dispatch was successful
          if (result.payload) {
            toast.success("Google login successful!");
            router.push('/home');
          } else {
            toast.error("Failed to sync user data");
          }
        } catch (error) {
          toast.error("Failed to sync Google login");
          console.error("Setup error:", error);
        }
      };

      setupSession();
    }
  }, [session, dispatch, router]);

  // This will redirect user to Google
  const handleGoogleSignIn = async () => {
    await signIn('google', { redirect: false });
  };

  return (
    <Button
      fullWidth
      variant="outlined"
      onClick={handleGoogleSignIn}
      disabled={status === 'loading'}
      sx={{
        mb: 2,
        py: 1.5,
        textTransform: 'none',
        fontSize: '16px',
        borderColor: '#dadce0',
        color: '#3c4043',
        '&:hover': {
          borderColor: '#dadce0',
          backgroundColor: '#f8f9fa'
        }
      }}
      startIcon={
        <svg width="18" height="18" viewBox="0 0 18 18">
          <path
            fill="#4285F4"
            d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
          />
          <path
            fill="#34A853"
            d="M9.003 18c2.43 0 4.467-.806 5.956-2.18L12.05 13.56c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332C2.44 15.983 5.485 18 9.003 18z"
          />
          <path
            fill="#FBBC05"
            d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.96H.957C.347 6.175 0 7.55 0 9.002c0 1.452.348 2.827.957 4.042l3.007-2.332z"
          />
          <path
            fill="#EA4335"
            d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.428 0 9.002 0 5.485 0 2.44 2.017.96 4.958L3.967 7.29c.708-2.127 2.692-3.71 5.036-3.71z"
          />
        </svg>
      }
    >
      {t("continueWithGoogle") || "Continue with Google"}
    </Button>
  );
}