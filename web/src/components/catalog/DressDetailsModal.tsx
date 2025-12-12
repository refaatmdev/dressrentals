import { useEffect, useState } from 'react';
import { X, Calendar, MapPin, User, DollarSign, AlertCircle } from 'lucide-react';
import { rentalService } from '../../services/rentalService';
import type { Dress, Rental } from '../../types';

interface DressDetailsModalProps {
    dress: Dress | null;
    onClose: () => void;
}

export const DressDetailsModal = ({ dress, onClose }: DressDetailsModalProps) => {
    const [rentals, setRentals] = useState<Rental[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (dress) {
            setLoading(true);
            rentalService.getRentalsByDress(dress.id)
                .then(setRentals)
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [dress]);

    if (!dress) return null;

    const formatDate = (date: any) => {
        if (!date) return '';
        // Handle Firestore Timestamp or Date object
        const d = date.toDate ? date.toDate() : new Date(date);
        return new Intl.DateTimeFormat('he-IL').format(d);
    };

    const futureRentals = rentals.filter(r => {
        const date = r.eventDate instanceof Date ? r.eventDate : (r.eventDate as any).toDate();
        return date > new Date();
    });

    const pastRentals = rentals.filter(r => {
        const date = r.eventDate instanceof Date ? r.eventDate : (r.eventDate as any).toDate();
        return date <= new Date();
    });

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col md:flex-row overflow-hidden">

                {/* Left Side - Image & Basic Info */}
                <div className="w-full md:w-1/3 bg-gray-50 p-6 flex flex-col">
                    <div className="aspect-[3/4] rounded-xl overflow-hidden mb-6 shadow-md">
                        <img src={dress.imageUrl} alt={dress.modelName} className="w-full h-full object-cover" />
                    </div>

                    <h2 className="text-2xl font-serif font-bold text-charcoal mb-2">{dress.modelName}</h2>

                    <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-2 text-gray-600">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium 
                ${dress.status === 'available' ? 'bg-green-100 text-green-700' :
                                    dress.status === 'rented' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                {dress.status === 'available' ? 'זמינה' : dress.status === 'rented' ? 'מושכרת' : 'בטיפול'}
                            </span>
                        </div>

                        {dress.rentalPrice && (
                            <div className="flex items-center gap-2 text-gray-700 font-medium">
                                <DollarSign size={18} className="text-gold" />
                                <span>מחיר השכרה: ₪{dress.rentalPrice.toLocaleString()}</span>
                            </div>
                        )}

                        <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm mt-4">
                            <h4 className="font-bold text-gray-900 mb-2 text-sm">נתונים כלליים</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">סה״כ השכרות:</span>
                                    <span className="font-medium">{dress.rentalCount}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">מיקום אחרון:</span>
                                    <span className="font-medium">{dress.lastLocation}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">עלות ייצור:</span>
                                    <span className="font-medium">₪{dress.productionCosts.totalCost.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - History & Schedule */}
                <div className="w-full md:w-2/3 p-6 flex flex-col relative">
                    <button onClick={onClose} className="absolute top-4 left-4 p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} />
                    </button>

                    <h3 className="text-xl font-bold text-charcoal mb-6">היסטוריית השכרות</h3>

                    {loading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gold"></div>
                        </div>
                    ) : rentals.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                            <AlertCircle size={48} className="mb-2 opacity-20" />
                            <p>שמלה זו לא הושכרה מעולם</p>
                        </div>
                    ) : (
                        <div className="space-y-8 overflow-y-auto pr-2">
                            {/* Future Rentals */}
                            {futureRentals.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">השכרות עתידיות</h4>
                                    <div className="space-y-3">
                                        {futureRentals.map(rental => (
                                            <div key={rental.id} className="flex items-center gap-4 p-4 bg-gold/5 border border-gold/20 rounded-xl">
                                                <div className="w-10 h-10 rounded-full bg-gold text-white flex items-center justify-center font-bold text-xs">
                                                    {new Date(rental.eventDate).getDate()}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-bold text-charcoal">{rental.clientName}</p>
                                                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                                                        <span className="flex items-center gap-1"><MapPin size={14} /> {rental.eventCity}</span>
                                                        <span className="flex items-center gap-1"><Calendar size={14} /> {formatDate(rental.eventDate)}</span>
                                                    </div>
                                                </div>
                                                <div className="text-gold-dark font-bold">₪{rental.finalPrice}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Past Rentals */}
                            <div>
                                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">היסטוריה</h4>
                                <div className="space-y-3">
                                    {pastRentals.map(rental => (
                                        <div key={rental.id} className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-xl hover:shadow-md transition-shadow">
                                            <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center font-bold text-xs">
                                                <User size={16} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold text-charcoal">{rental.clientName}</p>
                                                <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                                    <span className="flex items-center gap-1"><MapPin size={14} /> {rental.eventCity}</span>
                                                    <span className="flex items-center gap-1"><Calendar size={14} /> {formatDate(rental.eventDate)}</span>
                                                </div>
                                            </div>
                                            <div className="text-gray-400 font-medium">₪{rental.finalPrice}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
