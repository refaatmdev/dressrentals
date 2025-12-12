import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    getDocs,
    updateDoc,
    doc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Shift } from '../types';

const COLLECTION_NAME = 'shifts';

export const shiftService = {
    // Start a new shift
    async startShift(employeeId: string, employeeName: string): Promise<string> {
        const shift: Omit<Shift, 'id'> = {
            employeeId,
            employeeName,
            startTime: new Date(),
            // endTime is undefined initially
        };
        const docRef = await addDoc(collection(db, COLLECTION_NAME), shift);
        await updateDoc(docRef, { id: docRef.id });
        return docRef.id;
    },

    // End a shift
    async endShift(shiftId: string): Promise<void> {
        const docRef = doc(db, COLLECTION_NAME, shiftId);
        const endTime = new Date();
        // We could calculate totalHours here if we fetch the start time first, 
        // but for simplicity let's just mark the end time.
        // Ideally we'd do a transaction or fetch-then-update.
        await updateDoc(docRef, { endTime });
    },

    // Get shifts for an employee
    async getEmployeeShifts(employeeId: string): Promise<Shift[]> {
        const q = query(
            collection(db, COLLECTION_NAME),
            where('employeeId', '==', employeeId)
        );
        const snapshot = await getDocs(q);
        const shifts = snapshot.docs.map(doc => doc.data() as Shift);
        return shifts.sort((a, b) => {
            const dateA = a.startTime instanceof Date ? a.startTime : (a.startTime as any).toDate();
            const dateB = b.startTime instanceof Date ? b.startTime : (b.startTime as any).toDate();
            return dateB.getTime() - dateA.getTime();
        });
    },

    // Get all shifts (for admin)
    async getAllShifts(): Promise<Shift[]> {
        const q = query(collection(db, COLLECTION_NAME), orderBy('startTime', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data() as Shift);
    }
};
