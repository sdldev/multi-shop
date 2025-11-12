import { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import validator from 'validator';
import { customersAPI, branchesAPI, authAPI } from '../utils/api';
import { logout } from '../redux/authSlice';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { useToast } from '../components/ui/use-toast';
import { Phone, Mail, MapPin, Calendar, User, X, Users, UserPlus, FileText, Home, LogOut, Search, Copy, MessageCircle } from 'lucide-react';
import StaffMobileLayout from '../components/StaffMobileLayout';
import { useFlashSuccess } from '../components/FlashSuccessProvider';

export default function StaffMobile() {
  const { addToast } = useToast();
  const { showFlash } = useFlashSuccess();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [branch, setBranch] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTodoModal, setShowTodoModal] = useState(false);
  const [showSuccessView, setShowSuccessView] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState(null);
  const [currentView, setCurrentView] = useState('home'); // home, customer, profile, success
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 0 });
  const [hasMore, setHasMore] = useState(true);
  const lastItemRef = useRef(null);
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
    // Only fetch if user exists and has a valid branch_id
    if (!user?.branch_id) return;
    fetchBranch();
    // Don't auto-fetch customers on view change - wait for user search
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

  const fetchCustomers = async (search = '', page = 1, append = false) => {
    if (!user?.branch_id) return;
    
    // Only search if query has min 3 characters or empty (load all)
    if (search && search.trim().length > 0 && search.trim().length < 3) {
      return;
    }
    
    setLoading(true);
    try {
      const params = { 
        branch_id: user.branch_id,
        page,
        limit: 10
      };
      if (search && search.trim().length >= 3) {
        params.search = search.trim();
      }
      
      const resp = await customersAPI.getAll(params);
      const newCustomers = resp.data.data || [];
      
      if (append) {
        setCustomers(prev => [...prev, ...newCustomers]);
      } else {
        setCustomers(newCustomers);
      }
      
      setPagination(resp.data.pagination || { total: 0, page: 1, limit: 20, totalPages: 0 });
      setHasMore(page < (resp.data.pagination?.totalPages || 0));
    } catch (err) {
      addToast({ title: 'Error', description: 'Gagal memuat data pelanggan', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Live search effect with debouncing
  useEffect(() => {
    if (currentView === 'customer' && query.trim().length >= 3) {
      const timeoutId = setTimeout(() => {
        // Reset to page 1 on new search
        fetchCustomers(query, 1, false);
      }, 500); // Debounce 500ms for better performance

      return () => clearTimeout(timeoutId);
    } else if (currentView === 'customer' && query.trim().length === 0) {
      // Clear data when search is empty
      setCustomers([]);
      setPagination({ total: 0, page: 1, limit: 10, totalPages: 0 });
      setHasMore(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, currentView]);

  // Load more function for infinite scroll
  const loadMore = () => {
    if (!loading && hasMore) {
      // Store current last item position
      if (lastItemRef.current) {
        const lastItemId = lastItemRef.current.getAttribute('data-customer-id');
        // Fetch next page
        fetchCustomers(query, pagination.page + 1, true);
        
        // After DOM updates, scroll to the stored item
        setTimeout(() => {
          const element = document.querySelector(`[data-customer-id="${lastItemId}"]`);
          if (element) {
            element.scrollIntoView({ behavior: 'instant', block: 'start' });
          }
        }, 100);
      } else {
        fetchCustomers(query, pagination.page + 1, true);
      }
    }
  };

  // Reset search and customers when leaving customer view
  useEffect(() => {
    if (currentView !== 'customer') {
      setQuery('');
      setCustomers([]);
      setPagination({ total: 0, page: 1, limit: 10, totalPages: 0 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView]);

  if (!user) return null;

  // Render Dashboard (Home)
  const renderHome = () => (
    <div className="space-y-6">
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

        {/* TO-DO */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setShowTodoModal(true)}
        >
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-3 bg-orange-500 rounded-2xl flex items-center justify-center">
              <span className="text-3xl">📋</span>
            </div>
            <p className="font-semibold text-sm">TO-DO</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Render Customer List
  const renderCustomerList = () => (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Input
              className="pl-10"
              placeholder="Cari nama, telepon, kode, alamat (min 3 huruf)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        
        {/* Info messages */}
        {query.length === 0 && (
          <p className="text-sm text-muted-foreground px-1 py-2 bg-orange-50 dark:bg-orange-950 rounded-md border border-orange-200 dark:border-orange-800">
            💡 Masukkan minimal 3 karakter untuk mulai pencarian
          </p>
        )}
        {query.length > 0 && query.length < 3 && (
          <p className="text-xs text-amber-600 dark:text-amber-400 px-1">
            ⚠️ Minimal 3 karakter untuk pencarian
          </p>
        )}
        {pagination.total > 0 && (
          <p className="text-xs text-muted-foreground px-1">
            Menampilkan {customers.length} dari {pagination.total} pelanggan
          </p>
        )}
      </div>

      {/* List */}
      {loading && customers.length === 0 ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : customers.length === 0 ? (
        <div className="text-center py-12">
          {query.length >= 3 ? (
            <div className="space-y-2">
              <p className="text-lg text-muted-foreground">🔍</p>
              <p className="text-muted-foreground">Tidak ada hasil pencarian</p>
              <p className="text-xs text-muted-foreground">Coba kata kunci yang berbeda</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-4xl">👥</p>
              <p className="text-muted-foreground">Mulai cari pelanggan</p>
              <p className="text-xs text-muted-foreground">Ketik nama, telepon, kode, atau alamat</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {customers.map((c, index) => (
            <Card 
              key={c.customer_id} 
              className="shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              ref={index === customers.length - 1 ? lastItemRef : null}
              data-customer-id={c.customer_id}
              onClick={() => handleViewDetail(c)}
            >
              <CardContent className="p-4">
                <div className="space-y-2">
                  {/* Nama */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <User className="h-4 w-4 text-orange-500 flex-shrink-0" />
                      <p className="font-semibold text-base">{c.full_name || c.email}</p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="h-8 text-orange-500 hover:text-orange-600 hover:bg-orange-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetail(c);
                      }}
                    >
                      Detail
                    </Button>
                  </div>

                  {/* Nomor Kartu */}
                  {c.code && (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-muted-foreground">#</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{c.code}</p>
                    </div>
                  )}

                  {/* Phone */}
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    <p className="text-xs text-muted-foreground">{c.phone_number || c.phone || '-'}</p>
                  </div>

                  {/* Alamat */}
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground line-clamp-2">{c.address || '-'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button 
                onClick={loadMore}
                variant="outline"
                className="w-full max-w-xs min-h-[40px]"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    <span>Memuat...</span>
                  </div>
                ) : (
                  `Muat Lebih Banyak (${pagination.total - customers.length} lagi)`
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Render Profile
  const renderProfile = () => (
    <div className="space-y-6">
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

      const response = await customersAPI.create(sanitizedData);
      
      // Store customer data including branch info
      const customerWithBranch = {
        ...sanitizedData,
        customer_id: response.data.data?.customer_id,
        branch_name: branch?.branch_name
      };
      
      setNewCustomerData(customerWithBranch);
      setShowAddModal(false);
      resetForm();
      
      // Show flash success with callback to show success view
      showFlash('Customer berhasil ditambahkan!', {
        icon: 'check',
        onComplete: () => setCurrentView('success')
      });
      
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
      // No need for toast/flash - user will be redirected to login immediately
    } catch (error) {
      dispatch(logout());
    }
  };

  // Render Success View - Show newly added customer
  const renderSuccessView = () => (
    <div className="space-y-4 pb-8">
      {/* Success Message */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-green-800">Customer Berhasil Ditambahkan!</h3>
            <p className="text-sm text-green-600">Data customer telah tersimpan di sistem</p>
          </div>
        </div>
      </div>

      {/* Customer Detail Card */}
      {newCustomerData && (
        <Card className="shadow-md">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-orange-600" />
              Detail Customer
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {/* Name */}
            <div className="flex items-start gap-3 pb-3 border-b">
              <User className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 mb-1">Nama Lengkap</p>
                <p className="font-semibold text-gray-900 break-words">{newCustomerData.full_name}</p>
              </div>
            </div>

            {/* Code */}
            {newCustomerData.code && (
              <div className="flex items-start gap-3 pb-3 border-b">
                <FileText className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-1">Kode Customer</p>
                  <p className="font-mono font-semibold text-gray-900">#{newCustomerData.code}</p>
                </div>
              </div>
            )}

            {/* Email */}
            <div className="flex items-start gap-3 pb-3 border-b">
              <Mail className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 mb-1">Email</p>
                <p className="text-sm text-gray-900 break-words">{newCustomerData.email}</p>
              </div>
            </div>

            {/* Phone */}
            {newCustomerData.phone_number && (
              <div className="flex items-start gap-3 pb-3 border-b">
                <Phone className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-1">Nomor Telepon</p>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900">{newCustomerData.phone_number}</p>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(newCustomerData.phone_number);
                          showFlash('Nomor telepon disalin!', { icon: 'copy' });
                        }}
                        className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                        title="Salin nomor"
                      >
                        <Copy className="h-4 w-4 text-gray-600" />
                      </button>
                      <a
                        href={`https://wa.me/${newCustomerData.phone_number.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-md hover:bg-green-50 transition-colors"
                        title="WhatsApp"
                      >
                        <MessageCircle className="h-4 w-4 text-green-600" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Address */}
            {newCustomerData.address && (
              <div className="flex items-start gap-3 pb-3 border-b">
                <MapPin className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-1">Alamat</p>
                  <p className="text-sm text-gray-900 break-words">{newCustomerData.address}</p>
                </div>
              </div>
            )}

            {/* Registration Date */}
            <div className="flex items-start gap-3 pb-3 border-b">
              <Calendar className="h-5 w-5 text-indigo-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 mb-1">Tanggal Registrasi</p>
                <p className="text-sm text-gray-900">{formatDate(newCustomerData.registration_date)}</p>
              </div>
            </div>

            {/* Branch */}
            <div className="flex items-start gap-3 pb-3 border-b">
              <Home className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 mb-1">Cabang</p>
                <p className="font-semibold text-gray-900">{newCustomerData.branch_name}</p>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 mb-1">Status</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  newCustomerData.status === 'Active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {newCustomerData.status}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="space-y-3 pt-2">
        <Button
          onClick={() => setShowAddModal(true)}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Tambah Customer Lagi
        </Button>
        
        <Button
          onClick={() => {
            setCurrentView('customer');
            setNewCustomerData(null);
            // Auto search to show latest customers
            setQuery('');
            fetchCustomers('', 1, false);
          }}
          variant="outline"
          className="w-full"
        >
          <Users className="h-4 w-4 mr-2" />
          Lihat Daftar Customer
        </Button>

        <Button
          onClick={() => {
            setCurrentView('home');
            setNewCustomerData(null);
          }}
          variant="outline"
          className="w-full"
        >
          <Home className="h-4 w-4 mr-2" />
          Kembali ke Beranda
        </Button>
      </div>
    </div>
  );

  return (
    <StaffMobileLayout 
      currentView={currentView} 
      onViewChange={setCurrentView}
      branch={branch}
      user={user}
    >
      {currentView === 'home' && renderHome()}
      {currentView === 'customer' && renderCustomerList()}
      {currentView === 'profile' && renderProfile()}
      {currentView === 'success' && renderSuccessView()}

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
              <CardTitle className="pr-8">{selectedCustomer.full_name || '-'}</CardTitle>
              <CardDescription>{selectedCustomer.code}</CardDescription>
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
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Email</Label>
                    <p className="text-sm break-all">{selectedCustomer.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Nomor Telepon</Label>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm">{selectedCustomer.phone_number || '-'}</p>
                      {selectedCustomer.phone_number && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              navigator.clipboard?.writeText(selectedCustomer.phone_number);
                              showFlash('Nomor telepon disalin!', { icon: 'copy' });
                            }}
                          >
                            <Copy className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <a
                            href={`https://wa.me/${selectedCustomer.phone_number.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MessageCircle className="h-4 w-4 text-green-600" />
                            </Button>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Alamat</Label>
                    <p className="text-sm">{selectedCustomer.address || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Tanggal Registrasi</Label>
                    <p className="text-sm">{formatDate(selectedCustomer.created_at)}</p>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="pt-4 border-t space-y-2">
                {selectedCustomer.branch_name && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Cabang</span>
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

      {/* TO-DO Modal */}
      {showTodoModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900">
            <CardHeader className="relative bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 text-white hover:bg-white/20"
                onClick={() => setShowTodoModal(false)}
              >
                <X className="h-5 w-5" />
              </Button>
              <CardTitle className="pr-8 flex items-center gap-2">
                <span className="text-2xl">📋</span>
                TO-DO Pengembangan
              </CardTitle>
              <CardDescription className="text-white/90">Fitur yang akan datang</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Item 1 */}
                <div className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-950 rounded-xl border-2 border-orange-200 dark:border-orange-800">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
                    <span className="text-sm font-bold text-white">1</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-base text-foreground">Menambah WA Gateway</p>
                    <p className="text-sm text-muted-foreground mt-1.5">Integrasi WhatsApp untuk notifikasi customer secara otomatis</p>
                  </div>
                </div>

                {/* Item 2 */}
                <div className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-950 rounded-xl border-2 border-orange-200 dark:border-orange-800">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
                    <span className="text-sm font-bold text-white">2</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-base text-foreground">Scan Kartu Menggunakan Handphone</p>
                    <p className="text-sm text-muted-foreground mt-1.5">Fitur scan kartu member menggunakan kamera smartphone</p>
                  </div>
                </div>

                {/* Item 3 */}
                <div className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-950 rounded-xl border-2 border-orange-200 dark:border-orange-800">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
                    <span className="text-sm font-bold text-white">3</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-base text-foreground">Catat Transaksi Customer</p>
                    <p className="text-sm text-muted-foreground mt-1.5">Sistem pencatatan transaksi dan riwayat belanja customer</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-6 pt-4 border-t">
                <Button
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                  onClick={() => setShowTodoModal(false)}
                >
                  Tutup
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </StaffMobileLayout>
  );
}
