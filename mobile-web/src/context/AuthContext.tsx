import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { type User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { userService } from '../services/userService';
import type { User } from '../types';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isAdmin: boolean;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
            if (firebaseUser) {
                // Fetch extended user details from Firestore
                try {
                    const userDoc = await userService.getUser(firebaseUser.uid);
                    if (userDoc) {
                        setUser(userDoc);
                    } else {
                        // User exists in Auth but not Firestore -> Create default profile
                        const newUser: User = {
                            uid: firebaseUser.uid,
                            displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                            email: firebaseUser.email || '',
                            role: 'admin', // Default to admin for the first user to simplify setup
                            photoURL: firebaseUser.photoURL || null,
                            createdAt: new Date(),
                        };

                        await userService.syncUser(newUser);
                        setUser(newUser);
                    }
                } catch (error) {
                    console.error('Error fetching user details:', error);
                    setUser(null);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const logout = async () => {
        try {
            await auth.signOut();
            setUser(null);
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    const value = {
        user,
        loading,
        isAdmin: user?.role === 'admin',
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
