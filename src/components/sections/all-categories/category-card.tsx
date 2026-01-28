"use client";

import { Box, Typography } from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";

interface CategoryCardProps {
  id: string;
  name: string;
  parentCategoryId?: string;
}

export function CategoryCard({ id, name, parentCategoryId }: CategoryCardProps) {
  const locale = useLocale();

  const href = parentCategoryId
    ? `/${locale}/categories/${parentCategoryId}/${id}`
    : `/${locale}/categories/${id}`;

  return (
    <Link
      href={href}
      style={{ textDecoration: "none" }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 1.5,
          padding: 2,
          cursor: "pointer",
          transition: "all 0.2s ease",
          "&:hover": {
            transform: "translateY(-4px)",
          },
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
            padding: 2,
          }}
        >
          <Image
            src={`/icons/${id}.png`}
            alt={name}
            width={120}
            height={70}
            style={{ objectFit: "contain" }}
          />
        </Box>
        <Typography
          sx={{
            fontSize: "14px",
            color: "#3E4388",
            textAlign: "center",
            fontWeight: 500,
            lineHeight: 1.3,
          }}
        >
          {name}
        </Typography>
      </Box>
    </Link>
  );
}
