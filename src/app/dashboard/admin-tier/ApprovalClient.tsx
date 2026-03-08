"use client";

import { useTransition, useState } from "react";
import { approveOrder, rejectOrder } from "@/app/actions/orders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import OrderDetail, { OrderItemDetail } from "@/components/dashboard/OrderDetail";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { MessageCircle } from "lucide-react";

type OrderRow = {
    id: string;
    totalAmount: number;
    status: string;
    buyerName: string;
    branchName: string | null;
    buyerPhone: string | null;
    createdAt: Date | string | number | null;
    items: OrderItemDetail[];
};

export default function ApprovalClient({ initialOrders }: { initialOrders: OrderRow[] }) {
    const [isPending, startTransition] = useTransition();
    const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});

    const handleApprove = (orderId: string) => {
        startTransition(async () => {
            const result = await approveOrder(orderId);
            if (result?.success) {
                toast.success(result.message);
            } else {
                toast.error(result?.error || "Gagal menyetujui pesanan");
            }
        });
    };

    const handleReject = (orderId: string) => {
        const reason = rejectionReasons[orderId];
        if (!reason || reason.trim() === "") {
            toast.error("Harap isi alasan penolakan!");
            return;
        }

        startTransition(async () => {
            const result = await rejectOrder(orderId, reason);
            if (result?.success) {
                toast.success(result.message);
                setRejectionReasons(prev => {
                    const next = { ...prev };
                    delete next[orderId];
                    return next;
                });
            } else {
                toast.error(result?.error || "Gagal menolak pesanan");
            }
        });
    };

    if (initialOrders.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-lg border border-dashed border-neutral-300">
                <p className="text-muted-foreground">Tidak ada pesanan yang sesuai dengan filter.</p>
            </div>
        );
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PENDING_APPROVAL":
                return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Menunggu</Badge>;
            case "APPROVED":
                return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Disetujui</Badge>;
            case "PACKING":
                return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Packing</Badge>;
            case "REJECTED":
                return <Badge variant="destructive">Ditolak</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-4">
            {initialOrders.map((order) => (
                <div key={order.id} className="rounded-lg border bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                        <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                <span className="text-xs font-mono text-muted-foreground uppercase shrink-0">Ref: {order.id.slice(0, 8)}</span>
                                <span className="text-[10px] text-neutral-400 uppercase font-mono bg-neutral-50 px-1 rounded border border-neutral-100 shrink-0">
                                    {order.createdAt ? format(new Date(order.createdAt), "dd/MM/yy HH:mm", { locale: id }) : "-"}
                                </span>
                                {getStatusBadge(order.status)}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-lg text-neutral-900 leading-tight">
                                    {order.buyerName} {order.branchName ? `(${order.branchName})` : ""}
                                </span>
                                {order.buyerPhone && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-6 px-2 text-[10px] gap-1 border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
                                        onClick={() => {
                                            const phone = order.buyerPhone?.replace(/\D/g, '');
                                            const formattedPhone = phone?.startsWith('0') ? '62' + phone.slice(1) : phone;
                                            window.open(`https://wa.me/${formattedPhone}?text=Halo ${order.buyerName}, ini dari Admin ShoshaMart terkait pesanan ${order.id.slice(0, 8)}`, '_blank');
                                        }}
                                    >
                                        <MessageCircle className="w-3 h-3" />
                                        Chat WA
                                    </Button>
                                )}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">Nilai Pesanan</div>
                            <div className="font-bold text-blue-600">Rp {order.totalAmount.toLocaleString()}</div>
                        </div>
                        <div className="md:col-span-2 flex flex-col sm:flex-row items-center gap-3 justify-end">
                            {order.status === "PENDING_APPROVAL" ? (
                                <>
                                    <div className="flex w-full sm:w-auto items-center gap-2">
                                        <Input
                                            type="text"
                                            placeholder="Alasan tolak..."
                                            value={rejectionReasons[order.id] || ""}
                                            onChange={(e) => setRejectionReasons(prev => ({ ...prev, [order.id]: e.target.value }))}
                                            className="h-9 min-w-[150px] text-sm"
                                            disabled={isPending}
                                        />
                                        <Button
                                            onClick={() => handleReject(order.id)}
                                            disabled={isPending}
                                            variant="destructive"
                                            size="sm"
                                            className="h-9 px-4"
                                        >
                                            Tolak
                                        </Button>
                                    </div>
                                    <Button
                                        onClick={() => handleApprove(order.id)}
                                        disabled={isPending}
                                        size="sm"
                                        className="h-9 px-6 bg-green-600 hover:bg-green-700 text-white font-medium"
                                    >
                                        Setujui
                                    </Button>
                                </>
                            ) : (
                                <div className="text-xs text-muted-foreground italic">
                                    Pesanan sudah diproses
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-dashed border-neutral-100">
                        <OrderDetail items={order.items} />
                    </div>
                </div>
            ))}
        </div>
    );
}
