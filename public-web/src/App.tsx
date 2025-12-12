import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Gallery } from './components/Gallery';
import { DressModal } from './components/DressModal';
import { useSiteContent } from './hooks/useSiteContent';

function App() {
  const { globalSettings, landingContent } = useSiteContent();

  return (
    <div className="min-h-screen bg-offwhite font-sans selection:bg-gold/30" dir="rtl">
      <Navbar />
      <Hero />

      <div id="collection">
        <Gallery />
      </div>

      {/* About Section */}
      {landingContent?.aboutTitle && (
        <section id="about" className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-4xl font-serif font-bold text-charcoal mb-8">{landingContent.aboutTitle}</h2>
            <p className="text-lg text-gray-600 leading-relaxed whitespace-pre-line">
              {landingContent.aboutText}
            </p>
          </div>
        </section>
      )}

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-offwhite">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-serif font-bold text-charcoal mb-8">
            {landingContent?.contactTitle || 'צור קשר'}
          </h2>
          <p className="text-lg text-gray-600 mb-8 whitespace-pre-line">
            {landingContent?.contactText}
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            {globalSettings?.address && (
              <div className="text-center">
                <h3 className="font-bold text-gold-dark mb-2">כתובת</h3>
                <p className="text-gray-600">{globalSettings.address}</p>
              </div>
            )}
            {globalSettings?.whatsappPhone && (
              <div className="text-center">
                <h3 className="font-bold text-gold-dark mb-2">טלפון</h3>
                <a href={`https://wa.me/${globalSettings.whatsappPhone}`} className="text-gray-600 hover:text-gold">
                  {globalSettings.whatsappPhone}
                </a>
              </div>
            )}
          </div>
        </div>
      </section>

      <DressModal />

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-16 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center text-center">
          <h2 className="font-serif text-3xl font-bold text-charcoal mb-6 tracking-widest">
            {globalSettings?.logoUrl ? (
              <img src={globalSettings.logoUrl} alt="Rema Mulla" className="h-16 object-contain" />
            ) : "REMA MULLA"}
          </h2>
          <div className="flex gap-8 mb-8 text-sm text-gray-500 uppercase tracking-wider">
            {globalSettings?.instagramUrl && <a href={globalSettings.instagramUrl} className="hover:text-gold transition-colors">Instagram</a>}
            {globalSettings?.facebookUrl && <a href={globalSettings.facebookUrl} className="hover:text-gold transition-colors">Facebook</a>}
          </div>
          <p className="text-gray-400 text-xs font-light">© 2025 Rema Mulla Haute Couture. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
