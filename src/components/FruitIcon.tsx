import React from 'react';
import type { SmoothieFruitId } from '../data/products';

interface FruitIconProps {
  fruitId: SmoothieFruitId;
  className?: string;
}

export function FruitIcon({ fruitId, className = 'h-7 w-7' }: FruitIconProps) {
  switch (fruitId) {
    case 'strawberry':
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <defs>
            <radialGradient id="sb-body" cx="38%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#FF9BB2" />
              <stop offset="55%" stopColor="#E94F74" />
              <stop offset="100%" stopColor="#B8294E" />
            </radialGradient>
          </defs>
          {/* Leafy crown */}
          <path
            d="M32 10 C27 6 20 8 18 14 C22 15 26 15 29 14 C25 17 23 20 26 22 C29 19 31 16 32 15 C33 16 35 19 38 22 C41 20 39 17 35 14 C38 15 42 15 46 14 C44 8 37 6 32 10 Z"
            fill="#5E9C43"
            stroke="#366224"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M32 6 L32 12" stroke="#366224" strokeWidth="2.5" strokeLinecap="round" />
          {/* Berry body */}
          <path
            d="M17 23 C14 33 21 52 32 56 C43 52 50 33 47 23 C45 17 39 15 32 16 C25 15 19 17 17 23 Z"
            fill="url(#sb-body)"
            stroke="#8B1E3B"
            strokeWidth="1.5"
          />
          {/* Highlight */}
          <ellipse cx="25" cy="27" rx="3.2" ry="6" transform="rotate(-18 25 27)" fill="#FFD5DF" opacity="0.55" />
          {/* Seeds */}
          <g fill="#FCE694">
            <ellipse cx="24" cy="34" rx="1.2" ry="1.8" />
            <ellipse cx="32" cy="31" rx="1.2" ry="1.8" />
            <ellipse cx="40" cy="34" rx="1.2" ry="1.8" />
            <ellipse cx="28" cy="42" rx="1.2" ry="1.8" />
            <ellipse cx="36" cy="42" rx="1.2" ry="1.8" />
            <ellipse cx="32" cy="49" rx="1.1" ry="1.7" />
          </g>
        </svg>
      );

    case 'mango':
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <defs>
            <linearGradient id="mg-body" x1="20%" y1="10%" x2="85%" y2="90%">
              <stop offset="0%" stopColor="#FFE885" />
              <stop offset="50%" stopColor="#F6B93B" />
              <stop offset="100%" stopColor="#E57E25" />
            </linearGradient>
          </defs>
          {/* Mango leaf */}
          <path
            d="M36 14 C44 6 52 8 54 14 C48 18 42 18 36 14 Z"
            fill="#66A144"
            stroke="#3A6623"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <path d="M32 8 C34 11 35 13 35 16" stroke="#6E441B" strokeWidth="2.4" strokeLinecap="round" />
          {/* Plush mango body */}
          <path
            d="M33 14 C46 14 52 25 48 39 C44 50 32 57 22 53 C14 50 13 42 17 34 C20 27 21 14 33 14 Z"
            fill="url(#mg-body)"
            stroke="#9C5615"
            strokeWidth="1.5"
          />
          {/* Sunlit blush cheek */}
          <ellipse cx="27" cy="35" rx="5.5" ry="10" transform="rotate(22 27 35)" fill="#FFF4BC" opacity="0.55" />
          <path
            d="M25 45 C31 49 39 46 42 39"
            fill="none"
            stroke="#D96B27"
            strokeWidth="1.8"
            strokeLinecap="round"
            opacity="0.45"
          />
        </svg>
      );

    case 'blueberry':
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <defs>
            <radialGradient id="bb-grad-1" cx="35%" cy="32%" r="68%">
              <stop offset="0%" stopColor="#C3B0EB" />
              <stop offset="55%" stopColor="#7A61B3" />
              <stop offset="100%" stopColor="#463175" />
            </radialGradient>
            <radialGradient id="bb-grad-2" cx="35%" cy="32%" r="68%">
              <stop offset="0%" stopColor="#B69FE6" />
              <stop offset="55%" stopColor="#654B9E" />
              <stop offset="100%" stopColor="#3B2666" />
            </radialGradient>
          </defs>
          {/* Botanical leaf */}
          <path
            d="M30 16 C22 8 14 10 12 16 C18 20 25 20 30 16 Z"
            fill="#69A255"
            stroke="#39612B"
            strokeWidth="1.4"
          />
          {/* Back berry */}
          <circle cx="42" cy="27" r="12" fill="url(#bb-grad-2)" stroke="#332059" strokeWidth="1.4" />
          <path d="M39 17 L41 19 L44 17 L45 20 L38 20 Z" fill="#3B2666" />
          {/* Left berry */}
          <circle cx="22" cy="33" r="13" fill="url(#bb-grad-1)" stroke="#332059" strokeWidth="1.4" />
          <ellipse cx="18" cy="28" rx="3" ry="4.5" transform="rotate(-25 18 28)" fill="#E6DDFB" opacity="0.5" />
          {/* Front main berry */}
          <circle cx="35" cy="42" r="14" fill="url(#bb-grad-1)" stroke="#332059" strokeWidth="1.5" />
          <path d="M31 30 L33.5 32.5 L35 29.5 L37 32.5 L39.5 30 L38.5 34 L32 34 Z" fill="#332059" />
          <ellipse cx="29.5" cy="38" rx="3.2" ry="5" transform="rotate(-22 29.5 38)" fill="#EFE9FD" opacity="0.55" />
        </svg>
      );

    case 'kiwi':
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          {/* Outer fuzzy skin rim */}
          <circle cx="32" cy="32" r="23" fill="#8D6E48" stroke="#5E462A" strokeWidth="1.6" />
          {/* Lush emerald flesh */}
          <circle cx="32" cy="32" r="19.5" fill="#9ED168" />
          <circle cx="32" cy="32" r="16" fill="#B6E184" opacity="0.7" />
          {/* Creamy starburst core */}
          <ellipse cx="32" cy="32" rx="7.2" ry="8" fill="#EEF7D4" />
          {/* Radial dark seeds */}
          <g fill="#2C3A1B">
            <ellipse cx="32" cy="19.5" rx="1.2" ry="2.2" />
            <ellipse cx="32" cy="44.5" rx="1.2" ry="2.2" />
            <ellipse cx="19.5" cy="32" rx="2.2" ry="1.2" />
            <ellipse cx="44.5" cy="32" rx="2.2" ry="1.2" />
            <ellipse cx="23.5" cy="23.5" rx="1.3" ry="2.1" transform="rotate(-45 23.5 23.5)" />
            <ellipse cx="40.5" cy="23.5" rx="1.3" ry="2.1" transform="rotate(45 40.5 23.5)" />
            <ellipse cx="23.5" cy="40.5" rx="1.3" ry="2.1" transform="rotate(45 23.5 40.5)" />
            <ellipse cx="40.5" cy="40.5" rx="1.3" ry="2.1" transform="rotate(-45 40.5 40.5)" />
            <ellipse cx="27" cy="20.5" rx="1.1" ry="1.8" transform="rotate(-20 27 20.5)" />
            <ellipse cx="37" cy="20.5" rx="1.1" ry="1.8" transform="rotate(20 37 20.5)" />
            <ellipse cx="27" cy="43.5" rx="1.1" ry="1.8" transform="rotate(20 27 43.5)" />
            <ellipse cx="37" cy="43.5" rx="1.1" ry="1.8" transform="rotate(-20 37 43.5)" />
          </g>
        </svg>
      );

    case 'fig':
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <defs>
            <linearGradient id="fg-skin" x1="20%" y1="10%" x2="80%" y2="90%">
              <stop offset="0%" stopColor="#9C607B" />
              <stop offset="60%" stopColor="#6D334D" />
              <stop offset="100%" stopColor="#4A1E33" />
            </linearGradient>
          </defs>
          {/* Whole fig silhouette */}
          <path
            d="M32 9 C34 14 38 18 43 24 C49 31 50 43 44 50 C38 56 26 56 20 50 C14 43 15 31 21 24 C26 18 30 14 32 9 Z"
            fill="url(#fg-skin)"
            stroke="#3B1628"
            strokeWidth="1.5"
          />
          {/* Creamy pith */}
          <path
            d="M32 16 C34 20 37 24 41 29 C45 35 45 43 40 48 C35 52 29 52 24 48 C19 43 19 35 23 29 C27 24 30 20 32 16 Z"
            fill="#F6E5D8"
          />
          {/* Ruby honeyed interior */}
          <path
            d="M32 21 C34 24 36 27 38.5 31 C42 36 41.5 42 38 45.5 C34.5 49 29.5 49 26 45.5 C22.5 42 22 36 25.5 31 C28 27 30 24 32 21 Z"
            fill="#D95B6E"
          />
          {/* Center ruby heart + seeds */}
          <ellipse cx="32" cy="39" rx="5.5" ry="6.5" fill="#BE3A52" />
          <g fill="#FAD8A7">
            <circle cx="29" cy="35" r="1.1" />
            <circle cx="35" cy="35" r="1.1" />
            <circle cx="27" cy="40" r="1.1" />
            <circle cx="37" cy="40" r="1.1" />
            <circle cx="32" cy="43" r="1.1" />
            <circle cx="32" cy="32" r="1" />
          </g>
        </svg>
      );

    case 'yuzu':
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          {/* Aromatic citrus leaf */}
          <path
            d="M37 12 C45 6 53 8 54 14 C48 18 42 17 37 12 Z"
            fill="#5EA055"
            stroke="#2E5E2A"
            strokeWidth="1.4"
          />
          {/* Yuzu peel */}
          <circle cx="32" cy="34" r="21" fill="#F2C84B" stroke="#A67A12" strokeWidth="1.6" />
          {/* Inner cream pith */}
          <circle cx="32" cy="34" r="17.8" fill="#FFF8DC" />
          {/* Juicy segments */}
          <g fill="#F8D866">
            <path d="M32 32 L26 19 A14.5 14.5 0 0 1 38 19 Z" />
            <path d="M33.8 33 L41 20.5 A14.5 14.5 0 0 1 46 31 Z" />
            <path d="M33.8 35 L46 37 A14.5 14.5 0 0 1 41 47.5 Z" />
            <path d="M32 36 L38 49 A14.5 14.5 0 0 1 26 49 Z" />
            <path d="M30.2 35 L23 47.5 A14.5 14.5 0 0 1 18 37 Z" />
            <path d="M30.2 33 L18 31 A14.5 14.5 0 0 1 23 20.5 Z" />
          </g>
          {/* Center pith */}
          <circle cx="32" cy="34" r="2.6" fill="#FFFDF4" />
        </svg>
      );
  }
}
