import { Logo } from "@/icons";
import { Box, Stack, Typography } from "@mui/material";

export const HeaderLogo = () => {
  return (
    <Stack direction="row" alignItems="center">
      <Box sx={{ mt: -1 }}>
        <Logo variant="icon" width={56} height={46} />
      </Box>
      <Stack direction="row">
        <Typography variant="h1" color="primary" fontWeight={700}>
          Dentall
        </Typography>
        <Typography variant="h1" color="secondary" fontWeight={700}>
          Mall
        </Typography>
      </Stack>
    </Stack>
  );
};
