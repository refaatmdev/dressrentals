import type { Rental } from '../types';

export const calculateDressCost = (
    fabricCost: number,
    sewingCost: number,
    jewelryCost: number,
    paddingCost: number,
    additionalCosts: { amount: number }[] = []
): number => {
    const additionalTotal = additionalCosts.reduce((sum, item) => sum + item.amount, 0);
    return fabricCost + sewingCost + jewelryCost + paddingCost + additionalTotal;
};

export const checkDateOverlap = (
    startA: Date,
    endA: Date,
    startB: Date,
    endB: Date,
    bufferDays: number = 1
): boolean => {
    // Buffer logic:
    // We want a gap of `bufferDays` between rentals.
    // Effective range for A becomes [startA - buffer, endA + buffer]
    // Overlap if (StartA_Buffered <= EndB) AND (EndA_Buffered >= StartB)

    // However, usually buffer is "clean time" AFTER return.
    // So let's say: [StartA, EndA + Buffer] overlaps with [StartB, EndB]?
    // Or symmetrically: [StartA - Buffer, EndA + Buffer].

    // Let's stick to the symmetric buffer for safety as implemented in service previously.
    const bufferMs = bufferDays * 24 * 60 * 60 * 1000;

    const startABuffered = new Date(startA.getTime() - bufferMs);
    const endABuffered = new Date(endA.getTime() + bufferMs);

    return (startABuffered <= endB) && (endABuffered >= startB);
};

export const isDressAvailable = (
    rentals: Rental[],
    startDate: Date,
    endDate: Date,
    excludeRentalId?: string
): boolean => {
    const activeRentals = rentals.filter(r =>
        (r.status === 'active' || r.status === 'pending') &&
        r.id !== excludeRentalId
    );

    return !activeRentals.some(rental => {
        const rStart = rental.eventDate instanceof Date ? rental.eventDate : (rental.eventDate as any).toDate();
        const rEnd = rental.returnDate
            ? (rental.returnDate instanceof Date ? rental.returnDate : (rental.returnDate as any).toDate())
            : new Date(rStart.getTime() + (24 * 60 * 60 * 1000));

        return checkDateOverlap(startDate, endDate, rStart, rEnd);
    });
};
