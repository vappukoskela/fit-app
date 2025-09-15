// src/pages/UserPage.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

interface User {
    id: number;
    name: string;
    email: string;
    created_at?: string;
}

export function UserPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    const [editingUser, setEditingUser] = useState<User | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch("/api/user");
                setUsers(await res.json());
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    const updateUser = async () => {
        if (!editingUser) return;
        await fetch(`/api/users/${editingUser.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(editingUser),
        });
        setEditingUser(null);
        refresh();
    };


    const refresh = async () => {
        const res = await fetch("/api/user");
        setUsers(await res.json());
    };

    if (loading) {
        return (
            <div className="bg-background text-foreground">
                <main className="p-6">
                    <div className="flex flex-col justify-center items-center min-h-96 gap-4">
                        <Spinner variant="ring" />
                        <div>Loading food diary...</div>
                    </div>
                </main>
            </div>
        )
    }
    
    return (
        <main>

            <div className="p-6 grid grid-cols-1 gap-6">
                <Card>
                    <CardHeader className="flex items-center justify-between">
                        <CardTitle></CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((u) => (
                                    <TableRow key={u.id}>
                                        <TableCell>{u.id}</TableCell>
                                        <TableCell>{u.name}</TableCell>
                                        <TableCell>{u.email}</TableCell>
                                        <TableCell>{u.created_at ? new Date(u.created_at).toLocaleDateString() : "-"}</TableCell>
                                        <TableCell className="flex gap-2">
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button
                                                        variant="secondary"
                                                        onClick={() => setEditingUser(u)}
                                                    >
                                                        Edit
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Edit User</DialogTitle>
                                                    </DialogHeader>
                                                    {editingUser && (
                                                        <div className="grid gap-4 py-4">
                                                            <div>
                                                                <Label>Name</Label>
                                                                <Input
                                                                    value={editingUser.name}
                                                                    onChange={(e) =>
                                                                        setEditingUser({ ...editingUser, name: e.target.value })
                                                                    }
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label>Email</Label>
                                                                <Input
                                                                    value={editingUser.email}
                                                                    onChange={(e) =>
                                                                        setEditingUser({ ...editingUser, email: e.target.value })
                                                                    }
                                                                />
                                                            </div>
                                                            <Button onClick={updateUser}>Update</Button>
                                                        </div>
                                                    )}
                                                </DialogContent>
                                            </Dialog>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </main>
    )
}
    

export default UserPage;
