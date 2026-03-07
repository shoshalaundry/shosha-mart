"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useCartStore } from "@/store/cartStore";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Minus, Trash2, ImageIcon, ArrowLeft, ShoppingBag, Calendar as CalendarIcon } from "lucide-react";
import { submitOrder } from "@/app/actions/orders";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { cn } from "@/lib/utils";

import { toast } from "sonner";

export default function CartPageClient({
    buyerId,
    tierId,
}: {
    buyerId: string;
    tierId: string;
}) {
    const [mounted, setMounted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [manualDate, setManualDate] = useState<Date | undefined>(new Date());
    const router = useRouter();

    const { cart, removeFromCart, updateQuantity, clearCart, getTotalPrice, getTotalItems } = useCartStore();

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="animate-pulse space-y-4">
            <div className="h-24 bg-neutral-200 rounded-xl w-full"></div>
            <div className="h-24 bg-neutral-200 rounded-xl w-full"></div>
        </div>;
    }

    const cartItems = Object.values(cart);
    const totalItems = getTotalItems();
    const totalPrice = getTotalPrice();

    const handleCheckout = async () => {
        setIsSubmitting(true);

        // Validasi stok ulang (client-side prevention)
        const hasExceededStock = cartItems.some(item => item.quantity > item.stock);
        if (hasExceededStock) {
            toast.error("Gagal checkout: Beberapa barang di keranjang melebihi stok yang tersedia. Mohon sesuaikan kuantitas.");
            setIsSubmitting(false);
            return;
        }

        const itemsToSubmit = cartItems.map(item => ({
            productId: item.id,
            quantity: item.quantity,
            priceAtPurchase: item.tierPrice || 0
        }));

        try {
            const result = await submitOrder(
                buyerId,
                tierId,
                itemsToSubmit,
                manualDate ? manualDate.getTime() : undefined
            );

            if (result?.success) {
                toast.success(result.message);
                clearCart();
                router.push("/dashboard/buyer/orders");
            } else {
                toast.error(result?.error || "Terjadi kesalahan saat checkout.");
            }
        } catch (error) {
            toast.error("Terjadi kesalahan sistem saat checkout.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (cartItems.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-neutral-100 p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
                <div className="bg-neutral-50 w-24 h-24 rounded-full flex items-center justify-center mb-6">
                    <ShoppingBag className="w-10 h-10 text-neutral-300" />
                </div>
                <h2 className="text-2xl font-bold text-neutral-800 mb-2">Keranjang Kosong</h2>
                <p className="text-neutral-500 mb-8 max-w-md">Anda belum memiliki item di keranjang belanja. Silakan pilih produk dari katalog kami.</p>
                <Link href="/dashboard/buyer">
                    <Button size="lg" className="px-8">
                        Mulai Belanja
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 space-y-6">
                <Link href="/dashboard/buyer" className="inline-flex items-center text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Lanjut Belanja
                </Link>

                <div className="space-y-4">
                    {cartItems.map((item) => (
                        <div key={item.id} className="bg-white border rounded-xl p-4 flex gap-4 items-center shadow-sm">
                            <div className="border border-neutral-100 rounded-lg aspect-square w-24 h-24 flex items-center justify-center overflow-hidden bg-neutral-50 shrink-0">
                                {item.imageUrl ? (
                                    <Image
                                        src={item.imageUrl}
                                        alt={item.name}
                                        width={100}
                                        height={100}
                                        className="object-cover w-full h-full"
                                        unoptimized
                                    />
                                ) : (
                                    <ImageIcon className="h-8 w-8 text-neutral-200" />
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-neutral-900 truncate" title={item.name}>{item.name}</h3>
                                <div className="flex items-center gap-2 mt-0.5 mb-2">
                                    <span className="text-[10px] text-neutral-400 font-mono uppercase tracking-tighter">SKU: {item.sku}</span>
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-[4px] text-[10px] font-bold bg-neutral-100 text-neutral-500 uppercase">
                                        {item.unit || "Pcs"}
                                    </span>
                                </div>
                                <p className="font-bold text-blue-600">Rp {item.tierPrice?.toLocaleString()}</p>
                            </div>

                            <div className="flex flex-col items-end gap-3 shrink-0">
                                <div className="flex items-center border rounded-lg overflow-hidden bg-white shadow-sm">
                                    <button
                                        className="px-3 py-2 hover:bg-neutral-100 text-neutral-600 transition-colors disabled:opacity-50"
                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                        disabled={item.quantity <= 1}
                                    >
                                        <Minus className="w-4 h-4" />
                                    </button>
                                    <span className="w-10 text-center text-sm font-medium">{item.quantity}</span>
                                    <button
                                        className="px-3 py-2 hover:bg-neutral-100 text-neutral-600 transition-colors disabled:opacity-50"
                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                        disabled={item.quantity >= item.stock}
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`text-xs ${item.quantity >= item.stock ? "text-red-500" : "text-neutral-500"}`}>
                                        Max stok: {item.stock}
                                    </span>
                                    <button
                                        onClick={() => removeFromCart(item.id)}
                                        className="text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-colors"
                                        title="Hapus"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="w-full lg:w-96 shrink-0">
                <Card className="sticky top-8 border-none shadow-md overflow-hidden">
                    <div className="bg-neutral-900 p-6 text-white">
                        <CardTitle className="text-xl">Ringkasan Belanja</CardTitle>
                    </div>
                    <CardContent className="p-6 bg-white">
                        <div className="space-y-4 mb-6">
                            <div className="flex justify-between text-neutral-600">
                                <span>Total Item ({totalItems})</span>
                                <span>Rp {totalPrice.toLocaleString()}</span>
                            </div>
                            <div className="border-t border-dashed border-neutral-200 pt-4 mt-4">
                                <div className="flex justify-between text-lg font-bold text-neutral-900">
                                    <span>Total Harga</span>
                                    <span className="text-blue-600">Rp {totalPrice.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 mb-6">
                            <label className="text-sm font-medium text-neutral-700">Tanggal Transaksi (Dev Only)</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-900",
                                            !manualDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4 text-amber-600" />
                                        {manualDate ? format(manualDate, "PPP", { locale: idLocale }) : <span>Pilih Tanggal</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={manualDate}
                                        onSelect={setManualDate}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <Button
                            size="lg"
                            className="w-full text-base font-medium h-12"
                            onClick={handleCheckout}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Memproses..." : "Checkout Sekarang"}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
