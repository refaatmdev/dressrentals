import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Shirt, DollarSign, Users, TrendingUp, Eye } from 'lucide-react';
import { rentalService } from '../services/rentalService';
import { transactionService } from '../services/transactionService';
import { userService } from '../services/userService';
import { dressService } from '../services/dressService';
import type { Rental } from '../types';

export const AdminHome = () => {
    const [stats, setStats] = useState({
        activeRentals: 0,
        monthlyRevenue: 0,
        activeStaff: 0,
    });
    const [loading, setLoading] = useState(true);
    const [salesData, setSalesData] = useState<{ name: string; sales: number }[]>([]);
    const [recentRentals, setRecentRentals] = useState<Rental[]>([]);
    const [topDresses, setTopDresses] = useState<any[]>([]); // Using any for simplicity or import Dress type

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [rentals, transactions, staff, topScanned] = await Promise.all([
                    rentalService.getAllRentals(), // Fetch all to get recent ones too
                    transactionService.getAllTransactions(),
                    userService.getAllStaff(),
                    dressService.getTopScannedDresses(5)
                ]);

                // 1. Calculate Stats
                const activeRentalsCount = rentals.filter((r: Rental) => r.status === 'active').length;

                // Calculate revenue for current month
                const now = new Date();
                const currentMonthRevenue = transactions
                    .filter((t: any) => {
                        const date = t.timestamp instanceof Date ? t.timestamp : (t.timestamp as any).toDate();
                        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                    })
                    .reduce((sum: number, t: any) => sum + t.amount, 0);

                const activeStaffCount = staff.filter((u: any) => u.isActive !== false && u.role !== 'admin').length; // Exclude admins

                setStats({
                    activeRentals: activeRentalsCount,
                    monthlyRevenue: currentMonthRevenue,
                    activeStaff: activeStaffCount,
                });

                // 2. Prepare Chart Data (Last 6 Months)
                const months: Record<string, number> = {};
                for (let i = 5; i >= 0; i--) {
                    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    const key = new Intl.DateTimeFormat('he-IL', { month: 'short' }).format(d);
                    months[key] = 0;
                }

                transactions.forEach((t: any) => {
                    const date = t.timestamp instanceof Date ? t.timestamp : (t.timestamp as any).toDate();
                    const key = new Intl.DateTimeFormat('he-IL', { month: 'short' }).format(date);
                    if (months[key] !== undefined) {
                        months[key] += t.amount;
                    }
                });

                setSalesData(Object.entries(months).map(([name, sales]) => ({ name, sales })));

                // 3. Recent Activity (Last 5 rentals created)
                // Assuming rentals are sorted by creation or event date. 
                // Let's sort by eventDate for now as a proxy for "recent activity" or just take the top ones if getAllRentals returns them sorted.
                // Actually getAllRentals sorts by eventDate desc.
                setRecentRentals(rentals.slice(0, 5));
                setTopDresses(topScanned);

            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-charcoal">לוח בקרה</h1>
                    <p className="text-gray-500 mt-1">סקירה כללית של הסטודיו</p>
                </div>
                <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-gray-600">המערכת פעילה</span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass p-6 rounded-2xl flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 text-sm font-medium mb-1">השכרות פעילות</p>
                        <h3 className="text-3xl font-bold text-charcoal">{stats.activeRentals}</h3>
                    </div>
                    <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center text-gold-dark">
                        <Shirt size={24} />
                    </div>
                </div>

                <div className="glass p-6 rounded-2xl flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 text-sm font-medium mb-1">הכנסות החודש</p>
                        <h3 className="text-3xl font-bold text-charcoal">₪{stats.monthlyRevenue.toLocaleString()}</h3>
                    </div>
                    <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                        <DollarSign size={24} />
                    </div>
                </div>

                <div className="glass p-6 rounded-2xl flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 text-sm font-medium mb-1">צוות פעיל</p>
                        <h3 className="text-3xl font-bold text-charcoal">{stats.activeStaff}</h3>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                        <Users size={24} />
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 glass p-6 rounded-2xl">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-charcoal flex items-center gap-2">
                            <TrendingUp size={20} className="text-gold" />
                            מגמת מכירות (חצי שנה אחרונה)
                        </h3>
                    </div>

                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={salesData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#6B7280', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#6B7280', fontSize: 12 }}
                                    tickFormatter={(value) => `₪${value}`}
                                />
                                <Tooltip
                                    cursor={{ fill: '#F3F4F6' }}
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        borderRadius: '12px',
                                        border: 'none',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                    }}
                                    formatter={(value: number) => [`₪${value.toLocaleString()}`, 'הכנסות']}
                                />
                                <Bar
                                    dataKey="sales"
                                    fill="#D4AF37"
                                    radius={[6, 6, 0, 0]}
                                    barSize={40}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Top Trending Dresses */}
                    <div className="glass p-6 rounded-2xl">
                        <h3 className="text-lg font-bold text-charcoal mb-4 flex items-center gap-2">
                            <Eye size={20} className="text-gold" />
                            הכי נצפות (סריקות)
                        </h3>
                        <div className="space-y-4">
                            {topDresses.map((dress, index) => (
                                <div key={dress.id} className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xs">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{dress.modelName}</p>
                                        <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                                            <div
                                                className="bg-gold h-1.5 rounded-full"
                                                style={{ width: `${Math.min((dress.scanCount || 0) * 2, 100)}%` }} // Simple scaling
                                            ></div>
                                        </div>
                                    </div>
                                    <div className="text-sm font-bold text-gray-900">{dress.scanCount || 0}</div>
                                </div>
                            ))}
                            {topDresses.length === 0 && (
                                <p className="text-center text-gray-400 py-4">אין נתוני סריקה עדיין</p>
                            )}
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="glass p-6 rounded-2xl">
                        <h3 className="text-lg font-bold text-charcoal mb-4">פעילות אחרונה (השכרות)</h3>
                        <div className="space-y-4">
                            {recentRentals.map((rental) => (
                                <div key={rental.id} className="flex items-center gap-3 p-3 hover:bg-white/50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-gray-100">
                                    <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-gold-dark font-bold text-xs">
                                        RM
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{rental.dressName}</p>
                                        <p className="text-xs text-gray-500">
                                            {rental.clientName} • {new Intl.DateTimeFormat('he-IL').format(rental.eventDate instanceof Date ? rental.eventDate : (rental.eventDate as any).toDate())}
                                        </p>
                                    </div>
                                    <div className="text-sm font-bold text-gray-900">₪{rental.finalPrice.toLocaleString()}</div>
                                </div>
                            ))}
                            {recentRentals.length === 0 && (
                                <p className="text-center text-gray-400 py-8">אין פעילות אחרונה</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
