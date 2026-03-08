import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { orders, users, tiers } from "@/lib/db/schema";
import { eq, sql, desc, and, gte, lte, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FulfillmentClient from "./FulfillmentClient";
import { Suspense } from "react";
import DashboardAnalytics from "@/components/dashboard/DashboardAnalytics";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import DashboardFilters from "@/components/dashboard/DashboardFilters";
import { ImportOrderDialog } from "./orders/ImportOrderDialog";
import StockAlert from "@/components/dashboard/StockAlert";
import { products as productsTable } from "@/lib/db/schema";

export default async function SuperAdminDashboard(
    props: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }
) {
    const searchParams = await props.searchParams;
    const session = await getSession();

    if (!session || session.role !== "SUPERADMIN") {
        redirect("/dashboard");
    }

    // Parse filters
    const startDate = searchParams?.startDate ? parseInt(searchParams.startDate as string) : undefined;
    const endDate = searchParams?.endDate ? parseInt(searchParams.endDate as string) : undefined;
    const branchId = searchParams?.branchId ? searchParams.branchId as string : undefined;
    const searchQuery = searchParams?.q ? searchParams.q as string : undefined;
    const statusFilter = searchParams?.status ? (searchParams.status as string).split(",") : ["PENDING_APPROVAL", "APPROVED", "PACKING"];

    // Fetch branches for filter dropdown
    const branches = await db.query.users.findMany({
        where: eq(users.role, "BUYER"),
        columns: {
            id: true,
            username: true,
            branchName: true,
        }
    });

    const conditions: any[] = [
        inArray(orders.status, statusFilter)
    ];

    const now = new Date();
    const defaultStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).setHours(0, 0, 0, 0);
    const defaultEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000).setHours(23, 59, 59, 999);

    const activeStart = startDate || defaultStart;
    const activeEnd = endDate || defaultEnd;

    conditions.push(gte(orders.createdAt, activeStart));
    conditions.push(lte(orders.createdAt, activeEnd));

    if (branchId && branchId !== "all") {
        conditions.push(eq(orders.buyerId, branchId));
    }

    // Search Logic
    if (searchQuery) {
        conditions.push(sql`(
            ${users.username} LIKE ${`%${searchQuery}%`} OR 
            ${users.branchName} LIKE ${`%${searchQuery}%`} OR 
            ${orders.id} LIKE ${`%${searchQuery}%`}
        )`);
    }

    // Fetch all orders with relational data for SuperAdmin Management
    const approvedOrdersData = await db.query.orders.findMany({
        where: and(...conditions),
        with: {
            tier: true,
            buyer: true,
            items: {
                with: {
                    product: true,
                },
            },
        },
        orderBy: [desc(orders.createdAt)],
    });

    // Fetch low stock products for alerts
    const lowStockProducts = await db
        .select({
            id: productsTable.id,
            name: productsTable.name,
            sku: productsTable.sku,
            stock: productsTable.stock,
            unit: productsTable.unit,
        })
        .from(productsTable)
        .where(lte(productsTable.stock, 10))
        .orderBy(desc(productsTable.stock));

    const approvedOrders = approvedOrdersData.map(o => ({
        id: o.id,
        totalAmount: o.totalAmount,
        status: o.status,
        tierName: o.tier.name,
        buyerName: o.buyer.username,
        branchName: o.buyer.branchName,
        createdAt: o.createdAt,
        adminNotes: o.adminNotes, // Include adminNotes
        items: o.items.map(item => ({
            id: item.id,
            name: item.product?.name || "Produk Terhapus",
            sku: item.product?.sku || "-",
            unit: item.product?.unit || "Pcs",
            imageUrl: item.product?.imageUrl || null,
            quantity: item.quantity,
            price: item.priceAtPurchase,
        })),
    }));

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Dashboard Utama</h1>
                    <p className="text-neutral-500">Ringkasan performa seluruh tier dan total penjualan yang disetujui.</p>
                </div>
                <div className="flex items-center gap-2">
                    <ImportOrderDialog />
                </div>
            </div>

            <DashboardFilters role="SUPERADMIN" branches={branches} />

            <StockAlert products={lowStockProducts} />

            <Suspense fallback={<DashboardSkeleton />} key={`${startDate}-${endDate}-${branchId}`}>
                <DashboardAnalytics
                    role="SUPERADMIN"
                    startDate={startDate}
                    endDate={endDate}
                    branchId={branchId}
                />
            </Suspense>

            <Card className="mt-12">
                <CardHeader>
                    <CardTitle>Manajemen Pesanan Keseluruhan</CardTitle>
                </CardHeader>
                <CardContent>
                    <FulfillmentClient orders={approvedOrders} />
                </CardContent>
            </Card>
        </div>
    );
}
