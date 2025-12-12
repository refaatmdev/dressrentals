import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    addDoc,
    updateDoc,
    increment,
    runTransaction
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Rental, Client } from '../types';

import { isDressAvailable } from '../utils/calculations';

const COLLECTION_NAME = 'rentals';

export const rentalService = {
    // Create a new rental
    async createRental(rental: Omit<Rental, 'id'>): Promise<string> {
        if (!rental.clientId) {
            throw new Error('Client ID is required for rental');
        }
        const docRef = await addDoc(collection(db, COLLECTION_NAME), rental);
        await updateDoc(docRef, { id: docRef.id });

        // Increment rental count on the dress
        try {
            const dressRef = doc(db, 'dresses', rental.dressId);
            await updateDoc(dressRef, {
                rentalCount: increment(1)
            });
        } catch (error) {
            console.error('Error incrementing rental count:', error);
            // Non-blocking error
        }

        return docRef.id;
    },

    // Get Rental by ID
    async getRental(id: string): Promise<Rental | null> {
        const docRef = doc(db, COLLECTION_NAME, id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            return snap.data() as Rental;
        }
        return null;
    },

    // Get all rentals
    async getAllRentals(): Promise<Rental[]> {
        const q = query(collection(db, COLLECTION_NAME));
        const snapshot = await getDocs(q);
        const rentals = snapshot.docs.map(doc => doc.data() as Rental);
        return rentals.sort((a, b) => {
            const dateA = a.eventDate instanceof Date ? a.eventDate : (a.eventDate as any).toDate();
            const dateB = b.eventDate instanceof Date ? b.eventDate : (b.eventDate as any).toDate();
            return dateB.getTime() - dateA.getTime();
        });
    },

    // Get active rentals
    async getActiveRentals(): Promise<Rental[]> {
        const q = query(
            collection(db, COLLECTION_NAME),
            where('status', '==', 'active')
        );
        const snapshot = await getDocs(q);
        const rentals = snapshot.docs.map(doc => doc.data() as Rental);
        return rentals.sort((a, b) => {
            const dateA = a.eventDate instanceof Date ? a.eventDate : (a.eventDate as any).toDate();
            const dateB = b.eventDate instanceof Date ? b.eventDate : (b.eventDate as any).toDate();
            return dateA.getTime() - dateB.getTime();
        });
    },

    // Update rental
    async updateRental(id: string, data: Partial<Rental>): Promise<void> {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, data);
    },

    // Update rental status
    async updateRentalStatus(id: string, status: Rental['status']): Promise<void> {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, { status });
    },

    // Get rentals by dress ID
    async getRentalsByDress(dressId: string): Promise<Rental[]> {
        const q = query(
            collection(db, COLLECTION_NAME),
            where('dressId', '==', dressId)
        );
        const snapshot = await getDocs(q);
        const rentals = snapshot.docs.map(doc => doc.data() as Rental);
        return rentals.sort((a, b) => {
            const dateA = a.eventDate instanceof Date ? a.eventDate : (a.eventDate as any).toDate();
            const dateB = b.eventDate instanceof Date ? b.eventDate : (b.eventDate as any).toDate();
            return dateB.getTime() - dateA.getTime(); // Descending
        });
    },

    // Update rental payment
    async updateRentalPayment(id: string, amountPaid: number): Promise<void> {
        const docRef = doc(db, COLLECTION_NAME, id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            const currentPaid = snap.data().paidAmount || 0;
            await updateDoc(docRef, { paidAmount: currentPaid + amountPaid });
        }
    },

    // Get rentals with outstanding balance
    async getUnpaidRentals(): Promise<Rental[]> {
        // We fetch active rentals and filter client-side for those with debt
        // Ideally we'd query where('paidAmount', '<', 'finalPrice') but Firestore doesn't support field comparison in query
        const q = query(
            collection(db, COLLECTION_NAME),
            where('status', '==', 'active')
        );
        const snapshot = await getDocs(q);
        const rentals = snapshot.docs.map(doc => doc.data() as Rental);

        return rentals.filter(r => {
            const paid = r.paidAmount || 0;
            return paid < r.finalPrice;
        }).sort((a, b) => {
            const dateA = a.eventDate instanceof Date ? a.eventDate : (a.eventDate as any).toDate();
            const dateB = b.eventDate instanceof Date ? b.eventDate : (b.eventDate as any).toDate();
            return dateA.getTime() - dateB.getTime();
        });
    },



    // Check if dress is available for dates
    async checkDressAvailability(dressId: string, startDate: Date, endDate: Date, excludeRentalId?: string): Promise<boolean> {
        // Fetch all active rentals for this dress
        const q = query(
            collection(db, COLLECTION_NAME),
            where('dressId', '==', dressId),
            where('status', 'in', ['active', 'pending'])
        );

        const snapshot = await getDocs(q);
        const rentals = snapshot.docs.map(doc => doc.data() as Rental);

        return isDressAvailable(rentals, startDate, endDate, excludeRentalId);
    },

    // Create Rental with Transaction (Atomic)
    async createRentalWithTransaction(
        rentalData: Omit<Rental, 'id'>,
        clientData: Partial<Client> & { id?: string },
        transactionData?: { amount: number; method: 'cash' | 'credit' | 'check' | 'bit'; notes?: string }
    ): Promise<string> {
        return await runTransaction(db, async (transaction) => {
            // 1. Handle Client
            let clientId = rentalData.clientId;

            if (!clientId && clientData.fullName) {
                // Create new client
                const newClientRef = doc(collection(db, 'clients'));
                clientId = newClientRef.id;
                transaction.set(newClientRef, {
                    ...clientData,
                    id: clientId,
                    createdAt: new Date()
                });
            } else if (clientId) {
                // Update existing client if needed (e.g. measurements)
                const clientRef = doc(db, 'clients', clientId);
                transaction.update(clientRef, {
                    ...clientData
                });
            } else {
                throw new Error("Client ID or Data missing");
            }

            // 2. Create Rental
            const newRentalRef = doc(collection(db, COLLECTION_NAME));
            const rentalId = newRentalRef.id;

            const rentalToSave: Rental = {
                ...rentalData,
                id: rentalId,
                clientId: clientId,
                paidAmount: transactionData ? transactionData.amount : 0
            };

            transaction.set(newRentalRef, rentalToSave);

            // 3. Create Transaction (if amount > 0)
            if (transactionData && transactionData.amount > 0) {
                const newTransRef = doc(collection(db, 'transactions'));
                transaction.set(newTransRef, {
                    id: newTransRef.id,
                    type: 'deposit',
                    amount: transactionData.amount,
                    paymentMethod: transactionData.method,
                    customerName: rentalData.clientName,
                    relatedRentalId: rentalId,
                    notes: transactionData.notes || 'Initial Deposit',
                    timestamp: new Date()
                });
            }

            // 4. Update Dress Rental Count
            const dressRef = doc(db, 'dresses', rentalData.dressId);
            transaction.update(dressRef, {
                rentalCount: increment(1)
            });

            return rentalId;
        });
    }
};
