"use client";

import { useState, useEffect } from "react";
import { UserPlus, Search, Edit, Trash2 } from "lucide-react";
import { getUsers, getAdmins, deleteUser } from "@/app/actions/userActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserFormDialog } from "./UserFormDialog";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Pagination } from "@/components/ui/Pagination";
import { useRouter, useSearchParams } from "next/navigation";

export function UserManagementClient({
    initialUsers,
    initialAdmins,
    totalCount,
    currentPage
}: {
    initialUsers: any[],
    initialAdmins: any[],
    totalCount: number,
    currentPage: number
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [users, setUsers] = useState(initialUsers);
    const [admins, setAdmins] = useState(initialAdmins);
    const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
    const [roleFilter, setRoleFilter] = useState(searchParams.get("role") || "ALL");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<string | null>(null);

    const totalPages = Math.ceil(totalCount / 10);

    const updateFilters = (q?: string, role?: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (q !== undefined) {
            if (q) params.set("q", q);
            else params.delete("q");
        }
        if (role !== undefined) {
            if (role !== "ALL") params.set("role", role);
            else params.delete("role");
        }
        params.set("page", "1"); // Reset to page 1 on filter change
        router.push(`/dashboard/superadmin/users?${params.toString()}`);
    };

    // Sync with initialUsers when props change (server-side update)
    useEffect(() => {
        setUsers(initialUsers);
    }, [initialUsers]);

    // Use URL for searching instead of local fetch to keep it in sync with pagination
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery !== (searchParams.get("q") || "") || roleFilter !== (searchParams.get("role") || "ALL")) {
                updateFilters(searchQuery, roleFilter);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery, roleFilter]);

    const fetchUsers = async () => {
        const res = await getUsers(searchQuery, roleFilter, currentPage);
        setUsers(res.users);
    };

    const handleCreateClick = () => {
        setEditingUser(null);
        setIsDialogOpen(true);
    };

    const handleEditClick = (user: any) => {
        setEditingUser(user);
        setIsDialogOpen(true);
    };

    const handleDeleteClick = (id: string) => {
        setUserToDelete(id);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!userToDelete) return;

        const res = await deleteUser(userToDelete);
        if (res.success) {
            toast.success(res.message);
            fetchUsers();
        } else {
            toast.error(res.message);
        }
        setIsDeleteDialogOpen(false);
        setUserToDelete(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-3xl font-bold">Manajemen User</h1>
                <Button onClick={handleCreateClick} className="w-full sm:w-auto">
                    <UserPlus className="mr-2 h-4 w-4" /> Tambah User
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Daftar Pengguna</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Cari nama atau telepon..."
                                className="pl-8"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="w-full sm:w-48">
                            <Select value={roleFilter} onValueChange={setRoleFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Semua Role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Semua Role</SelectItem>
                                    <SelectItem value="SUPERADMIN">Super Admin</SelectItem>
                                    <SelectItem value="ADMIN_TIER">Admin Tier</SelectItem>
                                    <SelectItem value="BUYER">Buyer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="rounded-md border overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nama Pengguna</TableHead>
                                    <TableHead>No. Telepon</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Cabang (Buyer)</TableHead>
                                    <TableHead>Dikelola Oleh</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.length > 0 ? (
                                    users.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">{user.username}</TableCell>
                                            <TableCell>{user.phone}</TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${user.role === 'SUPERADMIN' ? 'bg-red-100 text-red-800' :
                                                    user.role === 'ADMIN_TIER' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-green-100 text-green-800'
                                                    }`}>
                                                    {user.role.replace('_', ' ')}
                                                </span>
                                            </TableCell>
                                            <TableCell>{user.branchName || "-"}</TableCell>
                                            <TableCell>{user.managedBy}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="outline" size="icon" onClick={() => handleEditClick(user)}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="destructive" size="icon" onClick={() => handleDeleteClick(user.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            Tidak ada user yang ditemukan.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <Pagination totalPages={totalPages} currentPage={currentPage} />
                </CardContent>
            </Card>

            <UserFormDialog
                isOpen={isDialogOpen}
                setIsOpen={setIsDialogOpen}
                editingUser={editingUser}
                onSuccess={fetchUsers}
                admins={admins}
            />

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tindakan ini akan menonaktifkan pengguna. Data riwayat transaksi tidak akan dihapus untuk menjaga integritas data laporan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Ya, Hapus</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
