import { useState, useEffect } from 'react';
import { X, Save, Loader2, User, Ruler } from 'lucide-react';
import { clientService } from '../../services/clientService';
import type { Client } from '../../types';

interface AddClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: Client | null;
}

export const AddClientModal = ({ isOpen, onClose, onSuccess, initialData }: AddClientModalProps) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<Client>>({
        fullName: '',
        phone: '',
        email: '',
        address: '',
        measurements: {
            bust: 0,
            waist: 0,
            hips: 0,
            height: 0,
            shoulderToFloor: 0,
            notes: '',
        },
    });

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        } else {
            setFormData({
                fullName: '',
                phone: '',
                email: '',
                address: '',
                measurements: {
                    bust: 0,
                    waist: 0,
                    hips: 0,
                    height: 0,
                    shoulderToFloor: 0,
                    notes: '',
                },
            });
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (initialData?.id) {
                await clientService.updateClient(initialData.id, formData);
            } else {
                await clientService.createClient({
                    ...formData as any,
                    createdAt: new Date(),
                });
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error saving client:', error);
            alert('שגיאה בשמירת הלקוחה');
        } finally {
            setLoading(false);
        }
    };

    const updateMeasurement = (field: string, value: string) => {
        setFormData({
            ...formData,
            measurements: {
                ...formData.measurements!,
                [field]: field === 'notes' ? value : Number(value),
            },
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                    <h2 className="text-2xl font-serif font-bold text-charcoal">
                        {initialData ? 'עריכת לקוחה' : 'הוספת לקוחה חדשה'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-8">
                    {/* Personal Info */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-gold font-bold border-b border-gray-100 pb-2">
                            <User size={20} />
                            <h3>פרטים אישיים</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">שם מלא</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold"
                                    placeholder="ישראל ישראלי"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">טלפון</label>
                                <input
                                    type="tel"
                                    required
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold"
                                    placeholder="050-0000000"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">אימייל</label>
                                <input
                                    type="email"
                                    value={formData.email || ''}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold"
                                    placeholder="optional@email.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">כתובת</label>
                                <input
                                    type="text"
                                    value={formData.address || ''}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold"
                                    placeholder="עיר, רחוב"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Measurements */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-gold font-bold border-b border-gray-100 pb-2">
                            <Ruler size={20} />
                            <h3>מידות גוף (ס״מ)</h3>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">היקף חזה</label>
                                <input
                                    type="number"
                                    value={formData.measurements?.bust || ''}
                                    onChange={(e) => updateMeasurement('bust', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">היקף מותן</label>
                                <input
                                    type="number"
                                    value={formData.measurements?.waist || ''}
                                    onChange={(e) => updateMeasurement('waist', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">היקף אגן</label>
                                <input
                                    type="number"
                                    value={formData.measurements?.hips || ''}
                                    onChange={(e) => updateMeasurement('hips', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">גובה כללי</label>
                                <input
                                    type="number"
                                    value={formData.measurements?.height || ''}
                                    onChange={(e) => updateMeasurement('height', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">כתף לרצפה</label>
                                <input
                                    type="number"
                                    value={formData.measurements?.shoulderToFloor || ''}
                                    onChange={(e) => updateMeasurement('shoulderToFloor', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">הערות מדידה</label>
                            <textarea
                                value={formData.measurements?.notes || ''}
                                onChange={(e) => updateMeasurement('notes', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold h-20 resize-none"
                                placeholder="לדוגמה: צריכה עקבים גבוהים..."
                            />
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 text-gray-600 hover:bg-gray-50 rounded-xl font-medium transition-colors"
                        >
                            ביטול
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-gold hover:bg-gold-dark text-white rounded-xl font-medium shadow-lg shadow-gold/20 transition-all flex items-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                            {initialData ? 'עדכן לקוחה' : 'שמור לקוחה'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
