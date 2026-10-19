import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Invoice PDFs read the Georgian font from disk at runtime (fs.readFileSync),
  // which file tracing can't see. Without this the font is missing from the
  // serverless bundle and invoice generation falls back to a Latin-only font.
  outputFileTracingIncludes: {
    "/api/**/*": ["./public/fonts/NotoSansGeorgian-*.ttf"],
  },
  images: {
    // Vercel's Hobby plan caps image-optimization requests per month; past the
    // cap every /_next/image request fails with 402 and pictures vanish from
    // the live site. Uploads are already scaled server-side (MAX_IMAGE_DIMENSION
    // in lib/images/processImage.ts), so serving them straight from Firebase
    // Storage costs little. Remove this line if the project moves to Pro.
    unoptimized: true,
    // 90 for product imagery — the default 75 visibly softens fine detail
    // (instrument tips, packaging text) once a photo is scaled into a card.
    qualities: [75, 90],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "media.istockphoto.com",
      },
      {
        protocol: "https",
        hostname: "encrypted-tbn0.gstatic.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
