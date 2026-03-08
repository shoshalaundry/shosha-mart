import { getAllProducts } from "@/app/actions/products";
import ProductList from "./ProductList";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function ProductsPage(
    props: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }
) {
    const searchParams = await props.searchParams;
    const session = await getSession();
    if (!session || session.role !== "SUPERADMIN") {
        redirect("/login");
    }

    const page = typeof searchParams?.page === 'string' ? parseInt(searchParams.page) : 1;
    const { products, totalCount } = await getAllProducts(page);

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Manajemen Produk</h1>
            </div>
            <ProductList
                initialProducts={products}
                totalCount={totalCount}
                currentPage={page}
            />
        </div>
    );
}
