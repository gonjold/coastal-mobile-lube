import React from 'react';

type IconProps = {
  className?: string;
};

// Icon 1: Book Online — calendar with a checkmark
export const BookOnlineIcon: React.FC<IconProps> = ({ className }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <rect x="10" y="14" width="44" height="40" rx="4" />
    <path d="M10 24 H54" />
    <path d="M20 10 V18" />
    <path d="M44 10 V18" />
    <path d="M22 38 L28 44 L42 30" />
  </svg>
);

// Icon 2: We Come to You — service van with location pin above
export const VanArrivalIcon: React.FC<IconProps> = ({ className }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {/* Location pin above van */}
    <path d="M32 6 C28 6 25 9 25 13 C25 18 32 24 32 24 C32 24 39 18 39 13 C39 9 36 6 32 6 Z" />
    <circle cx="32" cy="13" r="2" />
    {/* Van body */}
    <path d="M6 44 V34 C6 32 7 31 9 31 H38 L46 37 H55 C56 37 57 38 57 39 V44" />
    {/* Van wheels */}
    <circle cx="18" cy="46" r="4" />
    <circle cx="48" cy="46" r="4" />
    {/* Connect van wheels with ground line */}
    <path d="M6 46 H14" />
    <path d="M22 46 H44" />
    <path d="M52 46 H57" />
    {/* Van window */}
    <path d="M38 31 V37 H46" />
  </svg>
);

// Icon 3: Drive Away Happy — steering wheel with checkmark
export const DriveAwayIcon: React.FC<IconProps> = ({ className }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {/* Outer circle (steering wheel) */}
    <circle cx="32" cy="32" r="22" />
    {/* Inner hub */}
    <circle cx="32" cy="32" r="6" />
    {/* Spokes */}
    <path d="M32 10 V26" />
    <path d="M13 44 L27 35" />
    <path d="M51 44 L37 35" />
    {/* Checkmark on hub */}
    <path d="M29 32 L31 34 L35 30" />
  </svg>
);
