import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { GlobalSettings, LandingPageContent } from '../types';

export const useSiteContent = () => {
    const [globalSettings, setGlobalSettings] = useState<GlobalSettings | null>(null);
    const [landingContent, setLandingContent] = useState<LandingPageContent | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const globalSnap = await getDoc(doc(db, 'settings', 'global'));
                if (globalSnap.exists()) setGlobalSettings(globalSnap.data() as GlobalSettings);

                const landingSnap = await getDoc(doc(db, 'content', 'landing_page'));
                if (landingSnap.exists()) setLandingContent(landingSnap.data() as LandingPageContent);
            } catch (error) {
                console.error("Error fetching site content:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return { globalSettings, landingContent, loading };
};
