import React, { useState } from 'react';
import { useUsers } from '@/hooks/useUsers';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit2, Trash2, Plus, Users, Key, Shield, ShieldAlert, Loader2 } from 'lucide-react';
import { DEPARTMENTS, Department, AppRole } from '@/lib/types';
import { toast } from 'sonner';

const UserManagement = () => {
  const { users, isLoading, createUser, changePassword, updateRole, deleteUser } = useUsers();
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    department: 'Technical' as Department,
    role: 'user' as AppRole
  });

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    createUser.mutate(formData, {
      onSuccess: () => {
        setIsAddUserOpen(false);
        setFormData({
          email: '',
          password: '',
          full_name: '',
          department: 'Technical',
          role: 'user'
        });
      }
    });
  };

  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUserId && newPassword) {
      changePassword.mutate({ id: selectedUserId, password: newPassword }, {
        onSuccess: () => {
          setIsPasswordDialogOpen(false);
          setNewPassword('');
          setSelectedUserId(null);
        }
      });
    }
  };

  const toggleRole = (id: string, currentRole: AppRole) => {
    const newRole: AppRole = currentRole === 'admin' ? 'user' : 'admin';
    updateRole.mutate({ id, role: newRole });
  };

  if (isLoading) return <div className="p-10 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-card/40 p-4 rounded-xl border border-white/5 shadow-sm">
        <div>
          <h3 className="font-semibold text-lg">User Directory ({users.length})</h3>
          <p className="text-xs text-muted-foreground">Manage user accounts, roles, and security</p>
        </div>
        <Button onClick={() => setIsAddUserOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Add User
        </Button>
      </div>

      <div className="bg-card/50 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} className="hover:bg-white/5">
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{user.full_name || 'No Name'}</span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{user.department}</span>
                </TableCell>
                <TableCell>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`gap-1.5 h-7 px-2 ${user.role === 'admin' ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}
                    onClick={() => toggleRole(user.id, user.role as AppRole)}
                    disabled={updateRole.isPending}
                  >
                    {user.role === 'admin' ? <Shield className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                    {user.role}
                  </Button>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(user.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                      onClick={() => {
                        setSelectedUserId(user.id);
                        setIsPasswordDialogOpen(true);
                      }}
                      title="Reset Password"
                    >
                      <Key className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this user?')) {
                          deleteUser.mutate(user.id);
                        }
                      }}
                      title="Delete User"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Add User Dialog */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent className="max-w-md bg-card/95 backdrop-blur-xl border border-white/10">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddUser} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input id="full_name" value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Initial Password</Label>
              <Input id="password" type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required minLength={8} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select value={formData.department} onValueChange={(v) => setFormData({ ...formData, department: v as Department })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select dept" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v as AppRole })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsAddUserOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createUser.isPending}>
                {createUser.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="max-w-sm bg-card/95 backdrop-blur-xl border border-white/10">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePasswordReset} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="new_password">New Password</Label>
              <Input id="new_password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={8} placeholder="At least 8 characters" />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsPasswordDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={changePassword.isPending}>
                {changePassword.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Password'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
