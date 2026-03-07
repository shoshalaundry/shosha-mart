"use client";

import { useState, useTransition, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileSpreadsheet, Upload, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { importOrders } from "@/app/actions/orders";
import { getAllTiers } from "@/app/actions/pricing";
import { useRouter } from "next/navigation";
import * as xlsx from "xlsx";

export function ImportOrderDialog() {
    const [open, setOpen] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [isPending, startTransition] = useTransition();
    const [tiers, setTiers] = useState<{ id: string; name: string }[]>([]);
    const [selectedTier, setSelectedTier] = useState<string>("");
    const [preview, setPreview] = useState<{ branch: string; rowCount: number } | null>(null);
    const [allowNegativeStock, setAllowNegativeStock] = useState(false);

    const router = useRouter();

    useEffect(() => {
        if (open) {
            const fetchTiers = async () => {
                const result = await getAllTiers();
                setTiers(result);
            };
            fetchTiers();
        }
    }, [open]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0] || null;
        setFile(selectedFile);
        if (!selectedFile) {
            setPreview(null);
            return;
        }

        // Preview Logic
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = xlsx.read(bstr, { type: "binary" });
                const ws = wb.Sheets[wb.SheetNames[0]];

                const cellA1 = ws['A1']?.v;
                const branchName = cellA1 ? String(cellA1).replace(/CABANG:?\s*/i, "").trim() : "Tidak diketahui";

                const data = xlsx.utils.sheet_to_json(ws, { range: 1 });
                setPreview({ branch: branchName, rowCount: data.length });
            } catch (err) {
                toast.error("Format file tidak valid.");
            }
        };
        reader.readAsBinaryString(selectedFile);
    };

    const handleImport = async () => {
        if (!file || !selectedTier) {
            toast.error("Pilih file dan Admin Tier terlebih dahulu.");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        startTransition(async () => {
            try {
                const result = await importOrders(formData, selectedTier, allowNegativeStock) as { success: boolean; message?: string; error?: string };
                if (result.success) {
                    toast.success(result.message);
                    setOpen(false);
                    setFile(null);
                    setPreview(null);
                    router.refresh();
                } else {
                    toast.error(result.error || "Gagal mengimport data.");
                }
            } catch (error) {
                toast.error("Terjadi kesalahan sistem.");
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 border-green-200 text-green-700 hover:bg-green-50">
                    <FileSpreadsheet className="w-4 h-4" />
                    Import Histori Pesanan
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle>Import Histori Pesanan</DialogTitle>
                    <DialogDescription>
                        Unggah file Excel untuk memindahkan histori transaksi manual ke sistem.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="grid gap-2">
                        <Label>Pilih Admin Tier (Penanggung Jawab)</Label>
                        <Select onValueChange={setSelectedTier} value={selectedTier}>
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih Tier..." />
                            </SelectTrigger>
                            <SelectContent>
                                {tiers.map((tier) => (
                                    <SelectItem key={tier.id} value={tier.id}>
                                        {tier.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="orders-file">File Histori Excel</Label>
                        <Input
                            id="orders-file"
                            type="file"
                            accept=".xlsx, .xls"
                            onChange={handleFileChange}
                            disabled={isPending}
                        />
                        <p className="text-[10px] text-muted-foreground">
                            Format: A1=Cabang, Baris 2=Header (TANGGAL, NAMA BARANG, QTY, UNIT, HARGA UNIT)
                        </p>
                    </div>

                    {preview && (
                        <div className="p-3 bg-muted/50 rounded-lg border flex flex-col gap-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Cabang Terdeteksi:</span>
                                <span className="font-bold text-green-700">{preview.branch}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Jumlah Transaksi:</span>
                                <span className="font-bold">{preview.rowCount} baris</span>
                            </div>
                            <div className="mt-2 text-xs flex items-center gap-2 px-2 py-1 bg-yellow-50 text-yellow-800 border border-yellow-100 rounded">
                                <AlertCircle className="w-3 h-3" />
                                Pesanan akan diimport dengan status SUCCESS
                            </div>
                        </div>
                    )}

                    {preview && (
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="bypass-stock"
                                checked={allowNegativeStock}
                                onChange={(e) => setAllowNegativeStock(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <Label htmlFor="bypass-stock" className="text-sm font-normal cursor-pointer">
                                Bypass validasi stok (Izinkan stok minus)
                            </Label>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        onClick={handleImport}
                        disabled={isPending || !file || !selectedTier}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                Mengimport...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Konfirmasi & Import
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
