import { useEffect, useState } from 'react';
import { usersAPI } from '../utils/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { useToast } from '../components/ui/use-toast';
import { Plus, Edit, Trash2, Shield } from 'lucide-react';
import { format } from 'date-fns';

export default function Admins() {
  const { addToast } = useToast();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
  });

  useEffect(() => {
    fetchAdmins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const response = await usersAPI.getAll();
      setAdmins(response.data.data);
    } catch {
      addToast({
        title: 'Error',
        description: 'Failed to load admin users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingAdmin) {
        const data = { ...formData };
        if (!data.password) {
          delete data.password;
        }
        await usersAPI.update(editingAdmin.user_id, data);
        addToast({
          title: 'Success',
          description: 'Admin user updated successfully',
          variant: 'success',
        });
      } else {
        await usersAPI.create(formData);
        addToast({
          title: 'Success',
          description: 'Admin user created successfully',
          variant: 'success',
        });
      }

      setShowModal(false);
      setEditingAdmin(null);
      resetForm();
      fetchAdmins();
    } catch (error) {
      addToast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save admin user',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (admin) => {
    setEditingAdmin(admin);
    setFormData({
      username: admin.username,
      password: '',
      full_name: admin.full_name,
    });
    setShowModal(true);
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this admin user? This action cannot be undone.')) {
      return;
    }

    try {
      await usersAPI.delete(userId);
      addToast({
        title: 'Success',
        description: 'Admin user deleted successfully',
        variant: 'success',
      });
      fetchAdmins();
    } catch (error) {
      addToast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete admin user',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      full_name: '',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Users</h1>
          <p className="text-muted-foreground">Manage administrator accounts</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Admin
        </Button>
      </div>

      {/* Admins Table */}
      <Card>
        <CardHeader>
          <CardTitle>Admin User List</CardTitle>
          <CardDescription>{admins.length} admin user{admins.length !== 1 ? 's' : ''} found</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : admins.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No admin users found</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map((admin) => (
                    <TableRow key={admin.user_id}>
                      <TableCell>{admin.user_id}</TableCell>
                      <TableCell className="font-medium">{admin.username}</TableCell>
                      <TableCell>{admin.full_name}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                          <Shield className="h-3 w-3 mr-1" />
                          {admin.role}
                        </span>
                      </TableCell>
                      <TableCell>
                        {admin.created_at
                          ? format(new Date(admin.created_at), 'MMM dd, yyyy')
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(admin)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(admin.user_id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Admin Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>{editingAdmin ? 'Edit Admin User' : 'Add Admin User'}</CardTitle>
              <CardDescription>
                {editingAdmin ? 'Update admin user information' : 'Create a new admin user'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                    disabled={!!editingAdmin}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">
                    Password {editingAdmin ? '(leave empty to keep current)' : '*'}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!editingAdmin}
                    placeholder={editingAdmin ? 'Leave empty to keep current' : 'Enter password'}
                  />
                  {!editingAdmin && (
                    <p className="text-xs text-muted-foreground">
                      Min 8 characters, 1 uppercase, 1 number, 1 special character
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowModal(false);
                      setEditingAdmin(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : editingAdmin ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
