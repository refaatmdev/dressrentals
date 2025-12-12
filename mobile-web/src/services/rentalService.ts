import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    addDoc,
    orderBy,
    updateDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Rental } from '../types';

const COLLECTION_NAME = 'rentals';

export const rentalService = {
    // Create a new rental
    async createRental(rental: Omit<Rental, 'id'>): Promise<string> {
        if (!rental.clientId) {
            throw new Error('Client ID is required for rental');
        }
        const docRef = await addDoc(collection(db, COLLECTION_NAME), rental);
        await updateDoc(docRef, { id: docRef.id });
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
        const q = query(collection(db, COLLECTION_NAME), orderBy('eventDate', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data() as Rental);
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
    }
};
