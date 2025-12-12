import { useState, useEffect } from 'react';
import { X, Search, DollarSign, Check, AlertCircle, Loader2 } from 'lucide-react';
import { clientService } from '../services/clientService';
import { dressService } from '../services/dressService';
import { rentalService } from '../services/rentalService';
import type { Client, Dress, Rental } from '../types';
import { format } from 'date-fns';
import { DressAvailabilityCalendar } from './DressAvailabilityCalendar';

interface AddRentalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: Rental | null;
}

type Step = 'client' | 'dress' | 'financials';

export const AddRentalModal = ({ isOpen, onClose, onSuccess, initialData }: AddRentalModalProps) => {
    const [step, setStep] = useState<Step>('client');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Step 1: Client
    const [searchTerm, setSearchTerm] = useState('');
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [isNewClient, setIsNewClient] = useState(false);
    const [newClientData, setNewClientData] = useState({ fullName: '', phone: '', city: '' });

    // Step 2: Dress & Dates
    const [dresses, setDresses] = useState<Dress[]>([]);
    const [dressSearch, setDressSearch] = useState('');
    const [selectedDress, setSelectedDress] = useState<Dress | null>(null);
    const [eventDate, setEventDate] = useState('');
    const [returnDate, setReturnDate] = useState('');
    const [availabilityError, setAvailabilityError] = useState<string | null>(null);
    const [occupiedRanges, setOccupiedRanges] = useState<{ start: Date; end: Date }[]>([]);

    // Step 3: Financials
    const [finalPrice, setFinalPrice] = useState('');
    const [deposit, setDeposit] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit' | 'check' | 'bit'>('cash');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchClients();
            fetchDresses();

            if (initialData) {
                // Pre-fill data for editing
                setStep('client'); // Start at client, but everything is filled

                // We need to find the client object
                // For now, we'll just set the selectedClient manually if we can't find it in the list immediately
                // But fetchClients is async.
                // Let's set a temporary client object from initialData
                setSelectedClient({
                    id: initialData.clientId,
                    fullName: initialData.clientName,
                    phone: initialData.clientPhone,
                    address: initialData.eventCity || '',
                    email: '', // Not needed
                    createdAt: new Date(), // Dummy
                    measurements: { bust: 0, waist: 0, hips: 0, height: 0 } // Dummy
                });

                // Find dress
                // We'll set selectedDress when dresses are loaded or just use initialData info
                // But we need the full dress object for the UI (image etc)
                // We'll rely on fetchDresses finding it.
                // For now, let's just set the ID and let the UI handle it or wait for dresses

                setEventDate(initialData.eventDate instanceof Date ? initialData.eventDate.toISOString() : (initialData.eventDate as any).toDate().toISOString());
                if (initialData.returnDate) {
                    setReturnDate(initialData.returnDate instanceof Date ? initialData.returnDate.toISOString() : (initialData.returnDate as any).toDate().toISOString());
                }

                setFinalPrice(initialData.finalPrice.toString());
                setDeposit((initialData.paidAmount || 0).toString());
                // Notes not in Rental type? If not, ignore.
                // Payment method not in Rental type (it's per transaction). Default to cash.
            }
        } else {
            // Reset state on close
            setStep('client');
            setSelectedClient(null);
            setSelectedDress(null);
            setAvailabilityError(null);
            setError(null);
            setEventDate('');
            setReturnDate('');
            setFinalPrice('');
            setDeposit('');
            setNotes('');
            setIsNewClient(false);
            setNewClientData({ fullName: '', phone: '', city: '' });
            setOccupiedRanges([]);
        }
    }, [isOpen, initialData]);

    // Effect to set selected dress when dresses load if editing
    useEffect(() => {
        if (initialData && dresses.length > 0 && !selectedDress) {
            const dress = dresses.find(d => d.id === initialData.dressId);
            if (dress) {
                setSelectedDress(dress);
            }
        }
    }, [dresses, initialData]);

    // Fetch occupied dates when dress is selected
    useEffect(() => {
        if (selectedDress) {
            fetchOccupiedDates(selectedDress.id);
        }
    }, [selectedDress]);

    const fetchOccupiedDates = async (dressId: string) => {
        const rentals = await rentalService.getRentalsByDress(dressId);
        const ranges = rentals
            .filter(r => r.status === 'active') // Only check active rentals
            .filter(r => r.id !== initialData?.id) // Exclude current rental if editing
            .map(r => {
                const start = r.eventDate instanceof Date ? r.eventDate : (r.eventDate as any).toDate();
                const end = r.returnDate
                    ? (r.returnDate instanceof Date ? r.returnDate : (r.returnDate as any).toDate())
                    : new Date(start.getTime() + 24 * 60 * 60 * 1000);

                // Add buffer? User said "+/- 1 day".
                // Let's mark the exact dates + 1 day buffer as occupied for visual simplicity
                // Or just the exact dates.
                // Let's stick to exact dates for the calendar visual, but validation enforces buffer.
                return { start, end };
            });
        setOccupiedRanges(ranges);
    };

    const fetchClients = async () => {
        const allClients = await clientService.getAllClients();
        setClients(allClients);
    };

    const fetchDresses = async () => {
        const allDresses = await dressService.getAllDresses();
        setDresses(allDresses.filter(d => !d.isArchived));
    };

    const filteredClients = clients.filter(c =>
        c.fullName.includes(searchTerm) || c.phone.includes(searchTerm)
    );

    const filteredDresses = dresses.filter(d =>
        d.modelName.includes(dressSearch) || d.id.includes(dressSearch)
    );

    const handleClientSelect = (client: Client) => {
        setSelectedClient(client);
        setIsNewClient(false);
    };

    const checkAvailability = async () => {
        if (!selectedDress || !eventDate) return;

        setLoading(true);
        setAvailabilityError(null);

        const start = new Date(eventDate);
        const end = returnDate ? new Date(returnDate) : new Date(start.getTime() + 24 * 60 * 60 * 1000);

        try {
            // Check availability, excluding current rental if editing
            const isAvailable = await rentalService.checkDressAvailability(selectedDress.id, start, end, initialData?.id);

            if (!isAvailable) {
                // If editing, this is tricky.
                // Let's just show the error.
                setAvailabilityError('השמלה אינה פנויה בתאריכים אלו (ישנה חפיפה עם השכרה אחרת)');
            } else {
                setStep('financials');
            }
        } catch (err) {
            console.error(err);
            setError('שגיאה בבדיקת זמינות');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!selectedDress || (!selectedClient && !isNewClient)) return;

        setLoading(true);
        setError(null);

        try {
            const clientData = isNewClient ? {
                fullName: newClientData.fullName,
                phone: newClientData.phone,
                address: newClientData.city
            } : {
                id: selectedClient!.id,
                fullName: selectedClient!.fullName
            };

            const rentalData = {
                dressId: selectedDress.id,
                dressName: selectedDress.modelName,
                clientId: '', // Will be filled by service
                clientName: isNewClient ? newClientData.fullName : selectedClient!.fullName,
                clientPhone: isNewClient ? newClientData.phone : selectedClient!.phone,
                eventDate: new Date(eventDate),
                returnDate: returnDate ? new Date(returnDate) : new Date(new Date(eventDate).getTime() + 24 * 60 * 60 * 1000),
                eventCity: isNewClient ? newClientData.city : (selectedClient?.address || ''),
                finalPrice: parseFloat(finalPrice) || 0,
                status: 'active' as const
            };

            if (initialData) {
                // Update existing rental
                await rentalService.updateRental(initialData.id, rentalData);
                // Also update client if changed?
                // Also update transaction? No, we don't update transaction here usually.
                // If user wants to add payment, that's a separate flow usually.
                // But if they changed the price...
                // For now, just update rental.
            } else {
                // Create new
                await rentalService.createRentalWithTransaction(
                    rentalData,
                    clientData,
                    {
                        amount: parseFloat(deposit) || 0,
                        method: paymentMethod,
                        notes: notes
                    }
                );
            }

            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            setError('שגיאה ביצירת/עדכון ההשכרה');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                    <h2 className="text-2xl font-bold text-gray-800">
                        {initialData ? 'עריכת השכרה' : 'הוספת השכרה חדשה'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={24} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-6 flex-1">
                    {/* Steps Indicator */}
                    <div className="flex items-center justify-center mb-8">
                        <div className={`flex items-center gap-2 ${step === 'client' ? 'text-gold font-bold' : 'text-gray-400'}`}>
                            <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center border-current">1</div>
                            <span>לקוח</span>
                        </div>
                        <div className="w-12 h-px bg-gray-200 mx-2"></div>
                        <div className={`flex items-center gap-2 ${step === 'dress' ? 'text-gold font-bold' : 'text-gray-400'}`}>
                            <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center border-current">2</div>
                            <span>שמלה ותאריכים</span>
                        </div>
                        <div className="w-12 h-px bg-gray-200 mx-2"></div>
                        <div className={`flex items-center gap-2 ${step === 'financials' ? 'text-gold font-bold' : 'text-gray-400'}`}>
                            <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center border-current">3</div>
                            <span>תשלום</span>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-2">
                            <AlertCircle size={20} />
                            {error}
                        </div>
                    )}

                    {/* Step 1: Client */}
                    {step === 'client' && (
                        <div className="space-y-6">
                            {!isNewClient ? (
                                <>
                                    <div className="relative">
                                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                        <input
                                            type="text"
                                            placeholder="חפש לקוח לפי שם או טלפון..."
                                            className="w-full pl-4 pr-10 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-gold/20"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>

                                    <div className="max-h-60 overflow-y-auto space-y-2">
                                        {filteredClients.map(client => (
                                            <div
                                                key={client.id}
                                                onClick={() => handleClientSelect(client)}
                                                className={`p-3 rounded-xl cursor-pointer flex justify-between items-center transition-all
                                                    ${selectedClient?.id === client.id ? 'bg-gold/10 border border-gold/30' : 'bg-gray-50 hover:bg-gray-100'}`}
                                            >
                                                <div>
                                                    <div className="font-bold text-gray-800">{client.fullName}</div>
                                                    <div className="text-sm text-gray-500">{client.phone}</div>
                                                </div>
                                                {selectedClient?.id === client.id && <Check size={20} className="text-gold" />}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="text-center">
                                        <button
                                            onClick={() => setIsNewClient(true)}
                                            className="text-gold hover:text-gold-dark font-medium underline"
                                        >
                                            + יצירת לקוח חדש
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-4 bg-gray-50 p-6 rounded-xl border border-gray-100">
                                    <h3 className="font-bold text-gray-800 mb-4">פרטי לקוח חדש</h3>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">שם מלא</label>
                                        <input
                                            type="text"
                                            className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-gold/20"
                                            value={newClientData.fullName}
                                            onChange={(e) => setNewClientData({ ...newClientData, fullName: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">טלפון</label>
                                        <input
                                            type="text"
                                            className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-gold/20"
                                            value={newClientData.phone}
                                            onChange={(e) => setNewClientData({ ...newClientData, phone: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">עיר מגורים</label>
                                        <input
                                            type="text"
                                            className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-gold/20"
                                            value={newClientData.city}
                                            onChange={(e) => setNewClientData({ ...newClientData, city: e.target.value })}
                                        />
                                    </div>
                                    <button
                                        onClick={() => setIsNewClient(false)}
                                        className="text-sm text-gray-500 hover:text-gray-700"
                                    >
                                        ביטול וחזרה לחיפוש
                                    </button>
                                </div>
                            )}

                            <div className="flex justify-end pt-4">
                                <button
                                    onClick={() => setStep('dress')}
                                    disabled={!selectedClient && (!isNewClient || !newClientData.fullName || !newClientData.phone)}
                                    className="px-6 py-2 bg-gold text-white rounded-xl font-bold hover:bg-gold-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    המשך לשלב הבא
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Dress & Dates */}
                    {step === 'dress' && (
                        <div className="space-y-6">
                            <div className="relative">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="חפש שמלה..."
                                    className="w-full pl-4 pr-10 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-gold/20"
                                    value={dressSearch}
                                    onChange={(e) => setDressSearch(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-40 overflow-y-auto">
                                {filteredDresses.map(dress => (
                                    <div
                                        key={dress.id}
                                        onClick={() => setSelectedDress(dress)}
                                        className={`p-2 rounded-xl cursor-pointer border transition-all flex flex-col items-center gap-2
                                            ${selectedDress?.id === dress.id ? 'border-gold bg-gold/5' : 'border-gray-100 hover:border-gold/50'}`}
                                    >
                                        <img src={dress.imageUrl} alt={dress.modelName} className="w-full h-24 object-cover rounded-lg" />
                                        <span className="text-sm font-medium text-center">{dress.modelName}</span>
                                    </div>
                                ))}
                            </div>

                            {selectedDress && (
                                <div className="space-y-4">
                                    <label className="block text-sm font-medium text-gray-700">בחר תאריך אירוע</label>
                                    <DressAvailabilityCalendar
                                        occupiedRanges={occupiedRanges}
                                        selectedDate={eventDate ? new Date(eventDate) : null}
                                        onSelectDate={(date) => {
                                            setEventDate(date.toISOString());
                                            // Auto-set return date to +1 day
                                            const nextDay = new Date(date);
                                            nextDay.setDate(date.getDate() + 1);
                                            setReturnDate(nextDay.toISOString());
                                        }}
                                    />
                                    <div className="text-sm text-gray-500 text-center">
                                        תאריך אירוע: {eventDate ? format(new Date(eventDate), 'dd/MM/yyyy') : '-'} |
                                        תאריך החזרה: {returnDate ? format(new Date(returnDate), 'dd/MM/yyyy') : '-'}
                                    </div>
                                </div>
                            )}

                            {availabilityError && (
                                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center font-medium">
                                    {availabilityError}
                                </div>
                            )}

                            <div className="flex justify-between pt-4">
                                <button
                                    onClick={() => setStep('client')}
                                    className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors"
                                >
                                    חזרה
                                </button>
                                <button
                                    onClick={checkAvailability}
                                    disabled={!selectedDress || !eventDate || loading}
                                    className="px-6 py-2 bg-gold text-white rounded-xl font-bold hover:bg-gold-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={20} /> : null}
                                    בדיקת זמינות והמשך
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Financials */}
                    {step === 'financials' && (
                        <div className="space-y-6">
                            <div className="bg-gray-50 p-4 rounded-xl flex items-center gap-4">
                                <img src={selectedDress?.imageUrl} className="w-16 h-16 rounded-lg object-cover" />
                                <div>
                                    <div className="font-bold text-gray-800">{selectedDress?.modelName}</div>
                                    <div className="text-sm text-gray-500">
                                        {eventDate ? format(new Date(eventDate), 'dd/MM/yyyy') : ''}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">מחיר סופי ללקוח</label>
                                    <div className="relative">
                                        <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="number"
                                            className="w-full pl-4 pr-10 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-gold/20"
                                            value={finalPrice}
                                            onChange={(e) => setFinalPrice(e.target.value)}
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">מקדמה (תשלום עכשיו)</label>
                                    <div className="relative">
                                        <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="number"
                                            className="w-full pl-4 pr-10 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-gold/20"
                                            value={deposit}
                                            onChange={(e) => setDeposit(e.target.value)}
                                            placeholder="0.00"
                                            disabled={!!initialData} // Disable deposit editing if updating existing rental? Or allow adding more?
                                        // For simplicity, disable deposit editing in update mode for now, as it requires creating a new transaction.
                                        // Or just let them edit it but it won't create a transaction?
                                        // Let's disable it for now to avoid confusion.
                                        />
                                    </div>
                                    {initialData && <div className="text-xs text-gray-400 mt-1">לא ניתן לשנות מקדמה בעריכה</div>}
                                </div>
                            </div>

                            {!initialData && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">אמצעי תשלום (למקדמה)</label>
                                    <select
                                        className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-gold/20"
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value as any)}
                                    >
                                        <option value="cash">מזומן</option>
                                        <option value="credit">אשראי</option>
                                        <option value="bit">Bit / PayBox</option>
                                        <option value="check">צ'ק</option>
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">הערות</label>
                                <textarea
                                    className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-gold/20 h-24 resize-none"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="הערות נוספות..."
                                />
                            </div>

                            <div className="flex justify-between pt-4">
                                <button
                                    onClick={() => setStep('dress')}
                                    className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors"
                                >
                                    חזרה
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading || !finalPrice}
                                    className="px-6 py-2 bg-gold text-white rounded-xl font-bold hover:bg-gold-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={20} /> : null}
                                    {initialData ? 'שמור שינויים' : 'סיום ויצירת השכרה'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
