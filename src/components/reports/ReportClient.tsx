"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Download } from "lucide-react";
import { DateRange } from "react-day-picker";
import * as xlsx from "xlsx";
import { Line, LineChart, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis, CartesianGrid } from "recharts";

import { cn, formatRupiah, formatRupiahCompact, getMonthName } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ReportDataProps {
    initialData: any;
    role: string;
    adminId?: string;
}

export function ReportClient({ initialData, role, adminId }: ReportDataProps) {
    const [date, setDate] = React.useState<DateRange | undefined>({
        from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        to: new Date(),
    });

    const [data, setData] = React.useState(initialData);
    const [isLoading, setIsLoading] = React.useState(false);

    React.useEffect(() => {
        // Only fetch if date range is complete
        if (date?.from && date?.to) {
            const fetchData = async () => {
                setIsLoading(true);
                try {
                    // Dynamic import of server action to avoid passing it as prop if complex
                    const { getReportData } = await import("@/app/actions/reports");
                    const result = await getReportData({
                        startDate: date.from!.getTime(),
                        endDate: date.to!.getTime(),
                        role,
                        adminId
                    });
                    if (result.success) {
                        setData(result);
                    }
                } catch (error) {
                    console.error("Failed to fetch reports:", error);
                } finally {
                    setIsLoading(false);
                }
            };

            // Prevent refetching on initial load since we already have initialData
            // But we check time difference to see if it changed
            fetchData();
        }
    }, [date, role, adminId]);

    const exportToExcel = () => {
        if (!data.transactionList || data.transactionList.length === 0) return;

        const ws = xlsx.utils.json_to_sheet(data.transactionList.map((t: any) => ({
            "Tanggal": t.date,
            "Nama Buyer": t.buyerName,
            "Nama Barang": t.productName,
            "Satuan": t.unit,
            "Qty": t.quantity,
            "Total Harga (Rp)": t.totalPrice
        })));

        const wb = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, "Laporan Penjualan");

        const fileName = `Laporan_Penjualan_${format(date?.from || new Date(), "yyyy-MM-dd")}_to_${format(date?.to || new Date(), "yyyy-MM-dd")}.xlsx`;
        xlsx.writeFile(wb, fileName);
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-3xl font-bold">Laporan Penjualan</h1>

                <div className="flex items-center gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                id="date"
                                variant={"outline"}
                                className={cn(
                                    "w-[300px] justify-start text-left font-normal",
                                    !date && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date?.from ? (
                                    date.to ? (
                                        <>
                                            {format(date.from, "LLL dd, y")} -{" "}
                                            {format(date.to, "LLL dd, y")}
                                        </>
                                    ) : (
                                        format(date.from, "LLL dd, y")
                                    )
                                ) : (
                                    <span>Pilih rentang tanggal</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={date?.from}
                                selected={date}
                                onSelect={setDate}
                                numberOfMonths={2}
                            />
                        </PopoverContent>
                    </Popover>

                    <Button onClick={exportToExcel} variant="secondary" disabled={!data.transactionList?.length}>
                        <Download className="mr-2 h-4 w-4" />
                        Ekspor ke Excel
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Omzet</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatRupiah(data.totalRevenue || 0)}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Pesanan Selesai</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {data.completedOrders || 0}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Produk Terlaris</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm font-medium truncate">
                            {data.topProducts?.[0] ? `${data.topProducts[0].name} (${data.topProducts[0].quantity})` : "Belum ada data"}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-7">
                <Card className="col-span-4 max-h-[400px]">
                    <CardHeader>
                        <CardTitle>Tren Penjualan</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        {data.dailySales?.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data.dailySales} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(val) => format(new Date(val), "dd MMM")}
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        tickFormatter={(val) => formatRupiahCompact(val)}
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        domain={['auto', 'auto']}
                                    />
                                    <RechartsTooltip
                                        formatter={(value: any) => [formatRupiah(Number(value)), "Omzet"]}
                                        labelFormatter={(label) => {
                                            const date = new Date(label);
                                            return `${date.getDate()} ${getMonthName(date.getMonth() + 1)} ${date.getFullYear()}`;
                                        }}
                                    />
                                    <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-muted-foreground w-full">
                                Belum ada tren penjualan untuk rentang ini.
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="col-span-3 h-full max-h-[400px] overflow-y-auto">
                    <CardHeader>
                        <CardTitle>Produk Terlaris</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {data.topProducts?.length > 0 ? data.topProducts.map((product: any, i: number) => (
                                <div key={i} className="flex items-center justify-between">
                                    <span className="font-medium text-sm">{product.name}</span>
                                    <span className="text-muted-foreground text-sm font-bold">{product.quantity}</span>
                                </div>
                            )) : (
                                <div className="text-sm text-muted-foreground text-center">Belum ada data</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Rincian Transaksi</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tanggal</TableHead>
                                <TableHead>Nama Buyer</TableHead>
                                <TableHead>Nama Barang</TableHead>
                                <TableHead>Satuan</TableHead>
                                <TableHead className="text-right">Qty</TableHead>
                                <TableHead className="text-right">Total Harga</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.transactionList?.length > 0 ? (
                                data.transactionList.map((t: any, i: number) => (
                                    <TableRow key={i}>
                                        <TableCell>{format(new Date(t.date), "dd MMM yyyy")}</TableCell>
                                        <TableCell>{t.buyerName}</TableCell>
                                        <TableCell>{t.productName}</TableCell>
                                        <TableCell>{t.unit}</TableCell>
                                        <TableCell className="text-right">{t.quantity}</TableCell>
                                        <TableCell className="text-right">{formatRupiah(t.totalPrice)}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        Tidak ada transaksi dalam rentang waktu ini.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
