"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

interface MobileHeaderProps {
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ isCollapsed, setIsCollapsed }) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);


  return (
    <div className="fixed top-0 left-0 right-0 z-70 bg-white/90 backdrop-blur-lg shadow-sm md:hidden">
      <div className="flex items-center justify-between p-3 sm:p-4">
        {/* Logo/Company Name */}
        <Link href="/" className="text-xl font-semibold text-foreground text-black no-underline">
          <div className="flex items-center relative w-24 h-8">
            {/* ARISE text */}
            <span
              className={`absolute left-1 top-1 transition-all duration-300 ease-in-out
                ${isScrolled ? "opacity-0 translate-y-2 pointer-events-none" : "opacity-100 translate-y-0"}
              `}
            >
              <span className="text-xl font-semibold">ARISE</span>
            </span>
            {/* Logo */}
            <div
              className={`absolute left-0 top-0 w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 transition-all duration-300 ease-in-out
                ${isScrolled ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"}
              `}
            >
              <Image 
                src="https://api.arise-ai.org/wp-content/uploads/2025/06/ARISE_logo_original-removebg-preview.png" 
                alt="Arise Logo" 
                width={32}
                height={32}
                className="w-full h-full object-contain"
                priority
              />
            </div>
          </div>
        </Link>
        
        {/* Hamburger/Close Menu */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
          aria-label={isCollapsed ? "Open menu" : "Close menu"}
        >
          {isCollapsed ? (
            <span className="text-foreground">☰</span>
          ) : (
            <span className="text-foreground">✕</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default MobileHeader;
