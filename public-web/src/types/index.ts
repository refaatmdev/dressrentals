export interface Dress {
    id: string;
    modelName: string; // Hebrew: שם הדגם
    imageUrl: string;
    galleryImages?: string[]; // Multiple images support
    qrCodeValue: string; // The string stored in the QR
    status: 'available' | 'rented' | 'cleaning' | 'repair';
    rentalPrice?: number; // Price per rental

    // Costs (Hidden from clients) - Object structure
    productionCosts: {
        fabricCost: number;     // עלות בדים
        jewelryCost: number;    // עלות תכשיטים/חרוזים
        paddingCost: number;    // עלות פדים/קאפים
        sewingCost: number;     // עלות תפירה
        additionalCosts?: { name: string; amount: number }[]; // Dynamic extra costs
        totalCost: number;      // Calculated automatically
    };

    staffNotes: string; // Internal notes (e.g., "Zipper is fragile")

    // Analytics
    rentalCount: number; // How many times rented
    scanCount?: number; // How many times scanned
    lastLocation: string; // e.g., "Tel Aviv", "Jerusalem"
    createdAt: Date;
}

export interface GlobalSettings {
    logoUrl: string;
    instagramUrl: string;
    facebookUrl: string;
    whatsappPhone: string;
    address: string;
}

export interface LandingPageContent {
    heroImage: string;
    heroTitle: string;
    heroSubtitle: string;
    aboutTitle: string;
    aboutText: string;
    contactTitle: string;
    contactText: string;
    promoBanner?: boolean; // Keep for backward compatibility if needed
    welcomeTitle?: string; // Keep for backward compatibility
    welcomeMessage?: string; // Keep for backward compatibility
}
