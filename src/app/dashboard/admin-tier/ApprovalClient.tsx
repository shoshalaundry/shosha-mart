"use client";

import { useTransition, useState } from "react";
import { approveOrder, rejectOrder } from "@/app/actions/orders";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type OrderRow = {
    id: string;
    totalAmount: number;
    status: string;
    buyerName: string;
    branchName: string | null;
};

export default function ApprovalClient({ initialOrders }: { initialOrders: OrderRow[] }) {
    const [isPending, startTransition] = useTransition();
    const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});

    const handleApprove = (orderId: string) => {
        startTransition(async () => {
            const result = await approveOrder(orderId);
            if (result?.error) {
                alert(result.error);
            }
        });
    };

    const handleReject = (orderId: string) => {
        const reason = rejectionReasons[orderId];
        if (!reason || reason.trim() === "") {
            alert("Harap isi alasan penolakan!");
            return;
        }

        startTransition(async () => {
            const result = await rejectOrder(orderId, reason);
            if (result?.error) {
                alert(result.error);
            }
        });
    };

    if (initialOrders.length === 0) {
        return <p className="text-muted-foreground p-4">Tidak ada pesanan yang menunggu persetujuan.</p>;
    }

    return (
        <div className="rounded-md border bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>ID Pesanan</TableHead>
                        <TableHead>Pembeli (Cabang)</TableHead>
                        <TableHead>Total Harga</TableHead>
                        <TableHead className="w-[450px]">Aksi</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {initialOrders.map((order) => (
                        <TableRow key={order.id}>
                            <TableCell className="font-medium text-xs">{order.id.slice(0, 8)}...</TableCell>
                            <TableCell>
                                {order.buyerName} {order.branchName ? `(${order.branchName})` : ""}
                            </TableCell>
                            <TableCell className="font-semibold">Rp {order.totalAmount.toLocaleString()}</TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <Button
                                        onClick={() => handleApprove(order.id)}
                                        disabled={isPending}
                                        size="sm"
                                        className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
                                    >
                                        Setujui
                                    </Button>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="text"
                                            placeholder="Alasan tolak..."
                                            value={rejectionReasons[order.id] || ""}
                                            onChange={(e) => setRejectionReasons(prev => ({ ...prev, [order.id]: e.target.value }))}
                                            className="h-8 w-[200px] text-sm"
                                            disabled={isPending}
                                        />
                                        <Button
                                            onClick={() => handleReject(order.id)}
                                            disabled={isPending}
                                            variant="destructive"
                                            size="sm"
                                            className="shadow-sm"
                                        >
                                            Tolak
                                        </Button>
                                    </div>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
