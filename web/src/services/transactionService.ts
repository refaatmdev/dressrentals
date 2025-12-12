import {
    collection,
    addDoc,
    query,
    orderBy,
    limit,
    getDocs,
    doc,
    deleteDoc,
    getDoc,
    updateDoc,
    increment
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Transaction } from '../types';

const COLLECTION_NAME = 'transactions';

export const transactionService = {
    // Create a new transaction
    async createTransaction(transaction: Omit<Transaction, 'id'>): Promise<string> {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), transaction);
        await updateDoc(docRef, { id: docRef.id });
        return docRef.id;
    },

    // Get recent transactions
    async getRecentTransactions(limitCount: number = 20): Promise<Transaction[]> {
        const q = query(
            collection(db, COLLECTION_NAME),
            orderBy('timestamp', 'desc'),
            limit(limitCount)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
    },

    // Delete transaction and revert rental payment if needed
    async deleteTransaction(id: string): Promise<void> {
        const docRef = doc(db, COLLECTION_NAME, id);
        const snap = await getDoc(docRef);

        if (!snap.exists()) return;

        const transaction = snap.data() as Transaction;

        // If linked to a rental, revert the payment
        if (transaction.relatedRentalId) {
            const rentalRef = doc(db, 'rentals', transaction.relatedRentalId);
            await updateDoc(rentalRef, {
                paidAmount: increment(-transaction.amount)
            });
        }

        // Also check for individual items linked to rentals (backward compatibility or mixed carts)
        if (transaction.items) {
            for (const item of transaction.items) {
                if (item.rentalId && item.rentalId !== transaction.relatedRentalId) {
                    const rentalRef = doc(db, 'rentals', item.rentalId);
                    await updateDoc(rentalRef, {
                        paidAmount: increment(-item.amount)
                    });
                }
            }
        }

        await deleteDoc(docRef);
    },

    // Update transaction
    async updateTransaction(id: string, updates: Partial<Transaction>, originalTransaction: Transaction): Promise<void> {
        const docRef = doc(db, COLLECTION_NAME, id);

        // Handle amount change for rental payments
        if (updates.amount !== undefined && updates.amount !== originalTransaction.amount) {
            const diff = updates.amount - originalTransaction.amount;

            if (originalTransaction.relatedRentalId) {
                const rentalRef = doc(db, 'rentals', originalTransaction.relatedRentalId);
                await updateDoc(rentalRef, {
                    paidAmount: increment(diff)
                });
            }
        }

        await updateDoc(docRef, updates);
    },

    // Get all transactions (for analytics)
    async getAllTransactions(): Promise<Transaction[]> {
        const q = query(collection(db, COLLECTION_NAME), orderBy('timestamp', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
    }
};
