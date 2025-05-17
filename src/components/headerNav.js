"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import logo from '../assets/logo.png';
import { styled } from "@mui/system";
import { useTranslation } from "../contexts/translationContext"; // Import useTranslation
import { useSelector, useDispatch } from "react-redux";
import { logoutUser } from "../store/slices/authSlice"; 

const StyledTypography = styled(Typography)(({ theme }) => ({
  minWidth: "100px",
  color: theme.palette.text.secondary, // Directly accessing theme color
  "&:hover": {
    color: theme.palette.text.primary, // Change color on hover
    cursor: "pointer", // Show a pointer cursor on hover
  },
}));

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
  const handleLogout = (event) => {
    event.preventDefault(); // optional: prevent default link behavior
    dispatch(logoutUser());
    handleClose(); // close menu
    setDrawerOpen(false); // optional: close drawer on mobile
    router.push("/home"); // Navigate to the home page
  };
  return (
    <React.Fragment>
      {/* Persistent Drawer for Mobile */}
      {isMobile ? (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: 2 }}>
          {/* Logo */}
          <Image src={logo} alt="Logo" width={100} height={70} priority/>

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
                      <Image src={logo} alt="Logo" width={150} height={75} priority />
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
                    <Link href="/cart" passHref legacyBehavior>
                      <ListItem disablePadding onClick={toggleDrawer(false)} sx={{ color: "text.secondary" }}>
                        <ListItemButton component="a">
                          <ListItemIcon><HomeIcon /></ListItemIcon>
                          <ListItemText primary={t("cart")} />
                        </ListItemButton>
                      </ListItem>
                    </Link>
                    <Divider />
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
            <Image src={logo} alt="Logo" width={200} height={150} priority />
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
                  <Link href="/orders" passHref>
                    <StyledTypography>{t("orders")}</StyledTypography>
                  </Link>
                  <Link href="/cart" passHref>
                    <StyledTypography>{t("cart")}</StyledTypography>
                  </Link>
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
