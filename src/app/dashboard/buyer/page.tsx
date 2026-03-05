import { getSession } from "@/lib/auth/session";
import { getProductsForBuyer } from "@/app/actions/products";
import { redirect } from "next/navigation";
import CartClient from "./CartClient";

export default async function BuyerDashboard() {
    const session = await getSession();

    if (!session || session.role !== "BUYER" || !session.tierId) {
        redirect("/login");
    }

    const products = await getProductsForBuyer(session.tierId);

    return (
        <div className="container mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold mb-8">Katalog Produk</h1>

            <CartClient
                initialProducts={products}
                buyerId={session.id}
                tierId={session.tierId}
            />
        </div>
    );
}
