'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type Service = {
  label: string;
  href: string;
};

const SERVICES: Service[] = [
  { label: 'Automotive', href: '/services' },
  { label: 'Marine', href: '/marine' },
  { label: 'RV', href: '/rv' },
  { label: 'Fleet', href: '/fleet' },
];

export const NavServicesDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();

  const isActive =
    pathname === '/services-overview' ||
    SERVICES.some((s) => pathname === s.href);

  const handleOpen = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setIsOpen(true);
  };

  const handleClose = () => {
    closeTimerRef.current = setTimeout(() => setIsOpen(false), 200);
  };

  return (
    <div
      className="relative"
      onMouseEnter={handleOpen}
      onMouseLeave={handleClose}
      onFocus={handleOpen}
      onBlur={handleClose}
    >
      <Link
        href="/services-overview"
        className={`flex items-center gap-1 text-white hover:text-orange-400 transition-colors ${
          isActive ? 'text-orange-400' : ''
        }`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        Services
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        >
          <path d="M3 5 L6 8 L9 5" />
        </svg>
      </Link>

      {isOpen && (
        <div
          className="absolute top-full left-0 pt-3 z-50"
          role="menu"
        >
          <div className="bg-white rounded-xl shadow-xl border border-slate-100 py-2 min-w-[180px]">
            {SERVICES.map((service) => (
              <Link
                key={service.href}
                href={service.href}
                className={`block px-4 py-2.5 text-sm font-medium transition-colors ${
                  pathname === service.href
                    ? 'text-orange-600 bg-orange-50'
                    : 'text-slate-700 hover:text-orange-600 hover:bg-orange-50'
                }`}
                role="menuitem"
                onClick={() => setIsOpen(false)}
              >
                {service.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
