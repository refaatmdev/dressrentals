import { useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useGalleryStore } from '../store/useGalleryStore';
import { type Dress } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import Masonry from 'react-masonry-css';
import { Filter } from 'lucide-react';

const breakpointColumnsObj = {
    default: 3,
    1100: 2,
    700: 1
};

export const Gallery = () => {
    const {
        filteredDresses,
        filter,
        setDresses,
        setFilter,
        setSelectedDress,
        isLoading,
        setLoading
    } = useGalleryStore();

    useEffect(() => {
        const fetchDresses = async () => {
            try {
                const snapshot = await getDocs(collection(db, 'dresses'));
                const dressesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Dress));
                setDresses(dressesData);
            } catch (err) {
                console.error("Error fetching gallery:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDresses();
    }, []);

    const filters = [
        { id: 'all', label: 'הכל' },
        { id: 'new', label: 'חדש בקולקציה' },
        { id: 'available', label: 'זמין כעת' },
        { id: 'popular', label: 'הכי מבוקש' },
    ] as const;

    return (
        <div className="max-w-7xl mx-auto px-4 py-16">
            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
                <div className="flex items-center gap-2 text-charcoal">
                    <Filter size={20} />
                    <span className="font-serif font-bold text-xl">הקולקציה שלנו</span>
                </div>

                <div className="flex flex-wrap justify-center gap-3">
                    {filters.map((f) => (
                        <button
                            key={f.id}
                            onClick={() => setFilter(f.id)}
                            className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${filter === f.id
                                ? 'bg-gold text-white shadow-lg shadow-gold/30 scale-105'
                                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Gallery Grid */}
            {isLoading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
                </div>
            ) : (
                <Masonry
                    breakpointCols={breakpointColumnsObj}
                    className="flex w-auto -ml-6"
                    columnClassName="pl-6 bg-clip-padding"
                >
                    <AnimatePresence>
                        {filteredDresses.map((dress) => (
                            <motion.div
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.4 }}
                                key={dress.id}
                                className="mb-6 group cursor-pointer"
                                onClick={() => setSelectedDress(dress)}
                            >
                                <div className="relative overflow-hidden rounded-2xl bg-gray-100 aspect-[3/4]">
                                    <img
                                        src={dress.imageUrl}
                                        alt={dress.modelName}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                                        <h3 className="text-white font-serif text-xl font-bold translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                            {dress.modelName}
                                        </h3>
                                        <p className="text-white/80 text-sm translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                                            לחצי לפרטים נוספים
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </Masonry>
            )}
        </div>
    );
};
