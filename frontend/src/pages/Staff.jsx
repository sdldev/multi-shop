import { useEffect, useState } from 'react';
import validator from 'validator';
import { staffAPI, branchesAPI } from '../utils/api';
import { validatePassword } from '../utils/validation';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { useToast } from '../components/ui/use-toast';
import { ConfirmDialog } from '../components/ui/confirm-dialog';
import { Plus, Edit, Trash2 } from 'lucide-react';

export default function Staff() {
  const { addToast } = useToast();
  const [staff, setStaff] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState(null);
  const [editingStaff, setEditingStaff] = useState(null);
  const [passwordError, setPasswordError] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    branch_id: '',
  });

  useEffect(() => {
    fetchStaff();
    fetchBranches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const response = await staffAPI.getAll();
      setStaff(response.data.data);
    } catch {
      addToast({
        title: 'Error',
        description: 'Failed to load staff',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await branchesAPI.getAll();
      setBranches(response.data.data);
    } catch {
      addToast({
        title: 'Warning',
        description: 'Failed to load branches list',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');

    // Validate password if provided
    if (formData.password) {
      const validation = validatePassword(formData.password);
      if (!validation.isValid) {
        setPasswordError(validation.errors.join('. '));
        return;
      }
    } else if (!editingStaff) {
      // Password required for new staff
      setPasswordError('Password is required for new staff members');
      return;
    }

    setLoading(true);

    try {
      // Sanitize input data
      const sanitizedData = {
        username: validator.escape(formData.username.trim()),
        full_name: validator.escape(formData.full_name.trim()),
        branch_id: parseInt(formData.branch_id),
      };

      if (formData.password) {
        sanitizedData.password = formData.password; // Don't escape passwords
      }

      if (editingStaff) {
        await staffAPI.update(editingStaff.staff_id, sanitizedData);
        addToast({
          title: 'Success',
          description: 'Staff member updated successfully',
          variant: 'success',
        });
      } else {
        await staffAPI.create(sanitizedData);
        addToast({
          title: 'Success',
          description: 'Staff member created successfully',
          variant: 'success',
        });
      }

      setShowModal(false);
      setEditingStaff(null);
      resetForm();
      fetchStaff();
    } catch (error) {
      addToast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save staff member',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (staffMember) => {
    setEditingStaff(staffMember);
    setPasswordError('');
    setFormData({
      username: staffMember.username,
      password: '',
      full_name: staffMember.full_name,
      branch_id: staffMember.branch_id.toString(),
    });
    setShowModal(true);
  };

  const handleDeleteClick = (staffId) => {
    setStaffToDelete(staffId);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    try {
      await staffAPI.delete(staffToDelete);
      addToast({
        title: 'Success',
        description: 'Staff member deleted successfully',
        variant: 'success',
      });
      fetchStaff();
    } catch (error) {
      addToast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete staff member',
        variant: 'destructive',
      });
    } finally {
      setShowDeleteDialog(false);
      setStaffToDelete(null);
    }
  };

  const resetForm = () => {
    setPasswordError('');
    setFormData({
      username: '',
      password: '',
      full_name: '',
      branch_id: '',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Staff Management</h1>
          <p className="text-muted-foreground">Manage staff members across branches</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Staff
        </Button>
      </div>

      {/* Staff Table */}
      <Card>
        <CardHeader>
          <CardTitle>Staff List</CardTitle>
          <CardDescription>{staff.length} staff member{staff.length !== 1 ? 's' : ''} found</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : staff.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No staff members found</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.map((staffMember) => (
                    <TableRow key={staffMember.staff_id}>
                      <TableCell>{staffMember.staff_id}</TableCell>
                      <TableCell className="font-medium">{staffMember.username}</TableCell>
                      <TableCell>{staffMember.full_name}</TableCell>
                      <TableCell>{staffMember.branch_name}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(staffMember)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(staffMember.staff_id)}
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

      {/* Add/Edit Staff Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>{editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}</CardTitle>
              <CardDescription>
                {editingStaff ? 'Update staff member information' : 'Create a new staff member'}
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
                    disabled={!!editingStaff}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">
                    Password {editingStaff ? '(leave empty to keep current)' : '*'}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value });
                      setPasswordError('');
                    }}
                    required={!editingStaff}
                    placeholder={editingStaff ? 'Leave empty to keep current' : 'Enter password'}
                  />
                  {passwordError && (
                    <p className="text-xs text-destructive">{passwordError}</p>
                  )}
                  {!passwordError && (
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
                <div className="space-y-2">
                  <Label htmlFor="branch_id">Branch *</Label>
                  <select
                    id="branch_id"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={formData.branch_id}
                    onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                    required
                  >
                    <option value="">Select branch</option>
                    {branches.map((branch) => (
                      <option key={branch.branch_id} value={branch.branch_id}>
                        {branch.branch_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowModal(false);
                      setEditingStaff(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : editingStaff ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Staff Member"
        description="Are you sure you want to delete this staff member? This action cannot be undone."
        onConfirm={confirmDelete}
      />
    </div>
  );
}
