import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function BuyerOrdersPage() {
    const session = await getSession();
    if (!session || session.role !== "BUYER") {
        redirect("/login");
    }

    const myOrders = await db
        .select()
        .from(orders)
        .where(eq(orders.buyerId, session.id))
        .orderBy(desc(orders.createdAt));

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PENDING_APPROVAL":
                return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200">Menunggu Persetujuan</Badge>;
            case "APPROVED_BY_TIER":
                return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200">Disetujui Tier</Badge>;
            case "PROCESSED":
                return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">Selesai</Badge>;
            case "REJECTED":
                return <Badge variant="destructive">Ditolak</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="container mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold mb-8">Riwayat Pesanan</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Daftar Pesanan</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID Pesanan</TableHead>
                                <TableHead>Tanggal</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Catatan</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {myOrders.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}...</TableCell>
                                    <TableCell>{new Date(order.createdAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}</TableCell>
                                    <TableCell className="font-semibold">Rp {order.totalAmount.toLocaleString()}</TableCell>
                                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                                    <TableCell>
                                        {order.status === "REJECTED" && order.rejectionReason && (
                                            <span className="text-xs text-red-600 font-medium">Alasan: {order.rejectionReason}</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {myOrders.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        Belum ada pesanan yang dibuat.
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
