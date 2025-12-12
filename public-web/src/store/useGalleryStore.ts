import { create } from 'zustand';
import { type Dress } from '../types';

interface GalleryState {
    dresses: Dress[];
    filteredDresses: Dress[];
    filter: 'all' | 'new' | 'available' | 'popular';
    isLoading: boolean;
    selectedDress: Dress | null;
    setDresses: (dresses: Dress[]) => void;
    setFilter: (filter: 'all' | 'new' | 'available' | 'popular') => void;
    setSelectedDress: (dress: Dress | null) => void;
    setLoading: (loading: boolean) => void;
}

export const useGalleryStore = create<GalleryState>((set, get) => ({
    dresses: [],
    filteredDresses: [],
    filter: 'all',
    isLoading: true,
    selectedDress: null,

    setDresses: (dresses) => set({ dresses, filteredDresses: dresses }),

    setFilter: (filter) => {
        const { dresses } = get();
        let filtered = [...dresses];

        switch (filter) {
            case 'new':
                // Sort by createdAt desc
                filtered.sort((a, b) => {
                    const dateA = a.createdAt instanceof Date ? a.createdAt : (a.createdAt as any).toDate();
                    const dateB = b.createdAt instanceof Date ? b.createdAt : (b.createdAt as any).toDate();
                    return dateB.getTime() - dateA.getTime();
                });
                break;
            case 'available':
                filtered = filtered.filter(d => d.status === 'available');
                break;
            case 'popular':
                filtered.sort((a, b) => (b.scanCount || 0) - (a.scanCount || 0));
                break;
            case 'all':
            default:
                // Default sort? Maybe by name or random? Let's keep original order or sort by name
                break;
        }

        set({ filter, filteredDresses: filtered });
    },

    setSelectedDress: (dress) => set({ selectedDress: dress }),
    setLoading: (loading) => set({ isLoading: loading }),
}));
