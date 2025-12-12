import { useState, useEffect } from 'react';
import {
    ShoppingCart,
    Plus,
    Trash2,
    CreditCard,
    Banknote,
    CheckCircle2,
    Smartphone,
    History,
    Search,
    Loader2,
    Edit2,
    X
} from 'lucide-react';
import { transactionService } from '../services/transactionService';
import { rentalService } from '../services/rentalService';
import type { Transaction, TransactionItem, Rental } from '../types';

export const POS = () => {
    // Cart State
    const [cartItems, setCartItems] = useState<TransactionItem[]>([]);
    const [customItemName, setCustomItemName] = useState('');
    const [customItemPrice, setCustomItemPrice] = useState('');

    // Rental Payment State
    const [unpaidRentals, setUnpaidRentals] = useState<Rental[]>([]);
    const [selectedRental, setSelectedRental] = useState<Rental | null>(null);

    // Checkout State
    const [paymentMethod, setPaymentMethod] = useState<Transaction['paymentMethod']>('cash');
    const [customerName, setCustomerName] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    // History State
    const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

    useEffect(() => {
        fetchRecentTransactions();
        fetchUnpaidRentals();
    }, []);

    const fetchRecentTransactions = async () => {
        try {
            const data = await transactionService.getRecentTransactions();
            setRecentTransactions(data);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        }
    };

    const fetchUnpaidRentals = async () => {
        try {
            const data = await rentalService.getUnpaidRentals();
            setUnpaidRentals(data);
        } catch (error) {
            console.error('Error fetching rentals:', error);
        }
    };

    const addToCart = () => {
        if (!customItemName || !customItemPrice) return;

        const newItem: TransactionItem = {
            description: customItemName,
            amount: Number(customItemPrice),
            quantity: 1
        };

        setCartItems([...cartItems, newItem]);
        setCustomItemName('');
        setCustomItemPrice('');
    };

    const addRentalPayment = (rental: Rental) => {
        // Check if already in cart
        if (cartItems.some(item => item.rentalId === rental.id)) return;

        const remainingBalance = rental.finalPrice - (rental.paidAmount || 0);

        const newItem: TransactionItem = {
            description: `תשלום עבור השכרה: ${rental.dressName} (${rental.clientName})`,
            amount: remainingBalance,
            quantity: 1,
            rentalId: rental.id
        };

        setCartItems([...cartItems, newItem]);
        setSelectedRental(rental);
        setCustomerName(rental.clientName); // Auto-fill customer
    };

    const updateItemPrice = (index: number, newPrice: string) => {
        const newCart = [...cartItems];
        newCart[index].amount = Number(newPrice);
        setCartItems(newCart);
    };

    const removeFromCart = (index: number) => {
        const newCart = [...cartItems];
        newCart.splice(index, 1);
        setCartItems(newCart);
        if (newCart.length === 0) {
            setSelectedRental(null);
            setCustomerName('');
        }
    };

    const calculateTotal = () => {
        return cartItems.reduce((sum, item) => sum + (item.amount * item.quantity), 0);
    };

    const handleCheckout = async () => {
        if (cartItems.length === 0) return;

        setLoading(true);
        try {
            const total = calculateTotal();

            // 1. Create Transaction
            await transactionService.createTransaction({
                type: cartItems.some(i => i.rentalId) ? 'final_payment' : 'sale',
                amount: total,
                paymentMethod,
                customerName: customerName || 'לקוח מזדמן',
                relatedRentalId: selectedRental?.id, // Keep for backward compatibility/main reference
                items: cartItems,
                notes: notes,
                timestamp: new Date()
            });

            // 2. Update Rental Payments
            // Iterate through ALL items to find rental payments
            const updatePromises = cartItems
                .filter(item => item.rentalId)
                .map(item => rentalService.updateRentalPayment(item.rentalId!, item.amount));

            await Promise.all(updatePromises);

            // Reset
            setCartItems([]);
            setCustomerName('');
            setNotes('');
            setSelectedRental(null);
            setPaymentMethod('cash');

            // Refresh Data
            await Promise.all([
                fetchRecentTransactions(),
                fetchUnpaidRentals()
            ]);

            alert('העסקה בוצעה בהצלחה!');
        } catch (error) {
            console.error('Error processing transaction:', error);
            alert('שגיאה בביצוע העסקה');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTransaction = async (tx: Transaction) => {
        if (!confirm('האם את בטוחה שברצונך למחוק עסקה זו? פעולה זו תבטל את התשלום ותעדכן את היתרה.')) return;

        try {
            await transactionService.deleteTransaction(tx.id);
            await Promise.all([
                fetchRecentTransactions(),
                fetchUnpaidRentals()
            ]);
        } catch (error) {
            console.error('Error deleting transaction:', error);
            alert('שגיאה במחיקת העסקה');
        }
    };

    const handleUpdateTransaction = async () => {
        if (!editingTransaction) return;

        try {
            // Fetch original to compare
            const original = recentTransactions.find(t => t.id === editingTransaction.id);
            if (!original) return;

            await transactionService.updateTransaction(editingTransaction.id, editingTransaction, original);

            setEditingTransaction(null);
            await Promise.all([
                fetchRecentTransactions(),
                fetchUnpaidRentals()
            ]);
        } catch (error) {
            console.error('Error updating transaction:', error);
            alert('שגיאה בעדכון העסקה');
        }
    };

    return (
        <div className="flex h-[calc(100vh-8rem)] gap-6">
            {/* Left Side: Cart & Checkout */}
            <div className="w-2/3 flex flex-col gap-6">

                {/* Quick Add & Rentals */}
                <div className="grid grid-cols-2 gap-6 h-1/2">
                    {/* Custom Item */}
                    <div className="glass p-6 rounded-2xl flex flex-col">
                        <h3 className="font-bold text-lg text-charcoal mb-4 flex items-center gap-2">
                            <Plus size={20} className="text-gold" />
                            פריט כללי
                        </h3>
                        <div className="space-y-4 flex-1">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">תיאור הפריט</label>
                                <input
                                    type="text"
                                    value={customItemName}
                                    onChange={(e) => setCustomItemName(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-gold"
                                    placeholder="לדוגמה: הינומה"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">מחיר (₪)</label>
                                <input
                                    type="number"
                                    value={customItemPrice}
                                    onChange={(e) => setCustomItemPrice(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-gold"
                                    placeholder="0.00"
                                />
                            </div>
                            <button
                                onClick={addToCart}
                                disabled={!customItemName || !customItemPrice}
                                className="w-full mt-4 bg-charcoal text-white py-2 rounded-xl hover:bg-black transition-colors disabled:opacity-50"
                            >
                                הוסף לסל
                            </button>
                        </div>
                    </div>

                    {/* Unpaid Rentals */}
                    <div className="glass p-6 rounded-2xl flex flex-col overflow-hidden">
                        <h3 className="font-bold text-lg text-charcoal mb-4 flex items-center gap-2">
                            <Search size={20} className="text-gold" />
                            תשלום על השכרה (חובות)
                        </h3>
                        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                            {unpaidRentals.map(rental => {
                                const paid = rental.paidAmount || 0;
                                const remaining = rental.finalPrice - paid;
                                return (
                                    <button
                                        key={rental.id}
                                        onClick={() => addRentalPayment(rental)}
                                        className="w-full text-right p-3 border border-gray-100 rounded-xl hover:border-gold hover:bg-gold/5 transition-all group"
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-bold text-gray-800">{rental.clientName}</span>
                                            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">חוב: ₪{remaining.toLocaleString()}</span>
                                        </div>
                                        <div className="text-sm text-gray-500 flex justify-between">
                                            <span>{rental.dressName}</span>
                                            <span className="text-xs">שולם: ₪{paid.toLocaleString()} / ₪{rental.finalPrice.toLocaleString()}</span>
                                        </div>
                                    </button>
                                );
                            })}
                            {unpaidRentals.length === 0 && (
                                <p className="text-center text-gray-400 mt-10">אין חובות פתוחים</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Cart & Total */}
                <div className="glass p-6 rounded-2xl flex-1 flex flex-col">
                    <h3 className="font-bold text-lg text-charcoal mb-4 flex items-center gap-2">
                        <ShoppingCart size={20} className="text-gold" />
                        סל קניות
                    </h3>

                    <div className="flex-1 overflow-y-auto mb-4">
                        <table className="w-full">
                            <thead className="text-sm text-gray-500 border-b border-gray-100">
                                <tr>
                                    <th className="text-right pb-2 font-medium">פריט</th>
                                    <th className="text-left pb-2 font-medium">מחיר (ניתן לעריכה)</th>
                                    <th className="w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {cartItems.map((item, index) => (
                                    <tr key={index}>
                                        <td className="py-3 text-gray-800">{item.description}</td>
                                        <td className="py-3 text-left font-medium">
                                            <input
                                                type="number"
                                                value={item.amount}
                                                onChange={(e) => updateItemPrice(index, e.target.value)}
                                                className="w-24 px-2 py-1 border border-gray-200 rounded-lg focus:outline-none focus:border-gold"
                                            />
                                            <span className="ml-1">₪</span>
                                        </td>
                                        <td className="py-3 text-center">
                                            <button onClick={() => removeFromCart(index)} className="text-gray-400 hover:text-red-500">
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {cartItems.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="py-8 text-center text-gray-400">הסל ריק</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="border-t border-gray-100 pt-4">
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-xl font-bold text-charcoal">סה״כ לתשלום:</span>
                            <span className="text-3xl font-serif font-bold text-gold-dark">₪{calculateTotal().toLocaleString()}</span>
                        </div>

                        <div className="grid grid-cols-4 gap-2 mb-4">
                            {[
                                { id: 'cash', label: 'מזומן', icon: Banknote },
                                { id: 'credit', label: 'אשראי', icon: CreditCard },
                                { id: 'bit', label: 'ביט', icon: Smartphone },
                                { id: 'check', label: 'צ׳ק', icon: CheckCircle2 },
                            ].map(method => (
                                <button
                                    key={method.id}
                                    onClick={() => setPaymentMethod(method.id as any)}
                                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${paymentMethod === method.id
                                        ? 'border-gold bg-gold text-white shadow-lg shadow-gold/20'
                                        : 'border-gray-200 text-gray-500 hover:border-gold hover:text-gold'
                                        }`}
                                >
                                    <method.icon size={20} className="mb-1" />
                                    <span className="text-xs font-bold">{method.label}</span>
                                </button>
                            ))}
                        </div>

                        <div className="flex flex-col gap-3">
                            <input
                                type="text"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="הערות לעסקה..."
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-gold text-sm"
                            />
                            <div className="flex gap-4">
                                <input
                                    type="text"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    placeholder="שם הלקוח (אופציונלי)"
                                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-gold"
                                />
                                <button
                                    onClick={handleCheckout}
                                    disabled={loading || cartItems.length === 0}
                                    className="px-8 py-3 bg-charcoal text-white rounded-xl font-bold hover:bg-black transition-all shadow-lg disabled:opacity-50 flex items-center gap-2"
                                >
                                    {loading && <Loader2 className="animate-spin" size={20} />}
                                    בצע תשלום
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side: History */}
            <div className="w-1/3 glass p-6 rounded-2xl flex flex-col">
                <h3 className="font-bold text-lg text-charcoal mb-4 flex items-center gap-2">
                    <History size={20} className="text-gold" />
                    עסקאות אחרונות
                </h3>

                <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                    {recentTransactions.map(tx => (
                        <div key={tx.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gold/50 transition-colors group relative">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="font-bold text-charcoal">{tx.customerName}</p>
                                    <p className="text-xs text-gray-500">
                                        {new Intl.DateTimeFormat('he-IL', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            day: 'numeric',
                                            month: 'numeric'
                                        }).format(tx.timestamp instanceof Date ? tx.timestamp : (tx.timestamp as any).toDate())}
                                    </p>
                                </div>
                                <span className="font-bold text-gold-dark">₪{tx.amount.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span className="px-2 py-1 bg-white rounded border border-gray-200">
                                    {tx.paymentMethod === 'cash' ? 'מזומן' :
                                        tx.paymentMethod === 'credit' ? 'אשראי' :
                                            tx.paymentMethod === 'bit' ? 'ביט' : 'צ׳ק'}
                                </span>
                                {tx.items && tx.items.length > 0 && (
                                    <span>{tx.items[0].description} {tx.items.length > 1 ? `(+${tx.items.length - 1})` : ''}</span>
                                )}
                            </div>

                            {/* Actions Overlay */}
                            <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                <button
                                    onClick={() => setEditingTransaction(tx)}
                                    className="p-1.5 bg-white border border-gray-200 rounded-lg text-blue-500 hover:bg-blue-50 hover:border-blue-200"
                                    title="ערוך עסקה"
                                >
                                    <Edit2 size={14} />
                                </button>
                                <button
                                    onClick={() => handleDeleteTransaction(tx)}
                                    className="p-1.5 bg-white border border-gray-200 rounded-lg text-red-500 hover:bg-red-50 hover:border-red-200"
                                    title="מחק עסקה"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {recentTransactions.length === 0 && (
                        <div className="text-center text-gray-400 mt-10">
                            <History size={48} className="mx-auto mb-2 opacity-20" />
                            <p>אין עסקאות אחרונות</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Transaction Modal */}
            {editingTransaction && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setEditingTransaction(null)}>
                    <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                            <h3 className="text-xl font-bold text-charcoal">עריכת עסקה</h3>
                            <button onClick={() => setEditingTransaction(null)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">סכום (₪)</label>
                                <input
                                    type="number"
                                    value={editingTransaction.amount}
                                    onChange={e => setEditingTransaction({ ...editingTransaction, amount: Number(e.target.value) })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-gold"
                                />
                                <p className="text-xs text-orange-500 mt-1">
                                    שים לב: שינוי הסכום יעדכן אוטומטית את יתרת החוב של הלקוחה (אם העסקה מקושרת להשכרה).
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">אמצעי תשלום</label>
                                <select
                                    value={editingTransaction.paymentMethod}
                                    onChange={e => setEditingTransaction({ ...editingTransaction, paymentMethod: e.target.value as any })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-gold bg-white"
                                >
                                    <option value="cash">מזומן</option>
                                    <option value="credit">אשראי</option>
                                    <option value="bit">ביט</option>
                                    <option value="check">צ׳ק</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">הערות</label>
                                <textarea
                                    value={editingTransaction.notes || ''}
                                    onChange={e => setEditingTransaction({ ...editingTransaction, notes: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-gold h-24 resize-none"
                                />
                            </div>

                            <button
                                onClick={handleUpdateTransaction}
                                className="w-full bg-gold hover:bg-gold-dark text-white py-3 rounded-xl font-bold shadow-lg shadow-gold/20 transition-all"
                            >
                                שמור שינויים
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
