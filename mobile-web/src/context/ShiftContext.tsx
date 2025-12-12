import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { shiftService } from '../services/shiftService';
import { useAuth } from './AuthContext';
import type { Shift } from '../types';

interface ShiftContextType {
    activeShift: Shift | null;
    loading: boolean;
    startShift: () => Promise<void>;
    endShift: () => Promise<void>;
}

const ShiftContext = createContext<ShiftContextType | undefined>(undefined);

export function ShiftProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [activeShift, setActiveShift] = useState<Shift | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActiveShift = async () => {
            if (!user) {
                setActiveShift(null);
                setLoading(false);
                return;
            }

            try {
                const shifts = await shiftService.getEmployeeShifts(user.uid);
                const current = shifts.find(s => !s.endTime);
                setActiveShift(current || null);
            } catch (error) {
                console.error('Error fetching active shift:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchActiveShift();
    }, [user]);

    const startShift = async () => {
        if (!user) return;
        try {
            const id = await shiftService.startShift(user.uid, user.displayName || 'Staff');
            setActiveShift({
                id,
                employeeId: user.uid,
                employeeName: user.displayName || 'Staff',
                startTime: new Date()
            } as Shift);
        } catch (error) {
            console.error('Error starting shift:', error);
            throw error;
        }
    };

    const endShift = async () => {
        if (!activeShift) return;
        try {
            await shiftService.endShift(activeShift.id!);
            setActiveShift(null);
        } catch (error) {
            console.error('Error ending shift:', error);
            throw error;
        }
    };

    const value = {
        activeShift,
        loading,
        startShift,
        endShift
    };

    return <ShiftContext.Provider value={value}>{children}</ShiftContext.Provider>;
}

export function useShift() {
    const context = useContext(ShiftContext);
    if (context === undefined) {
        throw new Error('useShift must be used within a ShiftProvider');
    }
    return context;
}
