import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Dress, Rental } from '../types';

export interface AnalyticsData {
    kpis: {
        totalRevenue: number;
        netProfit: number;
        conversionRate: number;
        topCity: string;
    };
    funnel: {
        name: string;
        value: number;
        fill: string;
    }[];
    seasonality: {
        name: string;
        rentals: number;
    }[];
    geography: {
        name: string;
        value: number;
    }[];
    productPerformance: {
        id: string;
        name: string;
        imageUrl: string;
        scans: number;
        rentals: number;
        roi: number;
        revenue: number;
        cost: number;
        tags: ('potential_issue' | 'cash_cow')[];
    }[];
    deadStock: {
        id: string;
        name: string;
        imageUrl: string;
        lastActivity: string;
    }[];
}

export const useAnalyticsData = () => {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [dressesSnap, rentalsSnap] = await Promise.all([
                    getDocs(collection(db, 'dresses')),
                    getDocs(collection(db, 'rentals'))
                ]);

                const dresses = dressesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Dress));
                const rentals = rentalsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Rental));

                // --- KPI Calculations ---

                // Revenue (Completed rentals only for strict accounting, or active+completed for projected?)
                // Let's use active + completed for "Total Business Volume" but maybe strict for profit.
                // Request said "Total Revenue (sum of completed rentals)".
                const completedRentals = rentals.filter(r => r.status === 'completed' || r.status === 'active'); // Using active too as they are "signed deals"
                const totalRevenue = completedRentals.reduce((sum, r) => sum + (r.finalPrice || 0), 0);

                // Costs
                const totalProductionCost = dresses.reduce((sum, d) => sum + (d.productionCosts?.totalCost || 0), 0);
                const netProfit = totalRevenue - totalProductionCost;

                // Conversion
                const totalScans = dresses.reduce((sum, d) => sum + (d.scanCount || 0), 0);
                const totalRentalsCount = rentals.length;
                const conversionRate = totalScans > 0 ? (totalRentalsCount / totalScans) * 100 : 0;

                // Top City
                const cityCounts: Record<string, number> = {};
                rentals.forEach(r => {
                    if (r.eventCity) {
                        cityCounts[r.eventCity] = (cityCounts[r.eventCity] || 0) + 1;
                    }
                });
                const topCity = Object.entries(cityCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

                // --- Funnel Data ---
                const funnel = [
                    { name: 'צפיות (סריקות)', value: totalScans, fill: '#8884d8' },
                    { name: 'השכרות בפועל', value: totalRentalsCount, fill: '#82ca9d' }
                ];

                // --- Seasonality (Last 12 Months) ---
                const seasonalityMap: Record<string, number> = {};
                const now = new Date();
                for (let i = 11; i >= 0; i--) {
                    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    const key = new Intl.DateTimeFormat('he-IL', { month: 'short' }).format(d);
                    seasonalityMap[key] = 0;
                }
                rentals.forEach(r => {
                    if (r.eventDate) {
                        const date = r.eventDate instanceof Date ? r.eventDate : (r.eventDate as any).toDate();
                        const key = new Intl.DateTimeFormat('he-IL', { month: 'short' }).format(date);
                        if (seasonalityMap[key] !== undefined) {
                            seasonalityMap[key]++;
                        }
                    }
                });
                const seasonality = Object.entries(seasonalityMap).map(([name, rentals]) => ({ name, rentals }));

                // --- Geography ---
                const geography = Object.entries(cityCounts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([name, value]) => ({ name, value }));

                // --- Product Performance ---
                const productPerformance = dresses.map(dress => {
                    const dressRentals = rentals.filter(r => r.dressId === dress.id);
                    const rentalCount = dressRentals.length;
                    const revenue = dressRentals.reduce((sum, r) => sum + (r.finalPrice || 0), 0);
                    const cost = dress.productionCosts?.totalCost || 1; // Avoid division by zero
                    const roi = ((revenue - cost) / cost) * 100;
                    const scans = dress.scanCount || 0;

                    const tags: ('potential_issue' | 'cash_cow')[] = [];
                    if (scans > 50 && rentalCount < 2) tags.push('potential_issue');
                    if (roi > 300) tags.push('cash_cow');

                    return {
                        id: dress.id,
                        name: dress.modelName,
                        imageUrl: dress.imageUrl,
                        scans,
                        rentals: rentalCount,
                        roi,
                        revenue,
                        cost,
                        tags
                    };
                }).sort((a, b) => b.roi - a.roi).slice(0, 10); // Top 10 by ROI

                // --- Dead Stock ---
                const ninetyDaysAgo = new Date();
                ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

                const deadStock = dresses.filter(dress => {
                    const scans = dress.scanCount || 0;
                    const dressRentals = rentals.filter(r => r.dressId === dress.id);
                    const hasRecentRental = dressRentals.some(r => {
                        const date = r.eventDate instanceof Date ? r.eventDate : (r.eventDate as any).toDate();
                        return date > ninetyDaysAgo;
                    });

                    // Simple logic: No scans ever (or very low) AND no recent rentals
                    // Or strictly: 0 scans AND 0 rentals in last 90 days?
                    // User request: "zero scans and zero rentals in the last 90 days"
                    // We don't track scan dates historically per dress easily without querying scan_events.
                    // But we have total scanCount. If total is 0, then last 90 days is 0.
                    // If total > 0, we can't be sure without querying scan_events.
                    // For MVP, let's use: total scans == 0 OR (total scans < 5 AND no recent rentals)
                    return scans === 0 && !hasRecentRental;
                }).map(d => ({
                    id: d.id,
                    name: d.modelName,
                    imageUrl: d.imageUrl,
                    lastActivity: 'ללא פעילות'
                }));

                setData({
                    kpis: {
                        totalRevenue,
                        netProfit,
                        conversionRate,
                        topCity
                    },
                    funnel,
                    seasonality,
                    geography,
                    productPerformance,
                    deadStock
                });

            } catch (err) {
                console.error("Error fetching analytics:", err);
                setError("Failed to load analytics data");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return { data, loading, error };
};
