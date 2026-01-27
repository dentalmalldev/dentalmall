"use client";

import { Box, Container, Typography, Button, Stack } from "@mui/material";
import { useTranslations } from "next-intl";
import Image from "next/image";

export function Hero() {
  const t = useTranslations("hero");

  return (
    <Box  sx={{ padding: { xs: "16px 16px", md: "28px 120px" } }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column-reverse", md: "row" },
          alignItems: "center",
          gap: 4,
        }}
      >
        {/* Left side - Content */}
        <Box sx={{ flex: 1, textAlign: {xs: 'center'} }}>
          <Stack spacing={3}>
            <Typography variant="h1" sx={{color: '#3E4388'}}>{t("title")}</Typography>

            <Typography
              variant="body1"
              sx={{
                fontSize: { xs: "14px", md: "16px" },
                color: "#3E4388",
                lineHeight: 1.6,
              }}
            >
              {t("description")}
            </Typography>

            <Box>
              <Button
                variant="contained"
                size="large"
                sx={{
                  borderRadius: "100px",
                  padding: "12px 32px",
                  fontSize: "16px",
                  fontWeight: 600,
                  textTransform: "none",
                  backgroundColor: "#5B6ECD",
                  "&:hover": {
                    backgroundColor: "#4A5BC0",
                  },
                }}
              >
                {t("cta")}
              </Button>
            </Box>
          </Stack>
        </Box>

        {/* Right side - Image */}
        <Box sx={{ flex: 1, width: "100%" }}>
          <Box
            sx={{
              position: "relative",
              width: "100%",
              height: { xs: "300px", md: "400px" },
              borderRadius: "16px",
              overflow: "hidden",
            }}
          >
            <Image
              src="/assets/hero.jpg"
              alt="Dental products"
              fill
              style={{ objectFit: "cover" }}
              priority
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
