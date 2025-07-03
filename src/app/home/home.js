'use client';
import { Box, Divider } from '@mui/material';
import HeaderBox from '@/components/headerBox';
import CategorySlider from "@/components/categorySlider";
import DealsSlider from '@/components/dealsSlider';

const Home  = ({categories}) => {
  return (
    <Box sx={{ width: "100%", display: "flex", flexWrap: "wrap", gap: 2 }}>
      {/**HeaderBox section  */}
      <HeaderBox />

      <Divider sx={{ my: 4, borderColor: "text.primary", width: "100%" }} />

      {/** Category slider section  */}
      <CategorySlider initialData={categories}/>

      <Divider sx={{ my: 4, borderColor: "text.primary", width: "100%" }} />

      {/** Deals slider section  */}
      <DealsSlider/>

      <Divider sx={{ my: 4, borderColor: "text.primary", width: "100%" }} />

    </Box>
  );
}

export default Home