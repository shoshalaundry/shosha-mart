import React from "react";
import { AlertTriangle, AlertCircle, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type LowStockProduct = {
    id: string;
    name: string;
    sku: string;
    stock: number;
    unit: string;
};

interface StockAlertProps {
    products: LowStockProduct[];
}

export default function StockAlert({ products }: StockAlertProps) {
    if (products.length === 0) return null;

    const outOfStock = products.filter(p => p.stock === 0);
    const lowStock = products.filter(p => p.stock > 0 && p.stock <= 10);

    return (
        <div className="space-y-4">
            {outOfStock.length > 0 && (
                <div className="flex items-start gap-4 p-4 rounded-lg border border-red-200 bg-red-50 text-red-800 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="mt-1 p-2 rounded-full bg-red-100">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-sm">Stok Habis!</h3>
                        <p className="text-xs text-red-600 mb-2">Segera lakukan restock untuk produk-produk berikut:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {outOfStock.map(p => (
                                <div key={p.id} className="flex items-center justify-between text-[11px] bg-white/50 p-2 rounded border border-red-100">
                                    <span className="font-medium truncate mr-2">{p.name}</span>
                                    <Badge variant="destructive" className="h-4 text-[9px] px-1">0 {p.unit}</Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {lowStock.length > 0 && (
                <div className="flex items-start gap-4 p-4 rounded-lg border border-orange-200 bg-orange-50 text-orange-800 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="mt-1 p-2 rounded-full bg-orange-100">
                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-sm">Stok Menipis</h3>
                        <p className="text-xs text-orange-600 mb-2">Persediaan produk-produk ini sudah di bawah 10 unit:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {lowStock.map(p => (
                                <div key={p.id} className="flex items-center justify-between text-[11px] bg-white/50 p-2 rounded border border-orange-100">
                                    <span className="font-medium truncate mr-2">{p.name}</span>
                                    <Badge className="h-4 text-[9px] px-1 bg-orange-500 hover:bg-orange-500">{p.stock} {p.unit}</Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
