"use client";

import Link from "next/link";
import Image from "next/image";
import { Search, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";

interface DesktopNavProps {
  settings: {
    site_name: string;
    logo_url: string | null;
    primary_color: string;
  } | null;
}

export function DesktopNav({ settings }: DesktopNavProps) {
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const updateCartCount = () => {
      const cart: { id: string; quantity: number }[] = JSON.parse(localStorage.getItem("cart") || "[]");
      setCartCount(cart.reduce((sum: number, item) => sum + item.quantity, 0));
    };

    updateCartCount();
    window.addEventListener("storage", updateCartCount);
    window.addEventListener("cartUpdated", updateCartCount);

    return () => {
      window.removeEventListener("storage", updateCartCount);
      window.removeEventListener("cartUpdated", updateCartCount);
    };
  }, []);

  return (
    <nav className="hidden md:block bg-background/95 backdrop-blur-sm border-b-2 border-[#e10600]">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            {settings?.logo_url ? (
              <Image
                src={settings.logo_url}
                alt={settings.site_name || "GearsNP"}
                width={300}
                height={100}
                className="object-contain"
              />
            ) : (
              <span className="text-xl font-bold text-[#e10600]">
                {settings?.site_name || "GearsNP"}
              </span>
            )}
          </Link>

          {/* Center Menu */}
          <div className="flex items-center gap-8">
            <Link href="/" className="hover:text-[#e10600] transition-colors">
              Home
            </Link>
            <Link href="/shop" className="hover:text-[#e10600] transition-colors">
              Shop
            </Link>
            <Link href="/teams" className="hover:text-[#e10600] transition-colors">
              Teams
            </Link>
            <Link href="/events" className="hover:text-[#e10600] transition-colors">
              Events
            </Link>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <Link href="/search">
              <Search className="h-5 w-5 hover:text-[#e10600] cursor-pointer transition-colors" />
            </Link>
            <Link href="/cart" className="relative">
              <ShoppingCart className="h-5 w-5 hover:text-[#e10600] cursor-pointer transition-colors" />
              {cartCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-[#e10600]">
                  {cartCount}
                </Badge>
              )}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
