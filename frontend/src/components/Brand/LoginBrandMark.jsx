/* eslint-disable */
import React from 'react';

/**
 * Marca compacta para login: mini market / víveres (canasta + frutas), sin verde dominante.
 */
function LoginBrandMark({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 116"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Eliter Mini Market víveres"
    >
      <defs>
        <linearGradient id="loginMkCard" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.22)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.06)" />
        </linearGradient>
        <linearGradient id="loginMkBasket" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>

      <rect
        x="4"
        y="4"
        width="192"
        height="104"
        rx="16"
        fill="url(#loginMkCard)"
        stroke="rgba(255,255,255,0.28)"
        strokeWidth="1"
      />

      {/* Canasta */}
      <path
        d="M 48 46 L 54 36 L 92 36 L 98 46 Z"
        fill="url(#loginMkBasket)"
        opacity="0.95"
      />
      <path
        d="M 44 46 L 46 72 L 100 72 L 102 46 Z"
        fill="rgba(30,20,40,0.35)"
        stroke="rgba(253,230,138,0.65)"
        strokeWidth="1.2"
      />
      <path d="M 54 36 Q 73 28 92 36" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeLinecap="round" />

      {/* Frutas / víveres */}
      <circle cx="62" cy="34" r="6.5" fill="#ef4444" />
      <circle cx="76" cy="32" r="5.5" fill="#fb923c" />
      <circle cx="88" cy="35" r="5" fill="#fbbf24" />
      <ellipse cx="70" cy="30" rx="3" ry="2" fill="#92400e" opacity="0.9" transform="rotate(-25 70 30)" />

      {/* Bolsa / cereal sugerido */}
      <rect x="108" y="38" width="22" height="28" rx="3" fill="#fca5a5" opacity="0.9" />
      <rect x="112" y="42" width="14" height="6" rx="1" fill="#fecaca" />

      <text
        x="100"
        y="98"
        textAnchor="middle"
        fill="#fff8f0"
        fontFamily='system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
        fontSize="17"
        fontWeight="800"
        letterSpacing="0.18em"
      >
        ELITER
      </text>
      <text
        x="100"
        y="109"
        textAnchor="middle"
        fill="rgba(255,248,240,0.72)"
        fontFamily='system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
        fontSize="7.5"
        fontWeight="600"
        letterSpacing="0.14em"
      >
        MINI MARKET · VÍVERES
      </text>
    </svg>
  );
}

export default LoginBrandMark;
