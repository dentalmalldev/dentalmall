import { IconProps } from "@/types/icon-props";

export function ChevronDownIcon({ width = 24, height = 24, color = "#2C2957" }: IconProps = {}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7.41 8.59L12 13.17L16.59 8.59L18 10L12 16L6 10L7.41 8.59Z"
        fill={color}
      />
    </svg>
  );
}
