"use client";

import { useMemo } from "react";
import {
    Bar,
    BarChart,
    Area,
    AreaChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AnalyticsSummary } from "@/app/actions/analytics";
import { Users, ShoppingCart, TrendingUp, Package } from "lucide-react";

interface DashboardChartsProps {
    data: AnalyticsSummary | null;
    role: string;
}

export default function DashboardCharts({ data, role }: DashboardChartsProps) {
    if (!data) return <p className="text-neutral-500">Gagal memuat data analitik.</p>;

    return (
        <div className="space-y-8 mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-500">
                            {role === "BUYER" ? "Total Pengeluaran" : "Total Penjualan"}
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-neutral-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Rp {data.totalRevenue.toLocaleString("id-ID")}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-500">Transaksi Selesai</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-neutral-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.ordersCount}</div>
                    </CardContent>
                </Card>

                {data.totalUsers !== undefined && (
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-neutral-500">Total Pengguna Aktif</CardTitle>
                            <Users className="h-4 w-4 text-neutral-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{data.totalUsers}</div>
                        </CardContent>
                    </Card>
                )}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Tren Transaksi</CardTitle>
                        <CardDescription>Ringkasan 30 hari terakhir</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ResponsiveContainer width="100%" height={350}>
                            <AreaChart data={data.salesTrend}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis
                                    dataKey="date"
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => {
                                        const date = new Date(value);
                                        return `${date.getDate()}/${date.getMonth() + 1}`;
                                    }}
                                />
                                <YAxis
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `Rp ${(value / 1000000).toFixed(1)}M`}
                                />
                                <Tooltip
                                    formatter={(value: any) => [`Rp ${Number(value).toLocaleString("id-ID")}`, "Nilai"]}
                                    labelFormatter={(label) => `Tanggal: ${label}`}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#2563eb"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorRevenue)"
                                    activeDot={{ r: 6, strokeWidth: 0, fill: '#2563eb' }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Produk Terlaris</CardTitle>
                        <CardDescription>Berdasarkan volume penjualan.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={data.topProducts} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eee" />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    axisLine={false}
                                    tickLine={false}
                                    fontSize={12}
                                    width={120}
                                />
                                <Tooltip
                                    formatter={(value: any) => [value, "Unit Terjual"]}
                                    cursor={{ fill: 'transparent' }}
                                />
                                <Bar
                                    dataKey="quantitySold"
                                    fill="#3b82f6"
                                    radius={[0, 4, 4, 0]}
                                    barSize={20}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
