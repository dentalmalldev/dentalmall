'use client';

import { SearchIcon } from "@/icons";
import { TextField } from "@mui/material";
import { useTranslations } from 'next-intl';

export const HeaderSearch = () => {
  const t = useTranslations('actions');

  return (
    <TextField
      placeholder={t('search')}
      slotProps={{
        input: {
          startAdornment: <SearchIcon />,
        },
      }}
      sx={{
        width: { xs: "100%", md: "500px" },
        "& .MuiOutlinedInput-root": {
          borderRadius: "100px",
          "& fieldset": {
            borderColor: "#5B6ECD",
          },
          "&:hover fieldset": {
            borderColor: "#5B6ECD",
          },
          "&.Mui-focused fieldset": {
            borderColor: "#5B6ECD",
          },
        },
      }}
    />
  );
};
