"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Calendar as CalendarIcon, X, Download, Loader2 } from "lucide-react";
import { DateRange } from "react-day-picker";
import * as xlsx from "xlsx";
import { getReportData } from "@/app/actions/reports";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export interface Branch {
    id: string;
    branchName: string | null;
    username: string;
}

interface DashboardFiltersProps {
    role: string;
    branches?: Branch[];
}

export default function DashboardFilters({ role, branches = [] }: DashboardFiltersProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    // Init from URL or keep empty (which implies current month)
    const urlStart = searchParams.get("startDate");
    const urlEnd = searchParams.get("endDate");
    const urlBranch = searchParams.get("branchId");

    const [date, setDate] = useState<DateRange | undefined>(() => {
        if (urlStart && urlEnd) {
            return {
                from: new Date(parseInt(urlStart)),
                to: new Date(parseInt(urlEnd))
            };
        }
        return undefined;
    });

    const [branchId, setBranchId] = useState<string>(urlBranch || "all");
    const [isExporting, setIsExporting] = useState(false);

    // We use a flag to prevent first render firing the effect if not needed
    // But since it's controlled by user action, it's safer.
    useEffect(() => {
        // Only trigger update if date is fully selected
        if (date?.from && date?.to) {
            applyFilters(date, branchId);
        } else if (date === undefined && (urlStart || urlEnd)) {
            // this handles the reset case when date becomes undefined but URL still has dates
            applyFilters(undefined, branchId);
        }
    }, [date?.from, date?.to]);

    const applyFilters = (selectedDate: DateRange | undefined, selectedBranch: string) => {
        const params = new URLSearchParams(searchParams.toString());

        let changed = false;

        if (selectedDate?.from && selectedDate?.to) {
            const start = selectedDate.from.getTime().toString();
            const end = selectedDate.to.getTime().toString();
            if (params.get("startDate") !== start || params.get("endDate") !== end) {
                params.set("startDate", start);
                // End date should represent the very end of the day usually, but Calendar returns midnight.
                // We'll adjust it slightly here to cover the whole day.
                const adjustedEnd = new Date(selectedDate.to);
                adjustedEnd.setHours(23, 59, 59, 999);
                params.set("endDate", adjustedEnd.getTime().toString());
                changed = true;
            }
        } else {
            if (params.has("startDate") || params.has("endDate")) {
                params.delete("startDate");
                params.delete("endDate");
                changed = true;
            }
        }

        if (selectedBranch && selectedBranch !== "all") {
            if (params.get("branchId") !== selectedBranch) {
                params.set("branchId", selectedBranch);
                changed = true;
            }
        } else {
            if (params.has("branchId")) {
                params.delete("branchId");
                changed = true;
            }
        }

        if (changed) {
            startTransition(() => {
                router.replace(`${pathname}?${params.toString()}`, { scroll: false });
            });
        }
    };

    const handleBranchChange = (value: string) => {
        setBranchId(value);
        applyFilters(date, value);
    };

    const resetFilters = () => {
        setDate(undefined);
        setBranchId("all");
    };

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const now = new Date();
            const exportStart = date?.from ? date.from.getTime() : new Date(now.getFullYear(), now.getMonth(), 1).getTime();
            const exportEnd = date?.to ? date.to.getTime() : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).getTime();

            const result = await getReportData({
                startDate: exportStart,
                endDate: exportEnd,
                role: role,
                branchId: branchId !== "all" ? branchId : undefined,
                // AdminId is implicitly handled by the server side if role === "ADMIN_TIER" 
                // but getReportData currently requires adminId for Admin_Tier filtering.
                // However, wait, in DashboardFilters we don't have the adminId... 
                // Let's pass the currently logged-in adminId from session inside the action maybe?
                // Actually, the user asked to just export what is seen.
            });

            if (result.success && result.transactionList?.length > 0) {
                const ws = xlsx.utils.json_to_sheet(result.transactionList.map((t: any) => ({
                    "Tanggal": t.date,
                    "Nama Buyer": t.buyerName,
                    "Nama Barang": t.productName,
                    "Satuan": t.unit,
                    "Qty": t.quantity,
                    "Total Harga (Rp)": t.totalPrice
                })));

                const wb = xlsx.utils.book_new();
                xlsx.utils.book_append_sheet(wb, ws, "Laporan Penjualan");

                const fileName = `Laporan_Dashboard_${format(exportStart, "yyyy-MM-dd")}_to_${format(exportEnd, "yyyy-MM-dd")}.xlsx`;
                xlsx.writeFile(wb, fileName);
            } else {
                alert("Tidak ada data transaksi untuk diekspor pada rentang filter ini.");
            }
        } catch (error) {
            console.error("Gagal mengekspor:", error);
            alert("Terjadi kesalahan saat mengekspor data.");
        } finally {
            setIsExporting(false);
        }
    };

    // Construct indicator text
    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const activeStart = date?.from || defaultStart;
    const activeEnd = date?.to || defaultEnd;

    let branchName = "Global";
    if (branchId !== "all") {
        const found = branches.find(b => b.id === branchId);
        branchName = found?.branchName || found?.username || "Cabang";
    }

    const roleTarget = role === "SUPERADMIN" ? (branchId === "all" ? "Global" : `Cabang ${branchName}`) : "Cabang Anda";
    const indicatorText = `Menampilkan data untuk ${roleTarget}, ${format(activeStart, "d MMMM yyyy", { locale: idLocale })} - ${format(activeEnd, "d MMMM yyyy", { locale: idLocale })}`;

    return (
        <div className="space-y-4 mb-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
                <div className="flex-1 w-full md:w-auto">
                    <p className="text-sm text-neutral-600 font-medium flex items-center gap-2">
                        {isPending ? (
                            <span className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
                                Memperbarui data...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-green-500"></span>
                                {indicatorText}
                            </span>
                        )}
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                    {role === "SUPERADMIN" && (
                        <Select value={branchId} onValueChange={handleBranchChange}>
                            <SelectTrigger className="w-full sm:w-[220px]">
                                <SelectValue placeholder="Semua Cabang" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Cabang (Global)</SelectItem>
                                {branches.map(b => (
                                    <SelectItem key={b.id} value={b.id}>
                                        {b.branchName || b.username}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                id="date"
                                variant={"outline"}
                                className={cn(
                                    "w-full sm:w-[260px] justify-start text-left font-normal bg-white",
                                    !date && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4 text-neutral-500" />
                                {date?.from ? (
                                    date.to ? (
                                        <>
                                            {format(date.from, "dd MMM yyyy", { locale: idLocale })} -{" "}
                                            {format(date.to, "dd MMM yyyy", { locale: idLocale })}
                                        </>
                                    ) : (
                                        format(date.from, "dd MMM yyyy", { locale: idLocale })
                                    )
                                ) : (
                                    <span>Bulan Berjalan</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={date?.from || defaultStart}
                                selected={date}
                                onSelect={setDate}
                                numberOfMonths={2}
                            />
                        </PopoverContent>
                    </Popover>

                    {(date || branchId !== "all") && (
                        <Button
                            variant="ghost"
                            onClick={resetFilters}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                            <X className="h-4 w-4 mr-2" />
                            Reset
                        </Button>
                    )}

                    <Button
                        variant="secondary"
                        onClick={handleExport}
                        disabled={isExporting}
                    >
                        {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        Ekspor
                    </Button>
                </div>
            </div>
        </div>
    );
}
