// app/components/Dashboard.js
'use client';
import React, { useState, useEffect, useLayoutEffect } from "react";
import { useTheme } from "@mui/material/styles";
import { Box, CssBaseline, AppBar, Toolbar, Typography, Drawer, List, 
  ListItem, ListItemText, ListItemButton, ListItemIcon, IconButton, 
  Divider, MenuItem, Select, Tooltip, InputLabel } from '@mui/material';
import Link from "next/link";
import { useTranslation } from "../contexts/translationContext"; // Import useTranslation
import { usePathname } from 'next/navigation';
// Import icons
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import Web from '@mui/icons-material/Web';
import HomeIcon from '@mui/icons-material/Home';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import PeopleIcon from '@mui/icons-material/People';
import CategoryIcon from '@mui/icons-material/Category';
import ProductionQuantityLimitsIcon from '@mui/icons-material/ProductionQuantityLimits';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import TableChartIcon from '@mui/icons-material/TableChart';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import InventoryIcon from '@mui/icons-material/Inventory';
import AirportShuttleIcon from '@mui/icons-material/AirportShuttle';
import LanguageIcon from "@mui/icons-material/Language"

const drawerWidth = 240;
const minimizedDrawerWidth = 65; // Width when drawer is minimized

// Define menu items with their properties
const menuItems = [
  { text: 'Web Site', icon: <Web />, path: '/home' },
  { text: 'Dashboard', icon: <HomeIcon />, path: '/dashboard' },
  { text: 'Categories', icon: <CategoryIcon />, path: '/dashboard/categories/list' },
  { text: 'Products', icon: <ProductionQuantityLimitsIcon />, path: '/dashboard/products' },
  { text: 'Orders', icon: <ShoppingCartIcon />, path: '/dashboard/orders' },
  { text: 'Customers', icon: <PeopleIcon />, path: '/dashboard/customers/list' },
  { text: 'Reports', icon: <TableChartIcon />, path: '/dashboard/reports' },
  { text: 'Analytics', icon: <BarChartIcon />, path: '/dashboard/analytics' },
  { text: 'Roles Management', icon: <SupervisorAccountIcon />, path: '/dashboard/roles' },  
  { text: 'Warehouses', icon: <WarehouseIcon />, path: '/dashboard/warehouses' },
  { text: 'Inventories', icon: <InventoryIcon />, path: '/dashboard/inventories' },
  { text: 'Vendors', icon: <AirportShuttleIcon />, path: '/dashboard/vendors' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/dashboard/settings' },
];

const Dashboard = ({ children }) => {
  const theme = useTheme();
  const pathname = usePathname();
  const { language, changeLanguage, t } = useTranslation(); // Access language and changeLanguage
  // Initialize drawer state from localStorage if available, default to true
  const [mounted, setMounted] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);


  useEffect(() => {
    // After component mounts, try to get stored drawer state
    const storedDrawerState = localStorage.getItem('drawerOpen');
    if (storedDrawerState !== null) {
      setIsDrawerOpen(storedDrawerState === 'true');
    }
    setMounted(true);
  }, []);
  // Add useLayoutEffect for RTL/LTR transitions
  useLayoutEffect(() => {
    document.body.dir = language === 'ar' ? 'rtl' : 'ltr';
    return () => {
      document.body.dir = 'ltr';
    };
  }, [language]);

  const toggleDrawer = () => {
    const newState = !isDrawerOpen;
    setIsDrawerOpen(newState);
    // Save state to localStorage
    localStorage.setItem('drawerOpen', String(newState));
  };

  // Function to handle language change
  const handleLanguageChange = (event) => {
    changeLanguage(event.target.value); // Change language on selection
  };


     // Prevent hydration issues by not rendering until mounted
  if (!mounted) {
    return (
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <CssBaseline />
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Toolbar />
        </Box>
      </Box>
    );
  }
  return (
    <Box sx={{  
      display: 'flex',
      minHeight: '100vh',
      overflow: 'hidden',
      direction: language === 'ar' ? 'rtl' : 'ltr'
      }}>
      <CssBaseline />
      
      <AppBar position="fixed" sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: (theme) => theme.palette.background.default, 
          color: (theme) => theme.palette.text.secondary, // Add contrast text color
          ...(language === 'ar' ? { right: 0, left: 'auto' } : { left: 0, right: 'auto' })
        }}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="toggle drawer"
            onClick={toggleDrawer}
            edge="start"
            sx={{ mr: 2 }}
          >
            {isDrawerOpen ? <ChevronLeftIcon /> : <MenuIcon />}
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ pr: 5, pl: 5  }}>
            {t("dashboard")}
          </Typography>
        </Toolbar>
      </AppBar>
      
       <Drawer
        variant="permanent"
        anchor={language === 'ar' ? 'right' : 'left'} // Add anchor based on language
        sx={{
          width: isDrawerOpen ? drawerWidth : minimizedDrawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': { 
            width: isDrawerOpen ? drawerWidth : minimizedDrawerWidth,
            boxSizing: 'border-box',
            overflowX: 'hidden',
            transition: theme => theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            ...(language === 'ar' 
              ? { right: 0, left: 'auto' } 
              : { left: 0, right: 'auto' })
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <Link 
                  href={item.path}
                  style={{ 
                    textDecoration: 'none', 
                    width: '100%' 
                  }}
                  aria-label={item.text}
                >
                  <ListItemButton sx={{
                      minHeight: 48,
                      justifyContent: isDrawerOpen ? 'initial' : 'center',
                      px: 2.5,
                      color: (theme) => theme.palette.text.secondary,
                      backgroundColor: (theme) => 
                        pathname === item.path 
                          ? theme.palette.action.selected
                          : 'transparent',
                      '&:hover': {
                        backgroundColor: (theme) => theme.palette.action.hover,
                      },
                      // Add transition for smooth color changes
                      transition: theme => theme.transitions.create(['background-color'], {
                        duration: theme.transitions.duration.shortest,
                      }),
                    }}>
                     <Tooltip title={!isDrawerOpen ? item.text : ""} placement={language === 'ar' ? 'left' : 'right'}>
                        <ListItemIcon sx={{
                          minWidth: 0,
                          mr: isDrawerOpen ? 3 : 'auto',
                          justifyContent: 'center',
                          color: 'inherit',
                        }}>
                          {item.icon}
                        </ListItemIcon>
                      </Tooltip>
                      {isDrawerOpen && (
                        <ListItemText 
                          primary={item.text}
                          sx={{ opacity: 1, color: 'inherit' }} // This will inherit the color from ListItemButton
                        />
                      )}
                  </ListItemButton>
                </Link>
              </ListItem>
            ))}
          </List>
          <Divider/>
          <List>
            <ListItem disablePadding>
              {!isDrawerOpen ? (
                <Tooltip 
                  title={t("openToSwitchLanguage")} 
                  placement={language === 'ar' ? 'left' : 'right'}
                >
                  <IconButton
                    onClick={toggleDrawer}
                    aria-label={t("openToSwitchLanguage")}
                    aria-expanded={isDrawerOpen}
                    sx={{
                      width: '100%',
                      justifyContent: 'center',
                      color: 'inherit', // Change this to inherit
                      '& .MuiSvgIcon-root': {
                        color: (theme) => theme.palette.text.secondary // Explicitly set icon color
                      }
                    }}
                  >
                    <LanguageIcon aria-hidden="true"/>
                  </IconButton>
                </Tooltip>
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    px: 2,
                    minHeight: 48,
                    color: (theme) => theme.palette.text.secondary // Add this
                  }}
                >
                  <LanguageIcon sx={{ mr: 2, color: 'inherit' }} aria-hidden="true"/>
                  <InputLabel 
                    id="language-select-label"
                    sx={{ display: 'none' }}
                  >
                    {t("selectLanguage")}
                  </InputLabel>
                  <Select
                    id="language-select"
                    value={language}
                    onChange={handleLanguageChange}
                    variant="standard"
                    labelId="language-select-label"
                    inputProps={{
                      'aria-label': t("selectLanguage"),
                      'name': 'language-selector'
                    }}
                    sx={{ 
                      flexGrow: 1,
                      color: (theme) => theme.palette.text.secondary,
                      '& .MuiSelect-select': {
                        py: 0
                      }
                    }}
                  >
                    <MenuItem value="en" 
                              selected={language === 'en'}>
                        {t("english")}
                    </MenuItem>
                    <MenuItem value="ar" 
                              selected={language === 'ar'}>
                        {t("arabic")}
                    </MenuItem>
                  </Select>
                </Box>
              )}
            </ListItem>
          </List>
        </Box>
      </Drawer>
      
     <Box component="main" sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
          bgcolor: 'background.paper',
          ...(language === 'ar' 
            ? {
                marginRight: isDrawerOpen ? `${drawerWidth}px` : `${minimizedDrawerWidth}px`,
                marginLeft: 0
              }
            : {
                marginLeft: isDrawerOpen ? `${drawerWidth}px` : `${minimizedDrawerWidth}px`,
                marginRight: 0
              }
          ),
          transition: theme => theme.transitions.create(['margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}>
          <Toolbar />
          <Box sx={{ 
              flex: 1,
              p: 3,
              pb: 7, // Add bottom padding to prevent content from being hidden by footer
              overflow: 'auto',
              width: '100%',
              height: '100%'
            }}>
            {children}
          </Box>
          <Box 
            component="footer" 
            sx={{
            position: 'fixed',
            bottom: 0,
            width: `calc(100% - ${isDrawerOpen ? drawerWidth : minimizedDrawerWidth}px)`,
            py: 2,
            px: 3,
            bgcolor: 'background.default',
            borderTop: 1,
            borderColor: 'divider',
            ...(language === 'ar' 
              ? { right: isDrawerOpen ? drawerWidth : minimizedDrawerWidth }
              : { left: isDrawerOpen ? drawerWidth : minimizedDrawerWidth }
            ),
            transition: theme => theme.transitions.create(['width', 'left', 'right'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }}
          >
            <Typography variant="body2" color="text.secondary" align="center">
              © {new Date().getFullYear()} Farmer's Market
            </Typography>
          </Box>
        </Box>
    </Box>
  );
}

export default Dashboard