import { useState, useEffect } from 'react';
import { X, Search, UserPlus, Calendar, DollarSign, Check, Loader2 } from 'lucide-react';
import { clientService } from '../../services/clientService';
import { rentalService } from '../../services/rentalService';
import { AddClientModal } from '../clients/AddClientModal';
import type { Dress, Client } from '../../types';

interface RentDressModalProps {
    dress: Dress | null;
    onClose: () => void;
    onSuccess: () => void;
}

export const RentDressModal = ({ dress, onClose, onSuccess }: RentDressModalProps) => {
    const [step, setStep] = useState<1 | 2>(1);
    const [loading, setLoading] = useState(false);

    // Step 1: Client Selection
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Client[]>([]);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [isAddClientOpen, setIsAddClientOpen] = useState(false);
    const [searching, setSearching] = useState(false);

    // Step 2: Rental Details
    const [eventDate, setEventDate] = useState('');
    const [returnDate, setReturnDate] = useState('');
    const [finalPrice, setFinalPrice] = useState<number>(0);
    const [eventCity, setEventCity] = useState('');

    // Reset state when modal opens/closes
    useEffect(() => {
        if (dress) {
            setStep(1);
            setSearchQuery('');
            setSelectedClient(null);
            setEventDate('');
            setReturnDate('');
            setFinalPrice(dress.rentalPrice || 0);
            setEventCity('');
        }
    }, [dress]);

    // Search Logic (Debounced)
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.trim().length > 0) {
                setSearching(true);
                try {
                    const allClients = await clientService.getAllClients();
                    const query = searchQuery.toLowerCase().trim();
                    const filtered = allClients.filter(c =>
                        (c.fullName && c.fullName.toLowerCase().includes(query)) ||
                        (c.phone && c.phone.includes(query))
                    );
                    setSearchResults(filtered);
                } catch (error) {
                    console.error(error);
                } finally {
                    setSearching(false);
                }
            } else {
                setSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    if (!dress) return null;

    const handleClientSelect = (client: Client) => {
        setSelectedClient(client);
        setStep(2);
    };

    const handleRentalSubmit = async () => {
        if (!selectedClient || !eventDate || !returnDate) return;

        setLoading(true);
        try {
            await rentalService.createRental({
                dressId: dress.id,
                dressName: dress.modelName,
                clientId: selectedClient.id,
                clientName: selectedClient.fullName,
                clientPhone: selectedClient.phone,
                eventDate: new Date(eventDate),
                returnDate: new Date(returnDate),
                eventCity,
                finalPrice,
                status: 'active'
            });

            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error creating rental:', error);
            alert('שגיאה ביצירת ההשכרה');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                    <div>
                        <h2 className="text-2xl font-serif font-bold text-charcoal">השכרת שמלה</h2>
                        <p className="text-gray-500 text-sm">{dress.modelName} - שלב {step} מתוך 2</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">

                    {/* STEP 1: Identify Client */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="relative">
                                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pr-12 pl-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-gold text-lg"
                                    placeholder="חפש לקוחה לפי שם או טלפון..."
                                    autoFocus
                                />
                                {searching && (
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                        <Loader2 className="animate-spin text-gold" size={20} />
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                {searchResults.map(client => (
                                    <button
                                        key={client.id}
                                        onClick={() => handleClientSelect(client)}
                                        className="w-full flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-gold hover:bg-gold/5 transition-all group text-right"
                                    >
                                        <div>
                                            <p className="font-bold text-charcoal group-hover:text-gold-dark">{client.fullName}</p>
                                            <p className="text-sm text-gray-500">{client.phone}</p>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-gold group-hover:text-white flex items-center justify-center transition-colors">
                                            <Check size={16} />
                                        </div>
                                    </button>
                                ))}

                                {searchQuery.trim().length > 0 && searchResults.length === 0 && !searching && (
                                    <div className="text-center py-8">
                                        <p className="text-gray-500 mb-4">לא נמצאו תוצאות עבור "{searchQuery}"</p>
                                        <button
                                            onClick={() => setIsAddClientOpen(true)}
                                            className="inline-flex items-center gap-2 text-gold font-bold hover:underline"
                                        >
                                            <UserPlus size={20} />
                                            צור לקוחה חדשה
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* STEP 2: Rental Details */}
                    {step === 2 && selectedClient && (
                        <div className="space-y-6">
                            <div className="bg-gold/10 p-4 rounded-xl flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold">לקוחה</p>
                                    <p className="font-bold text-charcoal">{selectedClient.fullName}</p>
                                </div>
                                <button onClick={() => setStep(1)} className="text-sm text-gold hover:underline">החלף</button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">תאריך אירוע</label>
                                    <div className="relative">
                                        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="date"
                                            required
                                            value={eventDate}
                                            onChange={(e) => setEventDate(e.target.value)}
                                            className="w-full pr-10 pl-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-gold"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">תאריך החזרה</label>
                                    <div className="relative">
                                        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="date"
                                            required
                                            value={returnDate}
                                            onChange={(e) => setReturnDate(e.target.value)}
                                            className="w-full pr-10 pl-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-gold"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">עיר האירוע</label>
                                    <input
                                        type="text"
                                        value={eventCity}
                                        onChange={(e) => setEventCity(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-gold"
                                        placeholder="לדוגמה: ירושלים"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">מחיר סופי</label>
                                    <div className="relative">
                                        <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="number"
                                            required
                                            value={finalPrice}
                                            onChange={(e) => setFinalPrice(Number(e.target.value))}
                                            className="w-full pr-10 pl-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-gold font-bold text-lg"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 text-gray-600 hover:bg-gray-200 rounded-xl font-medium transition-colors"
                    >
                        ביטול
                    </button>

                    {step === 2 && (
                        <button
                            onClick={handleRentalSubmit}
                            disabled={loading || !eventDate || !returnDate}
                            className="px-8 py-2 bg-gold hover:bg-gold-dark text-white rounded-xl font-medium shadow-lg shadow-gold/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                            אשר השכרה
                        </button>
                    )}
                </div>
            </div>

            <AddClientModal
                isOpen={isAddClientOpen}
                onClose={() => setIsAddClientOpen(false)}
                onSuccess={() => {
                    // Ideally we would auto-select the new client here, but for now just close modal
                    // and let user search again (or we could pass a callback to set search query)
                    setIsAddClientOpen(false);
                    // Refresh search if needed or just let user type
                }}
            />
        </div>
    );
};
