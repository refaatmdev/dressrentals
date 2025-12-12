import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { rentalService } from '../services/rentalService';
import { useAuth } from '../context/AuthContext';
import { useShift } from '../context/ShiftContext';
import type { Rental } from '../types';
import { Phone, Calendar, User, Shirt, MessageCircle, Grid, ScanLine, Play, Square } from 'lucide-react';

export const Dashboard = () => {
    const { user, isAdmin } = useAuth();
    const { activeShift, startShift, endShift, loading: shiftLoading } = useShift();
    const navigate = useNavigate();
    const [rentals, setRentals] = useState<Rental[]>([]);
    const [loading, setLoading] = useState(true);
    const [elapsedTime, setElapsedTime] = useState<string>('00:00:00');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Rentals
                const rentalsData = await rentalService.getActiveRentals();
                const sortedRentals = rentalsData.sort((a, b) => {
                    const dateA = a.eventDate instanceof Date ? a.eventDate : (a.eventDate as any).toDate();
                    const dateB = b.eventDate instanceof Date ? b.eventDate : (b.eventDate as any).toDate();
                    return dateA.getTime() - dateB.getTime();
                });
                setRentals(sortedRentals);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    // Timer logic
    useEffect(() => {
        const updateTimer = () => {
            if (!activeShift) {
                setElapsedTime('00:00:00');
                return;
            }

            const start = activeShift.startTime instanceof Date ? activeShift.startTime : (activeShift.startTime as any).toDate();
            const now = new Date();
            const diff = now.getTime() - start.getTime();

            if (diff < 0) {
                setElapsedTime('00:00:00');
                return;
            }

            const hours = Math.floor(diff / 3600000);
            const minutes = Math.floor((diff % 3600000) / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);

            setElapsedTime(
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            );
        };

        let interval: ReturnType<typeof setInterval>;

        if (activeShift) {
            updateTimer(); // Run immediately
            interval = setInterval(updateTimer, 1000);
        } else {
            setElapsedTime('00:00:00');
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [activeShift]);

    const handleShiftToggle = async () => {
        if (!user) return;
        setActionLoading(true);
        try {
            if (activeShift) {
                await endShift();
            } else {
                await startShift();
            }
        } catch (error) {
            console.error('Error toggling shift:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const formatDate = (date: any) => {
        const d = date instanceof Date ? date : date.toDate();
        return new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'long' }).format(d);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-700';
            case 'completed': return 'bg-gray-100 text-gray-700';
            case 'cancelled': return 'bg-red-100 text-red-700';
            default: return 'bg-gold/10 text-gold-dark';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'active': return 'פעיל';
            case 'completed': return 'הושלם';
            case 'cancelled': return 'בוטל';
            default: return status;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20 p-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-serif font-bold text-charcoal">שלום, {user?.displayName?.split(' ')[0]}</h1>
                    <p className="text-gray-500 text-sm">ברוכה הבאה למשמרת</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center text-gold-dark font-bold text-lg border border-gold/20">
                    {user?.displayName?.charAt(0).toUpperCase()}
                </div>
            </div>

            {/* Time Clock Widget */}
            <div className="bg-white rounded-3xl p-6 shadow-lg shadow-gray-100 border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>

                <div className="flex items-center justify-between relative z-10">
                    <div>
                        <p className="text-gray-500 text-sm mb-1">שעון נוכחות</p>
                        <div className="font-mono text-3xl font-bold text-charcoal tracking-wider">
                            {elapsedTime}
                        </div>
                    </div>

                    <button
                        onClick={handleShiftToggle}
                        disabled={actionLoading || shiftLoading}
                        className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all shadow-md ${activeShift
                            ? 'bg-red-50 text-red-500 hover:bg-red-100 border border-red-100'
                            : 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-100'
                            }`}
                    >
                        {actionLoading ? (
                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-current border-t-transparent"></div>
                        ) : activeShift ? (
                            <Square fill="currentColor" size={24} />
                        ) : (
                            <Play fill="currentColor" size={24} />
                        )}
                    </button>
                </div>

                <div className="mt-4 flex items-center gap-2 text-xs font-medium">
                    <div className={`w-2 h-2 rounded-full ${activeShift ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
                    <span className={activeShift ? 'text-green-600' : 'text-gray-400'}>
                        {activeShift ? 'את במשמרת פעילה' : 'לא במשמרת'}
                    </span>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
                <button
                    onClick={() => navigate('/gallery')}
                    className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-3 hover:shadow-md transition-all group"
                >
                    <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Grid size={24} />
                    </div>
                    <span className="font-medium text-gray-700">גלריה</span>
                </button>

                <button
                    onClick={() => navigate('/scanner')}
                    className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-3 hover:shadow-md transition-all group"
                >
                    <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <ScanLine size={24} />
                    </div>
                    <span className="font-medium text-gray-700">סריקה</span>
                </button>
            </div>

            {/* Active Rentals */}
            {/* Active Rentals - Only for Admins */}
            {isAdmin && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-serif font-bold text-charcoal">השכרות קרובות</h2>
                        <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium">
                            {rentals.length}
                        </span>
                    </div>

                    <div className="space-y-4">
                        {rentals.map((rental) => (
                            <div key={rental.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm relative overflow-hidden">
                                <div className="flex gap-4">
                                    <div className="w-14 h-14 rounded-xl bg-gray-50 flex items-center justify-center text-gray-300 border border-gray-100 flex-shrink-0">
                                        <Shirt size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className="font-bold text-gray-900 truncate">{rental.dressName}</h3>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getStatusColor(rental.status)}`}>
                                                {getStatusLabel(rental.status)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-500 text-xs mb-3">
                                            <Calendar size={12} />
                                            <span>{formatDate(rental.eventDate)}</span>
                                        </div>

                                        <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                                            <div className="flex items-center gap-2">
                                                <User size={14} className="text-gray-400" />
                                                <span className="text-sm font-medium text-gray-700">{rental.clientName}</span>
                                            </div>
                                            <div className="flex gap-2">
                                                {rental.clientPhone && (
                                                    <>
                                                        <a
                                                            href={`tel:${rental.clientPhone}`}
                                                            className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100 transition-colors"
                                                        >
                                                            <Phone size={14} />
                                                        </a>
                                                        <a
                                                            href={`https://wa.me/${rental.clientPhone.replace(/\D/g, '')}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors"
                                                        >
                                                            <MessageCircle size={14} />
                                                        </a>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {rentals.length === 0 && (
                            <div className="text-center py-8 bg-white rounded-2xl border border-dashed border-gray-200">
                                <p className="text-gray-400 text-sm">אין השכרות פעילות</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
