import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { customersAPI, branchesAPI } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { useToast } from '../components/ui/use-toast';
import { Phone, Mail, MapPin, Calendar, User, X } from 'lucide-react';

export default function StaffMobile() {
  const { addToast } = useToast();
  const { user } = useSelector((state) => state.auth);
  const [branch, setBranch] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchBranch();
    fetchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold">Portal Staff (Mobile)</h1>
          <p className="text-sm text-muted-foreground">{branch ? branch.branch_name : 'Branch'}</p>
        </div>
        <Button onClick={() => fetchCustomers(query)} size="sm">Refresh</Button>
      </div>

      <div className="mb-4">
        <Input
          placeholder="Cari pelanggan (nama / email)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchCustomers(query)}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : customers.length === 0 ? (
        <p className="text-center text-muted-foreground">Tidak ada pelanggan untuk cabang ini.</p>
      ) : (
        <div className="space-y-3">
          {customers.map((c) => (
            <Card key={c.customer_id} className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="font-medium">{c.full_name || c.email}</span>
                  <span className={`text-xs px-2 py-1 rounded ${c.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                    {c.status}
                  </span>
                </CardTitle>
                <CardDescription className="text-xs">{c.email}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">{c.phone || '-'}</div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => navigator.clipboard?.writeText(c.email)}>
                      Salin Email
                    </Button>
                    <Button size="sm" onClick={() => handleViewDetail(c)}>Detail</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Customer Detail Modal */}
      {showDetailModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader className="relative">
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
                {selectedCustomer.email && (
                  <Button
                    className="flex-1"
                    onClick={() => window.location.href = `mailto:${selectedCustomer.email}`}
                  >
                    Kirim Email
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
