"use client";

import { Box, Typography, Button, Stack } from "@mui/material";
import { useTranslations } from "next-intl";
import { ProductCard, ProductCardProps } from "@/components/common";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

// Mock product data
const mockProducts: ProductCardProps[] = [
  {
    id: "1",
    name: "ერთჯერადი პირბადე",
    manufacturer: "ტესტი",
    image:
      "https://media.istockphoto.com/id/1206385911/photo/medical-mask.jpg?s=612x612&w=0&k=20&c=9YTEb6CENsGk5TIhK1S9EXXyXvqDSrPCixD3jOuIKnM=",
    price: 99,
    originalPrice: 199,
    discount: 50,
  },
  {
    id: "2",
    name: "ერთჯერადი პირბადე",
    manufacturer: "ტესტი",
    image:
      "https://media.istockphoto.com/id/1206385911/photo/medical-mask.jpg?s=612x612&w=0&k=20&c=9YTEb6CENsGk5TIhK1S9EXXyXvqDSrPCixD3jOuIKnM=",
    price: 99,
    originalPrice: 199,
    discount: 50,
  },
  {
    id: "3",
    name: "ერთჯერადი პირბადე",
    manufacturer: "ტესტი",
    image:
      "https://media.istockphoto.com/id/1206385911/photo/medical-mask.jpg?s=612x612&w=0&k=20&c=9YTEb6CENsGk5TIhK1S9EXXyXvqDSrPCixD3jOuIKnM=",
    price: 99,
    originalPrice: 199,
    discount: 50,
  },
  {
    id: "4",
    name: "ერთჯერადი პირბადე",
    manufacturer: "ტესტი",
    image:
      "https://media.istockphoto.com/id/1206385911/photo/medical-mask.jpg?s=612x612&w=0&k=20&c=9YTEb6CENsGk5TIhK1S9EXXyXvqDSrPCixD3jOuIKnM=",
    price: 99,
    originalPrice: 199,
    discount: 50,
  },
];

export function Products() {
  const t = useTranslations("productsSection");

  return (
    <Box sx={{ padding: { xs: "16px 16px", md: "28px 120px" } }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ marginBottom: 3 }}
      >
        <Typography
          variant="h4"
          sx={{
            color: "#3E4388",
            textAlign: { xs: "center", md: "left" },
          }}
        >
          {t("title")}
        </Typography>
        <Button
          sx={{
            color: "#5B6ECD",
            textTransform: "none",
            fontWeight: 600,
            display: { xs: "none", md: "block" },
          }}
        >
          {t("viewAll")}
        </Button>
      </Stack>

      {/* Products Swiper */}
      <Swiper
        spaceBetween={24}
        slidesPerView={2}
        pagination={{ clickable: true }}
        breakpoints={{
          640: {
            slidesPerView: 2,
            spaceBetween: 24,
          },
          1024: {
            slidesPerView: 3,
            spaceBetween: 24,
          },
        }}
        style={{ paddingBottom: "40px" }}
      >
        {mockProducts.map((product) => (
          <SwiperSlide key={product.id}>
            <ProductCard {...product} />
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Mobile View All Button */}
      <Box sx={{ display: { xs: "block", md: "none" }, marginTop: 3 }}>
        <Button
          variant="outlined"
          fullWidth
          sx={{
            borderRadius: "100px",
            padding: "12px",
            color: "#5B6ECD",
            borderColor: "#5B6ECD",
            textTransform: "none",
            fontWeight: 600,
          }}
        >
          {t("viewAll")}
        </Button>
      </Box>
    </Box>
  );
}
