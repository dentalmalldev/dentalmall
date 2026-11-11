"use client";

import { Box, Button, Skeleton, Stack, Typography } from "@mui/material";
import { useTranslations, useLocale } from "next-intl";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { useRouter } from "next/navigation";
import { useCategories } from "@/hooks";

export function Categories() {
  const t = useTranslations("categoriesSection");
  const locale = useLocale();
  const router = useRouter();
  const { data: categories = [], isLoading } = useCategories();

  const getCategoryName = (category: { name: string; name_ka: string }) =>
    locale === "ka" ? category.name_ka : category.name;

  return (
    <Box sx={{ py: { xs: 2, md: 3.5 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
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
        <Button onClick={() => router.push(`/${locale}/categories`)}>
          {t("allCategories")}
        </Button>
      </Stack>

      <Swiper
        spaceBetween={12}
        slidesPerView={3}
        breakpoints={{
          600: { slidesPerView: 4, spaceBetween: 16 },
          900: { slidesPerView: 5, spaceBetween: 16 },
          1200: { slidesPerView: 6, spaceBetween: 16 },
        }}
      >
        {/* Placeholders in the same slider and boxes as the real cards, so
            nothing jumps: the tile copies the real one's sizing (its padding
            adds to the width, as there), and the caption reserves three lines
            because the longest category names wrap that far. */}
        {isLoading &&
          [1, 2, 3, 4, 5, 6].map((i) => (
            <SwiperSlide key={`skeleton-${i}`}>
              <Box
                aria-hidden
                sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, padding: 2 }}
              >
                <Box
                  sx={{
                    position: "relative",
                    width: "100%",
                    aspectRatio: "1",
                    maxWidth: "180px",
                    padding: 1.5,
                    margin: "0 auto",
                  }}
                >
                  <Skeleton
                    variant="rounded"
                    sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", borderRadius: "12px" }}
                  />
                </Box>
                <Typography variant="body2" sx={{ fontSize: "12px", fontWeight: 500, width: "80%" }}>
                  <Skeleton />
                  <Skeleton />
                  <Skeleton width="50%" sx={{ mx: "auto" }} />
                </Typography>
              </Box>
            </SwiperSlide>
          ))}
        {!isLoading &&
          categories.map((category) => (
            <SwiperSlide key={category.id}>
              <Box
                onClick={() => router.push(`/${locale}/categories/${category.slug}`)}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 1,
                  padding: 2,
                  cursor: "pointer",
                  transition: "all 0.3s",
                  "&:hover": { transform: "translateY(-4px)" },
                }}
              >
                <Box
                  sx={{
                    width: "100%",
                    aspectRatio: "1",
                    maxWidth: "180px",
                    borderRadius: "12px",
                    backgroundColor: "#F5F6FF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 1.5,
                    margin: "0 auto",
                  }}
                >
                  <Image
                    src={`/icons/${category.slug}.png`}
                    alt={getCategoryName(category)}
                    width={150}
                    height={88}
                    style={{ objectFit: "contain", width: "100%", height: "auto" }}
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
                  {getCategoryName(category)}
                </Typography>
              </Box>
            </SwiperSlide>
          ))}
      </Swiper>
    </Box>
  );
}
