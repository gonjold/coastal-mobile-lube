import Link from "next/link";
import { type ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  href?: string;
  variant?: "primary" | "secondary" | "teal";
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit";
}

const variantStyles = {
  primary:
    "bg-orange text-white hover:bg-orange-hover focus:ring-orange/40",
  secondary:
    "border-2 border-navy text-navy hover:bg-navy hover:text-white focus:ring-navy/40",
  teal: "bg-teal text-white hover:opacity-90 focus:ring-teal/40",
};

const sizeStyles = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-base",
  lg: "px-8 py-4 text-lg",
};

export default function Button({
  children,
  href,
  variant = "primary",
  size = "md",
  className = "",
  onClick,
  type = "button",
}: ButtonProps) {
  const classes = `inline-flex items-center justify-center font-semibold rounded-[var(--radius-button)] transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} className={classes}>
      {children}
    </button>
  );
}
