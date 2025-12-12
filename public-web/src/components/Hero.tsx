import { useSiteContent } from '../hooks/useSiteContent';
import { motion } from 'framer-motion';

export const Hero = () => {
    const { landingContent } = useSiteContent();

    if (!landingContent) return <div className="h-screen bg-offwhite animate-pulse"></div>;

    // Fallbacks
    const bgImage = landingContent.heroImage || 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?q=80&w=2574&auto=format&fit=crop';
    const title = landingContent.heroTitle || landingContent.welcomeTitle || "Rema Mulla";
    const subtitle = landingContent.heroSubtitle || landingContent.welcomeMessage || "Haute Couture & Bridal Design";

    return (
        <div className="relative h-[80vh] w-full overflow-hidden">
            {/* Background Image with Parallax-like effect (fixed) */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed"
                style={{ backgroundImage: `url(${bgImage})` }}
            >
                <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"></div>
            </div>

            {/* Content */}
            <div className="relative h-full flex flex-col items-center justify-center text-center text-white px-4">
                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-5xl md:text-7xl font-serif font-bold mb-6 tracking-wide"
                >
                    {title}
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="text-lg md:text-xl font-light max-w-2xl opacity-90 leading-relaxed"
                >
                    {subtitle}
                </motion.p>
            </div>
        </div>
    );
};
