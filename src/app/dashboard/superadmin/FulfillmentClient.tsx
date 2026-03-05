"use client";

import { useTransition } from "react";
import { processOrder } from "@/app/actions/orders";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type OrderRow = {
    id: string;
    totalAmount: number;
    status: string;
    tierName: string;
    buyerName: string | null;
};

export default function FulfillmentClient({ orders }: { orders: OrderRow[] }) {
    const [isPending, startTransition] = useTransition();

    const handleProcess = (orderId: string) => {
        startTransition(async () => {
            const result = await processOrder(orderId);
            if (result?.error) {
                alert(result.error);
            }
        });
    };

    if (orders.length === 0) {
        return <p className="text-center text-neutral-500 py-8">Belum ada pesanan yang disetujui oleh Admin Tier.</p>;
    }

    return (
        <div className="rounded-md border border-neutral-200 bg-white">
            <Table>
                <TableHeader className="bg-neutral-50">
                    <TableRow>
                        <TableHead>No. Referensi</TableHead>
                        <TableHead>Tier</TableHead>
                        <TableHead>Cabang / Pembeli</TableHead>
                        <TableHead>Nilai Pesanan</TableHead>
                        <TableHead>Status / Aksi</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {orders.map((order) => (
                        <TableRow key={order.id}>
                            <TableCell className="font-mono text-xs text-neutral-500">
                                {order.id.split('-')[0]}
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline" className="font-bold">{order.tierName}</Badge>
                            </TableCell>
                            <TableCell>{order.buyerName}</TableCell>
                            <TableCell className="font-medium">Rp {order.totalAmount.toLocaleString("id-ID")}</TableCell>
                            <TableCell>
                                {order.status === "APPROVED_BY_TIER" ? (
                                    <Button
                                        onClick={() => handleProcess(order.id)}
                                        disabled={isPending}
                                        size="sm"
                                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                                    >
                                        Proses Pesanan
                                    </Button>
                                ) : (
                                    <Badge className="bg-neutral-200 text-neutral-800 hover:bg-neutral-200 shadow-sm border-0 font-medium">
                                        Sudah Diproses
                                    </Badge>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
