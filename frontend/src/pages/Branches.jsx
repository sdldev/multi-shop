import { useEffect, useState } from 'react';
import { branchesAPI } from '../utils/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { useToast } from '../components/ui/use-toast';
import { Plus, Edit, Trash2, Building2 } from 'lucide-react';

export default function Branches() {
  const { addToast } = useToast();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [formData, setFormData] = useState({
    branch_name: '',
    address: '',
    phone_number: '',
    manager_name: '',
  });

  useEffect(() => {
    fetchBranches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const response = await branchesAPI.getAll();
      setBranches(response.data.data);
    } catch {
      addToast({
        title: 'Error',
        description: 'Failed to load branches',
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
      if (editingBranch) {
        await branchesAPI.update(editingBranch.branch_id, formData);
        addToast({
          title: 'Success',
          description: 'Branch updated successfully',
          variant: 'success',
        });
      } else {
        await branchesAPI.create(formData);
        addToast({
          title: 'Success',
          description: 'Branch created successfully',
          variant: 'success',
        });
      }

      setShowModal(false);
      setEditingBranch(null);
      resetForm();
      fetchBranches();
    } catch (error) {
      addToast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save branch',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (branch) => {
    setEditingBranch(branch);
    setFormData({
      branch_name: branch.branch_name,
      address: branch.address || '',
      phone_number: branch.phone_number || '',
      manager_name: branch.manager_name || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (branchId) => {
    if (!window.confirm('Are you sure you want to delete this branch? This action cannot be undone.')) {
      return;
    }

    try {
      await branchesAPI.delete(branchId);
      addToast({
        title: 'Success',
        description: 'Branch deleted successfully',
        variant: 'success',
      });
      fetchBranches();
    } catch (error) {
      addToast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete branch',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      branch_name: '',
      address: '',
      phone_number: '',
      manager_name: '',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Branches</h1>
          <p className="text-muted-foreground">Manage branch locations</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Branch
        </Button>
      </div>

      {/* Branches Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {branches.map((branch) => (
            <Card key={branch.branch_id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <Building2 className="h-8 w-8 text-primary" />
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(branch)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(branch.branch_id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="mt-2">{branch.branch_name}</CardTitle>
                <CardDescription>ID: {branch.branch_id}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {branch.manager_name && (
                    <p>
                      <span className="font-medium">Manager:</span> {branch.manager_name}
                    </p>
                  )}
                  {branch.phone_number && (
                    <p>
                      <span className="font-medium">Phone:</span> {branch.phone_number}
                    </p>
                  )}
                  {branch.address && (
                    <p>
                      <span className="font-medium">Address:</span> {branch.address}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Branches Table */}
      <Card>
        <CardHeader>
          <CardTitle>Branch List</CardTitle>
          <CardDescription>{branches.length} branch{branches.length !== 1 ? 'es' : ''} found</CardDescription>
        </CardHeader>
        <CardContent>
          {branches.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No branches found</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Branch Name</TableHead>
                    <TableHead>Manager</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {branches.map((branch) => (
                    <TableRow key={branch.branch_id}>
                      <TableCell>{branch.branch_id}</TableCell>
                      <TableCell className="font-medium">{branch.branch_name}</TableCell>
                      <TableCell>{branch.manager_name || '-'}</TableCell>
                      <TableCell>{branch.phone_number || '-'}</TableCell>
                      <TableCell>{branch.address || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(branch)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(branch.branch_id)}
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

      {/* Add/Edit Branch Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>{editingBranch ? 'Edit Branch' : 'Add Branch'}</CardTitle>
              <CardDescription>
                {editingBranch ? 'Update branch information' : 'Create a new branch'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="branch_name">Branch Name *</Label>
                  <Input
                    id="branch_name"
                    value={formData.branch_name}
                    onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manager_name">Manager Name</Label>
                  <Input
                    id="manager_name"
                    value={formData.manager_name}
                    onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone_number">Phone Number</Label>
                  <Input
                    id="phone_number"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowModal(false);
                      setEditingBranch(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : editingBranch ? 'Update' : 'Create'}
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
