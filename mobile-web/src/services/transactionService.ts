import {
    collection,
    addDoc,
    query,
    orderBy,
    limit,
    getDocs,
    updateDoc
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
        return snapshot.docs.map(doc => doc.data() as Transaction);
    },

    // Get all transactions (for analytics)
    async getAllTransactions(): Promise<Transaction[]> {
        const q = query(collection(db, COLLECTION_NAME), orderBy('timestamp', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data() as Transaction);
    }
};
