import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { customersAPI, branchesAPI } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { useToast } from '../components/ui/use-toast';

export default function StaffMobile() {
  const { addToast } = useToast();
  const { user } = useSelector((state) => state.auth);
  const [branch, setBranch] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

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
                    <Button size="sm" onClick={() => window.alert(JSON.stringify(c, null, 2))}>Detail</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
