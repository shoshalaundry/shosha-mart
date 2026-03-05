"use client";

import { useState, useTransition } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { upsertTierPrice } from "@/app/actions/pricing";

type Product = { id: string; name: string; sku: string; basePrice: number };
type Tier = { id: string; name: string };
type TierPrice = { id: string; productId: string; tierId: string; price: number };

export default function PricingList({
    products,
    tiers,
    initialPrices
}: {
    products: Product[];
    tiers: Tier[];
    initialPrices: TierPrice[];
}) {
    const [isPending, startTransition] = useTransition();
    const [editing, setEditing] = useState<{ product: Product; tier: Tier } | null>(null);
    const [price, setPrice] = useState<number>(0);

    const getPrice = (productId: string, tierId: string) => {
        const tp = initialPrices.find(p => p.productId === productId && p.tierId === tierId);
        return tp ? tp.price : null;
    };

    const handleSave = () => {
        if (!editing) return;
        startTransition(async () => {
            const result = await upsertTierPrice({
                productId: editing.product.id,
                tierId: editing.tier.id,
                price: price
            });
            if (result.success) {
                setEditing(null);
            } else {
                alert(result.error);
            }
        });
    };

    const openEdit = (product: Product, tier: Tier) => {
        const currentPrice = getPrice(product.id, tier.id);
        setEditing({ product, tier });
        setPrice(currentPrice ?? product.basePrice);
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
                                const currentPrice = getPrice(product.id, tier.id);
                                return (
                                    <TableCell key={tier.id} className="text-center">
                                        <button
                                            onClick={() => openEdit(product, tier)}
                                            className="hover:underline text-sm font-semibold"
                                        >
                                            {currentPrice ? `Rp ${currentPrice.toLocaleString()}` : "Atur Harga"}
                                        </button>
                                    </TableCell>
                                );
                            })}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Atur Harga {editing?.tier.name} - {editing?.product.name}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="price">Harga Tier</Label>
                            <Input
                                id="price"
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(Number(e.target.value))}
                            />
                            <p className="text-xs text-muted-foreground">
                                Base Price: Rp {editing?.product.basePrice.toLocaleString()}
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSave} disabled={isPending}>Simpan Harga</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
