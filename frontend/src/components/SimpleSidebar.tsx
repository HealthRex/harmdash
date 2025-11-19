"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Image from "next/image";

interface NavItem {
  title: string;
  path: string;
  isSection: boolean;
}

const navItems: NavItem[] = [
  { title: "SAGE", path: "https://sageconsult.ai/", isSection: false },
  { title: "Benchmarks", path: "/", isSection: false },
  { title: "Blog", path: "https://www.arise-ai.org/blog", isSection: false },
  { title: "Research", path: "https://www.arise-ai.org/research", isSection: false },
  { title: "News", path: "https://www.arise-ai.org/news", isSection: false },
  { title: "People", path: "https://www.arise-ai.org/team", isSection: false },
  { title: "Events", path: "https://www.arise-ai.org/events", isSection: false },
  { title: "About", path: "https://www.arise-ai.org/about", isSection: false },
];

interface SimpleSidebarProps {
  isCollapsed?: boolean;
  setIsCollapsed?: React.Dispatch<React.SetStateAction<boolean>>;
}

const SimpleSidebar: React.FC<SimpleSidebarProps> = ({
  isCollapsed: externalIsCollapsed,
  setIsCollapsed: externalSetIsCollapsed,
}) => {
  const [internalIsCollapsed, setInternalIsCollapsed] = useState(true); // ✅ default closed
  const [isLoaded, setIsLoaded] = useState(false); // ✅ ensures we wait for sessionStorage
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const isMobile = useIsMobile();

  // ✅ Load collapse state from sessionStorage before rendering
  useEffect(() => {
    const stored = sessionStorage.getItem("sidebarCollapsed");
    if (stored !== null) {
      setInternalIsCollapsed(stored === "true");
    }
    setIsLoaded(true); // only render after we know the state
  }, []);

  // ✅ Persist collapse state in sessionStorage
  useEffect(() => {
    if (isLoaded) {
      sessionStorage.setItem("sidebarCollapsed", String(internalIsCollapsed));
    }
  }, [internalIsCollapsed, isLoaded]);

  const isCollapsed =
    externalIsCollapsed !== undefined
      ? externalIsCollapsed
      : internalIsCollapsed;

  const setIsCollapsed = externalSetIsCollapsed || setInternalIsCollapsed;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = () => {
    if (isMobile) setIsCollapsed(true);
  };

  const handleOverlayClick = () => {
    if (isMobile && !isCollapsed) setIsCollapsed(true);
  };

  const NavItemWrapper = ({
    item,
    children,
  }: {
    item: NavItem;
    children: React.ReactNode;
  }) => {
    if (isCollapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{children}</TooltipTrigger>
          <TooltipContent side="right" className="ml-2">
            <p>{item.title}</p>
          </TooltipContent>
        </Tooltip>
      );
    }
    return <>{children}</>;
  };

  // ✅ Don't render until sessionStorage state is loaded
  if (!isLoaded) return null;

  return (
    <TooltipProvider>
      <div className="relative">
        {isMobile && !isCollapsed && (
          <div
            className="fixed inset-0 z-50 bg-white"
            onClick={handleOverlayClick}
          />
        )}

        <div
          className={cn(
            "fixed z-60 transform transition-all duration-300 ease-in-out bg-white text-gray-900",
            isMobile
              ? cn(
                  "top-0 left-0 right-0 z-60",
                  isCollapsed ? "-translate-y-full" : "translate-y-0"
                )
              : cn("top-0 left-0 h-full", isCollapsed ? "w-16" : "w-48")
          )}
        >
          <div className="h-full flex flex-col">
            <div className="flex-1">
              {/* Header area */}
              <div className="p-4 border-gray-100">
                {!isCollapsed ? (
                  <div className="flex items-center justify-between h-10">
                    <Link
                      href="/"
                      className="flex items-center gap-2 relative w-24 h-8"
                    >
                      <span
                        className={cn(
                          "absolute left-1 top-0 transition-all duration-300 ease-in-out",
                          isScrolled
                            ? "opacity-0 translate-y-2 pointer-events-none"
                            : "opacity-100 translate-y-0"
                        )}
                      >
                        <span className="text-xl font-semibold text-gray-900 whitespace-nowrap">
                          ARISE
                        </span>
                      </span>
                      <div
                        className={cn(
                          "absolute left-0 top-0 w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 transition-all duration-300 ease-in-out",
                          isScrolled
                            ? "opacity-100 translate-y-0"
                            : "opacity-0 -translate-y-2 pointer-events-none"
                        )}
                      >
                        <Image
                          src="https://api.arise-ai.org/wp-content/uploads/2025/06/ARISE_logo_original-removebg-preview.png"
                          alt="Arise Logo"
                          width={32}
                          height={32}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </Link>
                    <button
                      onClick={() => setIsCollapsed(!isCollapsed)}
                      className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 flex-shrink-0"
                      aria-label="Collapse sidebar"
                    >
                      <svg
                        width="20"
                        height="20"
                        fill="none"
                        viewBox="0 0 20 20"
                      >
                        <path
                          d="M12 6l-4 4 4 4"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/"
                    className="flex flex-col items-center h-10 justify-center gap-1"
                  >
                    <div className="w-8 h-8 rounded-lg overflow-hidden">
                      <Image
                        src="https://api.arise-ai.org/wp-content/uploads/2025/06/ARISE_logo_original-removebg-preview.png"
                        alt="Arise Logo"
                        width={32}
                        height={32}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </Link>
                )}
              </div>

              {isCollapsed && (
                <div className="px-4 pb-2 pt-2">
                  <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="w-full p-1.5 rounded-md hover:bg-gray-100 text-gray-500 flex justify-center"
                    aria-label="Expand sidebar"
                  >
                    <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
                      <path
                        d="M8 6l4 4-4 4"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              )}

              {/* Nav Items */}
              <nav
                className={cn(
                  "px-3 py-2 w-full",
                  isMobile ? "pb-4" : "h-[85%] flex flex-col justify-center"
                )}
              >
                <ul
                  className={cn(
                    isMobile
                      ? "grid grid-cols-1 gap-0 justify-start w-full"
                      : "space-y-1"
                  )}
                >
                  {navItems.map((item) => (
                    <li
                      key={item.title}
                      className={cn(
                        isMobile ? "border-b border-[#e5e5e5] w-full" : ""
                      )}
                    >
                      <NavItemWrapper item={item}>
                        <a
                          href={item.path}
                          onClick={
                            isCollapsed && !isMobile
                              ? (e) => e.preventDefault()
                              : handleNavClick
                          }
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium",
                            "text-gray-700",
                            !isCollapsed
                              ? "hover:text-gray-900 transition-colors rounded-sm hover:bg-gray-100"
                              : "pointer-events-none",
                            pathname === item.path &&
                              !isCollapsed &&
                              "bg-gray-100 text-gray-900",
                            isCollapsed && !isMobile && "justify-center",
                            isMobile && "justify-start text-left w-full min-w-0",
                            isMobile && "text-xl py-4"
                          )}
                        >
                          {(!isCollapsed || isMobile) && (
                            <span>{item.title}</span>
                          )}
                        </a>
                      </NavItemWrapper>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default SimpleSidebar;
