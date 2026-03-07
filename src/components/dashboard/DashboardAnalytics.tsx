import { getAnalyticsData } from "@/app/actions/analytics";
import DashboardCharts from "@/components/dashboard/DashboardCharts";

export default async function DashboardAnalytics({
    role,
    startDate,
    endDate,
    branchId
}: {
    role: string;
    startDate?: number;
    endDate?: number;
    branchId?: string;
}) {
    const data = await getAnalyticsData({ startDate, endDate, branchId });
    return <DashboardCharts data={data} role={role} />;
}
