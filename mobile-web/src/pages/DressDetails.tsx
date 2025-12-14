import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dressService } from '../services/dressService';
import { rentalService } from '../services/rentalService';
import type { Dress, Rental } from '../types';
import { ArrowRight, ChevronDown, ChevronUp, AlertTriangle, Calendar, MapPin, User, DollarSign, Scissors, Gem, Layers, Eye } from 'lucide-react';

import { useAuth } from '../context/AuthContext';

export const DressDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAdmin } = useAuth();
    const [dress, setDress] = useState<Dress | null>(null);
    const [rentals, setRentals] = useState<Rental[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCosts, setShowCosts] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            try {
                const [dressData, rentalsData] = await Promise.all([
                    dressService.getDress(id),
                    rentalService.getRentalsByDress(id)
                ]);
                setDress(dressData);
                setRentals(rentalsData);
            } catch (error) {
                console.error('Error fetching details:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
            </div>
        );
    }

    if (!dress) {
        return (
            <div className="p-8 text-center">
                <p className="text-gray-500">השמלה לא נמצאה</p>
                <button onClick={() => navigate(-1)} className="text-gold font-bold mt-4">חזרה</button>
            </div>
        );
    }

    const formatDate = (date: any) => {
        const d = date instanceof Date ? date : date.toDate();
        return new Intl.DateTimeFormat('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'available': return 'bg-green-100 text-green-700';
            case 'rented': return 'bg-red-100 text-red-700';
            case 'cleaning': return 'bg-blue-100 text-blue-700';
            case 'repair': return 'bg-orange-100 text-orange-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'available': return 'פנויה';
            case 'rented': return 'מושכרת';
            case 'cleaning': return 'בניקוי';
            case 'repair': return 'בתיקון';
            default: return status;
        }
    };

    return (
        <div className="pb-24 bg-white min-h-screen">
            {/* Hero Image */}
            <div className="relative h-[40vh] bg-gray-100">
                {dress.imageUrl ? (
                    <img src={dress.imageUrl} alt={dress.modelName} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <Scissors size={48} />
                    </div>
                )}

                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-4 right-4 w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-gray-700 shadow-sm z-10"
                >
                    <ArrowRight size={20} />
                </button>

                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6 pt-20 text-white">
                    <div className="flex justify-between items-end">
                        <div>
                            <h1 className="text-3xl font-serif font-bold mb-1">{dress.modelName}</h1>
                            <p className="opacity-90 font-mono text-sm">#{dress.id.slice(0, 6)}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md ${getStatusColor(dress.status)} bg-opacity-90`}>
                            {getStatusLabel(dress.status)}
                        </span>
                    </div>

                    <div className="flex justify-between items-end mt-2">
                        {/* Scan Count */}
                        <div className="flex items-center gap-2 opacity-80">
                            <Eye size={14} />
                            <span className="text-xs font-medium">{dress.scanCount || 0} צפיות</span>
                        </div>

                        {/* Rental Price */}
                        {dress.rentalPrice && (
                            <div className="flex items-center gap-1 bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg">
                                <span className="text-sm">מחיר השכרה:</span>
                                <span className="font-bold text-lg">₪{dress.rentalPrice}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-8">
                {/* Section A: Production Costs */}
                {/* Section A: Production Costs - Only for Admins */}
                {isAdmin && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <button
                            onClick={() => setShowCosts(!showCosts)}
                            className="w-full p-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gold/10 text-gold-dark flex items-center justify-center">
                                    <DollarSign size={16} />
                                </div>
                                <span className="font-bold text-gray-700">עלויות ייצור</span>
                            </div>
                            {showCosts ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                        </button>

                        {showCosts && (
                            <div className="p-4 space-y-3 animate-fade-in-up">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 flex items-center gap-2"><Layers size={14} /> בדים</span>
                                    <span className="font-medium">₪{dress.productionCosts.fabricCost}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 flex items-center gap-2"><Scissors size={14} /> תפירה</span>
                                    <span className="font-medium">₪{dress.productionCosts.sewingCost}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 flex items-center gap-2"><Gem size={14} /> תכשיטים</span>
                                    <span className="font-medium">₪{dress.productionCosts.jewelryCost}</span>
                                </div>
                                <div className="pt-3 border-t border-gray-100 flex justify-between font-bold text-charcoal">
                                    <span>סה"כ עלות</span>
                                    <span>₪{dress.productionCosts.totalCost}</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Section B: Designer Notes */}
                {dress.staffNotes && (
                    <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100 flex gap-4">
                        <AlertTriangle className="text-orange-500 flex-shrink-0" size={24} />
                        <div>
                            <h3 className="font-bold text-orange-800 text-sm mb-1">הערות לצוות</h3>
                            <p className="text-orange-700 text-sm leading-relaxed">{dress.staffNotes}</p>
                        </div>
                    </div>
                )}

                {/* Section C: Rental Log */}
                <div>
                    <h3 className="font-serif font-bold text-xl text-charcoal mb-4 flex items-center gap-2">
                        <Calendar className="text-gold-dark" size={20} />
                        היסטוריית השכרות
                    </h3>

                    <div className="relative border-r-2 border-gray-100 mr-3 space-y-8">
                        {rentals.map((rental) => {
                            const isPast = new Date(rental.eventDate) < new Date();
                            return (
                                <div key={rental.id} className="relative pr-6">
                                    <div className={`absolute -right-[9px] top-1 w-4 h-4 rounded-full border-2 ${isPast ? 'bg-gray-200 border-gray-300' : 'bg-green-500 border-green-200'
                                        }`}></div>

                                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-bold text-gray-900">{formatDate(rental.eventDate)}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${rental.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                {rental.status === 'active' ? 'פעיל' : 'הושלם'}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
                                            <User size={14} />
                                            <span>{rental.clientName}</span>
                                        </div>

                                        {rental.eventCity && (
                                            <div className="flex items-center gap-2 text-gray-500 text-xs">
                                                <MapPin size={12} />
                                                <span>{rental.eventCity}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {rentals.length === 0 && (
                            <div className="pr-6 text-gray-400 text-sm">אין היסטוריית השכרות</div>
                        )}
                    </div>
                </div>
            </div>
        </div >
    );
};
