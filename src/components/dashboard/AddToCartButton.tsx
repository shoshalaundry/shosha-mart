"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";

export default function AddToCartButton({
    productId,
    productName,
    price
}: {
    productId: string;
    productName: string;
    price: number;
}) {
    const [added, setAdded] = useState(false);

    // Future implementation: save to localStorage or backend cart
    const handleAddToCart = () => {
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
    };

    return (
        <Button
            onClick={handleAddToCart}
            variant={added ? "secondary" : "default"}
            className={`w-full ${added ? 'bg-green-100 text-green-800 hover:bg-green-200' : ''}`}
        >
            <ShoppingCart className="w-4 h-4 mr-2" />
            {added ? "Ditambahkan!" : "Tambah ke Keranjang"}
        </Button>
    );
}
