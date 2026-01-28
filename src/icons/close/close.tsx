import { IconProps } from "@/types";

export function CloseIcon({ width = 48, height = 48 }: IconProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M36 12L12 36M12 12L36 36"
        stroke="#1E1E1E"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
