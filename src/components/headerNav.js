"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import {
  Avatar,
  Box,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
  ListItemIcon,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Select,
  Chip
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import PersonAdd from "@mui/icons-material/PersonAdd";
import Settings from "@mui/icons-material/Settings";
import Logout from "@mui/icons-material/Logout";
import HomeIcon from "@mui/icons-material/Home";
import InfoIcon from "@mui/icons-material/Info";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LanguageIcon from "@mui/icons-material/Language"
import Image from "next/image";
import Link from "next/link";
import logo from '../assets/new-logo.jpg';
import { styled } from "@mui/system";
import { useTranslation } from "../contexts/translationContext";
import { useSelector, useDispatch } from "react-redux";
import { logoutUser } from "../store/slices/authSlice";
import { selectCartCount } from "../store/slices/cartSlice";
import { checkPermission } from '@/middlewares/frontend_helpers';

const StyledTypography = styled(Typography)(({ theme }) => ({
  minWidth: "100px",
  color: theme.palette.text.secondary, // Directly accessing theme color
  "&:hover": {
    color: theme.palette.text.primary, // Change color on hover
    cursor: "pointer", // Show a pointer cursor on hover
  },
}));

const StyledImageWrapper = styled(Box)({
  borderRadius: '5%',
  overflow: 'hidden' // This is important to make borderRadius work with images
});

export default function HeaderNav() {
  const router = useRouter(); 
  const theme = useTheme();
  const [mounted, setMounted] = useState(false);
  const isMobile = useMediaQuery(theme.breakpoints.down("md")); // Detect mobile screens
  const { language, changeLanguage, t } = useTranslation(); // Access language and changeLanguage
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const dispatch = useDispatch();
  const loggedIn = useSelector((state) => state.auth.isloggedIn);
  const user = useSelector((state) => state.auth.user);
  const actions = useSelector((state) => state.auth.actions || []);
  const cartItemCount = useSelector(selectCartCount);

  // Check if user has permission to view dashboard
  const canViewDashboard = checkPermission(actions, ['view_dashboard']);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; // prevent hydration errors

  // Function to toggle the drawer open/close
  // This function is used for the mobile drawer
  const toggleDrawer = (open) => (event) => {
    if (event.type === "keydown" && (event.key === "Tab" || event.key === "Shift")) {
      return;
    }
    setDrawerOpen(open);
  };

  // Function to handle menu click
  // This will open the menu on desktop and close it on mobile
  const handleClick = (event) => {
    if (isMobile) {
      setAnchorEl(null);  // Close the menu
    } else {
      setAnchorEl(event.currentTarget); // Open the menu on desktop
    }
  };

  // Function to handle menu close
  // This will close the menu on desktop
  // and also close the drawer on mobile
  const handleClose = () => {
    setAnchorEl(null);  // Close the menu
  };

  // Function to handle language change
  const handleLanguageChange = (event) => {
    changeLanguage(event.target.value); // Change language on selection
  };

  // Function to handle logout
  // This will dispatch the logout action and close the menu
  const handleLogout = async (event) => {
    event.preventDefault();
    
    // Clear Redux state and localStorage
    dispatch(logoutUser());
    
    // Clear NextAuth session (this also clears NextAuth cookies)
    await signOut({ redirect: false });
    
    handleClose();
    setDrawerOpen(false);
    router.push("/home");
  };
  return (
    <React.Fragment>
      {/* Persistent Drawer for Mobile */}
      {isMobile ? (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: 2 }}>
          {/* Logo */}
          <StyledImageWrapper>
            <Image src={logo} alt="Logo" width={100} height={70} priority />
          </StyledImageWrapper>

          {/* Menu Button */}
          <IconButton onClick={toggleDrawer(true)}>
            <MenuIcon />
          </IconButton>

          {/* Drawer Component */}
          <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
            <Box sx={{ width: 250 }}>
              <List>
                <ListItem onClick={toggleDrawer(false)}>
                  <Link href="/home" passHref legacyBehavior>
                    <a>
                      <StyledImageWrapper>
                        <Image src={logo} alt="Logo" width={150} height={75} priority />
                      </StyledImageWrapper>
                    </a>
                  </Link>
                </ListItem>
                <Divider />
                {loggedIn && (
                  <Link href="/profile" passHref legacyBehavior>
                    <ListItem disablePadding onClick={toggleDrawer(false)}>
                      <ListItemButton component="a">
                        <ListItemIcon><AccountCircleIcon /></ListItemIcon>
                        <ListItemText primary={t("profile")} />
                      </ListItemButton>
                    </ListItem>
                  </Link>
                )}

                <Link href="/about" passHref legacyBehavior>
                  <ListItem disablePadding onClick={toggleDrawer(false)} sx={{ color: "text.secondary" }}>
                    <ListItemButton component="a">
                      <ListItemIcon><InfoIcon /></ListItemIcon>
                      <ListItemText primary={t("about")} />
                    </ListItemButton>
                  </ListItem>
                </Link>

                <Link href="/cart" passHref legacyBehavior>
                  <ListItem disablePadding onClick={toggleDrawer(false)} sx={{ color: "text.secondary" }}>
                    <ListItemButton component="a">
                      <ListItemIcon><HomeIcon /></ListItemIcon>
                      <ListItemText 
                        primary={
                          <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                            {t("cart")}
                            {cartItemCount > 0 && (
                              <Chip
                                label={cartItemCount}
                                color="error"
                                size="small"
                                sx={{
                                  ml: 1,
                                  height: 16,
                                  minWidth: 20,
                                  fontSize: '0.65rem',
                                  fontWeight: 'bold'
                                }}
                              />
                            )}
                          </Box>
                        } 
                      />
                    </ListItemButton>
                  </ListItem>
                </Link>

                {loggedIn ? (
                  <>
                    <Link href="/orders" passHref legacyBehavior>
                      <ListItem disablePadding onClick={toggleDrawer(false)} sx={{ color: "text.secondary" }}>
                        <ListItemButton component="a">
                          <ListItemIcon><HomeIcon /></ListItemIcon>
                          <ListItemText primary={t("orders")} />
                        </ListItemButton>
                      </ListItem>
                    </Link>
                    
                    <Divider />
                    {canViewDashboard && (
                      <Link href="/dashboard" passHref legacyBehavior>
                        <ListItem disablePadding onClick={toggleDrawer(false)} sx={{ color: "text.secondary" }}>
                          <ListItemButton component="a">
                            <ListItemIcon><PersonAdd /></ListItemIcon>
                            <ListItemText primary={t("dashboard")} />
                          </ListItemButton>
                        </ListItem>
                      </Link>
                    )}
                    <Link href="/home" passHref legacyBehavior>
                      <ListItem disablePadding onClick={toggleDrawer(false)} sx={{ color: "text.secondary" }}>
                        <ListItemButton component="a">
                          <ListItemIcon><PersonAdd /></ListItemIcon>
                          <ListItemText primary={t("addAccount")} />
                        </ListItemButton>
                      </ListItem>
                    </Link>
                    <Link href="/home" passHref legacyBehavior>
                      <ListItem disablePadding onClick={toggleDrawer(false)} sx={{ color: "text.secondary" }}>
                        <ListItemButton component="a">
                          <ListItemIcon><Settings /></ListItemIcon>
                          <ListItemText primary={t("settings")} />
                        </ListItemButton>
                      </ListItem>
                    </Link>
                    <ListItem disablePadding sx={{ color: "text.secondary" }}>
                      <ListItemButton onClick={handleLogout}>
                        <ListItemIcon><Logout /></ListItemIcon>
                        <ListItemText primary={t("logout")} />
                      </ListItemButton>
                    </ListItem>
                    <Divider />
                  </>
                ) : (
                  <Link href="/login" passHref legacyBehavior>
                    <ListItem disablePadding onClick={toggleDrawer(false)} sx={{ color: "text.secondary" }}>
                      <ListItemButton component="a">
                        <ListItemIcon><HomeIcon /></ListItemIcon>
                        <ListItemText primary={t("login")} />
                      </ListItemButton>
                    </ListItem>
                  </Link>
                )}
                {/* Language Selector */}
                <ListItem sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
                  <Select
                    value={language}
                    onChange={handleLanguageChange}
                    displayEmpty
                    inputProps={{ "aria-label": "Select language" }}
                    sx={{ width: "80%", textAlign: "center" }}
                    IconComponent={LanguageIcon}
                  >
                    <MenuItem value="en">{t("english")}</MenuItem>
                    <MenuItem value="ar">{t("arabic")}</MenuItem>
                  </Select>
                </ListItem>
              </List>
            </Box>
          </Drawer>
        </Box>
      ) : (
        /* Normal Navbar for Desktop */
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            p: 2,
            bgcolor: "background.paper",
            boxShadow: "0px 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          {/* Logo */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <StyledImageWrapper>
              <Image src={logo} alt="Logo" width={200} height={150} priority />
            </StyledImageWrapper>
          </Box>

          {/* Navigation Links */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Link href="/home" passHref>
                <StyledTypography>{t("home")}</StyledTypography>
              </Link>
              <Link href="/about" passHref>
                <StyledTypography>{t("about")}</StyledTypography>
              </Link>
            {
              loggedIn ? (
                <>
                  <Box sx={{ position: 'relative', mx: 1 }}>
                    <Link href="/cart" passHref>
                      <StyledTypography component="span">
                        {t("cart")}
                      </StyledTypography>
                    </Link>
                    {cartItemCount > 0 && (
                      <Chip
                        label={cartItemCount}
                        color="error"
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: -8,
                          right: -20,
                          height: 16,
                          minWidth: 20,
                          fontSize: '0.65rem',
                          fontWeight: 'bold',
                          padding: 0
                        }}
                      />
                    )}
                  </Box>
                  <Link href="/orders" passHref>
                    <StyledTypography>{t("orders")}</StyledTypography>
                  </Link>
                  {canViewDashboard && (
                    <Link href="/dashboard" passHref>
                      <StyledTypography>{t("dashboard")}</StyledTypography>
                    </Link>
                  )}
                </>
              ) : 
                  <Link href="/login" passHref>
                    <StyledTypography>{t("login")}</StyledTypography>
                  </Link>
                                
            }

            {/* Language Selector */}
            <Select
              value={language}
              onChange={handleLanguageChange}
              displayEmpty
              inputProps={{
                "aria-label": "Select language",
              }}
              sx={{ ml: 2 }}
              IconComponent={LanguageIcon}
            >
              <MenuItem value="en">{t("english")}</MenuItem>
              <MenuItem value="ar">{t("arabic")}</MenuItem>
            </Select>

            {/* Profile Menu */}
            { loggedIn ? (
              <Tooltip title="Account settings">
                <IconButton
                  onClick={handleClick}
                  size="small"
                  sx={{ ml: 2 }}
                  aria-controls={open ? "account-menu" : undefined}
                  aria-haspopup="true"
                  aria-expanded={open ? "true" : undefined}
                >
                  <Avatar sx={{ width: 32, height: 32 }}>{user?.firstName ? user.firstName.charAt(0).toUpperCase() : "M"}</Avatar>
                </IconButton>
              </Tooltip>
            ) : ("")}
          </Box>
        </Box>
      )}

      {/* Desktop Account Menu */}
      {  loggedIn ? (
        <Menu
          anchorEl={anchorEl}
          id="account-menu"
          open={open}
          onClose={handleClose}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        >
          <MenuItem component={Link} href="/profile" onClick={handleClose}
            sx={{color: "text.secondary",
                "&:hover": { backgroundColor: "hoverBackground.color", color: "text.primary"},
                }}>
            <Avatar sx={{ mr: 1 }} />
            {t("profile")}
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleClose} sx={{color: "text.secondary",
                "&:hover": { backgroundColor: "hoverBackground.color", color: "text.primary"},
                }}>
            <ListItemIcon>
              <PersonAdd fontSize="small" />
            </ListItemIcon>
            {t("addAccount")}
          </MenuItem>
          <MenuItem onClick={handleClose} sx={{color: "text.secondary",
                "&:hover": { backgroundColor: "hoverBackground.color", color: "text.primary"},
                }}>
            <ListItemIcon>
              <Settings fontSize="small" />
            </ListItemIcon>
            {t("settings")}
          </MenuItem>
          <MenuItem onClick={handleLogout} sx={{color: "text.secondary",
                "&:hover": { backgroundColor: "hoverBackground.color", color: "text.primary"},
                }}>
            <ListItemIcon>
              <Logout fontSize="small" />
            </ListItemIcon>
            {t("logout")}
          </MenuItem>
        </Menu>
      ) : ("") }
      
    </React.Fragment>
  );
}
