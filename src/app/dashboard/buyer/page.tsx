import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import DashboardAnalytics from "@/components/dashboard/DashboardAnalytics";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";

export default async function BuyerDashboard() {
    const session = await getSession();

    if (!session || session.role !== "BUYER" || !session.tierId) {
        redirect("/login");
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold mb-8 text-neutral-800 tracking-tight">Dashboard Statistik</h1>

            <Suspense fallback={<DashboardSkeleton />}>
                <DashboardAnalytics role="BUYER" />
            </Suspense>
        </div>
    );
}
