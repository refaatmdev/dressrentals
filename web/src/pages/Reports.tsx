import { useEffect, useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { TrendingUp, Award, CreditCard, Calendar } from 'lucide-react';
import { transactionService } from '../services/transactionService';
import { rentalService } from '../services/rentalService';
import type { Transaction, Rental } from '../types';

export const Reports = () => {
    const [loading, setLoading] = useState(true);
    const [monthlyRevenue, setMonthlyRevenue] = useState<{ name: string; amount: number }[]>([]);
    const [topDresses, setTopDresses] = useState<{ name: string; count: number }[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<{ name: string; value: number }[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [transactions, rentals] = await Promise.all([
                transactionService.getAllTransactions(),
                rentalService.getAllRentals()
            ]);

            processRevenueData(transactions);
            processTopDresses(rentals);
            processPaymentMethods(transactions);
        } catch (error) {
            console.error('Error fetching report data:', error);
        } finally {
            setLoading(false);
        }
    };

    const processRevenueData = (transactions: Transaction[]) => {
        // Group by month (last 6 months)
        const months: Record<string, number> = {};
        const now = new Date();

        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = new Intl.DateTimeFormat('he-IL', { month: 'short' }).format(d);
            months[key] = 0;
        }

        transactions.forEach(t => {
            const date = t.timestamp instanceof Date ? t.timestamp : (t.timestamp as any).toDate();
            // Only count if within last 6 months (simplified check)
            const key = new Intl.DateTimeFormat('he-IL', { month: 'short' }).format(date);
            if (months[key] !== undefined) {
                months[key] += t.amount;
            }
        });

        setMonthlyRevenue(Object.entries(months).map(([name, amount]) => ({ name, amount })));
    };

    const processTopDresses = (rentals: Rental[]) => {
        const counts: Record<string, number> = {};
        rentals.forEach(r => {
            counts[r.dressName] = (counts[r.dressName] || 0) + 1;
        });

        const sorted = Object.entries(counts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));

        setTopDresses(sorted);
    };

    const processPaymentMethods = (transactions: Transaction[]) => {
        const counts: Record<string, number> = {
            cash: 0,
            credit: 0,
            bit: 0,
            check: 0
        };

        transactions.forEach(t => {
            if (counts[t.paymentMethod] !== undefined) {
                counts[t.paymentMethod] += t.amount;
            }
        });

        const labels: Record<string, string> = {
            cash: 'מזומן',
            credit: 'אשראי',
            bit: 'ביט',
            check: 'צ׳ק'
        };

        setPaymentMethods(Object.entries(counts).map(([key, value]) => ({
            name: labels[key],
            value
        })).filter(item => item.value > 0));
    };

    const COLORS = ['#D4AF37', '#1F2937', '#9CA3AF', '#E5E7EB'];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-charcoal">דוחות וניתוח נתונים</h1>
                    <p className="text-gray-500 mt-1">סקירה מעמיקה של ביצועי העסק</p>
                </div>
                <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2">
                    <Calendar size={18} className="text-gold" />
                    <span className="text-sm font-medium text-gray-600">חצי שנה אחרונה</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Revenue Chart */}
                <div className="glass p-6 rounded-2xl lg:col-span-2">
                    <h3 className="text-lg font-bold text-charcoal mb-6 flex items-center gap-2">
                        <TrendingUp size={20} className="text-gold" />
                        הכנסות חודשיות
                    </h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyRevenue}>
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
                                    dataKey="amount"
                                    fill="#D4AF37"
                                    radius={[6, 6, 0, 0]}
                                    barSize={50}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Dresses */}
                <div className="glass p-6 rounded-2xl">
                    <h3 className="text-lg font-bold text-charcoal mb-6 flex items-center gap-2">
                        <Award size={20} className="text-gold" />
                        השמלות המבוקשות ביותר
                    </h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topDresses} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    axisLine={false}
                                    tickLine={false}
                                    width={100}
                                    tick={{ fill: '#374151', fontSize: 12, fontWeight: 500 }}
                                />
                                <Tooltip
                                    cursor={{ fill: '#F3F4F6' }}
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        borderRadius: '12px',
                                        border: 'none',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                    }}
                                />
                                <Bar
                                    dataKey="count"
                                    fill="#1F2937"
                                    radius={[0, 6, 6, 0]}
                                    barSize={30}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Payment Methods */}
                <div className="glass p-6 rounded-2xl">
                    <h3 className="text-lg font-bold text-charcoal mb-6 flex items-center gap-2">
                        <CreditCard size={20} className="text-gold" />
                        התפלגות אמצעי תשלום
                    </h3>
                    <div className="h-80 w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={paymentMethods}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {paymentMethods.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        borderRadius: '12px',
                                        border: 'none',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                    }}
                                    formatter={(value: number) => `₪${value.toLocaleString()}`}
                                />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};
