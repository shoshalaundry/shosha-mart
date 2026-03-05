import { getSession } from "@/lib/auth/session";
import { getTierMonthlyReport } from "@/app/actions/reports";
import { redirect } from "next/navigation";
import ReportFilters from "./ReportFilters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function TierReportsPage({
    searchParams,
}: {
    searchParams: Promise<{ month?: string; year?: string }>;
}) {
    const session = await getSession();
    if (!session || session.role !== "ADMIN_TIER" || !session.tierId) {
        redirect("/login");
    }

    const { month, year } = await searchParams;
    const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();

    const reportData = await getTierMonthlyReport(session.tierId, currentMonth, currentYear);

    return (
        <div className="container mx-auto py-8 px-4 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-3xl font-bold">Laporan Bulanan</h1>
                <ReportFilters initialMonth={currentMonth} initialYear={currentYear} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Pengeluaran (Selesai)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Rp {reportData.totalSpent.toLocaleString()}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Produk Terlaris</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Produk</TableHead>
                                <TableHead className="text-right">Kuantitas Terjual</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reportData.topProducts.map((p, i) => (
                                <TableRow key={i}>
                                    <TableCell>{p.name}</TableCell>
                                    <TableCell className="text-right font-semibold">{p.totalQuantity}</TableCell>
                                </TableRow>
                            ))}
                            {reportData.topProducts.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                                        Tidak ada data penjualan untuk periode ini.
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
