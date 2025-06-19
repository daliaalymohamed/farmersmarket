import { CircularProgress } from '@mui/material';

const ButtonLoader = ({ size = 20 }) => (
  <CircularProgress 
    size={size} 
    color="inherit"
    sx={{ 
      width: size,
      height: size,
      marginRight: 1 
    }} 
  />
);

export default ButtonLoader;