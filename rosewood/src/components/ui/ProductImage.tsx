"use client";

import Image from "next/image";
import { useState } from "react";

interface ProductImageProps {
  src: string | null | undefined;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  priority?: boolean;
  sizes?: string;
}

/**
 * ProductImage component with automatic fallback handling
 * 
 * Handles:
 * - Null/undefined images
 * - Failed external URLs (like placehold.co)
 * - Provides a clean fallback UI with product initial
 */
export default function ProductImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className = "",
  priority = false,
  sizes,
}: ProductImageProps) {
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // If no src or error occurred, show fallback
  const shouldShowFallback = !src || error || src.includes("placehold.co");

  // Get first letter of alt text for fallback
  const fallbackLetter = alt ? alt.charAt(0).toUpperCase() : "P";

  if (shouldShowFallback) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-[#f5f0e8] to-[#e8dcc8] ${className}`}
        style={!fill ? { width, height } : undefined}
      >
        <span className="text-[#b8952e] font-semibold text-2xl">
          {fallbackLetter}
        </span>
      </div>
    );
  }

  return (
    <>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        fill={fill}
        className={`${className} ${isLoading ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}
        onError={() => {
          setError(true);
          setIsLoading(false);
        }}
        onLoad={() => setIsLoading(false)}
        priority={priority}
        sizes={sizes}
        unoptimized={src.startsWith("http") && !src.includes("localhost")}
      />
      {isLoading && (
        <div
          className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#f5f0e8] to-[#e8dcc8] ${className}`}
        >
          <span className="text-[#b8952e] font-semibold text-2xl animate-pulse">
            {fallbackLetter}
          </span>
        </div>
      )}
    </>
  );
}
