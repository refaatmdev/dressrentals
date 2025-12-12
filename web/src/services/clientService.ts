import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    addDoc,
    updateDoc,
    deleteDoc,
    orderBy
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Client } from '../types';

const COLLECTION_NAME = 'clients';

export const clientService = {
    // Create a new client
    async createClient(client: Omit<Client, 'id'>): Promise<string> {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), client);
        await updateDoc(docRef, { id: docRef.id });
        return docRef.id;
    },

    // Update client
    async updateClient(id: string, updates: Partial<Client>): Promise<void> {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, updates);
    },

    // Delete client
    async deleteClient(id: string): Promise<void> {
        const docRef = doc(db, COLLECTION_NAME, id);
        await deleteDoc(docRef);
    },

    // Get client by ID
    async getClient(id: string): Promise<Client | null> {
        const docRef = doc(db, COLLECTION_NAME, id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            return snap.data() as Client;
        }
        return null;
    },

    // Get client by Phone (Search)
    async getClientByPhone(phone: string): Promise<Client | null> {
        const q = query(collection(db, COLLECTION_NAME), where('phone', '==', phone));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            return snapshot.docs[0].data() as Client;
        }
        return null;
    },

    // Search clients by name or phone (Partial match would require a different solution like Algolia, 
    // but for now we'll do client-side filtering or exact match)
    // Here we fetch all and filter, or use simple queries. 
    // For scalability, we should use a proper search index.
    // For now, let's implement getAll and filter in UI, or simple prefix search if needed.
    async getAllClients(): Promise<Client[]> {
        const q = query(collection(db, COLLECTION_NAME), orderBy('fullName', 'asc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data() as Client);
    }
};
