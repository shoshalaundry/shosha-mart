"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { approveOrder, rejectOrder } from "@/app/actions/orders";

export default function ApprovalActions({ orderId }: { orderId: string }) {
    const [isApproving, setIsApproving] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);

    const handleApprove = async () => {
        setIsApproving(true);
        await approveOrder(orderId);
        setIsApproving(false);
    };

    const handleReject = async () => {
        setIsRejecting(true);
        await rejectOrder(orderId, rejectReason);
        setIsRejecting(false);
        setDialogOpen(false);
    };

    return (
        <div className="flex gap-2 justify-end">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
                        Reject
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Tolak Pesanan</DialogTitle>
                        <DialogDescription>
                            Silakan masukkan alasan pembatalan untuk pesanan ini. Pembeli akan melihat alasan ini di riwayat pesanan mereka.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="reason">Alasan Pembatalan</Label>
                            <Input
                                id="reason"
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Misal: Stok tidak mencukupi, minimum pembelian tidak tercapai..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleReject}
                            disabled={isRejecting || !rejectReason.trim()}
                        >
                            {isRejecting ? "Memproses..." : "Konfirmasi Tolak"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Button
                size="sm"
                onClick={handleApprove}
                disabled={isApproving}
                className="bg-green-600 hover:bg-green-700 text-white"
            >
                {isApproving ? "Memproses..." : "Approve"}
            </Button>
        </div>
    );
}
