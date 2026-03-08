import { getSession } from "@/lib/auth/session";
import { getProductsForBuyer } from "@/app/actions/products";
import { redirect } from "next/navigation";
import CatalogClient from "../CatalogClient";

export default async function KatalogPage(
    props: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }
) {
    const searchParams = await props.searchParams;
    const session = await getSession();
    if (!session || session.role !== "BUYER") {
        redirect("/login");
    }

    const page = typeof searchParams?.page === 'string' ? parseInt(searchParams.page) : 1;
    const { products, totalCount } = await getProductsForBuyer(session.id, page);

    return (
        <CatalogClient
            initialProducts={products}
            totalCount={totalCount}
            currentPage={page}
        />
    );
}
