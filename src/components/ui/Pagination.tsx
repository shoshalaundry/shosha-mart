"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface PaginationProps {
    totalPages: number;
    currentPage: number;
}

export function Pagination({ totalPages, currentPage }: PaginationProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    if (totalPages <= 1) return null;

    const createPageURL = (pageNumber: number | string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", pageNumber.toString());
        return `${pathname}?${params.toString()}`;
    };

    const handlePageChange = (page: number) => {
        router.push(createPageURL(page));
    };

    return (
        <div className="flex items-center justify-center space-x-2 py-4">
            <Button
                variant="outline"
                size="icon"
                onClick={() => handlePageChange(1)}
                disabled={currentPage <= 1}
                className="hidden h-8 w-8 lg:flex"
            >
                <span className="sr-only">Halaman Pertama</span>
                <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
                variant="outline"
                size="icon"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="h-8 w-8"
            >
                <span className="sr-only">Halaman Sebelumnya</span>
                <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center justify-center text-sm font-medium">
                Halaman {currentPage} dari {totalPages}
            </div>

            <Button
                variant="outline"
                size="icon"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="h-8 w-8"
            >
                <span className="sr-only">Halaman Selanjutnya</span>
                <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
                variant="outline"
                size="icon"
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage >= totalPages}
                className="hidden h-8 w-8 lg:flex"
            >
                <span className="sr-only">Halaman Terakhir</span>
                <ChevronsRight className="h-4 w-4" />
            </Button>
        </div>
    );
}
