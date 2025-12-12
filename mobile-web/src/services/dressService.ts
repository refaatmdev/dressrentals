import {
    collection,
    doc,
    getDoc,
    updateDoc, // Kept as it's used in createDress, updateDressStatus, and updateDress
    getDocs,
    query,
    where,
    addDoc,
    deleteDoc,
    increment
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

    async deleteDress(id: string): Promise<void> {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
    },

    async recordScan(dressId: string, dressName: string, staffId?: string): Promise<void> {
        // 1. Create Scan Event
        await addDoc(collection(db, 'scan_events'), {
            dressId,
            dressName,
            scannedAt: new Date(),
            staffId: staffId || 'anonymous'
        });

        // 2. Increment scan count on dress
        const dressRef = doc(db, COLLECTION_NAME, dressId);
        await updateDoc(dressRef, {
            scanCount: increment(1)
        });
    },

    // Get Dress by ID
    async getDress(id: string): Promise<Dress | null> {
        const docRef = doc(db, COLLECTION_NAME, id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            return snap.data() as Dress;
        }
        return null;
    },

    // Get Dress by QR Code
    async getDressByQr(qrCodeValue: string): Promise<Dress | null> {
        const q = query(collection(db, COLLECTION_NAME), where('qrCodeValue', '==', qrCodeValue));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            return snapshot.docs[0].data() as Dress;
        }
        return null;
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

    // Update full dress details
    async updateDress(id: string, data: Partial<Dress>): Promise<void> {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, data);
    }
};
