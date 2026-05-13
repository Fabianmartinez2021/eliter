/* eslint-disable */
import React from 'react';

/**
 * Marca ELITER: texto en arco + trazo inferior (identidad Eliter).
 */
function EliterLogo({ className = '', title = 'Eliter' }) {
  return (
    <svg
      className={`eliter-logo ${className}`.trim()}
      viewBox="0 0 300 100"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <defs>
        <path id="eliter-logo-arc" d="M 28 66 Q 150 24 272 66" fill="none" />
      </defs>
      <text
        fill="#328a6c"
        fontFamily='system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
        fontWeight="800"
        fontSize="36"
        letterSpacing="0.2em"
      >
        <textPath xlinkHref="#eliter-logo-arc" startOffset="50%" textAnchor="middle">
          ELITER
        </textPath>
      </text>
      <path
        d="M 30 80 Q 150 96 270 80"
        stroke="#2d2d2d"
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default EliterLogo;
