import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    secondary: {
      main: '#dc004e',    // Your secondary color
    },
    background: {
      default: 'rgba(255,233,201,.6)', // Your default background color
      paper: '#ffffff',   // Background color for components like Paper
    },
    text: {
      primary: 'rgba(233, 141, 8, 0.6)', // Primary text color
      secondary: '#757575', // Secondary text color
    },
    hoverBackground: {
      color: "#f0f0f0"
    }
  },
});

export default theme;