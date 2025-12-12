import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dressService } from '../services/dressService';
import type { Dress } from '../types';
import { Search, Filter, Shirt } from 'lucide-react';

export const Gallery = () => {
    const navigate = useNavigate();
    const [dresses, setDresses] = useState<Dress[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchDresses = async () => {
            try {
                const data = await dressService.getAllDresses();
                setDresses(data);
            } catch (error) {
                console.error('Error fetching dresses:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDresses();
    }, []);

    const filteredDresses = dresses.filter(dress =>
        dress.modelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dress.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
            </div>
        );
    }

    return (
        <div className="pb-24">
            {/* Header & Search */}
            <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 px-4 py-4 border-b border-gray-100">
                <h1 className="text-2xl font-serif font-bold text-charcoal mb-4">הקולקציה שלנו</h1>

                <div className="flex gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="חיפוש לפי שם או דגם..."
                            className="w-full pr-10 pl-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-gold/20 transition-all text-right"
                        />
                    </div>
                    <button className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors">
                        <Filter size={20} />
                    </button>
                </div>
            </div>

            {/* Masonry Grid */}
            <div className="p-4 columns-2 gap-4 space-y-4">
                {filteredDresses.map((dress) => (
                    <div
                        key={dress.id}
                        onClick={() => navigate(`/dress/${dress.id}`)}
                        className="break-inside-avoid bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 group cursor-pointer"
                    >
                        <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
                            {dress.imageUrl ? (
                                <img
                                    src={dress.imageUrl}
                                    alt={dress.modelName}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                    <Shirt size={32} />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>

                        <div className="p-3">
                            <h3 className="font-bold text-gray-900 truncate">{dress.modelName}</h3>
                            <p className="text-xs text-gray-500 font-mono mt-1">#{dress.id.slice(0, 6)}</p>
                        </div>
                    </div>
                ))}
            </div>

            {filteredDresses.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-gray-400">לא נמצאו שמלות</p>
                </div>
            )}
        </div>
    );
};
