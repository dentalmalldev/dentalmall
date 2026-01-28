"use client";

import { Box, Stack, Typography } from "@mui/material";
import { useTranslations } from "next-intl";

export default function OrDivider() {
  const t = useTranslations("auth");
  return (
    <Stack>
      <Box
        sx={{
          position: "relative",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          my: 2,
        }}
      >
        <Box
          sx={{
            flex: 1,
            height: "1px",
            bgcolor: "grey.400",
          }}
        />
        <Typography
          variant="caption"
          sx={{
            px: 2,
            color: "grey.500",
            bgcolor: "background.paper",
            zIndex: 1,
            lineHeight: 1,
          }}
        >
          {t("or")}
        </Typography>
        <Box
          sx={{
            flex: 1,
            height: "1px",
            bgcolor: "grey.400",
          }}
        />
      </Box>
    </Stack>
  );
}
