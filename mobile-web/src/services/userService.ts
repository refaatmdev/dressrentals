import {
    collection,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    getDocs,
    query
} from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { db, firebaseConfig } from '../lib/firebase';
import type { User } from '../types';

const COLLECTION_NAME = 'users';

export const userService = {
    // Create or Update User (e.g. on first login)
    async syncUser(user: User): Promise<void> {
        const userRef = doc(db, COLLECTION_NAME, user.uid);
        await setDoc(userRef, user, { merge: true });
    },

    // Get User by ID
    async getUser(uid: string): Promise<User | null> {
        const userRef = doc(db, COLLECTION_NAME, uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
            return snap.data() as User;
        }
        return null;
    },

    // Get all users (staff + admin)
    async getAllStaff(): Promise<User[]> {
        const q = query(collection(db, COLLECTION_NAME)); // Fetch ALL users
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            ...doc.data(),
            uid: doc.id // Ensure uid is always present from doc ID
        } as User));
    },

    // Update user role
    async updateUserRole(uid: string, role: 'admin' | 'staff'): Promise<void> {
        const userRef = doc(db, COLLECTION_NAME, uid);
        await updateDoc(userRef, { role });
    },

    // Update user status
    async updateUserStatus(uid: string, isActive: boolean): Promise<void> {
        const userRef = doc(db, COLLECTION_NAME, uid);
        await updateDoc(userRef, { isActive });
    },

    // Update user details
    async updateUser(uid: string, data: Partial<User>): Promise<void> {
        const userRef = doc(db, COLLECTION_NAME, uid);
        await updateDoc(userRef, data);
    },

    // Create new user (Secondary App Pattern)
    async createUser(email: string, displayName: string, role: 'admin' | 'staff'): Promise<void> {
        // 1. Initialize a secondary app instance
        // Note: We use static imports now to avoid build warnings about mixed import types
        const secondaryApp = initializeApp(firebaseConfig, 'SecondaryApp');
        const secondaryAuth = getAuth(secondaryApp);

        try {
            // 2. Create user in Authentication
            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, '123456'); // Default password
            const { user } = userCredential;

            // 3. Create user document in Firestore (using main app's db instance)
            const newUser: User = {
                uid: user.uid,
                displayName,
                email,
                role,
                isActive: true,
                createdAt: new Date(),
                photoURL: null
            };

            await setDoc(doc(db, COLLECTION_NAME, user.uid), newUser);

            // 4. Sign out from secondary app to be safe (though deleteApp handles cleanup)
            await signOut(secondaryAuth);

        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        } finally {
            // 5. Delete the secondary app to clean up
            await deleteApp(secondaryApp);
        }
    }
};
