import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import validator from 'validator';
import { customersAPI, branchesAPI, authAPI } from '../utils/api';
import { logout } from '../redux/authSlice';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { useToast } from '../components/ui/use-toast';
import { Phone, Mail, MapPin, Calendar, User, X, Users, UserPlus, FileText, Home, LogOut } from 'lucide-react';

export default function StaffMobile() {
  const { addToast } = useToast();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [branch, setBranch] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentView, setCurrentView] = useState('home'); // home, customer, profile
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    phone_number: '',
    code: '',
    address: '',
    status: 'Active',
    registration_date: new Date().toISOString().split('T')[0], // Today's date
  });

  useEffect(() => {
    if (!user) return;
    fetchBranch();
    if (currentView === 'customer') {
      fetchCustomers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, currentView]);

  const fetchBranch = async () => {
    if (!user?.branch_id) return;
    try {
      const resp = await branchesAPI.getById(user.branch_id);
      setBranch(resp.data.data);
    } catch (err) {
      // non-fatal
    }
  };

  const fetchCustomers = async (search = '') => {
    if (!user?.branch_id) return;
    setLoading(true);
    try {
      // pass branch filter; backend should enforce branch scoping for staff
      const params = { branch_id: user.branch_id };
      if (search) params.q = search;
      const resp = await customersAPI.getAll(params);
      setCustomers(resp.data.data || []);
    } catch (err) {
      addToast({ title: 'Error', description: 'Gagal memuat data pelanggan', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;
  if (user.role !== 'staff') return <Navigate to="/dashboard" replace />;

  // Render Dashboard (Home)
  const renderHome = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
            <span className="text-2xl">🏪</span>
          </div>
          <div>
            <h1 className="text-xl font-bold">Branch {branch?.branch_name || 'BTH'}</h1>
            <p className="text-sm opacity-90">{user?.full_name}</p>
          </div>
        </div>
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Data Customer */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setCurrentView('customer')}
        >
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-3 bg-orange-500 rounded-2xl flex items-center justify-center">
              <Users className="h-8 w-8 text-white" />
            </div>
            <p className="font-semibold text-sm">DATA CUSTOMER</p>
          </CardContent>
        </Card>

        {/* Tambah Customer */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setShowAddModal(true)}
        >
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-3 bg-orange-500 rounded-2xl flex items-center justify-center">
              <UserPlus className="h-8 w-8 text-white" />
            </div>
            <p className="font-semibold text-sm">TAMBAH CUSTOMER</p>
          </CardContent>
        </Card>

        {/* Laporan */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow opacity-60">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-3 bg-orange-500 rounded-2xl flex items-center justify-center">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <p className="font-semibold text-sm">LAPORAN</p>
            <p className="text-xs text-muted-foreground mt-1">(Under Development)</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Render Customer List
  const renderCustomerList = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Data Customer</h2>
        <Button onClick={() => fetchCustomers(query)} size="sm">Refresh</Button>
      </div>

      {/* Search */}
      <Input
        placeholder="Cari pelanggan (nama / email)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && fetchCustomers(query)}
      />

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : customers.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">Tidak ada pelanggan untuk cabang ini.</p>
      ) : (
        <div className="space-y-3 pb-20">
          {customers.map((c) => (
            <Card key={c.customer_id} className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="font-medium text-base">{c.full_name || c.email}</span>
                  <span className={`text-xs px-2 py-1 rounded ${c.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                    {c.status}
                  </span>
                </CardTitle>
                <CardDescription className="text-xs">{c.email}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">{c.phone || '-'}</div>
                  <Button size="sm" onClick={() => handleViewDetail(c)}>Detail</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  // Render Profile
  const renderProfile = () => (
    <div className="space-y-6 pb-20">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6 text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-orange-500 rounded-full flex items-center justify-center">
            <User className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-xl font-bold mb-1">{user?.full_name}</h2>
          <p className="text-sm text-muted-foreground capitalize">{user?.role}</p>
        </CardContent>
      </Card>

      {/* Branch Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informasi Branch</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Nama Branch</span>
            <span className="text-sm font-medium">{branch?.branch_name || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Branch ID</span>
            <span className="text-sm font-medium">#{user?.branch_id}</span>
          </div>
          {branch?.address && (
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Alamat</span>
              <span className="text-sm font-medium text-right">{branch.address}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informasi Akun</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Username</span>
            <span className="text-sm font-medium">{user?.username}</span>
          </div>
          {user?.code && (
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Kode Staff</span>
              <span className="text-sm font-medium">{user.code}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Logout Button */}
      <Button 
        variant="destructive" 
        className="w-full"
        onClick={handleLogout}
      >
        <LogOut className="h-4 w-4 mr-2" />
        Logout
      </Button>
    </div>
  );

  const handleViewDetail = (customer) => {
    setSelectedCustomer(customer);
    setShowDetailModal(true);
  };

  const handleCloseDetail = () => {
    setShowDetailModal(false);
    setSelectedCustomer(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();

    // Validate email
    if (!validator.isEmail(formData.email)) {
      addToast({ title: 'Error', description: 'Email tidak valid', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const sanitizedData = {
        branch_id: user.branch_id,
        email: formData.email.trim().toLowerCase(),
        full_name: validator.escape(formData.full_name.trim()),
        phone_number: formData.phone_number ? validator.escape(formData.phone_number.trim()) : '',
        code: formData.code ? validator.escape(formData.code.trim()) : '',
        address: formData.address ? validator.escape(formData.address.trim()) : '',
        registration_date: formData.registration_date,
        status: formData.status,
      };

      await customersAPI.create(sanitizedData);
      addToast({ title: 'Berhasil!', description: 'Customer berhasil ditambahkan', variant: 'success' });
      setShowAddModal(false);
      resetForm();
      if (currentView === 'customer') {
        fetchCustomers();
      }
    } catch (error) {
      addToast({
        title: 'Error',
        description: error.response?.data?.message || 'Gagal menambahkan customer',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      full_name: '',
      phone_number: '',
      code: '',
      address: '',
      status: 'Active',
      registration_date: new Date().toISOString().split('T')[0],
    });
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      dispatch(logout());
      addToast({ title: 'Logout', description: 'Anda telah logout', variant: 'default' });
    } catch (error) {
      dispatch(logout());
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="max-w-md mx-auto p-4 pb-24">
        {currentView === 'home' && renderHome()}
        {currentView === 'customer' && renderCustomerList()}
        {currentView === 'profile' && renderProfile()}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="max-w-md mx-auto flex items-center justify-around p-2">
          <button
            onClick={() => setCurrentView('home')}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg flex-1 ${
              currentView === 'home' ? 'text-orange-500' : 'text-gray-500'
            }`}
          >
            <Home className="h-6 w-6" />
            <span className="text-xs font-medium">Beranda</span>
          </button>
          <button
            onClick={() => setCurrentView('customer')}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg flex-1 ${
              currentView === 'customer' ? 'text-orange-500' : 'text-gray-500'
            }`}
          >
            <Users className="h-6 w-6" />
            <span className="text-xs font-medium">Customer</span>
          </button>
          <button
            onClick={() => setCurrentView('profile')}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg flex-1 ${
              currentView === 'profile' ? 'text-orange-500' : 'text-gray-500'
            }`}
          >
            <User className="h-6 w-6" />
            <span className="text-xs font-medium">Profil</span>
          </button>
        </div>
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end justify-center z-50">
          <Card className="w-full max-w-lg rounded-t-3xl rounded-b-none max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900">
            <CardHeader className="relative sticky top-0 bg-white dark:bg-gray-900 z-10 border-b">
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2"
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
              >
                <X className="h-5 w-5" />
              </Button>
              <CardTitle>Tambah Customer Baru</CardTitle>
              <CardDescription>Isi data customer untuk cabang Anda</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleAddCustomer} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nama Lengkap *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                    placeholder="Nama lengkap customer"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    placeholder="customer@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone_number">Nomor Telepon</Label>
                  <Input
                    id="phone_number"
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    placeholder="08xxxxxxxxxx"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code">Kode Customer</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="Kode unik customer (opsional)"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Alamat</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Alamat lengkap"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registration_date">Tanggal Registrasi *</Label>
                  <Input
                    id="registration_date"
                    type="date"
                    value={formData.registration_date}
                    onChange={(e) => setFormData({ ...formData, registration_date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <select
                    id="status"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    required
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                  >
                    Batal
                  </Button>
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading ? 'Menyimpan...' : 'Simpan'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Customer Detail Modal */}
      {showDetailModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900">
            <CardHeader className="relative bg-white dark:bg-gray-900">
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2"
                onClick={handleCloseDetail}
              >
                <X className="h-5 w-5" />
              </Button>
              <CardTitle className="pr-8">Detail Pelanggan</CardTitle>
              <CardDescription>Informasi lengkap pelanggan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status Badge */}
              <div className="flex items-center justify-between pb-4 border-b">
                <span className="text-sm font-medium text-muted-foreground">Status</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  selectedCustomer.status === 'Active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {selectedCustomer.status}
                </span>
              </div>

              {/* Personal Info */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Nama Lengkap</Label>
                    <p className="font-medium">{selectedCustomer.full_name || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Email</Label>
                    <p className="font-medium break-all">{selectedCustomer.email}</p>
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs"
                      onClick={() => {
                        navigator.clipboard?.writeText(selectedCustomer.email);
                        addToast({ title: 'Email disalin!', variant: 'success' });
                      }}
                    >
                      Salin email
                    </Button>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Nomor Telepon</Label>
                    <p className="font-medium">{selectedCustomer.phone || '-'}</p>
                    {selectedCustomer.phone && (
                      <div className="flex gap-2 mt-1">
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-xs"
                          onClick={() => {
                            navigator.clipboard?.writeText(selectedCustomer.phone);
                            addToast({ title: 'Nomor telepon disalin!', variant: 'success' });
                          }}
                        >
                          Salin nomor
                        </Button>
                        <span className="text-muted-foreground">•</span>
                        <a
                          href={`tel:${selectedCustomer.phone}`}
                          className="text-xs text-primary hover:underline"
                        >
                          Panggil
                        </a>
                        <span className="text-muted-foreground">•</span>
                        <a
                          href={`https://wa.me/${selectedCustomer.phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline"
                        >
                          WhatsApp
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Alamat</Label>
                    <p className="font-medium">{selectedCustomer.address || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Tanggal Registrasi</Label>
                    <p className="font-medium">{formatDate(selectedCustomer.created_at)}</p>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Customer ID</span>
                  <span className="font-medium">#{selectedCustomer.customer_id}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Branch ID</span>
                  <span className="font-medium">#{selectedCustomer.branch_id}</span>
                </div>
                {selectedCustomer.branch_name && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Nama Branch</span>
                    <span className="font-medium">{selectedCustomer.branch_name}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleCloseDetail}
                >
                  Tutup
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
