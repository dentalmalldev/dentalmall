"use client";

import { Box, Button, Stack, Typography } from "@mui/material";
import { useMessages, useTranslations } from "next-intl";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

interface Category {
  id: string;
  name: string;
  subcategories: { id: string; name: string }[];
}

export function Categories() {
  const messages = useMessages();
  const t = useTranslations("categoriesSection");
  const categories = messages.categories as Category[];

  return (
    <Box sx={{ padding: { xs: "16px 16px", md: "28px 120px" } }}>
      <Stack direction='row' justifyContent='space-between' alignItems='center'>
        <Typography
          variant="h4"
          sx={{
            color: "#3E4388",
            marginBottom: 3,
            textAlign: { xs: "center", md: "left" },
          }}
        >
          {t("title")}
        </Typography>
        <Button>{t("allCategories")}</Button>
      </Stack>
      <Swiper
        spaceBetween={16}
        slidesPerView={2}
        breakpoints={{
          640: {
            slidesPerView: 3,
          },
          768: {
            slidesPerView: 3,
          },
          1024: {
            slidesPerView: 4,
          },
          1280: {
            slidesPerView: 6,
          },
        }}
      >
        {categories.map((category) => (
          <SwiperSlide key={category.id}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 1,
                padding: 2,
                cursor: "pointer",
                transition: "all 0.3s",
                "&:hover": {
                  transform: "translateY(-4px)",
                },
              }}
            >
              <Box
                sx={{
                  width: "180px",
                  height: "180px",
                  borderRadius: "12px",
                  backgroundColor: "#F5F6FF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 2,
                }}
              >
                <Image
                  src={`/icons/${category.id}.png`}
                  alt={category.name}
                  width={150}
                  height={88}
                  style={{ objectFit: "contain" }}
                />
              </Box>
              <Typography
                variant="body2"
                sx={{
                  fontSize: "12px",
                  color: "#3E4388",
                  textAlign: "center",
                  fontWeight: 500,
                }}
              >
                {category.name}
              </Typography>
            </Box>
          </SwiperSlide>
        ))}
      </Swiper>
    </Box>
  );
}
