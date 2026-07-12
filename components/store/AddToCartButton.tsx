"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Check, X, Ruler } from "lucide-react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

const SIZE_CHART = [
  { size: "S",    chest: 38, length: 26 },
  { size: "M",    chest: 40, length: 27 },
  { size: "L",    chest: 42, length: 28 },
  { size: "XL",   chest: 44, length: 29 },
  { size: "XXL",  chest: 46, length: 30 },
  { size: "XXXL", chest: 48, length: 31 },
];

function SizeGuideModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Ruler className="h-4 w-4 text-[#e10600]" />
            <span className="font-bold text-base">Size Guide</span>
            <span className="text-xs text-muted-foreground">(inches)</span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#e10600] text-white">
                <th className="px-4 py-3 text-left font-semibold">Size</th>
                <th className="px-4 py-3 text-center font-semibold">Chest</th>
                <th className="px-4 py-3 text-center font-semibold">Length</th>
              </tr>
            </thead>
            <tbody>
              {SIZE_CHART.map((row, i) => (
                <tr key={row.size} className={i % 2 === 0 ? "bg-background" : "bg-muted/40"}>
                  <td className="px-4 py-3 font-semibold">{row.size}</td>
                  <td className="px-4 py-3 text-center">{row.chest}"</td>
                  <td className="px-4 py-3 text-center">{row.length}"</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground text-center px-5 py-3 border-t border-border">
          Measurements are approximate. If between sizes, size up.
        </p>
      </div>
    </div>
  );
}

interface AddToCartButtonProps {
  product: {
    id: string;
    name: string;
    base_price: number;
    stock_quantity: number;
    has_sizes: boolean;
    free_delivery?: boolean;
    sizes: Array<{
      id: string;
      size: string;
      stock: number;
      price_modifier: number;
    }>;
    image_url: string | null;
  };
  onSizeChange?: (size: string) => void;
}

export function AddToCartButton({ product, onSizeChange }: AddToCartButtonProps) {
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  const handleSizeChange = (size: string) => {
    setSelectedSize(size);
    if (onSizeChange) {
      onSizeChange(size);
    }
  };

  const handleAddToCart = () => {
    // Validate size selection if product has sizes
    if (product.has_sizes && !selectedSize) {
      toast.error("Please select a size");
      return;
    }

    setIsAdding(true);

    // Get current cart
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");

    // Create cart item
    const cartItem = {
      id: product.has_sizes ? `${product.id}-${selectedSize}` : product.id,
      productId: product.id,
      name: product.name,
      price: product.base_price,
      quantity: quantity,
      size: selectedSize || null,
      image_url: product.image_url,
      free_delivery: product.free_delivery ?? false,
    };

    // Check if item already exists
    const existingItemIndex = cart.findIndex((item: { id: string }) => item.id === cartItem.id);

    if (existingItemIndex > -1) {
      // Update quantity
      cart[existingItemIndex].quantity += quantity;
    } else {
      // Add new item
      cart.push(cartItem);
    }

    // Save to localStorage
    localStorage.setItem("cart", JSON.stringify(cart));

    // Trigger custom event to update cart count
    window.dispatchEvent(new Event("cartUpdated"));

    // Show success message - compact at top
    toast.success(`✓ ${product.name} ${selectedSize ? `(${selectedSize})` : ""} added to cart`, {
      position: "top-center",
      duration: 2000,
    });

    setTimeout(() => setIsAdding(false), 1000);
  };

  const isOutOfStock = product.stock_quantity === 0;
  const selectedSizeData = product.sizes.find((s) => s.size === selectedSize);
  const isSizeOutOfStock = product.has_sizes && selectedSizeData && selectedSizeData.stock === 0;

  return (
    <div className="space-y-4">
      {/* Size Selection */}
      {product.has_sizes && product.sizes.length > 0 && (
        <div className="space-y-2">
          <Label className="text-base">Select Size</Label>
          <RadioGroup value={selectedSize} onValueChange={handleSizeChange}>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((size) => (
                <div key={size.id} className="relative">
                  <RadioGroupItem
                    value={size.size}
                    id={size.id}
                    disabled={size.stock === 0}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={size.id}
                    className={`flex items-center justify-center rounded-md border-2 border-muted px-6 py-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-[#e10600] peer-data-[state=checked]:bg-[#e10600]/10 [&:has([data-state=checked])]:border-[#e10600] cursor-pointer transition-colors ${
                      size.stock === 0 ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {size.size}
                  </Label>
                  {size.stock === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-md">
                      <span className="text-xs font-medium">Out</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </RadioGroup>
          <button
            onClick={() => setShowSizeGuide(true)}
            className="text-xs text-[#e10600] underline underline-offset-2 hover:text-[#c00500] flex items-center gap-1 mt-1"
          >
            <Ruler className="h-3 w-3" /> Size Guide
          </button>
        </div>
      )}

      {showSizeGuide && <SizeGuideModal onClose={() => setShowSizeGuide(false)} />}

      {/* Quantity */}
      <div className="flex items-center gap-4">
        <Label className="text-base">Quantity</Label>
        <div className="flex items-center border rounded-md">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={quantity === 1}
          >
            -
          </Button>
          <span className="px-4 font-medium">{quantity}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setQuantity(quantity + 1)}
            disabled={quantity >= product.stock_quantity}
          >
            +
          </Button>
        </div>
      </div>

      {/* Add to Cart Button */}
      <Button
        size="lg"
        className="w-full bg-[#e10600] hover:bg-[#c00500]"
        onClick={handleAddToCart}
        disabled={isOutOfStock || isSizeOutOfStock || isAdding}
      >
        {isAdding ? (
          <>
            <Check className="mr-2 h-5 w-5" />
            Added!
          </>
        ) : (
          <>
            <ShoppingCart className="mr-2 h-5 w-5" />
            {isOutOfStock || isSizeOutOfStock ? "Out of Stock" : "Add to Cart"}
          </>
        )}
      </Button>
    </div>
  );
}
