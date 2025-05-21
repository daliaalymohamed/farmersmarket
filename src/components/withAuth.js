"use client";

import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { Box, CircularProgress } from '@mui/material';
import { checkAuth } from "@/store/slices/authSlice";

// This is a higher-order component (HOC) that wraps a component and checks for authentication
// before rendering it. If the user is not authenticated, they are redirected to the login page.
// The HOC uses Redux to manage authentication state and Next.js for routing.
// It also uses the useEffect hook to perform side effects, such as checking authentication status
// and redirecting the user based on their authentication status.
const withAuth = (WrappedComponent) => {
    return function AuthWrapper(props) {
        const dispatch = useDispatch();
        const router = useRouter();

        const { isloggedIn, loading } = useSelector((state) => state.auth);

        useEffect(() => {
            dispatch(checkAuth());
        }, [dispatch]);

        useEffect(() => {
        if (!loading && !isloggedIn) {
            router.replace("/");
        }
        }, [loading, isloggedIn, router]);

        if (loading || (!isloggedIn && typeof window !== "undefined")) {
            return (
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "100vh",
                    }}
                >
                <CircularProgress />
                </Box>
            ); // or return null
        }
        
        return <WrappedComponent {...props} />;
  };
};

export default withAuth;
