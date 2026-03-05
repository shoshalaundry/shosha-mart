import { getAllProducts } from "@/app/actions/products";
import ProductList from "./ProductList";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function ProductsPage() {
    const session = await getSession();
    if (!session || session.role !== "SUPERADMIN") {
        redirect("/login");
    }

    const products = await getAllProducts();

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Manajemen Produk</h1>
            </div>
            <ProductList initialProducts={products} />
        </div>
    );
}
