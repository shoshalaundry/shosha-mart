"use client";

import { useState, useTransition } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { createProduct, updateProduct, deleteProduct } from "@/app/actions/products";
import { uploadImageAction } from "@/app/actions/upload";
import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { ImportProductDialog } from "./ImportProductDialog";

type Product = {
    id: string;
    name: string;
    sku: string;
    basePrice: number;
    stock: number;
    unit: string;
    imageUrl: string | null;
};

type FormDataState = {
    name: string;
    sku: string;
    basePrice: number;
    stock: number;
    unit: string;
    imageUrl: string;
    imageType: "upload" | "link";
    file: File | null;
    previewUrl: string;
};

const initialFormState: FormDataState = {
    name: "", sku: "", basePrice: 0, stock: 0, unit: "Pcs", imageUrl: "", imageType: "link", file: null, previewUrl: ""
};

import { Pagination } from "@/components/ui/Pagination";

export default function ProductList({
    initialProducts,
    totalCount,
    currentPage
}: {
    initialProducts: Product[],
    totalCount: number,
    currentPage: number
}) {
    const totalPages = Math.ceil(totalCount / 10);

    const [isPending, startTransition] = useTransition();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [formData, setFormData] = useState<FormDataState>(initialFormState);
    const [uploading, setUploading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData(prev => ({
                ...prev,
                file,
                previewUrl: URL.createObjectURL(file)
            }));
        }
    };

    const handleSave = async (isEdit: boolean) => {
        setUploading(true);
        let finalImageUrl = formData.imageUrl;

        if (formData.imageType === "upload" && formData.file) {
            const formDataUpload = new FormData();
            formDataUpload.append("file", formData.file);
            const uploadResult = await uploadImageAction(formDataUpload);

            if (uploadResult.success && uploadResult.url) {
                finalImageUrl = uploadResult.url;
            } else {
                alert(uploadResult.error || "Gagal mengunggah gambar");
                setUploading(false);
                return;
            }
        }

        startTransition(async () => {
            const productData = {
                name: formData.name,
                sku: formData.sku,
                basePrice: formData.basePrice,
                stock: formData.stock,
                unit: formData.unit,
                imageUrl: finalImageUrl || undefined
            };

            const result = isEdit && editingProduct
                ? await updateProduct(editingProduct.id, productData)
                : await createProduct(productData);

            if (result.success) {
                setIsAddOpen(false);
                setEditingProduct(null);
                setFormData(initialFormState);
            } else {
                alert(result?.error || "Terjadi kesalahan");
            }
            setUploading(false);
        });
    };

    const handleDelete = (id: string) => {
        if (!confirm("Apakah Anda yakin ingin menghapus produk ini?")) return;
        startTransition(async () => {
            const result = await deleteProduct(id);
            if (!result?.success) {
                alert(result?.error);
            }
        });
    };

    const openEdit = (product: Product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            sku: product.sku,
            basePrice: product.basePrice,
            stock: product.stock,
            unit: product.unit || "Pcs",
            imageUrl: product.imageUrl || "",
            imageType: product.imageUrl?.startsWith("https://") ? "link" : "upload", // simple heuristic
            file: null,
            previewUrl: product.imageUrl || ""
        });
    };

    const renderProductForm = (isEdit: boolean) => (
        <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nama Produk</Label>
                        <Input id="name" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="sku">SKU</Label>
                        <Input id="sku" value={formData.sku} onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="basePrice">Base Price</Label>
                            <Input id="basePrice" type="number" value={formData.basePrice} onChange={(e) => setFormData(prev => ({ ...prev, basePrice: Number(e.target.value) }))} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="unit">Satuan (Unit)</Label>
                            <Input id="unit" placeholder="Pcs, Box, etc" value={formData.unit} onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="stock">Stok (Jumlah Barang)</Label>
                        <Input id="stock" type="number" value={formData.stock} onChange={(e) => setFormData(prev => ({ ...prev, stock: Number(e.target.value) }))} />
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="flex bg-neutral-100 rounded-md p-1 h-9 items-center">
                        <button
                            type="button"
                            className={`flex-1 text-sm font-medium rounded-sm py-1 transition-all ${formData.imageType === 'link' ? 'bg-white shadow-sm' : 'text-neutral-500 hover:text-neutral-900'}`}
                            onClick={() => setFormData(prev => ({ ...prev, imageType: 'link' }))}
                        >
                            Link URL
                        </button>
                        <button
                            type="button"
                            className={`flex-1 text-sm font-medium rounded-sm py-1 transition-all ${formData.imageType === 'upload' ? 'bg-white shadow-sm' : 'text-neutral-500 hover:text-neutral-900'}`}
                            onClick={() => setFormData(prev => ({ ...prev, imageType: 'upload' }))}
                        >
                            Upload File
                        </button>
                    </div>

                    <div className="space-y-2">
                        <Label>Gambar Produk</Label>
                        {formData.imageType === "link" ? (
                            <Input
                                key="link-input"
                                placeholder="https://..."
                                value={formData.imageUrl || ""}
                                onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value, previewUrl: e.target.value }))}
                            />
                        ) : (
                            <Input
                                key="upload-input"
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                        )}
                    </div>

                    <div className="border rounded-md aspect-square w-full max-w-[200px] flex items-center justify-center overflow-hidden bg-neutral-50 mx-auto mt-4">
                        {formData.previewUrl ? (
                            <Image
                                src={formData.previewUrl}
                                alt="Preview"
                                width={200}
                                height={200}
                                className="object-cover w-full h-full"
                                unoptimized={formData.imageType === "link" || formData.previewUrl.startsWith("blob:")}
                            />
                        ) : (
                            <div className="text-neutral-400 flex flex-col items-center">
                                <ImageIcon className="h-8 w-8 mb-2 opacity-50" />
                                <span className="text-xs">Preview Area</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <DialogFooter>
                <Button onClick={() => handleSave(isEdit)} disabled={isPending || uploading}>
                    {uploading ? "Mengunggah..." : isPending ? "Menyimpan..." : "Simpan"}
                </Button>
            </DialogFooter>
        </div>
    );

    return (
        <div className="space-y-4">
            <div className="flex justify-end gap-2">
                <ImportProductDialog />
                <Dialog open={isAddOpen} onOpenChange={(open) => {
                    setIsAddOpen(open);
                    if (!open) setFormData(initialFormState);
                }}>
                    <DialogTrigger asChild>
                        <Button>Tambah Produk</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Tambah Produk Baru</DialogTitle>
                        </DialogHeader>
                        {renderProductForm(false)}
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px]">Gambar</TableHead>
                            <TableHead>Nama</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead>Satuan</TableHead>
                            <TableHead>Base Price</TableHead>
                            <TableHead>Stok</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {initialProducts.map((product) => (
                            <TableRow key={product.id}>
                                <TableCell>
                                    <div className="w-10 h-10 rounded-md border overflow-hidden bg-neutral-50 flex items-center justify-center shrink-0">
                                        {product.imageUrl ? (
                                            <Image
                                                src={product.imageUrl}
                                                alt={product.name}
                                                width={40}
                                                height={40}
                                                className="object-cover w-full h-full"
                                                unoptimized
                                            />
                                        ) : (
                                            <ImageIcon className="h-4 w-4 text-neutral-300" />
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="font-medium">{product.name}</TableCell>
                                <TableCell className="text-muted-foreground">{product.sku}</TableCell>
                                <TableCell>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 text-neutral-800">
                                        {product.unit}
                                    </span>
                                </TableCell>
                                <TableCell>Rp {product.basePrice.toLocaleString()}</TableCell>
                                <TableCell>{product.stock}</TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button variant="outline" size="sm" onClick={() => openEdit(product)}>Edit</Button>
                                    <Button variant="destructive" size="sm" onClick={() => handleDelete(product.id)}>Hapus</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {initialProducts.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-neutral-500">
                                    Belum ada produk.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <Pagination totalPages={totalPages} currentPage={currentPage} />


            <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Produk</DialogTitle>
                    </DialogHeader>
                    {renderProductForm(true)}
                </DialogContent>
            </Dialog>
        </div>
    );
}
