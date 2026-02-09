"use client";

import { Box, Typography } from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";

interface CategoryCardProps {
  slug: string;
  name: string;
  image?: string | null;
  parentCategorySlug?: string;
}

export function CategoryCard({
  slug,
  name,
  image,
  parentCategorySlug,
}: CategoryCardProps) {
  const locale = useLocale();

  const href = parentCategorySlug
    ? `/${locale}/categories/${parentCategorySlug}/${slug}`
    : `/${locale}/categories/${slug}`;

  const imageSrc = `/icons/${slug}.png`;

  return (
    <Link href={href} style={{ textDecoration: "none" }}>
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
            position: "relative",
            overflow: "hidden",
          }}
        >
          {image ? (
            <Image
              src={imageSrc}
              alt={name}
              fill
              style={{ objectFit: "contain", padding: "16px" }}
            />
          ) : (
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
          )}
        </Box>
        {image ? (
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
        ) : null}
      </Box>
    </Link>
  );
}
