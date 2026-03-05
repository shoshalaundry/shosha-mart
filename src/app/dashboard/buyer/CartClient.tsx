"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Plus, Minus, Trash2, ImageIcon } from "lucide-react";
import { submitOrder } from "@/app/actions/orders";
import Image from "next/image";

type Product = {
    id: string;
    name: string;
    sku: string;
    basePrice: number;
    tierPrice?: number | null;
    imageUrl?: string | null;
};

type CartItem = Product & { quantity: number };

export default function CartClient({
    initialProducts,
    buyerId,
    tierId,
}: {
    initialProducts: Product[];
    buyerId: string;
    tierId: string;
}) {
    const [cart, setCart] = useState<Record<string, CartItem>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const addToCart = (product: Product) => {
        setCart((prev) => {
            const current = prev[product.id];
            return {
                ...prev,
                [product.id]: {
                    ...product,
                    quantity: current ? current.quantity + 1 : 1,
                },
            };
        });
        setMessage(null);
    };

    const removeFromCart = (productId: string) => {
        setCart((prev) => {
            const next = { ...prev };
            delete next[productId];
            return next;
        });
    };

    const cartItems = Object.values(cart);
    const cartTotal = cartItems.reduce((sum, item) => sum + (item.tierPrice || 0) * item.quantity, 0);

    const handleCheckout = async () => {
        setIsSubmitting(true);
        setMessage(null);

        const itemsToSubmit = cartItems.map(item => ({
            productId: item.id,
            quantity: item.quantity,
            priceAtPurchase: item.tierPrice || 0
        }));

        const result = await submitOrder(buyerId, tierId, itemsToSubmit);

        if (result?.error) {
            setMessage({ type: "error", text: result.error });
        } else {
            setMessage({ type: "success", text: "Pesanan berhasil dibuat!" });
            setCart({});
        }
        setIsSubmitting(false);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {initialProducts.map((p) => { // Renamed product to p for consistency with snippet
                    return (
                        <div key={p.id} className="border rounded-lg p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
                            <div>
                                <div className="border rounded-md aspect-square w-full flex items-center justify-center overflow-hidden bg-neutral-50 mb-3 shrink-0">
                                    {p.imageUrl ? (
                                        <Image
                                            src={p.imageUrl}
                                            alt={p.name}
                                            width={200}
                                            height={200}
                                            className="object-cover w-full h-full"
                                            unoptimized
                                        />
                                    ) : (
                                        <ImageIcon className="h-8 w-8 text-neutral-300" />
                                    )}
                                </div>
                                <h3 className="font-semibold">{p.name}</h3>
                                <p className="text-sm text-neutral-500 mb-2">SKU: {p.sku}</p>

                                {p.tierPrice !== null && p.tierPrice !== undefined ? (
                                    <p className="font-medium text-blue-600 mb-4">Rp {p.tierPrice.toLocaleString()}</p>
                                ) : (
                                    <p className="font-medium text-red-500 mb-4 text-sm">Harga Belum Tersedia</p>
                                )}
                            </div>
                            <Button
                                className="w-full"
                                disabled={p.tierPrice === null}
                                onClick={() => addToCart(p)}
                            >
                                {p.tierPrice !== null ? "Tambah ke Keranjang" : "Hubungi Admin"}
                            </Button>
                        </div>
                    );
                })}
            </div>

            <div className="md:col-span-1">
                <Card className="sticky top-8">
                    <CardHeader>
                        <CardTitle>Keranjang Anda</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {cartItems.length === 0 ? (
                            <p className="text-muted-foreground text-sm">Keranjang kosong.</p>
                        ) : (
                            <div className="space-y-4">
                                {cartItems.map((item) => (
                                    <div key={item.id} className="flex justify-between items-center bg-muted/50 p-2 rounded-md">
                                        <div>
                                            <p className="font-medium text-sm">{item.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {item.quantity} x Rp {item.tierPrice?.toLocaleString()}
                                            </p>
                                        </div>
                                        <Button variant="destructive" size="sm" onClick={() => removeFromCart(item.id)}>Hapus</Button>
                                    </div>
                                ))}
                                <div className="border-t pt-4 mt-4">
                                    <div className="flex justify-between font-bold">
                                        <span>Total:</span>
                                        <span>Rp {cartTotal.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {message && (
                            <div className={`mt-4 p-3 rounded-md text-sm ${message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                }`}>
                                {message.text}
                            </div>
                        )}
                    </CardContent>
                    <CardFooter>
                        <Button
                            className="w-full"
                            disabled={cartItems.length === 0 || isSubmitting}
                            onClick={handleCheckout}
                        >
                            {isSubmitting ? "Memproses..." : "Checkout Sekarang"}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
