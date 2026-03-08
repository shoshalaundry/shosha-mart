"use client";

import { useState, useTransition } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { upsertTierPrice } from "@/app/actions/pricing";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

type Product = { id: string; name: string; sku: string; basePrice: number };
type Tier = { id: string; name: string };
type TierPrice = { id: string; productId: string; tierId: string; price: number | null; isActive: boolean };

import { Pagination } from "@/components/ui/Pagination";

export default function PricingList({
    products,
    tiers,
    initialPrices,
    totalCount,
    currentPage
}: {
    products: Product[];
    tiers: Tier[];
    initialPrices: TierPrice[];
    totalCount: number;
    currentPage: number;
}) {
    const totalPages = Math.ceil(totalCount / 10);

    const [isPending, startTransition] = useTransition();
    const [editing, setEditing] = useState<{ product: Product; tier: Tier } | null>(null);
    const [price, setPrice] = useState<string>("");

    const getTierData = (productId: string, tierId: string) => {
        const tp = initialPrices.find(p => p.productId === productId && p.tierId === tierId);
        return tp ? { price: tp.price, isActive: tp.isActive } : { price: null, isActive: true };
    };

    const handleSave = () => {
        if (!editing) return;
        startTransition(async () => {
            const result = await upsertTierPrice({
                productId: editing.product.id,
                tierId: editing.tier.id,
                price: price === "" ? undefined : Number(price)
            });
            if (result.success) {
                toast.success(result.message);
                setEditing(null);
            } else {
                toast.error(result.error);
            }
        });
    };

    const toggleActive = (product: Product, tier: Tier, currentActive: boolean) => {
        startTransition(async () => {
            const result = await upsertTierPrice({
                productId: product.id,
                tierId: tier.id,
                isActive: !currentActive
            });
            if (result.success) {
                toast.success(`Produk ${!currentActive ? 'diaktifkan' : 'dinonaktifkan'}`);
            } else {
                toast.error(result.error);
            }
        });
    };

    const openEdit = (product: Product, tier: Tier) => {
        const data = getTierData(product.id, tier.id);
        setEditing({ product, tier });
        setPrice(data.price === null ? "" : data.price.toString());
    };

    return (
        <div className="rounded-md border bg-card overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Produk (Base Price)</TableHead>
                        {tiers.map(tier => (
                            <TableHead key={tier.id} className="text-center">{tier.name}</TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {products.map(product => (
                        <TableRow key={product.id}>
                            <TableCell className="font-medium whitespace-nowrap">
                                <div>{product.name}</div>
                                <div className="text-xs text-muted-foreground">Base: Rp {product.basePrice.toLocaleString()}</div>
                            </TableCell>
                            {tiers.map(tier => {
                                const data = getTierData(product.id, tier.id);
                                return (
                                    <TableCell key={tier.id}>
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="flex items-center gap-2">
                                                <Switch
                                                    checked={data.isActive}
                                                    onCheckedChange={() => toggleActive(product, tier, data.isActive)}
                                                    disabled={isPending}
                                                />
                                                <span className="text-[10px] font-medium uppercase">
                                                    {data.isActive ? "Aktif" : "Non-aktif"}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => openEdit(product, tier)}
                                                className={`hover:underline text-sm font-semibold ${!data.isActive ? 'opacity-50' : ''}`}
                                            >
                                                {data.price
                                                    ? `Rp ${data.price.toLocaleString()}`
                                                    : <span className="text-muted-foreground italic text-xs">Base: Rp {product.basePrice.toLocaleString()}</span>
                                                }
                                            </button>
                                        </div>
                                    </TableCell>
                                );
                            })}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <div className="p-4 border-t">
                <Pagination totalPages={totalPages} currentPage={currentPage} />
            </div>


            <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Atur Harga {editing?.tier.name} - {editing?.product.name}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="price">Harga Tier (Kosongkan untuk pakai Base Price)</Label>
                            <Input
                                id="price"
                                type="number"
                                placeholder={`Base: ${editing?.product.basePrice}`}
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Produk: {editing?.product.name} (SKU: {editing?.product.sku})
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSave} disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Simpan Harga
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
