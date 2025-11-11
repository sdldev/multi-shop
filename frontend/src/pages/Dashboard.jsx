import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { dashboardAPI } from '../utils/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { useToast } from '../components/ui/toast';
import { Users, UserCheck, UserX, Building2, UserCog, Shield } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

export default function Dashboard() {
  const { user } = useSelector((state) => state.auth);
  const { addToast } = useToast();
  const [stats, setStats] = useState(null);
  const [branchStats, setBranchStats] = useState([]);
  const [recentCustomers, setRecentCustomers] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, recentRes] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getRecentCustomers(10),
      ]);

      setStats(statsRes.data.data);
      setRecentCustomers(recentRes.data.data);

      if (isAdmin) {
        const [branchRes, trendsRes] = await Promise.all([
          dashboardAPI.getBranchStats(),
          dashboardAPI.getCustomerTrends(),
        ]);
        setBranchStats(branchRes.data.data);
        setTrends(trendsRes.data.data);
      }
    } catch (error) {
      addToast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Branches',
      value: stats?.totalBranches || 0,
      icon: Building2,
      show: true,
    },
    {
      title: 'Total Customers',
      value: stats?.totalCustomers || 0,
      icon: Users,
    },
    {
      title: 'Active Customers',
      value: stats?.activeCustomers || 0,
      icon: UserCheck,
      description: 'Currently active',
    },
    {
      title: 'Inactive Customers',
      value: stats?.inactiveCustomers || 0,
      icon: UserX,
      description: 'Currently inactive',
    },
    {
      title: 'Total Staff',
      value: stats?.totalStaff || 0,
      icon: UserCog,
      show: isAdmin,
    },
    {
      title: 'Total Admins',
      value: stats?.totalAdmins || 0,
      icon: Shield,
      show: isAdmin,
    },
  ].filter(card => card.show !== false);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.full_name}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              {card.description && (
                <p className="text-xs text-muted-foreground">
                  {card.description}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Customer Trends Chart - Admin Only */}
      {isAdmin && trends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Customer Registration Trends</CardTitle>
            <CardDescription>Last 12 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Branch Statistics - Admin Only */}
      {isAdmin && branchStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Branch Statistics</CardTitle>
            <CardDescription>Overview of all branches</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Branch Name</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead className="text-right">Customers</TableHead>
                  <TableHead className="text-right">Active</TableHead>
                  <TableHead className="text-right">Inactive</TableHead>
                  <TableHead className="text-right">Staff</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {branchStats.map((branch) => (
                  <TableRow key={branch.branch_id}>
                    <TableCell className="font-medium">{branch.branch_name}</TableCell>
                    <TableCell>{branch.manager_name}</TableCell>
                    <TableCell className="text-right">{branch.total_customers}</TableCell>
                    <TableCell className="text-right">{branch.active_customers}</TableCell>
                    <TableCell className="text-right">{branch.inactive_customers}</TableCell>
                    <TableCell className="text-right">{branch.total_staff}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Recent Customers */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Customer Registrations</CardTitle>
          <CardDescription>Latest customers added to the system</CardDescription>
        </CardHeader>
        <CardContent>
          {recentCustomers.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No customers found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registered</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentCustomers.map((customer) => (
                  <TableRow key={customer.customer_id}>
                    <TableCell className="font-medium">{customer.full_name}</TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>{customer.branch_name}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          customer.status === 'Active'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                        }`}
                      >
                        {customer.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      {format(new Date(customer.registration_date), 'MMM dd, yyyy')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
