import { useAnalyticsData } from '../hooks/useAnalyticsData';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
    TrendingUp, DollarSign, Activity, MapPin, AlertTriangle,
    Award, Eye, ShoppingBag
} from 'lucide-react';

const COLORS = ['#D4AF37', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export const Analytics = () => {
    const { data, loading, error } = useAnalyticsData();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
            </div>
        );
    }

    if (error || !data) {
        return <div className="text-red-500 text-center p-8">שגיאה בטעינת הנתונים</div>;
    }

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-serif font-bold text-charcoal">תובנות וניתוח נתונים</h1>
                <p className="text-gray-500 mt-1">מבט על ביצועי הסטודיו, מגמות ורווחיות</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard
                    title="הכנסות כוללות"
                    value={`₪${data.kpis.totalRevenue.toLocaleString()} `}
                    icon={DollarSign}
                    color="text-green-600"
                    bg="bg-green-50"
                />
                <KpiCard
                    title="רווח נקי"
                    value={`₪${data.kpis.netProfit.toLocaleString()} `}
                    icon={TrendingUp}
                    color="text-gold-dark"
                    bg="bg-gold/10"
                />
                <KpiCard
                    title="יחס המרה (סריקה להשכרה)"
                    value={`${data.kpis.conversionRate.toFixed(1)}% `}
                    icon={Activity}
                    color="text-blue-600"
                    bg="bg-blue-50"
                />
                <KpiCard
                    title="עיר מובילה"
                    value={data.kpis.topCity}
                    icon={MapPin}
                    color="text-purple-600"
                    bg="bg-purple-50"
                />
            </div>

            {/* Row 1: Interest Funnel */}
            <div className="glass p-6 rounded-2xl">
                <h3 className="text-lg font-bold text-charcoal mb-6">משפך התעניינות (חודשי)</h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.funnel} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                            />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={40}>
                                {data.funnel.map((entry, index) => (
                                    <Cell key={`cell - ${index} `} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Row 2: Seasonality & Geography */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Seasonality */}
                <div className="glass p-6 rounded-2xl">
                    <h3 className="text-lg font-bold text-charcoal mb-6">עונתיות (השכרות לפי חודש)</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.seasonality}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                                />
                                <Line type="monotone" dataKey="rentals" stroke="#D4AF37" strokeWidth={3} dot={{ r: 4, fill: '#D4AF37' }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Geography */}
                <div className="glass p-6 rounded-2xl">
                    <h3 className="text-lg font-bold text-charcoal mb-6">התפלגות לפי ערים</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.geography}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {data.geography.map((_, index) => (
                                        <Cell key={`cell - ${index} `} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Row 3: Product Performance Table */}
            <div className="glass p-6 rounded-2xl overflow-hidden">
                <h3 className="text-lg font-bold text-charcoal mb-6">ביצועי שמלות (Top 10 ROI)</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead>
                            <tr className="text-gray-500 text-sm border-b border-gray-100">
                                <th className="pb-3 font-medium">שמלה</th>
                                <th className="pb-3 font-medium text-center">צפיות</th>
                                <th className="pb-3 font-medium text-center">השכרות</th>
                                <th className="pb-3 font-medium text-center">ROI</th>
                                <th className="pb-3 font-medium">סטטוס</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {data.productPerformance.map((dress) => (
                                <tr key={dress.id} className="group hover:bg-gray-50/50 transition-colors">
                                    <td className="py-4 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden">
                                            {dress.imageUrl ? (
                                                <img src={dress.imageUrl} alt={dress.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">RM</div>
                                            )}
                                        </div>
                                        <span className="font-medium text-gray-900">{dress.name}</span>
                                    </td>
                                    <td className="py-4 text-center">
                                        <div className="inline-flex items-center gap-1 text-gray-600 bg-gray-100 px-2 py-1 rounded-full text-xs">
                                            <Eye size={12} /> {dress.scans}
                                        </div>
                                    </td>
                                    <td className="py-4 text-center">
                                        <div className="inline-flex items-center gap-1 text-gray-600 bg-gray-100 px-2 py-1 rounded-full text-xs">
                                            <ShoppingBag size={12} /> {dress.rentals}
                                        </div>
                                    </td>
                                    <td className="py-4 text-center">
                                        <span className={`font - bold ${dress.roi > 0 ? 'text-green-600' : 'text-red-500'} `}>
                                            {dress.roi.toFixed(0)}%
                                        </span>
                                    </td>
                                    <td className="py-4">
                                        <div className="flex gap-2">
                                            {dress.tags.includes('cash_cow') && (
                                                <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold border border-yellow-200">
                                                    <Award size={12} /> כוכב רווח
                                                </span>
                                            )}
                                            {dress.tags.includes('potential_issue') && (
                                                <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-bold border border-red-200">
                                                    <AlertTriangle size={12} /> דורש בדיקה
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Row 4: Dead Stock Alert */}
            {data.deadStock.length > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-6">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-red-100 rounded-xl text-red-600">
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-red-900 mb-1">מלאי ללא תנועה ("Dead Stock")</h3>
                            <p className="text-red-700 text-sm mb-4">
                                השמלות הבאות לא נסרקו ולא הושכרו ב-90 הימים האחרונים. מומלץ לשקול מבצע חיסול או שינוי מיקום בתצוגה.
                            </p>
                            <div className="flex flex-wrap gap-3">
                                {data.deadStock.map(dress => (
                                    <div key={dress.id} className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-red-100 shadow-sm">
                                        <div className="w-8 h-8 rounded bg-gray-100 overflow-hidden">
                                            {dress.imageUrl && <img src={dress.imageUrl} alt={dress.name} className="w-full h-full object-cover" />}
                                        </div>
                                        <span className="text-sm font-medium text-gray-700">{dress.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const KpiCard = ({ title, value, icon: Icon, color, bg }: { title: string, value: string, icon: any, color: string, bg: string }) => (
    <div className="glass p-6 rounded-2xl flex items-center justify-between hover:scale-[1.02] transition-transform duration-300">
        <div>
            <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-charcoal">{value}</h3>
        </div>
        <div className={`w - 12 h - 12 ${bg} rounded - xl flex items - center justify - center ${color} `}>
            <Icon size={24} />
        </div>
    </div>
);
