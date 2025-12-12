import { useState, useEffect } from 'react';
import { Menu, X, Instagram, Facebook } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSiteContent } from '../hooks/useSiteContent';

export const Navbar = () => {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { globalSettings } = useSiteContent();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <>
            <motion.nav
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.6 }}
                className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${scrolled
                    ? 'bg-white/80 backdrop-blur-md shadow-sm py-4'
                    : 'bg-transparent py-6'
                    }`}
            >
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    {/* Logo */}
                    <div className="text-2xl font-serif font-bold tracking-widest text-charcoal">
                        {globalSettings?.logoUrl ? (
                            <img src={globalSettings.logoUrl} alt="Rema Mulla" className="h-12 object-contain" />
                        ) : (
                            "REMA MULLA"
                        )}
                    </div>

                    {/* Desktop Links */}
                    <div className="hidden md:flex items-center gap-8 font-sans text-sm tracking-wide font-medium text-charcoal/80">
                        <a href="#" className="hover:text-gold transition-colors">בית</a>
                        <a href="#collection" className="hover:text-gold transition-colors">קולקציה</a>
                        <a href="#about" className="hover:text-gold transition-colors">אודות</a>
                        <a href="#contact" className="hover:text-gold transition-colors">צור קשר</a>
                    </div>

                    {/* Socials / Action */}
                    <div className="hidden md:flex items-center gap-4">
                        {globalSettings?.instagramUrl && (
                            <a href={globalSettings.instagramUrl} target="_blank" rel="noopener noreferrer" className="p-2 hover:text-gold transition-colors"><Instagram size={20} /></a>
                        )}
                        {globalSettings?.facebookUrl && (
                            <a href={globalSettings.facebookUrl} target="_blank" rel="noopener noreferrer" className="p-2 hover:text-gold transition-colors"><Facebook size={20} /></a>
                        )}
                        {globalSettings?.whatsappPhone && (
                            <a href={`https://wa.me/${globalSettings.whatsappPhone}`} target="_blank" rel="noopener noreferrer" className="px-5 py-2 bg-gold text-white rounded-full text-sm font-medium hover:bg-gold-dark transition-colors">
                                תיאום פגישה
                            </a>
                        )}
                    </div>

                    {/* Mobile Toggle */}
                    <button
                        className="md:hidden p-2 text-charcoal"
                        onClick={() => setMobileMenuOpen(true)}
                    >
                        <Menu size={24} />
                    </button>
                </div>
            </motion.nav>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center"
                    >
                        <button
                            className="absolute top-6 left-6 p-2 text-charcoal"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <X size={32} />
                        </button>

                        <div className="flex flex-col items-center gap-8 font-serif text-2xl text-charcoal">
                            <a href="#" onClick={() => setMobileMenuOpen(false)}>בית</a>
                            <a href="#collection" onClick={() => setMobileMenuOpen(false)}>קולקציה</a>
                            <a href="#about" onClick={() => setMobileMenuOpen(false)}>אודות</a>
                            <a href="#contact" onClick={() => setMobileMenuOpen(false)}>צור קשר</a>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
