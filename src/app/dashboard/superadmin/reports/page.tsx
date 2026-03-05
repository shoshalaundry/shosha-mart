import { getSession } from "@/lib/auth/session";
import { getGlobalAnalytics } from "@/app/actions/reports";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function GlobalAnalyticsPage() {
    const session = await getSession();
    if (!session || session.role !== "SUPERADMIN") {
        redirect("/login");
    }

    const { tierComparison, topBranches } = await getGlobalAnalytics();

    return (
        <div className="container mx-auto py-8 px-4 space-y-8">
            <h1 className="text-3xl font-bold">Analitik Global</h1>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Perbandingan Penjualan per Tier</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tier</TableHead>
                                    <TableHead className="text-right">Total Penjualan</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tierComparison.map((tc, i) => (
                                    <TableRow key={i}>
                                        <TableCell className="font-medium">{tc.name}</TableCell>
                                        <TableCell className="text-right">Rp {tc.totalSales?.toLocaleString() || 0}</TableCell>
                                    </TableRow>
                                ))}
                                {tierComparison.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={2} className="text-center py-4 text-muted-foreground">
                                            Belum ada data penjualan yang diselesaikan.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Performa Cabang (Top 10)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Cabang / Buyer</TableHead>
                                    <TableHead className="text-right">Akumulasi Belanja</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {topBranches.map((tb, i) => (
                                    <TableRow key={i}>
                                        <TableCell>
                                            <div className="font-medium">{tb.branchName || tb.username}</div>
                                            <div className="text-xs text-muted-foreground">{tb.username}</div>
                                        </TableCell>
                                        <TableCell className="text-right font-semibold">
                                            Rp {tb.totalSpent?.toLocaleString() || 0}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {topBranches.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={2} className="text-center py-4 text-muted-foreground">
                                            Belum ada data belanja cabang.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
