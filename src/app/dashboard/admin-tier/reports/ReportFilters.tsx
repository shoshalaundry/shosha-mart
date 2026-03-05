"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

export default function ReportFilters({
    initialMonth,
    initialYear
}: {
    initialMonth: number;
    initialYear: number
}) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const handleFilter = (month: string, year: string) => {
        const params = new URLSearchParams(searchParams);
        if (month) params.set("month", month);
        if (year) params.set("year", year);
        router.push(`${pathname}?${params.toString()}`);
    };

    const months = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];

    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

    return (
        <div className="flex gap-2">
            <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={initialMonth}
                onChange={(e) => handleFilter(e.target.value, initialYear.toString())}
            >
                {months.map((m, i) => (
                    <option key={i + 1} value={i + 1}>{m}</option>
                ))}
            </select>
            <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={initialYear}
                onChange={(e) => handleFilter(initialMonth.toString(), e.target.value)}
            >
                {years.map(y => (
                    <option key={y} value={y}>{y}</option>
                ))}
            </select>
        </div>
    );
}
