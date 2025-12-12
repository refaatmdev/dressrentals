import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Save, Globe, Layout, Image as ImageIcon } from 'lucide-react';
import { ImageUpload } from '../components/common/ImageUpload';

interface GlobalSettings {
    logoUrl: string;
    instagramUrl: string;
    facebookUrl: string;
    whatsappPhone: string;
    address: string;
}

interface LandingPageContent {
    heroImage: string;
    heroTitle: string;
    heroSubtitle: string;
    aboutTitle: string;
    aboutText: string;
    contactTitle: string;
    contactText: string;
}

export const Settings = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [globalSettings, setGlobalSettings] = useState<GlobalSettings>({
        logoUrl: '',
        instagramUrl: '',
        facebookUrl: '',
        whatsappPhone: '',
        address: ''
    });

    const [landingContent, setLandingContent] = useState<LandingPageContent>({
        heroImage: '',
        heroTitle: '',
        heroSubtitle: '',
        aboutTitle: '',
        aboutText: '',
        contactTitle: '',
        contactText: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const globalSnap = await getDoc(doc(db, 'settings', 'global'));
                if (globalSnap.exists()) setGlobalSettings(globalSnap.data() as GlobalSettings);

                const landingSnap = await getDoc(doc(db, 'content', 'landing_page'));
                if (landingSnap.exists()) setLandingContent(landingSnap.data() as LandingPageContent);
            } catch (error) {
                console.error("Error fetching settings:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await setDoc(doc(db, 'settings', 'global'), globalSettings);
            await setDoc(doc(db, 'content', 'landing_page'), landingContent);
            alert('ההגדרות נשמרו בהצלחה!');
        } catch (error) {
            console.error("Error saving settings:", error);
            alert('שגיאה בשמירת ההגדרות');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8">טוען הגדרות...</div>;

    return (
        <div className="p-8 max-w-5xl mx-auto" dir="rtl">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">הגדרות אתר</h1>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-gold text-white rounded-xl hover:bg-gold-dark transition-colors disabled:opacity-50"
                >
                    <Save size={20} />
                    {saving ? 'שומר...' : 'שמור שינויים'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Global Settings */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-6 text-gold-dark border-b border-gray-100 pb-4">
                        <Globe size={24} />
                        <h2 className="text-xl font-bold">הגדרות כלליות</h2>
                    </div>

                    <div className="space-y-4">


                        <div>
                            <ImageUpload
                                label="לוגו האתר"
                                currentImageUrl={globalSettings.logoUrl}
                                onImageUploaded={(url) => setGlobalSettings({ ...globalSettings, logoUrl: url })}
                                folder="settings/logo"
                            />
                        </div>

// ... (later in file)

                        <div>
                            <ImageUpload
                                label="תמונת רקע (Hero Image)"
                                currentImageUrl={landingContent.heroImage}
                                onImageUploaded={(url) => setLandingContent({ ...landingContent, heroImage: url })}
                                folder="settings/hero"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">אינסטגרם (URL)</label>
                            <input
                                type="text"
                                value={globalSettings.instagramUrl}
                                onChange={e => setGlobalSettings({ ...globalSettings, instagramUrl: e.target.value })}
                                className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">פייסבוק (URL)</label>
                            <input
                                type="text"
                                value={globalSettings.facebookUrl}
                                onChange={e => setGlobalSettings({ ...globalSettings, facebookUrl: e.target.value })}
                                className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">טלפון לתיאום (וואטסאפ)</label>
                            <input
                                type="text"
                                value={globalSettings.whatsappPhone}
                                onChange={e => setGlobalSettings({ ...globalSettings, whatsappPhone: e.target.value })}
                                className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none"
                                placeholder="97250..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">כתובת הסטודיו</label>
                            <input
                                type="text"
                                value={globalSettings.address}
                                onChange={e => setGlobalSettings({ ...globalSettings, address: e.target.value })}
                                className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Landing Page Content */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-6 text-gold-dark border-b border-gray-100 pb-4">
                        <Layout size={24} />
                        <h2 className="text-xl font-bold">תוכן דף הבית</h2>
                    </div>

                    <div className="space-y-6">
                        {/* Hero Section */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <ImageIcon size={16} /> תמונה ראשית
                            </h3>
                            <div>
                                <ImageUpload
                                    label="תמונת רקע (Hero Image)"
                                    currentImageUrl={landingContent.heroImage}
                                    onImageUploaded={(url) => setLandingContent({ ...landingContent, heroImage: url })}
                                    folder="settings/hero"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">כותרת ראשית</label>
                                <input
                                    type="text"
                                    value={landingContent.heroTitle}
                                    onChange={e => setLandingContent({ ...landingContent, heroTitle: e.target.value })}
                                    className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">כותרת משנה</label>
                                <input
                                    type="text"
                                    value={landingContent.heroSubtitle}
                                    onChange={e => setLandingContent({ ...landingContent, heroSubtitle: e.target.value })}
                                    className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none"
                                />
                            </div>
                        </div>

                        {/* About Section */}
                        <div className="space-y-4 pt-4 border-t border-gray-100">
                            <h3 className="font-bold text-gray-900">אודות</h3>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">כותרת אודות</label>
                                <input
                                    type="text"
                                    value={landingContent.aboutTitle}
                                    onChange={e => setLandingContent({ ...landingContent, aboutTitle: e.target.value })}
                                    className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">טקסט אודות</label>
                                <textarea
                                    rows={4}
                                    value={landingContent.aboutText}
                                    onChange={e => setLandingContent({ ...landingContent, aboutText: e.target.value })}
                                    className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
