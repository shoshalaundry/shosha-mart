"use client";

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Package } from "lucide-react";
import Image from "next/image";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export type OrderItemDetail = {
    id: string;
    name: string;
    sku: string;
    imageUrl: string | null;
    quantity: number;
    price: number;
    unit?: string;
};

export default function OrderDetail({ items }: { items: OrderItemDetail[] }) {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return (
        <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="items" className="border-none">
                <AccordionTrigger className="hover:no-underline py-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-neutral-600">
                        <Package className="h-4 w-4" />
                        <span>Detail Item ({totalItems} barang)</span>
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                    <div className="rounded-lg border border-neutral-100 overflow-hidden bg-white">
                        <Table>
                            <TableHeader className="bg-neutral-50/50">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="px-3 py-2 text-xs font-semibold uppercase tracking-wider h-auto">Produk</TableHead>
                                    <TableHead className="px-3 py-2 text-xs font-semibold uppercase tracking-wider h-auto">Banyak</TableHead>
                                    <TableHead className="px-3 py-2 text-xs font-semibold uppercase tracking-wider h-auto">Satuan</TableHead>
                                    <TableHead className="px-3 py-2 text-xs font-semibold uppercase tracking-wider h-auto">Harga</TableHead>
                                    <TableHead className="px-3 py-2 text-xs font-semibold uppercase tracking-wider h-auto text-right">Subtotal</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.map((item) => (
                                    <TableRow key={item.id} className="hover:bg-neutral-50/50 transition-colors">
                                        <TableCell className="px-3 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded border border-neutral-200 bg-neutral-100">
                                                    {item.imageUrl ? (
                                                        <Image
                                                            src={item.imageUrl}
                                                            alt={item.name}
                                                            fill
                                                            className="object-cover"
                                                            unoptimized
                                                        />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center">
                                                            <Package className="h-5 w-5 text-neutral-300" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="font-semibold text-sm text-neutral-900 truncate">{item.name}</span>
                                                    <span className="text-xs font-mono text-neutral-500 uppercase tracking-tight">SKU: {item.sku}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-3 py-3 text-sm text-neutral-600 font-medium">{item.quantity}</TableCell>
                                        <TableCell className="px-3 py-3">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-black bg-neutral-100 text-neutral-700 border border-neutral-200 uppercase">
                                                {item.unit || "Pcs"}
                                            </span>
                                        </TableCell>
                                        <TableCell className="px-3 py-3 text-sm text-neutral-600">Rp {item.price.toLocaleString()}</TableCell>
                                        <TableCell className="px-3 py-3 text-sm font-bold text-neutral-900 text-right whitespace-nowrap">
                                            Rp {(item.price * item.quantity).toLocaleString()}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
}
