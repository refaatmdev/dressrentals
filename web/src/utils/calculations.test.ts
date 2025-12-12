import { describe, it, expect } from 'vitest';
import { calculateDressCost, checkDateOverlap, isDressAvailable } from './calculations';
import type { Rental } from '../types';

describe('Calculations Utils', () => {
    describe('calculateDressCost', () => {
        it('should correctly sum up all costs', () => {
            const total = calculateDressCost(100, 50, 25, 10, [{ amount: 15 }]);
            expect(total).toBe(200);
        });

        it('should handle missing additional costs', () => {
            const total = calculateDressCost(100, 50, 25, 10);
            expect(total).toBe(185);
        });
    });

    describe('checkDateOverlap', () => {
        it('should detect direct overlap', () => {
            const startA = new Date('2024-01-01');
            const endA = new Date('2024-01-05');
            const startB = new Date('2024-01-03');
            const endB = new Date('2024-01-07');

            // Overlap: 3rd to 5th
            expect(checkDateOverlap(startA, endA, startB, endB, 0)).toBe(true);
        });

        it('should detect no overlap', () => {
            const startA = new Date('2024-01-01');
            const endA = new Date('2024-01-05');
            const startB = new Date('2024-01-06');
            const endB = new Date('2024-01-10');

            expect(checkDateOverlap(startA, endA, startB, endB, 0)).toBe(false);
        });

        it('should respect buffer days', () => {
            const startA = new Date('2024-01-01');
            const endA = new Date('2024-01-05');
            const startB = new Date('2024-01-06'); // Adjacent day
            const endB = new Date('2024-01-10');

            // With 1 day buffer, 5th + 1 = 6th, so it touches/overlaps
            expect(checkDateOverlap(startA, endA, startB, endB, 1)).toBe(true);
        });
    });

    describe('isDressAvailable', () => {
        const mockRentals: Rental[] = [
            {
                id: '1',
                dressId: 'd1',
                dressName: 'Dress 1',
                clientId: 'c1',
                clientName: 'Client 1',
                clientPhone: '0500000000',
                eventDate: new Date('2024-01-10'),
                returnDate: new Date('2024-01-12'),
                eventCity: 'City',
                finalPrice: 1000,
                status: 'active'
            }
        ];

        it('should return true if no rentals overlap', () => {
            const start = new Date('2024-01-01');
            const end = new Date('2024-01-05');
            expect(isDressAvailable(mockRentals, start, end)).toBe(true);
        });

        it('should return false if rental overlaps', () => {
            const start = new Date('2024-01-11'); // Inside 10-12
            const end = new Date('2024-01-15');
            expect(isDressAvailable(mockRentals, start, end)).toBe(false);
        });

        it('should ignore excluded rental ID (for edits)', () => {
            const start = new Date('2024-01-11');
            const end = new Date('2024-01-15');
            // Exclude '1', so it should be available now
            expect(isDressAvailable(mockRentals, start, end, '1')).toBe(true);
        });
    });
});
