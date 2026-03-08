"use client";

import { useTransition, useEffect, useState } from "react";
import { processOrder, packOrder, bypassDeleteOrder, approveOrder, rejectOrder } from "@/app/actions/orders";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Download, Package, CheckCircle, Trash2, Check, XCircle, AlertTriangle, MessageCircle } from "lucide-react";
import OrderDetail, { OrderItemDetail } from "@/components/dashboard/OrderDetail";
import dynamic from "next/dynamic";
import { InvoicePDF } from "@/components/dashboard/InvoicePDF";
import { format } from "date-fns";
import { id } from "date-fns/locale";

// Dynamic import for PDFDownloadLink to avoid SSR issues
const PDFDownloadLink = dynamic(
    () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
    { ssr: false }
);

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

type OrderRow = {
    id: string;
    totalAmount: number;
    status: string;
    tierName: string;
    buyerName: string | null;
    branchName: string | null;
    buyerPhone: string | null;
    createdAt: Date | string | number | null;
    adminNotes?: string | null;
    items: OrderItemDetail[];
};

// No imports needed for browser print anymore

export default function FulfillmentClient({ orders }: { orders: OrderRow[] }) {
    const [isPending, startTransition] = useTransition();
    const [isClient, setIsClient] = useState(false);
    const [rejectingOrder, setRejectingOrder] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState("");
    const [paperSize, setPaperSize] = useState<'full' | 'half' | 'large'>('full');

    useEffect(() => {
        setIsClient(true);
    }, []);



    const handlePack = (orderId: string) => {
        startTransition(async () => {
            const result = await packOrder(orderId);
            if (result?.success) {
                toast.success(result.message);
            } else {
                toast.error(result?.error || "Gagal merubah status");
            }
        });
    };

    const handleProcess = (orderId: string) => {
        startTransition(async () => {
            const result = await processOrder(orderId);
            if (result?.success) {
                toast.success(result.message);
            } else {
                toast.error(result?.error || "Gagal memproses pesanan");
            }
        });
    };

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

    const handleReject = () => {
        if (!rejectingOrder || !rejectReason.trim()) return;

        startTransition(async () => {
            const result = await rejectOrder(rejectingOrder, rejectReason);
            if (result?.success) {
                toast.success(result.message);
                setRejectingOrder(null);
                setRejectReason("");
            } else {
                toast.error(result?.error || "Gagal menolak pesanan");
            }
        });
    };

    const handleDeleteBypass = (orderId: string) => {
        if (!confirm("Peringatan: Anda akan menghapus pesanan ini secara permanen dan mengembalikan stok produk terkait. Lanjutkan?")) return;

        startTransition(async () => {
            const result = await bypassDeleteOrder(orderId);
            if (result?.success) {
                toast.success(result.message);
            } else {
                toast.error(result?.error || "Gagal menghapus pesanan");
            }
        });
    };

    if (orders.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-lg border border-dashed border-neutral-300">
                <p className="text-muted-foreground font-medium">Tidak ada pesanan yang sesuai dengan filter.</p>
                <p className="text-xs text-muted-foreground mt-1">Coba ubah filter status atau kata kunci pencarian Anda.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {orders.map((order) => (
                <div key={order.id} className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div className="flex flex-wrap items-center gap-6">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Referensi</span>
                                <span className="font-mono text-xs font-semibold">{order.id.slice(0, 8)}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-neutral-400 uppercase tracking-wider">Tier</span>
                                <Badge variant="secondary" className="w-fit font-bold">{order.tierName}</Badge>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-neutral-400 uppercase tracking-wider">Tanggal</span>
                                <span className="text-xs font-semibold text-neutral-600">
                                    {order.createdAt ? format(new Date(order.createdAt), "dd MMM yyyy, HH:mm", { locale: id }) : "-"}
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-neutral-400 uppercase tracking-wider">Pembeli</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-lg text-neutral-800 leading-tight">
                                        {order.buyerName} {order.branchName ? `(${order.branchName})` : ""}
                                    </span>
                                    {order.buyerPhone && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-7 px-2 text-[10px] gap-1 border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
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
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] text-neutral-400 uppercase tracking-wider">Status</span>
                                <Badge className={
                                    order.status === 'APPROVED' ? 'bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200' :
                                        order.status === 'PACKING' ? 'bg-purple-100 text-purple-700 hover:bg-purple-100 border-purple-200' :
                                            order.status === 'PENDING_APPROVAL' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200' :
                                                order.status === 'REJECTED' ? 'bg-red-100 text-red-700 hover:bg-red-100 border-red-200' :
                                                    'bg-green-100 text-green-700 hover:bg-green-100 border-green-200'
                                }>
                                    {order.status === "PENDING_APPROVAL" ? "MENUNGGU" :
                                        order.status === "APPROVED" ? "DISETUJUI" :
                                            order.status === "PACKING" ? "PACKING" :
                                                order.status === "REJECTED" ? "DITOLAK" : "SELESAI"}
                                </Badge>

                            </div>
                            {order.adminNotes && (
                                <div className="flex items-center text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                    {order.adminNotes}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <div className="text-[10px] text-neutral-400 uppercase tracking-wider text-right">Total Nilai</div>
                                <div className="text-lg font-bold text-blue-700">Rp {order.totalAmount.toLocaleString("id-ID")}</div>
                            </div>

                            <div className="flex flex-wrap items-center justify-end gap-2 max-w-[500px]">
                                {order.status === "PENDING_APPROVAL" && (
                                    <>
                                        <Button
                                            onClick={() => handleApprove(order.id)}
                                            disabled={isPending}
                                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm gap-2 whitespace-nowrap"
                                        >
                                            <Check className="h-4 w-4" />
                                            Setujui
                                        </Button>
                                        <Dialog open={rejectingOrder === order.id} onOpenChange={(open) => {
                                            if (open) setRejectingOrder(order.id);
                                            else { setRejectingOrder(null); setRejectReason(""); }
                                        }}>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 gap-2 whitespace-nowrap">
                                                    <XCircle className="h-4 w-4" /> Tolak
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Tolak Pesanan Ini?</DialogTitle>
                                                </DialogHeader>
                                                <div className="space-y-4 py-4">
                                                    <div className="space-y-2">
                                                        <Label>Alasan Penolakan</Label>
                                                        <Textarea
                                                            placeholder="Berikan alasan agar pembeli mengerti..."
                                                            value={rejectReason}
                                                            onChange={(e) => setRejectReason(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                <DialogFooter>
                                                    <Button variant="destructive" onClick={handleReject} disabled={isPending || !rejectReason.trim()}>
                                                        {isPending ? "Memproses..." : "Konfirmasi Tolak"}
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </>
                                )}

                                {/* Paper Size Selection and Printing */}
                                {(order.status === "PACKING" || order.status === "PROCESSED") && isClient && (
                                    <div className="flex items-center gap-2">
                                        <Select value={paperSize} onValueChange={(value: any) => setPaperSize(value)}>
                                            <SelectTrigger className="w-[140px] h-9 text-xs border-neutral-300">
                                                <SelectValue placeholder="Ukuran Kertas" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="full">Full (9.5 x 11)</SelectItem>
                                                <SelectItem value="half">Bagi 2 (9.5 x 5.5)</SelectItem>
                                                <SelectItem value="large">Besar (14.8 x 11)</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        <PDFDownloadLink
                                            document={<InvoicePDF order={order} paperSize={paperSize} />}
                                            fileName={`Invoice-${order.id.slice(0, 8)}.pdf`}
                                        >
                                            {/* @ts-ignore */}
                                            {({ loading }) => (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={loading}
                                                    className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 whitespace-nowrap h-9"
                                                >
                                                    <Download className="h-4 w-4" />
                                                    {loading ? "..." : "PDF"}
                                                </Button>
                                            )}
                                        </PDFDownloadLink>
                                    </div>
                                )}

                                {order.status === "APPROVED" && (
                                    <Button
                                        onClick={() => handlePack(order.id)}
                                        disabled={isPending}
                                        className="bg-orange-500 hover:bg-orange-600 text-white shadow-sm gap-2 whitespace-nowrap"
                                    >
                                        <Package className="h-4 w-4" />
                                        Mulai Packing
                                    </Button>
                                )}

                                {order.status === "PACKING" && (
                                    <Button
                                        onClick={() => handleProcess(order.id)}
                                        disabled={isPending}
                                        className="bg-green-600 hover:bg-green-700 text-white shadow-sm gap-2 whitespace-nowrap"
                                    >
                                        <CheckCircle className="h-4 w-4" />
                                        Selesaikan
                                    </Button>
                                )}

                                {/* SUPERADMIN Bypass Action */}
                                <Button
                                    onClick={() => handleDeleteBypass(order.id)}
                                    disabled={isPending}
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 h-9 w-9"
                                    title="Hapus Pesanan (Bypass)"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-dashed border-neutral-100 mt-4 pt-2">
                        <OrderDetail items={order.items} />
                    </div>
                </div>
            ))}
        </div>
    );
}
