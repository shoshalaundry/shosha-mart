"use client";

import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { updateProfile } from "@/app/actions/profile";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, ShieldCheck, User as UserIcon } from "lucide-react";

const profileFormSchema = z.object({
    username: z.string().min(3, {
        message: "Username minimal 3 karakter.",
    }),
    phone: z.string().min(10, {
        message: "Nomor Handphone tidak valid.",
    }),
    branchName: z.string(), // Read-only, just for display in form mapping
    currentPassword: z.string().optional(),
    newPassword: z.string().min(6, {
        message: "Password baru minimal 6 karakter.",
    }).optional().or(z.literal("")),
}).refine(data => {
    // If new password is provided, current password MUST be provided
    if (data.newPassword && data.newPassword.length > 0) {
        return data.currentPassword && data.currentPassword.length > 0;
    }
    return true;
}, {
    message: "Password saat ini harus diisi jika Anda ingin mengubah sandi.",
    path: ["currentPassword"]
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface ProfileClientProps {
    initialUser: {
        id: string;
        username: string;
        phone: string;
        branchName: string | null;
    };
}

export default function ProfileClient({ initialUser }: ProfileClientProps) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            username: initialUser.username,
            phone: initialUser.phone,
            branchName: initialUser.branchName || "Cabang Belum Diatur",
            currentPassword: "",
            newPassword: "",
        },
    });

    async function onSubmit(data: ProfileFormValues) {
        startTransition(async () => {
            const formData = new FormData();
            formData.append("username", data.username);
            formData.append("phone", data.phone);

            // Note: branchName is intentionally omitted from the formData payload to prevent tampering.
            // The server action explicitly ignores it anyway.

            if (data.currentPassword) {
                formData.append("currentPassword", data.currentPassword);
            }
            if (data.newPassword) {
                formData.append("newPassword", data.newPassword);
            }

            const result = await updateProfile(formData);

            if (result.success) {
                toast.success(result.message || "Profil berhasil diperbarui!");
                form.setValue("currentPassword", "");
                form.setValue("newPassword", "");
                router.refresh();
            } else {
                toast.error(result.message || "Gagal memperbarui profil.");
            }
        });
    }

    return (
        <Card className="border-t-4 border-t-neutral-900 shadow-lg">
            <CardHeader className="bg-neutral-50 rounded-t-xl border-b pb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-neutral-200 p-3 rounded-full">
                        <UserIcon className="h-6 w-6 text-neutral-700" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl">Data Profil</CardTitle>
                        <CardDescription>
                            Pastikan nomor handphone dan username yang Anda masukkan sudah benar agar akses login tetap aman.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-8">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                        {/* READ-ONLY FIELD */}
                        <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg mb-6">
                            <FormField
                                control={form.control}
                                name="branchName"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex items-center gap-2 mb-1">
                                            <ShieldCheck className="h-4 w-4 text-neutral-500" />
                                            <FormLabel className="text-neutral-700 font-semibold">Nama / Kode Cabang</FormLabel>
                                        </div>
                                        <FormControl>
                                            <Input
                                                className="bg-neutral-100 border-neutral-300 text-neutral-600 font-medium cursor-not-allowed"
                                                disabled
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription className="text-amber-700 mt-2">
                                            Data ini dikelola oleh Admin Regional. Hubungi SuperAdmin secara langsung jika perlu merubah penugasan cabang.
                                        </FormDescription>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="username"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Username (Login ID)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="budi_cabang1" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nomor WhatsApp</FormLabel>
                                        <FormControl>
                                            <Input placeholder="0812345678" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="border-t pt-8 mt-8">
                            <h3 className="text-lg font-medium mb-4">Ganti Password (Opsional)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="currentPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Sandi Saat Ini</FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="Masukkan sandi saat ini" {...field} />
                                            </FormControl>
                                            <FormDescription>Wajib diisi jika mau membuat sandi baru.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="newPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Sandi Baru</FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="Masukkan sandi baru" {...field} />
                                            </FormControl>
                                            <FormDescription>Biarkan kosong jika tidak ingin ganti sandi.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t">
                            <Button type="submit" disabled={isPending} className="w-full md:w-auto min-w-[150px]">
                                {isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Menyimpan...
                                    </>
                                ) : (
                                    "Simpan Perubahan"
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
