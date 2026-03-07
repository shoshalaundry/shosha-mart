import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import ApprovalClient from "./ApprovalClient";
import { Suspense } from "react";
import DashboardAnalytics from "@/components/dashboard/DashboardAnalytics";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import DashboardFilters from "@/components/dashboard/DashboardFilters";

export default async function AdminTierDashboard(
    props: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }
) {
    const searchParams = await props.searchParams;
    const session = await getSession();

    if (!session || session.role !== "ADMIN_TIER" || !session.tierId) {
        redirect("/login");
    }

    // Parse filters
    const startDate = searchParams?.startDate ? parseInt(searchParams.startDate as string) : undefined;
    const endDate = searchParams?.endDate ? parseInt(searchParams.endDate as string) : undefined;

    const pendingOrders = await db.query.orders.findMany({
        where: and(
            eq(orders.status, "PENDING_APPROVAL"),
            eq(orders.tierId, session.tierId)
        ),
        with: {
            buyer: true,
            items: {
                with: {
                    product: true,
                },
            },
        },
        orderBy: [desc(orders.createdAt)],
    });

    const formattedOrders = pendingOrders.map(o => ({
        id: o.id,
        totalAmount: o.totalAmount,
        status: o.status,
        buyerName: o.buyer.username,
        branchName: o.buyer.branchName,
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
        <div className="container mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold mb-8">Persetujuan Pesanan (Admin Tier)</h1>

            <DashboardFilters role="ADMIN_TIER" />

            <Suspense fallback={<DashboardSkeleton />} key={`${startDate}-${endDate}`}>
                <DashboardAnalytics
                    role="ADMIN_TIER"
                    startDate={startDate}
                    endDate={endDate}
                />
            </Suspense>

            <div className="mt-12">
                <ApprovalClient initialOrders={formattedOrders} />
            </div>
        </div>
    );
}
