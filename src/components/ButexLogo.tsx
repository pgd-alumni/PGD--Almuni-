import React, { useState } from 'react';
import butexLogoImg from '../assets/butex-logo.png';

interface ButexLogoProps {
  className?: string;
  sizeClassName?: string;
  showBorder?: boolean;
  alt?: string;
}

export const ButexLogo: React.FC<ButexLogoProps> = ({
  className = '',
  sizeClassName = 'w-10 h-10',
  showBorder = true,
  alt = 'BUTEX PGD Alumni Logo'
}) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className={`relative rounded-full bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-md ${
        showBorder ? 'border-2 border-[#FFBF00]' : ''
      } ${sizeClassName} ${className}`}
    >
      {!imgError ? (
        <img
          src={butexLogoImg}
          alt={alt}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover rounded-full"
        />
      ) : (
        /* Vector SVG Fallback with BUTEX Crest */
        <div className="w-full h-full bg-gradient-to-br from-[#002147] to-[#001329] flex flex-col items-center justify-center text-white relative p-1">
          <svg viewBox="0 0 100 100" className="w-full h-full fill-current text-[#FFBF00]">
            <circle cx="50" cy="50" r="46" fill="none" stroke="#FFBF00" strokeWidth="3" />
            <circle cx="50" cy="50" r="41" fill="#002147" />
            {/* Textile Loom Shuttle / Gear */}
            <path
              d="M50 16 L54 36 L64 36 L56 42 L59 62 L50 48 L41 62 L44 42 L36 36 L46 36 Z"
              fill="#FFBF00"
            />
            {/* Laurel Wreath */}
            <path
              d="M26 68 C 22 55, 24 38, 33 28 M74 68 C 78 55, 76 38, 67 28"
              fill="none"
              stroke="#FFBF00"
              strokeWidth="2"
              strokeDasharray="2,2"
            />
            {/* Text BUTEX */}
            <text
              x="50"
              y="74"
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize="10"
              fontWeight="900"
              fontFamily="sans-serif"
              letterSpacing="1"
            >
              BUTEX
            </text>
            <text
              x="50"
              y="85"
              textAnchor="middle"
              fill="#FFBF00"
              fontSize="7"
              fontWeight="bold"
              fontFamily="sans-serif"
            >
              PGD ALUMNI
            </text>
          </svg>
        </div>
      )}
    </div>
  );
};
