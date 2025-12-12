import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle } from 'lucide-react';
import { useGalleryStore } from '../store/useGalleryStore';
import { useSiteContent } from '../hooks/useSiteContent';

export const DressModal = () => {
    const { selectedDress, setSelectedDress } = useGalleryStore();
    const { globalSettings } = useSiteContent();

    if (!selectedDress) return null;

    const phoneNumber = globalSettings?.whatsappPhone || '972500000000';
    const whatsappMessage = `Hi, I'm interested in dress ${selectedDress.modelName}`;
    const whatsappLink = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(whatsappMessage)}`;

    // Combine main image and gallery images
    const allImages = [
        selectedDress.imageUrl,
        ...(selectedDress.galleryImages || [])
    ].filter((img, index, self) => img && self.indexOf(img) === index); // Unique non-empty images

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
                onClick={() => setSelectedDress(null)}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="bg-white w-full max-w-5xl max-h-[95vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col relative"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header Section (Fixed) */}
                    <div className="p-6 md:p-8 border-b border-gray-100 flex flex-col items-center justify-center relative bg-white z-10">
                        <button
                            onClick={() => setSelectedDress(null)}
                            className="absolute top-6 left-6 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors text-charcoal"
                        >
                            <X size={24} />
                        </button>

                        <h2 className="text-4xl md:text-5xl font-serif font-bold text-charcoal mb-6 text-center tracking-wide">
                            {selectedDress.modelName}
                        </h2>

                        <a
                            href={whatsappLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-full font-medium transition-all transform hover:scale-105 shadow-lg shadow-green-600/20"
                        >
                            <MessageCircle size={20} />
                            <span>אני מעוניינת בשמלה זו</span>
                        </a>
                    </div>

                    {/* Gallery Section (Scrollable) */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 max-w-4xl mx-auto">
                            {allImages.map((img, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className={`relative rounded-2xl overflow-hidden shadow-sm group ${
                                        // Make the first image full width on mobile, or span 2 cols if it's the only one
                                        allImages.length === 1 ? 'md:col-span-2' : ''
                                        }`}
                                >
                                    <img
                                        src={img}
                                        alt={`${selectedDress.modelName} - ${index + 1}`}
                                        className="w-full h-auto object-cover hover:scale-105 transition-transform duration-700"
                                    />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
