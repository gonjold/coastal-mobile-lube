interface WaveDividerProps {
  color?: string;
  flip?: boolean;
  className?: string;
}

export default function WaveDivider({
  color = "#FFFFFF",
  flip = false,
  className = "",
}: WaveDividerProps) {
  return (
    <div
      className={`w-full leading-[0] ${flip ? "rotate-180" : ""} ${className}`}
      style={{ height: "var(--wave-height)" }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1200 36"
        preserveAspectRatio="none"
        className="block w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0,24 C200,36 400,0 600,18 C800,36 1000,0 1200,12 L1200,36 L0,36 Z"
          fill={color}
        />
      </svg>
    </div>
  );
}
