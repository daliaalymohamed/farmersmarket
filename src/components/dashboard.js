// app/components/Dashboard.js
'use client';
import React, { useState, useEffect } from "react";
import { useTheme } from "@mui/material/styles";
import { styled } from "@mui/system";
import { Box, CssBaseline, AppBar, Toolbar, Typography, Drawer, List, 
  ListItem, ListItemText, ListItemButton, ListItemIcon, IconButton } from '@mui/material';
import Link from "next/link";
import { useTranslation } from "../contexts/translationContext"; // Import useTranslation
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

const drawerWidth = 240;
const minimizedDrawerWidth = 65; // Width when drawer is minimized

// Define menu items with their properties
const menuItems = [
  { text: 'Web Site', icon: <Web />, path: '/home' },
  { text: 'Dashboard', icon: <HomeIcon />, path: '/dashboard' },
  { text: 'Categories', icon: <CategoryIcon />, path: '/dashboard/categories' },
  { text: 'Products', icon: <ProductionQuantityLimitsIcon />, path: '/dashboard/products' },
  { text: 'Orders', icon: <ShoppingCartIcon />, path: '/dashboard/orders' },
  { text: 'Customers', icon: <PeopleIcon />, path: '/dashboard/customers/list' },
  { text: 'Reports', icon: <TableChartIcon />, path: '/dashboard/reports' },
  { text: 'Analytics', icon: <BarChartIcon />, path: '/dashboard/analytics' },
  { text: 'Roles Management', icon: <SupervisorAccountIcon />, path: '/dashboard/roles' },  
  { text: 'Settings', icon: <SettingsIcon />, path: '/dashboard/settings' },
];

const Dashboard = ({ children }) => {
  const theme = useTheme();
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

  const toggleDrawer = () => {
    const newState = !isDrawerOpen;
    setIsDrawerOpen(newState);
    // Save state to localStorage
    localStorage.setItem('drawerOpen', String(newState));
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
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      <AppBar position="fixed" sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: (theme) => theme.palette.background.default, 
          color: (theme) => theme.palette.text.secondary, // Add contrast text color
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
          <Typography variant="h6" noWrap component="div">
            {t("dashboard")}
          </Typography>
        </Toolbar>
      </AppBar>
      
       <Drawer
        variant="permanent"
        sx={{
          width: isDrawerOpen ? drawerWidth : minimizedDrawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { 
            width: isDrawerOpen ? drawerWidth : minimizedDrawerWidth,
            boxSizing: 'border-box',
            overflowX: 'hidden',
            transition: theme => theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
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
                >
                  <ListItemButton sx={{
                      minHeight: 48,
                      justifyContent: isDrawerOpen ? 'initial' : 'center',
                      px: 2.5,
                      color: (theme) => theme.palette.text.secondary
                    }}>
                     <ListItemIcon sx={{
                        minWidth: 0,
                        mr: isDrawerOpen ? 3 : 'auto',
                        justifyContent: 'center',
                        color: 'inherit', // This will inherit the color from ListItemButton
                      }}>
                        {item.icon}
                      </ListItemIcon>
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
        </Box>
      </Drawer>
      
     <Box component="main" sx={{ 
        flexGrow: 1, 
        bgcolor: 'background.paper', 
        p: 3,
        pb: 0,
        marginLeft: 0,
        transition: theme => theme.transitions.create(['margin', 'width'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        width: isDrawerOpen ? 
          `calc(100% - ${drawerWidth}px)` : 
          `calc(100% - ${minimizedDrawerWidth}px)`,
        }}>
          <Toolbar />
          <Box sx={{ 
              flex: 1,
              width: '100%',
              overflow: 'hidden' // Prevent content from overflowing
            }}>
            {children}
          </Box>
          <Box 
            component="footer" 
            sx={{
              mt: 'auto',
              width: '100vw',
              position: 'fixed',
              left: isDrawerOpen ? drawerWidth : minimizedDrawerWidth,
              right: 0,
              bottom: 0,
              py: 2,
              px: 3,
              bgcolor: 'background.default',
              borderTop: 1,
              borderColor: 'divider',
              transition: theme => theme.transitions.create(['left', 'margin'], {
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