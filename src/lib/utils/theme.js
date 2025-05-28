import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    secondary: {
      main: '#dc004e',    // Your secondary color
    },
    background: {
      default: '#A8A559', // Your default background color
      paper: '#ffffff',   // Background color for components like Paper
    },
    text: {
      primary: '#985C4A', // Primary text color
      secondary:  '#040301', // Secondary text color
    },
    hoverBackground: {
      color: "#A8A559"
    }
  },
});

export default theme;