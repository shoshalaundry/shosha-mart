import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { orders, users, tiers } from "@/lib/db/schema";
import { eq, inArray, sql, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Users, ShoppingCart } from "lucide-react";
import FulfillmentClient from "./FulfillmentClient";

export default async function SuperAdminDashboard() {
    const session = await getSession();

    if (!session || session.role !== "SUPERADMIN") {
        redirect("/dashboard");
    }

    // Fetch all approved orders metrics
    const approvedOrders = await db
        .select({
            id: orders.id,
            totalAmount: orders.totalAmount,
            status: orders.status,
            tierName: tiers.name,
            buyerName: users.branchName,
        })
        .from(orders)
        .innerJoin(tiers, eq(orders.tierId, tiers.id))
        .innerJoin(users, eq(orders.buyerId, users.id))
        .where(inArray(orders.status, ["APPROVED_BY_TIER", "PROCESSED"]))
        .orderBy(desc(orders.id));

    // Compute overall stats
    const totalApprovedOrdersCount = approvedOrders.length;
    const totalSalesVolume = approvedOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    // Users count
    const totalUsersResult = await db.select({ count: sql<number>`count(*)` }).from(users);
    const totalUsers = totalUsersResult[0].count;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Dashboard Utama</h1>
                <p className="text-neutral-500">Ringkasan performa seluruh tier dan total penjualan yang disetujui.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-500">Total Penjualan</CardTitle>
                        <BarChart className="h-4 w-4 text-neutral-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Rp {totalSalesVolume.toLocaleString("id-ID")}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-500">Pesanan Disetujui</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-neutral-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalApprovedOrdersCount}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-500">Total Pengguna</CardTitle>
                        <Users className="h-4 w-4 text-neutral-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalUsers}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Riwayat Pesanan Disetujui (Konsolidasi)</CardTitle>
                </CardHeader>
                <CardContent>
                    <FulfillmentClient orders={approvedOrders} />
                </CardContent>
            </Card>
        </div>
    );
}
