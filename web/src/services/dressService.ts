import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Dress } from '../types';

const COLLECTION_NAME = 'dresses';

export const dressService = {
    // Create a new dress
    async createDress(dress: Omit<Dress, 'id'>): Promise<string> {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), dress);
        // Update the doc with its generated ID
        await updateDoc(docRef, { id: docRef.id });
        return docRef.id;
    },

    // Get Dress by ID
    async getDress(id: string): Promise<Dress | null> {
        const docRef = doc(db, COLLECTION_NAME, id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            return { id: snap.id, ...snap.data() } as Dress;
        }
        return null;
    },

    // Get Dress by QR Code
    async getDressByQr(qrValue: string): Promise<Dress | null> {
        const q = query(collection(db, COLLECTION_NAME), where('qrCodeValue', '==', qrValue));
        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;
        return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Dress;
    },

    async getTopScannedDresses(limitCount: number = 5): Promise<Dress[]> {
        const q = query(collection(db, COLLECTION_NAME), orderBy('scanCount', 'desc'), limit(limitCount));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Dress));
    },

    // Get all dresses
    async getAllDresses(): Promise<Dress[]> {
        const snapshot = await getDocs(collection(db, COLLECTION_NAME));
        return snapshot.docs.map(doc => doc.data() as Dress);
    },

    // Update dress status
    async updateDressStatus(id: string, status: Dress['status']): Promise<void> {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, { status });
    },

    // Update dress
    async updateDress(id: string, updates: Partial<Dress>): Promise<void> {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, updates);
    },

    // Archive dress (Soft delete)
    async archiveDress(id: string, isArchived: boolean): Promise<void> {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, { isArchived });
    },

    // Delete dress (Hard delete)
    async deleteDress(id: string): Promise<void> {
        const docRef = doc(db, COLLECTION_NAME, id);
        await deleteDoc(docRef);
    }
};
